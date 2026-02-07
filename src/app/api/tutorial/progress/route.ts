/**
 * US-029: Onboarding Tutorial - Progress API
 * GET: Get tutorial progress for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTutorialProgress, initializeTutorial } from '@/lib/tutorial';

export async function GET(request: NextRequest) {
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

    // Get or initialize tutorial progress
    let progress = await getTutorialProgress(user.userId);

    if (!progress) {
      progress = await initializeTutorial(user.userId);
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error fetching tutorial progress:', error);
    return NextResponse.json({ error: 'Failed to fetch tutorial progress' }, { status: 500 });
  }
}
