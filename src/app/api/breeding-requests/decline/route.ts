import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Fetch breeding request
    const breedingRequest = await prisma.breedingRequest.findUnique({
      where: { id: requestId },
    });

    if (!breedingRequest) {
      return NextResponse.json({ error: 'Breeding request not found' }, { status: 404 });
    }

    // Verify user is the addressee
    if (breedingRequest.addresseeId !== decoded.userId) {
      return NextResponse.json({ error: 'You can only decline requests sent to you' }, { status: 403 });
    }

    if (breedingRequest.status !== 'pending') {
      return NextResponse.json({ error: 'This breeding request is no longer pending' }, { status: 400 });
    }

    // Mark request as declined
    await prisma.breedingRequest.update({
      where: { id: requestId },
      data: { status: 'declined' },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error declining breeding request:', error);
    const message = error instanceof Error ? error.message : 'Failed to decline breeding request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
