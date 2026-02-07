/**
 * US-029: Onboarding Tutorial - Skip API
 * POST: Skip the tutorial
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { skipTutorial } from '@/lib/tutorial';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Skip tutorial
    const updated = await skipTutorial(user.userId);

    return NextResponse.json({
      success: true,
      progress: updated,
    });
  } catch (error) {
    console.error('Error skipping tutorial:', error);
    return NextResponse.json({ error: 'Failed to skip tutorial' }, { status: 500 });
  }
}
