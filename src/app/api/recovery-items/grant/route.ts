// US-008: Grant recovery items to users (for testing/admin purposes)
// This endpoint allows granting free recovery items to users

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const GrantItemSchema = z.object({
  userId: z.string().uuid(),
  itemName: z.string().default('Health Potion'),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemName, quantity } = GrantItemSchema.parse(body);

    // Find the recovery item
    const item = await prisma.recoveryItem.findUnique({
      where: { itemName },
    });

    if (!item) {
      return NextResponse.json(
        { error: `Recovery item '${itemName}' not found` },
        { status: 404 }
      );
    }

    // Check if user already has this item
    const existingUserItem = await prisma.userRecoveryItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId: item.id,
        },
      },
    });

    if (existingUserItem) {
      // Update quantity
      const updated = await prisma.userRecoveryItem.update({
        where: {
          userId_itemId: {
            userId,
            itemId: item.id,
          },
        },
        data: {
          quantity: existingUserItem.quantity + quantity,
        },
        include: {
          item: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Granted ${quantity} ${itemName}(s). Total: ${updated.quantity}`,
        userItem: updated,
      });
    } else {
      // Create new user item
      const created = await prisma.userRecoveryItem.create({
        data: {
          userId,
          itemId: item.id,
          quantity,
        },
        include: {
          item: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Granted ${quantity} ${itemName}(s)`,
        userItem: created,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error granting recovery item:', error);
    return NextResponse.json({ error: 'Failed to grant recovery item' }, { status: 500 });
  }
}
