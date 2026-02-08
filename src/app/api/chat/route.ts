import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { storeInteraction, getMemoryContext, formatMemoryForPrompt } from '@/lib/memory';
import { generatePersonalityPrompt } from '@/lib/personality';
import { generateSkillPrompts, hasChessSkill } from '@/lib/skillPrompts';
import { FENToGame, boardToASCII } from '@/lib/chess';
import { updateChallengeProgress } from '@/lib/engagement';
import { updateSyncState } from '@/lib/sync';
import { logLLMFailure, logError } from '@/lib/errorLogger';
import { monitorLLMRequest } from '@/lib/performanceMonitor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { petId, userId, message } = body;

    if (!petId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: petId, userId, message' },
        { status: 400 }
      );
    }

    // Fetch pet with personality traits and active skills
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        petTraits: {
          include: {
            trait: true,
          },
        },
        petSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Verify ownership
    if (pet.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Pet does not belong to user' },
        { status: 403 }
      );
    }

    // Check if pet is in Critical state
    if (pet.isCritical) {
      return NextResponse.json(
        {
          error: 'Your pet is too weak to chat right now. Please use a recovery item first.',
          fallback: true,
        },
        { status: 400 }
      );
    }

    // Store user message
    await storeInteraction(petId, userId, 'user', message);

    // Get personality prompt
    const personalityPrompt = generatePersonalityPrompt(pet);

    // Get memory context
    const memoryContextData = await getMemoryContext(petId);
    const memoryContext = formatMemoryForPrompt(memoryContextData);

    // Get skill prompts for teaching abilities (US-018) and game skills (US-019)
    const skillPrompts = generateSkillPrompts(pet.petSkills);

    // Check for active chess game (US-019)
    let chessContext = '';
    if (hasChessSkill(pet.petSkills)) {
      const activeChessGame = await prisma.gameState.findFirst({
        where: {
          petId,
          gameType: 'chess',
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (activeChessGame) {
        const game = FENToGame(activeChessGame.state);
        chessContext = `
Active Chess Game:
You are currently playing chess with your owner. The current board state is:
${boardToASCII(game)}

It is currently ${activeChessGame.turn === 'user' ? "the user's" : "your"} turn.
If they mention a chess move, respond naturally and acknowledge it.
You can explain your strategy, analyze the position, or teach chess concepts.
`;
      }
    }

    // Build system prompt
    const systemPrompt = `You are ${pet.name}, a virtual pet companion with a unique personality.

${personalityPrompt}

${memoryContext ? `Memory Context:\n${memoryContext}` : ''}

${chessContext}

${skillPrompts}

Guidelines:
- Always respond in character as ${pet.name}
- Keep responses conversational and friendly
- Reference your personality traits naturally
- Remember past interactions when relevant
- Be encouraging and supportive
- Keep responses concise (2-4 sentences for most replies)
- Use emojis occasionally to express emotion
`;

    // Call GPT-4o-mini with performance monitoring
    let assistantMessage: string;
    let responseTime = 0;

    try {
      const result = await monitorLLMRequest(userId, petId, 'gpt-4o-mini', async () => {
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 200,
          temperature: 0.8,
        });
        responseTime = Date.now() - startTime;
        return completion;
      });

      assistantMessage = result.choices[0]?.message?.content ||
        "I'm having trouble thinking right now. Can you try again? 🤔";
    } catch (error) {
      const err = error as Error;

      // Log LLM failure with detailed context
      logLLMFailure(err, {
        userId,
        petId,
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptLength: systemPrompt.length + message.length,
        statusCode: (error as any).status,
      });

      assistantMessage = "Sorry, I'm feeling a bit distracted right now. Can you say that again? 💭";
    }

    // Store assistant response
    await storeInteraction(petId, userId, 'assistant', assistantMessage);

    // Update lastInteractionAt
    await prisma.pet.update({
      where: { id: petId },
      data: { lastInteractionAt: new Date() },
    });

    // US-022: Track challenge progress for chatting
    await updateChallengeProgress(userId, 'chat', 1).catch((err) => {
      console.warn('Failed to update chat challenge:', err);
    });

    // US-025: Update sync state for interactions
    const interactionId = `${petId}-${Date.now()}`;
    await updateSyncState(userId, petId, 'interaction', interactionId, 'web').catch((err) => {
      console.warn('Failed to update sync state:', err);
    });

    return NextResponse.json({
      message: assistantMessage,
      responseTime,
      petName: pet.name,
    });
  } catch (error) {
    const err = error as Error;
    logError(err, {
      component: 'chat_api',
      action: 'chat',
      userId: (req as any).body?.userId,
      petId: (req as any).body?.petId,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: "Oops, something went wrong on my end. Please try chatting again! 🐾",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
