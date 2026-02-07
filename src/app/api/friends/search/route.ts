import { NextRequest, NextResponse } from 'next/server';
import { searchUsersByEmail } from '@/lib/friends';
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

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || email.length < 2) {
      return NextResponse.json({ error: 'Email query must be at least 2 characters' }, { status: 400 });
    }

    const users = await searchUsersByEmail(email, decoded.userId);

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
