/**
 * US-010: Hybrid Memory System
 * US-030: Data Privacy - Encryption at Rest
 *
 * Manages pet memory with a hybrid approach:
 * - Recent interactions (last 50) stored with full detail
 * - Older interactions (30+ days) summarized using GPT-4o-mini
 * - Memory retrieval combines both for LLM context
 * - All messages encrypted at rest for privacy compliance
 */

import { prisma } from './prisma';
import { encrypt, decrypt } from './encryption';

const MAX_RECENT_INTERACTIONS = 50;
const SUMMARIZATION_AGE_DAYS = 30;

export interface MemoryContext {
  recentInteractions: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  historicalSummaries: Array<{
    summary: string;
    period: string;
  }>;
}

/**
 * Store a new interaction (message) for a pet
 * Messages are encrypted at rest for privacy compliance (US-030)
 */
export async function storeInteraction(
  petId: string,
  userId: string,
  role: 'user' | 'assistant',
  message: string,
  context?: string
) {
  // Encrypt the message before storing
  const encryptedMessage = encrypt(message);
  const encryptedContext = context ? encrypt(context) : undefined;

  // Store the encrypted interaction
  await prisma.interaction.create({
    data: {
      petId,
      userId,
      role,
      message: encryptedMessage,
      context: encryptedContext,
    },
  });

  // Clean up old interactions to maintain only last 50
  await pruneOldInteractions(petId);
}

/**
 * Remove interactions beyond the last 50 for a pet
 */
async function pruneOldInteractions(petId: string) {
  // Get all interactions sorted by creation date (newest first)
  const allInteractions = await prisma.interaction.findMany({
    where: { petId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  // If we have more than MAX_RECENT_INTERACTIONS, delete the older ones
  if (allInteractions.length > MAX_RECENT_INTERACTIONS) {
    const idsToKeep = allInteractions
      .slice(0, MAX_RECENT_INTERACTIONS)
      .map((i: { id: string }) => i.id);

    await prisma.interaction.deleteMany({
      where: {
        petId,
        id: { notIn: idsToKeep },
      },
    });
  }
}

/**
 * Retrieve full memory context for a pet (recent + summarized)
 * This is used to build the LLM system prompt
 * Decrypts messages when retrieving (US-030)
 */
export async function getMemoryContext(petId: string): Promise<MemoryContext> {
  // Get recent interactions (last 50, newest first, then reverse for chronological order)
  const recentInteractions = await prisma.interaction.findMany({
    where: { petId },
    orderBy: { createdAt: 'desc' },
    take: MAX_RECENT_INTERACTIONS,
    select: {
      role: true,
      message: true,
      createdAt: true,
    },
  });

  // Get all memory summaries (these are encrypted too)
  const summaries = await prisma.memorySummary.findMany({
    where: { petId },
    orderBy: { periodStart: 'asc' },
    select: {
      summary: true,
      periodStart: true,
      periodEnd: true,
    },
  });

  return {
    recentInteractions: recentInteractions.reverse().map((interaction: { role: string; message: string; createdAt: Date }) => ({
      role: interaction.role as 'user' | 'assistant',
      content: decrypt(interaction.message), // Decrypt message when retrieving
      timestamp: interaction.createdAt,
    })),
    historicalSummaries: summaries.map((s: { summary: string; periodStart: Date; periodEnd: Date }) => ({
      summary: decrypt(s.summary), // Decrypt summary when retrieving
      period: `${s.periodStart.toISOString().split('T')[0]} to ${s.periodEnd.toISOString().split('T')[0]}`,
    })),
  };
}

/**
 * Get interactions that are older than 30 days and not yet summarized
 * Used by the summarization job
 */
export async function getInteractionsForSummarization(petId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - SUMMARIZATION_AGE_DAYS);

  // Get interactions older than 30 days
  const oldInteractions = await prisma.interaction.findMany({
    where: {
      petId,
      createdAt: { lt: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      message: true,
      context: true,
      createdAt: true,
    },
  });

  // Check if we already have a summary covering this period
  if (oldInteractions.length > 0) {
    const oldestDate = oldInteractions[0].createdAt;
    const newestDate = oldInteractions[oldInteractions.length - 1].createdAt;

    const existingSummary = await prisma.memorySummary.findFirst({
      where: {
        petId,
        periodStart: { lte: oldestDate },
        periodEnd: { gte: newestDate },
      },
    });

    // If we already have a summary for this period, return empty array
    if (existingSummary) {
      return [];
    }
  }

  return oldInteractions;
}

/**
 * Store a memory summary and delete the interactions it summarizes
 * Encrypts summary before storing (US-030)
 */
export async function storeMemorySummary(
  petId: string,
  summary: string,
  periodStart: Date,
  periodEnd: Date
) {
  // Encrypt the summary before storing
  const encryptedSummary = encrypt(summary);

  // Create the summary
  await prisma.memorySummary.create({
    data: {
      petId,
      summary: encryptedSummary,
      periodStart,
      periodEnd,
    },
  });

  // Delete the interactions that were summarized (they're now in the summary)
  await prisma.interaction.deleteMany({
    where: {
      petId,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });
}

/**
 * Format memory context as a string for LLM system prompt injection
 */
export function formatMemoryForPrompt(memory: MemoryContext): string {
  let prompt = '';

  // Add historical summaries first
  if (memory.historicalSummaries.length > 0) {
    prompt += '## Historical Memory\n';
    memory.historicalSummaries.forEach((summary) => {
      prompt += `\n**${summary.period}:**\n${summary.summary}\n`;
    });
    prompt += '\n';
  }

  // Add recent interactions
  if (memory.recentInteractions.length > 0) {
    prompt += '## Recent Interactions\n';
    memory.recentInteractions.forEach((interaction) => {
      const timestamp = interaction.timestamp.toISOString().split('T')[0];
      prompt += `[${timestamp}] ${interaction.role === 'user' ? 'User' : 'You'}: ${interaction.content}\n`;
    });
  }

  return prompt.trim();
}
