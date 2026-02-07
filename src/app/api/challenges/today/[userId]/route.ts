// US-022: Get Today's Challenge for User
import { NextRequest, NextResponse } from 'next/server';
import { getTodayChallenge } from '@/lib/engagement';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    const challenge = await getTodayChallenge(userId);

    if (!challenge) {
      return NextResponse.json(
        { error: 'No challenge assigned for today' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Get today challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s challenge' },
      { status: 500 }
    );
  }
}
