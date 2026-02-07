/**
 * US-017: Skill Activation and Storage
 * API route to get all skills owned by a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSkills } from '@/lib/skills';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const skills = await getUserSkills(userId);

    return NextResponse.json({ skills }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user skills' },
      { status: 500 }
    );
  }
}
