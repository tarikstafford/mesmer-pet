import { NextRequest, NextResponse } from 'next/server';
import { sendFriendRequest } from '@/lib/friends';
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

    const { addresseeId } = await request.json();

    if (!addresseeId) {
      return NextResponse.json({ error: 'Addressee ID is required' }, { status: 400 });
    }

    const friendship = await sendFriendRequest(decoded.userId, addresseeId);

    return NextResponse.json({
      success: true,
      friendship,
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    const message = error instanceof Error ? error.message : 'Failed to send friend request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
