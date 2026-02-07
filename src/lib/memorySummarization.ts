/**
 * US-010: Memory Summarization Service
 *
 * Uses GPT-4o-mini to summarize old interactions into condensed memories
 */

import OpenAI from 'openai';
import { getInteractionsForSummarization, storeMemorySummary } from './memory';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const MAX_SUMMARY_TOKENS = 500;

/**
 * Summarize old interactions for a specific pet using GPT-4o-mini
 */
export async function summarizeMemoriesForPet(petId: string): Promise<boolean> {
  // Get interactions that need summarization (older than 30 days)
  const interactions = await getInteractionsForSummarization(petId);

  // If no interactions to summarize, return early
  if (interactions.length === 0) {
    return false;
  }

  // Build the conversation history for the LLM
  const conversationText = interactions
    .map((interaction: { createdAt: Date; role: string; message: string }) => {
      const timestamp = interaction.createdAt.toISOString().split('T')[0];
      const speaker = interaction.role === 'user' ? 'User' : 'Pet';
      return `[${timestamp}] ${speaker}: ${interaction.message}`;
    })
    .join('\n');

  // Call GPT-4o-mini to generate a summary
  const prompt = `You are summarizing a pet's conversation history with its owner. The pet is an AI companion with personality traits and memories.

Below is a chronological list of interactions between the user and their pet. Please create a concise summary (max ${MAX_SUMMARY_TOKENS} tokens) that captures:
1. Key topics discussed
2. Important events or milestones
3. The pet's personality traits exhibited
4. User preferences or interests revealed
5. Emotional moments or bonding experiences

Be specific and include details that would help the pet remember context in future conversations.

Conversation History:
${conversationText}

Summary:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a memory summarization assistant. Create concise, detailed summaries that preserve important context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_SUMMARY_TOKENS,
      temperature: 0.3, // Lower temperature for more consistent summaries
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      console.error(`Failed to generate summary for pet ${petId}: No content returned`);
      return false;
    }

    // Store the summary and delete the old interactions
    const periodStart = interactions[0].createdAt;
    const periodEnd = interactions[interactions.length - 1].createdAt;

    await storeMemorySummary(petId, summary, periodStart, periodEnd);

    console.log(`Successfully summarized ${interactions.length} interactions for pet ${petId}`);
    return true;
  } catch (error) {
    console.error(`Error summarizing memories for pet ${petId}:`, error);
    return false;
  }
}

/**
 * Run summarization for all pets that have old interactions
 * This is called by the daily cron job
 */
export async function summarizeAllPetMemories(): Promise<void> {
  const { prisma } = await import('./prisma');

  // Get all pets that have interactions
  const petsWithInteractions = await prisma.pet.findMany({
    where: {
      interactions: {
        some: {},
      },
    },
    select: {
      id: true,
    },
  });

  console.log(`Starting memory summarization for ${petsWithInteractions.length} pets...`);

  let summarizedCount = 0;

  for (const pet of petsWithInteractions) {
    const summarized = await summarizeMemoriesForPet(pet.id);
    if (summarized) {
      summarizedCount++;
    }
  }

  console.log(`Memory summarization complete. Summarized memories for ${summarizedCount} pets.`);
}
