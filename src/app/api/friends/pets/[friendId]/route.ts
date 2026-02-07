import { NextRequest, NextResponse } from 'next/server';
import { areFriends } from '@/lib/friends';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
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

    const { friendId } = await params;

    // Verify friendship
    const isFriend = await areFriends(decoded.userId, friendId);
    if (!isFriend) {
      return NextResponse.json({ error: 'You can only view pets of your friends' }, { status: 403 });
    }

    // Fetch friend's pets
    const pets = await prisma.pet.findMany({
      where: {
        userId: friendId,
      },
      include: {
        petTraits: {
          include: {
            trait: true,
          },
        },
        petSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch friend info
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      friend,
      pets,
    });
  } catch (error) {
    console.error('Error fetching friend pets:', error);
    return NextResponse.json({ error: 'Failed to fetch friend pets' }, { status: 500 });
  }
}
