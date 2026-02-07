// US-008: Pet Death Prevention and Recovery
// API endpoint to use a recovery item on a pet in Critical state

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyRecovery, canUseRecoveryItem } from '@/lib/recovery';
import { z } from 'zod';

const RecoverSchema = z.object({
  petId: z.string().uuid(),
  userId: z.string().uuid(),
  itemId: z.string().uuid().optional(), // Optional: use default recovery item if not provided
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, userId, itemId } = RecoverSchema.parse(body);

    // Fetch the pet
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Verify ownership
    if (pet.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If no itemId provided, use the default "Health Potion" item
    let recoveryItemId = itemId;
    if (!recoveryItemId) {
      const defaultItem = await prisma.recoveryItem.findUnique({
        where: { itemName: 'Health Potion' },
      });
      if (!defaultItem) {
        return NextResponse.json(
          { error: 'Default recovery item not found. Please seed the database.' },
          { status: 500 }
        );
      }
      recoveryItemId = defaultItem.id;
    }

    // Check user's inventory
    const userItem = await prisma.userRecoveryItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId: recoveryItemId,
        },
      },
    });

    const quantity = userItem?.quantity || 0;

    // Validate recovery action
    const validation = canUseRecoveryItem(pet.isCritical, quantity);
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Apply recovery
    const result = applyRecovery(pet.health, pet.maxHealthPenalty);

    // Update pet stats
    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: {
        health: result.health,
        isCritical: result.isCritical,
        maxHealthPenalty: result.maxHealthPenalty,
        neglectStartedAt: null, // Reset neglect period
        lastInteractionAt: new Date(),
      },
    });

    // Decrease item quantity
    if (quantity > 1) {
      await prisma.userRecoveryItem.update({
        where: {
          userId_itemId: {
            userId,
            itemId: recoveryItemId,
          },
        },
        data: {
          quantity: quantity - 1,
        },
      });
    } else {
      // Delete if quantity would be 0
      await prisma.userRecoveryItem.delete({
        where: {
          userId_itemId: {
            userId,
            itemId: recoveryItemId,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      pet: updatedPet,
      message: result.message,
      itemsRemaining: quantity - 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }

    console.error('Error in recover endpoint:', error);
    return NextResponse.json({ error: 'Failed to recover pet' }, { status: 500 });
  }
}
