import { NextRequest, NextResponse } from 'next/server';
import { acceptFriendRequest } from '@/lib/friends';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const { friendshipId } = await request.json();

    if (!friendshipId) {
      return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 });
    }

    const friendship = await acceptFriendRequest(friendshipId, decoded.userId);

    return NextResponse.json({
      success: true,
      friendship,
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept friend request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
