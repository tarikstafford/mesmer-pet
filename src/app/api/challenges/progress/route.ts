// US-022: Update Challenge Progress
import { NextRequest, NextResponse } from 'next/server';
import { updateChallengeProgress } from '@/lib/engagement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, challengeType, incrementBy = 1 } = body;

    if (!userId || !challengeType) {
      return NextResponse.json(
        { error: 'userId and challengeType are required' },
        { status: 400 }
      );
    }

    const result = await updateChallengeProgress(userId, challengeType, incrementBy);

    if (!result) {
      return NextResponse.json(
        { error: 'No active challenge found for this type today' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update challenge progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge progress' },
      { status: 500 }
    );
  }
}
