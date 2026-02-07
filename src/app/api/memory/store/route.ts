/**
 * US-010: Store a new interaction in memory
 * POST /api/memory/store
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { storeInteraction } from '@/lib/memory';

const storeInteractionSchema = z.object({
  petId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  message: z.string().min(1),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = storeInteractionSchema.parse(body);

    await storeInteraction(
      validatedData.petId,
      validatedData.userId,
      validatedData.role,
      validatedData.message,
      validatedData.context
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error storing interaction:', error);
    return NextResponse.json(
      { error: 'Failed to store interaction' },
      { status: 500 }
    );
  }
}
