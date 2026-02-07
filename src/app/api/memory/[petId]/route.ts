/**
 * US-010: Retrieve memory context for a pet
 * GET /api/memory/[petId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryContext, formatMemoryForPrompt } from '@/lib/memory';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await context.params;

    const memoryContext = await getMemoryContext(petId);

    // Return both structured and formatted versions
    return NextResponse.json({
      memory: memoryContext,
      formattedPrompt: formatMemoryForPrompt(memoryContext),
    });
  } catch (error) {
    console.error('Error retrieving memory:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memory' },
      { status: 500 }
    );
  }
}
