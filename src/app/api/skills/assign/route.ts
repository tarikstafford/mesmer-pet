/**
 * US-017: Skill Activation and Storage
 * API route to assign a skill to a pet
 */

import { NextRequest, NextResponse } from 'next/server';
import { assignSkillToPet } from '@/lib/skills';

export async function POST(request: NextRequest) {
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

    // Assign skill to pet
    const petSkill = await assignSkillToPet(petId, skillId, userId);

    return NextResponse.json(
      {
        message: 'Skill assigned to pet successfully',
        petSkill,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to assign skill to pet' },
      { status: 500 }
    );
  }
}
