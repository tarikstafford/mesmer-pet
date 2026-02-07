// US-007: Health Warning System - Get warnings for a pet
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPetWarnings } from '@/lib/warnings';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ petId: string }> }
) {
  try {
    const params = await props.params;
    const { petId } = params;

    // Fetch pet with current stats
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: {
        id: true,
        health: true,
        hunger: true,
        happiness: true,
        energy: true,
        userId: true,
      },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Check for active warnings based on current stats
    const activeWarnings = checkPetWarnings({
      health: pet.health,
      hunger: pet.hunger,
      happiness: pet.happiness,
      energy: pet.energy,
    });

    // Fetch stored warnings from database
    const storedWarnings = await prisma.warning.findMany({
      where: {
        petId,
        cleared: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Update database warnings:
    // 1. Mark old warnings as cleared if no longer active
    // 2. Create new warnings if they don't exist in DB
    const activeWarningTypes = new Set(activeWarnings.map(w => w.type));
    const storedWarningTypes = new Set(storedWarnings.map(w => w.type));

    // Clear warnings that are no longer active
    for (const stored of storedWarnings) {
      if (!activeWarningTypes.has(stored.type as any)) {
        await prisma.warning.update({
          where: { id: stored.id },
          data: {
            cleared: true,
            clearedAt: new Date(),
          },
        });
      }
    }

    // Create new warnings that don't exist in DB
    for (const active of activeWarnings) {
      if (!storedWarningTypes.has(active.type)) {
        await prisma.warning.create({
          data: {
            petId,
            type: active.type,
            severity: active.severity,
            message: active.message,
          },
        });
      }
    }

    return NextResponse.json({
      warnings: activeWarnings,
      petId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching warnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warnings' },
      { status: 500 }
    );
  }
}
