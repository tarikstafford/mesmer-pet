// US-025: Cross-Platform Pet Sync
// Handles real-time synchronization of pet data across web and AR platforms

import { prisma } from './prisma';

export type EntityType = 'pet' | 'interaction' | 'stats' | 'memory';
export type Platform = 'web' | 'ar' | 'mobile';
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface SyncUpdate {
  entityType: EntityType;
  entityId: string;
  data: any;
  version: number;
  platform: Platform;
  deviceId?: string;
}

export interface ConflictResolution {
  resolved: boolean;
  winner: 'client' | 'server' | 'merge';
  mergedData?: any;
  reason?: string;
}

/**
 * Update sync state for an entity
 */
export async function updateSyncState(
  userId: string,
  petId: string | null,
  entityType: EntityType,
  entityId: string,
  platform: Platform,
  deviceId?: string
): Promise<void> {
  await prisma.syncState.upsert({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
    update: {
      version: { increment: 1 },
      lastSyncedAt: new Date(),
      platform,
      deviceId,
      updatedAt: new Date(),
    },
    create: {
      userId,
      petId,
      entityType,
      entityId,
      version: 1,
      lastSyncedAt: new Date(),
      platform,
      deviceId,
    },
  });
}

/**
 * Get current sync state for an entity
 */
export async function getSyncState(
  userId: string,
  entityType: EntityType,
  entityId: string
) {
  return await prisma.syncState.findUnique({
    where: {
      userId_entityType_entityId: {
        userId,
        entityType,
        entityId,
      },
    },
  });
}

/**
 * Get all sync states for a user since a specific timestamp
 */
export async function getSyncStatesSince(
  userId: string,
  since: Date,
  petId?: string
) {
  return await prisma.syncState.findMany({
    where: {
      userId,
      ...(petId && { petId }),
      lastSyncedAt: {
        gte: since,
      },
    },
    orderBy: {
      lastSyncedAt: 'desc',
    },
  });
}

/**
 * Resolve conflicts when multiple platforms update the same entity
 * Uses "Last Write Wins" strategy with version checking
 */
export async function resolveConflict(
  userId: string,
  update: SyncUpdate
): Promise<ConflictResolution> {
  const currentState = await getSyncState(userId, update.entityType, update.entityId);

  // No existing state - accept update
  if (!currentState) {
    return {
      resolved: true,
      winner: 'client',
      reason: 'No existing state - accepting client update',
    };
  }

  // Version matches or client is newer - accept update
  if (update.version >= currentState.version) {
    return {
      resolved: true,
      winner: 'client',
      reason: 'Client version is current or newer',
    };
  }

  // Client version is older - conflict detected
  // For stats, we can merge by taking max values
  if (update.entityType === 'stats') {
    const mergedData = mergeStats(currentState, update.data);
    return {
      resolved: true,
      winner: 'merge',
      mergedData,
      reason: 'Stats merged - taking maximum values for all stats',
    };
  }

  // For interactions and memory, prefer server (more recent)
  if (update.entityType === 'interaction' || update.entityType === 'memory') {
    return {
      resolved: false,
      winner: 'server',
      reason: 'Server has newer version - rejecting client update',
    };
  }

  // Default: Last Write Wins (server wins)
  return {
    resolved: false,
    winner: 'server',
    reason: 'Server has newer version',
  };
}

/**
 * Merge stats by taking max health/happiness/energy and min hunger
 * This ensures we don't lose positive progress from either platform
 */
function mergeStats(serverState: any, clientData: any): any {
  const merged = {
    health: Math.max(serverState.health || 0, clientData.health || 0),
    hunger: Math.min(serverState.hunger || 100, clientData.hunger || 100),
    happiness: Math.max(serverState.happiness || 0, clientData.happiness || 0),
    energy: Math.max(serverState.energy || 0, clientData.energy || 0),
  };

  return merged;
}

/**
 * Queue an offline action to be synced later
 */
export async function queueOfflineAction(
  userId: string,
  petId: string | null,
  actionType: string,
  actionData: any,
  platform: Platform,
  deviceId?: string
): Promise<string> {
  const action = await prisma.offlineAction.create({
    data: {
      userId,
      petId,
      actionType,
      actionData: JSON.stringify(actionData),
      status: 'pending',
      platform,
      deviceId,
    },
  });

  return action.id;
}

/**
 * Get pending offline actions for a user
 */
export async function getPendingOfflineActions(userId: string, petId?: string) {
  return await prisma.offlineAction.findMany({
    where: {
      userId,
      ...(petId && { petId }),
      status: 'pending',
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Mark an offline action as synced
 */
export async function markActionSynced(actionId: string): Promise<void> {
  await prisma.offlineAction.update({
    where: { id: actionId },
    data: {
      status: 'synced',
      syncedAt: new Date(),
    },
  });
}

/**
 * Mark an offline action as failed
 */
export async function markActionFailed(actionId: string, error: string): Promise<void> {
  await prisma.offlineAction.update({
    where: { id: actionId },
    data: {
      status: 'failed',
      attempts: { increment: 1 },
      error,
    },
  });
}

/**
 * Mark an offline action as conflicted
 */
export async function markActionConflicted(actionId: string, reason: string): Promise<void> {
  await prisma.offlineAction.update({
    where: { id: actionId },
    data: {
      status: 'conflict',
      error: reason,
    },
  });
}

/**
 * Clean up old synced and failed actions (older than 7 days)
 */
export async function cleanupOldActions(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.offlineAction.deleteMany({
    where: {
      OR: [
        { status: 'synced', syncedAt: { lte: sevenDaysAgo } },
        { status: 'failed', createdAt: { lte: sevenDaysAgo } },
      ],
    },
  });

  return result.count;
}

/**
 * Get sync summary for a user's pets
 */
export async function getSyncSummary(userId: string) {
  const syncStates = await prisma.syncState.findMany({
    where: { userId },
    orderBy: { lastSyncedAt: 'desc' },
    take: 10,
  });

  const pendingActions = await prisma.offlineAction.count({
    where: { userId, status: 'pending' },
  });

  const failedActions = await prisma.offlineAction.count({
    where: { userId, status: 'failed' },
  });

  const conflictedActions = await prisma.offlineAction.count({
    where: { userId, status: 'conflict' },
  });

  return {
    recentSyncs: syncStates,
    pendingActions,
    failedActions,
    conflictedActions,
    lastSync: syncStates[0]?.lastSyncedAt || null,
  };
}
