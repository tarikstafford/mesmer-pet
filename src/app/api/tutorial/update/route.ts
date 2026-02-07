/**
 * US-029: Onboarding Tutorial - Update API
 * POST: Update tutorial step completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateTutorialStep } from '@/lib/tutorial';
import { z } from 'zod';

const updateSchema = z.object({
  step: z.enum(['create_pet', 'feed', 'chat', 'view_stats', 'learn_breeding']),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { step } = validation.data;

    // Update tutorial progress
    const updated = await updateTutorialStep(user.userId, step);

    return NextResponse.json({
      success: true,
      progress: updated,
    });
  } catch (error) {
    console.error('Error updating tutorial:', error);
    return NextResponse.json({ error: 'Failed to update tutorial progress' }, { status: 500 });
  }
}
