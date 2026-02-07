/**
 * US-006: Feeding System API
 * POST /api/pets/feed - Feed a pet
 */

import { NextRequest, NextResponse } from 'next/server';
import { feedPet } from '@/lib/feeding';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, userId } = body;

    if (!petId || !userId) {
      return NextResponse.json(
        { error: 'petId and userId are required' },
        { status: 400 }
      );
    }

    const result = await feedPet(petId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, cooldownRemaining: result.cooldownRemaining },
        { status: result.cooldownRemaining ? 429 : 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      pet: result.pet,
    });
  } catch (error) {
    console.error('Feed pet error:', error);
    return NextResponse.json(
      { error: 'Failed to feed pet' },
      { status: 500 }
    );
  }
}
