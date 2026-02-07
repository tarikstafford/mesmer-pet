// US-022: Assign Daily Challenge to User
import { NextRequest, NextResponse } from 'next/server';
import { assignDailyChallenge } from '@/lib/engagement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const userChallenge = await assignDailyChallenge(userId);

    if (!userChallenge) {
      return NextResponse.json(
        { error: 'No active challenges available' },
        { status: 404 }
      );
    }

    return NextResponse.json(userChallenge);
  } catch (error) {
    console.error('Assign challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to assign daily challenge' },
      { status: 500 }
    );
  }
}
