import { NextRequest, NextResponse } from 'next/server';
import { getPendingRequests, getSentRequests } from '@/lib/friends';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const [pendingRequests, sentRequests] = await Promise.all([
      getPendingRequests(decoded.userId),
      getSentRequests(decoded.userId),
    ]);

    return NextResponse.json({
      received: pendingRequests,
      sent: sentRequests,
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
  }
}
