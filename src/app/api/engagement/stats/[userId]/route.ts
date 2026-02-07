// US-022: Get User Engagement Statistics
import { NextRequest, NextResponse } from 'next/server';
import { getUserEngagement } from '@/lib/engagement';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    const engagement = await getUserEngagement(userId);

    if (!engagement) {
      return NextResponse.json(
        { error: 'User engagement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(engagement);
  } catch (error) {
    console.error('Get engagement stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement statistics' },
      { status: 500 }
    );
  }
}
