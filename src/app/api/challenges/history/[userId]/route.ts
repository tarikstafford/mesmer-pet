// US-022: Get User Challenge History
import { NextRequest, NextResponse } from 'next/server';
import { getUserChallengeHistory } from '@/lib/engagement';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await getUserChallengeHistory(userId, limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Get challenge history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge history' },
      { status: 500 }
    );
  }
}
