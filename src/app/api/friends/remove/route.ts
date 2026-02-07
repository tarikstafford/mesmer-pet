import { NextRequest, NextResponse } from 'next/server';
import { removeFriend } from '@/lib/friends';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    await removeFriend(decoded.userId, friendId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove friend';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
