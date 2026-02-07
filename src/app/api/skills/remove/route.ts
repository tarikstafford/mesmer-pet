/**
 * US-017: Skill Activation and Storage
 * API route to remove a skill from a pet
 */

import { NextRequest, NextResponse } from 'next/server';
import { removeSkillFromPet } from '@/lib/skills';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, skillId, userId } = body;

    // Validate required fields
    if (!petId || !skillId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: petId, skillId, userId' },
        { status: 400 }
      );
    }

    // Remove skill from pet
    await removeSkillFromPet(petId, skillId, userId);

    return NextResponse.json(
      { message: 'Skill removed from pet successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to remove skill from pet' },
      { status: 500 }
    );
  }
}
