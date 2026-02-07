import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { cookieConsent } = body;

    // Update user's cookie consent
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { cookieConsent },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cookie consent update error:', error);
    return NextResponse.json(
      { error: 'Failed to update cookie consent' },
      { status: 500 }
    );
  }
}
