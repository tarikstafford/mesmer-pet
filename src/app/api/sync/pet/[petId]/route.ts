// US-025: Sync pet data across platforms
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSyncStatesSince, updateSyncState, resolveConflict, type SyncUpdate } from '@/lib/sync';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { petId } = await context.params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    // Get pet data
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
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
        warnings: {
          where: { cleared: false },
        },
      },
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    if (pet.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get sync states since timestamp (if provided)
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 5000); // Default: last 5 seconds
    const syncStates = await getSyncStatesSince(user.userId, sinceDate, petId);

    // Get recent interactions (last 10)
    const recentInteractions = await prisma.interaction.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        pet,
        recentInteractions,
        syncStates,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sync get error:', error);
    return NextResponse.json({ error: 'Failed to sync pet data' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { petId } = await context.params;
    const body = await request.json();
    const { updates, platform = 'web', deviceId } = body;

    // Verify pet ownership
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.userId !== user.userId) {
      return NextResponse.json({ error: 'Pet not found or forbidden' }, { status: 403 });
    }

    const results = [];

    // Process each update
    for (const update of updates as SyncUpdate[]) {
      const conflict = await resolveConflict(user.userId, update);

      if (conflict.resolved) {
        // Apply the update
        const dataToApply = conflict.mergedData || update.data;

        if (update.entityType === 'stats') {
          // Update pet stats
          await prisma.pet.update({
            where: { id: petId },
            data: {
              health: dataToApply.health,
              hunger: dataToApply.hunger,
              happiness: dataToApply.happiness,
              energy: dataToApply.energy,
              lastStatUpdate: new Date(),
            },
          });

          // Update sync state
          await updateSyncState(user.userId, petId, 'stats', petId, platform, deviceId);

          results.push({
            entityType: update.entityType,
            entityId: update.entityId,
            status: 'synced',
            winner: conflict.winner,
            data: dataToApply,
          });
        } else if (update.entityType === 'interaction') {
          // Interaction already stored via memory API
          await updateSyncState(user.userId, petId, 'interaction', update.entityId, platform, deviceId);

          results.push({
            entityType: update.entityType,
            entityId: update.entityId,
            status: 'synced',
            winner: conflict.winner,
          });
        }
      } else {
        // Conflict not resolved - return server version
        results.push({
          entityType: update.entityType,
          entityId: update.entityId,
          status: 'conflict',
          reason: conflict.reason,
          winner: conflict.winner,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sync post error:', error);
    return NextResponse.json({ error: 'Failed to sync updates' }, { status: 500 });
  }
}
