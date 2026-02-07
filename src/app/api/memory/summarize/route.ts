/**
 * US-010: Trigger memory summarization
 * POST /api/memory/summarize
 *
 * This endpoint can be called by:
 * - Cron jobs (Vercel Cron, etc.)
 * - Manual admin trigger
 * - Background job scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeAllPetMemories } from '@/lib/memorySummarization';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here for production
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await summarizeAllPetMemories();

    return NextResponse.json({
      success: true,
      message: 'Memory summarization completed'
    });
  } catch (error) {
    console.error('Error during memory summarization:', error);
    return NextResponse.json(
      { error: 'Failed to summarize memories' },
      { status: 500 }
    );
  }
}

// Also support GET for simple cron job triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
