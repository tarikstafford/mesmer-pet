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

    const userId = decoded.userId;
    const body = await request.json();
    const { confirmationText } = body;

    // Require confirmation text
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation text' },
        { status: 400 }
      );
    }

    // Mark account for deletion (allows for grace period if needed)
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
      },
    });

    // Immediately delete all user data (GDPR Right to Erasure)
    // Prisma cascade deletes will handle related records automatically
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

// Request deletion (marks for deletion but doesn't delete immediately)
export async function PUT(request: NextRequest) {
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

    const userId = decoded.userId;

    // Mark account for deletion (30-day grace period)
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account marked for deletion. You have 30 days to cancel.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    return NextResponse.json(
      { error: 'Failed to request account deletion' },
      { status: 500 }
    );
  }
}

// Cancel deletion request
export async function DELETE(request: NextRequest) {
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

    const userId = decoded.userId;

    // Cancel deletion request
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled',
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel deletion' },
      { status: 500 }
    );
  }
}
