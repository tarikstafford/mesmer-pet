import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStatDegradation } from '@/lib/statDegradation';

// POST /api/pets/update-stats - Update all pets' stats based on time elapsed
// Can be called manually or by background jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, timezoneOffset = 0 } = body;

    if (petId) {
      // Update single pet
      const pet = await prisma.pet.findUnique({
        where: { id: petId },
      });

      if (!pet) {
        return NextResponse.json(
          { error: 'Pet not found' },
          { status: 404 }
        );
      }

      const updatedStats = calculateStatDegradation(
        {
          health: pet.health,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
        },
        pet.lastStatUpdate,
        pet.lastInteractionAt,
        pet.neglectStartedAt,
        pet.isCritical,
        timezoneOffset
      );

      const updatedPet = await prisma.pet.update({
        where: { id: petId },
        data: {
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          energy: updatedStats.energy,
          lastStatUpdate: updatedStats.lastStatUpdate,
          isCritical: updatedStats.isCritical || false,
          neglectStartedAt: updatedStats.neglectStartedAt,
        },
      });

      return NextResponse.json(
        {
          message: 'Pet stats updated',
          pet: updatedPet,
        },
        { status: 200 }
      );
    } else {
      // Update all pets (for background job)
      const allPets = await prisma.pet.findMany();

      const updatePromises = allPets.map(async (pet) => {
        const updatedStats = calculateStatDegradation(
          {
            health: pet.health,
            hunger: pet.hunger,
            happiness: pet.happiness,
            energy: pet.energy,
          },
          pet.lastStatUpdate,
          pet.lastInteractionAt,
          pet.neglectStartedAt,
          pet.isCritical,
          timezoneOffset
        );

        return prisma.pet.update({
          where: { id: pet.id },
          data: {
            health: updatedStats.health,
            hunger: updatedStats.hunger,
            happiness: updatedStats.happiness,
            energy: updatedStats.energy,
            lastStatUpdate: updatedStats.lastStatUpdate,
            isCritical: updatedStats.isCritical || false,
            neglectStartedAt: updatedStats.neglectStartedAt,
          },
        });
      });

      await Promise.all(updatePromises);

      return NextResponse.json(
        {
          message: `Updated stats for ${allPets.length} pets`,
          count: allPets.length,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Stat update error:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}

// GET /api/pets/update-stats - Same as POST for easier cron job integration
export async function GET(request: NextRequest) {
  try {
    const allPets = await prisma.pet.findMany();

    const updatePromises = allPets.map(async (pet) => {
      const updatedStats = calculateStatDegradation(
        {
          health: pet.health,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
        },
        pet.lastStatUpdate,
        pet.lastInteractionAt,
        pet.neglectStartedAt,
        pet.isCritical,
        0 // Default timezone offset for cron jobs
      );

      return prisma.pet.update({
        where: { id: pet.id },
        data: {
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          energy: updatedStats.energy,
          lastStatUpdate: updatedStats.lastStatUpdate,
          isCritical: updatedStats.isCritical || false,
          neglectStartedAt: updatedStats.neglectStartedAt,
        },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json(
      {
        message: `Updated stats for ${allPets.length} pets`,
        count: allPets.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stat update error:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}
