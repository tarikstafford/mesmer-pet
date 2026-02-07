import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { storeInteraction } from '@/lib/memory';
import { generatePersonalityPrompt } from '@/lib/personality';
import { formatMemoryForPrompt } from '@/lib/memory';

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

    // Fetch pet with personality traits
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        petTraits: {
          include: {
            trait: true,
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
    const memoryContext = await formatMemoryForPrompt(petId);

    // Build system prompt
    const systemPrompt = `You are ${pet.name}, a virtual pet companion with a unique personality.

${personalityPrompt}

${memoryContext ? `Memory Context:\n${memoryContext}` : ''}

Guidelines:
- Always respond in character as ${pet.name}
- Keep responses conversational and friendly
- Reference your personality traits naturally
- Remember past interactions when relevant
- Be encouraging and supportive
- Keep responses concise (2-4 sentences for most replies)
- Use emojis occasionally to express emotion
`;

    // Call GPT-4o-mini
    const startTime = Date.now();
    let assistantMessage: string;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      assistantMessage = completion.choices[0]?.message?.content ||
        "I'm having trouble thinking right now. Can you try again? 🤔";
    } catch (error) {
      console.error('OpenAI API error:', error);
      assistantMessage = "Sorry, I'm feeling a bit distracted right now. Can you say that again? 💭";
    }

    const responseTime = Date.now() - startTime;

    // Store assistant response
    await storeInteraction(petId, userId, 'assistant', assistantMessage);

    // Update lastInteractionAt
    await prisma.pet.update({
      where: { id: petId },
      data: { lastInteractionAt: new Date() },
    });

    return NextResponse.json({
      message: assistantMessage,
      responseTime,
      petName: pet.name,
    });
  } catch (error) {
    console.error('Chat API error:', error);
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
