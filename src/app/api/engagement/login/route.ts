// US-022: Daily Login Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { processDailyLogin } from '@/lib/engagement';

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

    const result = await processDailyLogin(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Daily login error:', error);
    return NextResponse.json(
      { error: 'Failed to process daily login' },
      { status: 500 }
    );
  }
}
