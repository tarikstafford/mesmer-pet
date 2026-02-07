/**
 * US-017: Skill Activation and Storage
 * API route to get all skills for a specific pet
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPetSkills } from '@/lib/skills';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await params;

    if (!petId) {
      return NextResponse.json(
        { error: 'Pet ID is required' },
        { status: 400 }
      );
    }

    const skills = await getPetSkills(petId);

    return NextResponse.json({ skills }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pet skills' },
      { status: 500 }
    );
  }
}
