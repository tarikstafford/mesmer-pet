// US-008: Pet Death Prevention and Recovery
// API endpoint to fetch user's recovery items

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    const userItems = await prisma.userRecoveryItem.findMany({
      where: { userId },
      include: {
        item: true,
      },
      orderBy: {
        acquiredDate: 'desc',
      },
    });

    return NextResponse.json({ items: userItems });
  } catch (error) {
    console.error('Error fetching user recovery items:', error);
    return NextResponse.json({ error: 'Failed to fetch recovery items' }, { status: 500 });
  }
}
