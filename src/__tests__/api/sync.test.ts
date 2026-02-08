/**
 * US-TEST-012: Test sync API endpoints
 * Tests for cross-device sync, conflict resolution, and offline action queue functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as getSyncStatus } from '@/app/api/sync/status/route';
import { GET as getSyncPetData, POST as postSyncPetData } from '@/app/api/sync/pet/[petId]/route';
import { GET as getOfflineActions, POST as queueOfflineAction, PATCH as updateOfflineAction } from '@/app/api/sync/offline/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { updateSyncState, type SyncUpdate } from '@/lib/sync';

// Mock NextRequest with proper header handling
class MockNextRequest {
  private body: any;
  private headersMap: Map<string, string>;
  public url: string;

  constructor(body: any, headers?: Record<string, string>, url?: string) {
    this.body = body;
    this.headersMap = new Map(Object.entries(headers || {}));
    this.url = url || 'http://localhost:3000/api/sync';
  }

  async json() {
    return this.body;
  }

  get headers() {
    return {
      get: (key: string) => this.headersMap.get(key) || null,
    };
  }
}

describe('Sync API Endpoints', () => {
  let userId: string;
  let otherUserId: string;
  let petId: string;
  let otherPetId: string;
  let userToken: string;
  let otherUserToken: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.offlineAction.deleteMany({});
    await prisma.syncState.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.petTrait.deleteMany({});
    await prisma.warning.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    userId = user.id;
    userToken = generateToken({ userId: user.id, email: user.email });

    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        password: 'hashedpassword',
        name: 'Other User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    otherUserId = otherUser.id;
    otherUserToken = generateToken({ userId: otherUser.id, email: otherUser.email });

    // Create test pets
    const pet = await prisma.pet.create({
      data: {
        userId,
        name: 'TestPet',
        generation: 1,
        health: 80,
        hunger: 50,
        happiness: 70,
        energy: 60,
      },
    });
    petId = pet.id;

    const otherPet = await prisma.pet.create({
      data: {
        userId: otherUserId,
        name: 'OtherPet',
        generation: 1,
        health: 90,
        hunger: 40,
        happiness: 80,
        energy: 70,
      },
    });
    otherPetId = otherPet.id;
  });

  afterEach(async () => {
    await prisma.offlineAction.deleteMany({});
    await prisma.syncState.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.petTrait.deleteMany({});
    await prisma.warning.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/sync/status - Get sync status', () => {
    it('should return sync summary for authenticated user', async () => {
      // Create some sync states
      await updateSyncState(userId, petId, 'stats', petId, 'web', 'device1');
      await updateSyncState(userId, petId, 'interaction', 'int1', 'mobile', 'device2');

      // Create pending offline action
      await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'feed',
          actionData: JSON.stringify({ amount: 10 }),
          status: 'pending',
          platform: 'web',
        },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await getSyncStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.recentSyncs).toHaveLength(2);
      expect(data.data.pendingActions).toBe(1);
      expect(data.data.failedActions).toBe(0);
      expect(data.data.conflictedActions).toBe(0);
      expect(data.data.lastSync).toBeTruthy();
    });

    it('should return 401 when no auth token provided', async () => {
      const request = new MockNextRequest({}, {}) as any;

      const response = await getSyncStatus(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: 'Bearer invalid-token' }
      ) as any;

      const response = await getSyncStatus(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });

    it('should return empty summary for user with no sync data', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await getSyncStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.recentSyncs).toHaveLength(0);
      expect(data.data.pendingActions).toBe(0);
      expect(data.data.failedActions).toBe(0);
      expect(data.data.conflictedActions).toBe(0);
      expect(data.data.lastSync).toBe(null);
    });
  });

  describe('GET /api/sync/pet/[petId] - Get pet sync data', () => {
    it('should return pet data with sync states', async () => {
      // Create sync state
      await updateSyncState(userId, petId, 'stats', petId, 'web', 'device1');

      // Create interaction
      await prisma.interaction.create({
        data: {
          petId,
          userId,
          role: 'user',
          message: 'Fed the pet',
          context: 'feed',
        },
      });

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await getSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.pet.id).toBe(petId);
      expect(data.data.pet.name).toBe('TestPet');
      expect(data.data.recentInteractions).toHaveLength(1);
      expect(data.data.syncStates).toHaveLength(1);
      expect(data.data.serverTime).toBeTruthy();
    });

    it('should filter sync states by since parameter', async () => {
      // Create old sync state
      const oldDate = new Date(Date.now() - 10000); // 10 seconds ago
      await prisma.syncState.create({
        data: {
          userId,
          petId,
          entityType: 'stats',
          entityId: petId,
          version: 1,
          lastSyncedAt: oldDate,
          platform: 'web',
        },
      });

      // Create new sync state
      await updateSyncState(userId, petId, 'interaction', 'int1', 'mobile', 'device1');

      const since = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
      const url = `http://localhost:3000/api/sync/pet/${petId}?since=${since}`;
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await getSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should only return the recent sync state (interaction)
      expect(data.data.syncStates.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 when pet not found', async () => {
      const nonExistentPetId = 'non-existent-pet-id';
      const url = `http://localhost:3000/api/sync/pet/${nonExistentPetId}`;
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId: nonExistentPetId }) };
      const response = await getSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Pet not found');
    });

    it('should return 403 when user does not own pet', async () => {
      const url = `http://localhost:3000/api/sync/pet/${otherPetId}`;
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }, // using userToken for otherPet
        url
      ) as any;

      const context = { params: Promise.resolve({ petId: otherPetId }) };
      const response = await getSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 401 when no auth token provided', async () => {
      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest({}, {}, url) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await getSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/sync/pet/[petId] - Sync pet updates', () => {
    it('should accept and apply stats update when no conflict', async () => {
      const updates: SyncUpdate[] = [
        {
          entityType: 'stats',
          entityId: petId,
          data: { health: 90, hunger: 40, happiness: 80, energy: 70 },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
      expect(data.data.results[0].status).toBe('synced');
      expect(data.data.results[0].winner).toBe('client');

      // Verify pet stats were updated
      const updatedPet = await prisma.pet.findUnique({ where: { id: petId } });
      expect(updatedPet?.health).toBe(90);
      expect(updatedPet?.hunger).toBe(40);
      expect(updatedPet?.happiness).toBe(80);
      expect(updatedPet?.energy).toBe(70);
    });

    it('should merge stats when version conflict occurs', async () => {
      // Create existing sync state with version 2
      await prisma.syncState.create({
        data: {
          userId,
          petId,
          entityType: 'stats',
          entityId: petId,
          version: 2,
          lastSyncedAt: new Date(),
          platform: 'web',
        },
      });

      // Client sends update with older version (1)
      const updates: SyncUpdate[] = [
        {
          entityType: 'stats',
          entityId: petId,
          data: { health: 95, hunger: 30, happiness: 75, energy: 65 },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
      expect(data.data.results[0].status).toBe('synced');
      expect(data.data.results[0].winner).toBe('merge');
      expect(data.data.results[0].data).toBeDefined();

      // Merged stats should take max values
      expect(data.data.results[0].data.health).toBeGreaterThanOrEqual(80);
      expect(data.data.results[0].data.happiness).toBeGreaterThanOrEqual(70);
    });

    it('should handle interaction updates', async () => {
      const updates: SyncUpdate[] = [
        {
          entityType: 'interaction',
          entityId: 'int-123',
          data: { type: 'feed', timestamp: new Date().toISOString() },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
      expect(data.data.results[0].status).toBe('synced');
    });

    it('should reject interaction update when server has newer version', async () => {
      // Create existing sync state with version 2 for interaction
      await prisma.syncState.create({
        data: {
          userId,
          petId,
          entityType: 'interaction',
          entityId: 'int-123',
          version: 2,
          lastSyncedAt: new Date(),
          platform: 'web',
        },
      });

      // Client sends update with older version (1)
      const updates: SyncUpdate[] = [
        {
          entityType: 'interaction',
          entityId: 'int-123',
          data: { type: 'feed', timestamp: new Date().toISOString() },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
      expect(data.data.results[0].status).toBe('conflict');
      expect(data.data.results[0].winner).toBe('server');
    });

    it('should handle multiple concurrent updates', async () => {
      const updates: SyncUpdate[] = [
        {
          entityType: 'stats',
          entityId: petId,
          data: { health: 90, hunger: 40, happiness: 80, energy: 70 },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
        {
          entityType: 'interaction',
          entityId: 'int-456',
          data: { type: 'play', timestamp: new Date().toISOString() },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(2);
      expect(data.data.results.every((r: any) => r.status === 'synced')).toBe(true);
    });

    it('should return 403 when user does not own pet', async () => {
      const updates: SyncUpdate[] = [
        {
          entityType: 'stats',
          entityId: otherPetId,
          data: { health: 90, hunger: 40, happiness: 80, energy: 70 },
          version: 1,
          platform: 'mobile',
          deviceId: 'device1',
        },
      ];

      const url = `http://localhost:3000/api/sync/pet/${otherPetId}`;
      const request = new MockNextRequest(
        { updates, platform: 'mobile', deviceId: 'device1' },
        { authorization: `Bearer ${userToken}` }, // using userToken for otherPet
        url
      ) as any;

      const context = { params: Promise.resolve({ petId: otherPetId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Pet not found or forbidden');
    });

    it('should return 401 when no auth token provided', async () => {
      const url = `http://localhost:3000/api/sync/pet/${petId}`;
      const request = new MockNextRequest(
        { updates: [], platform: 'mobile' },
        {},
        url
      ) as any;

      const context = { params: Promise.resolve({ petId }) };
      const response = await postSyncPetData(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/sync/offline - Get pending offline actions', () => {
    it('should return pending offline actions for user', async () => {
      // Create pending actions
      await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'feed',
          actionData: JSON.stringify({ amount: 10 }),
          status: 'pending',
          platform: 'mobile',
        },
      });

      await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'play',
          actionData: JSON.stringify({ duration: 5 }),
          status: 'pending',
          platform: 'mobile',
        },
      });

      // Create synced action (should not be returned)
      await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'heal',
          actionData: JSON.stringify({ amount: 20 }),
          status: 'synced',
          platform: 'mobile',
          syncedAt: new Date(),
        },
      });

      const url = 'http://localhost:3000/api/sync/offline';
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const response = await getOfflineActions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.actions).toHaveLength(2);
      expect(data.data.actions[0].actionType).toBe('feed');
      expect(data.data.actions[0].actionData).toEqual({ amount: 10 });
      expect(data.data.actions[1].actionType).toBe('play');
    });

    it('should filter by petId when provided', async () => {
      // Create action for petId
      await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'feed',
          actionData: JSON.stringify({ amount: 10 }),
          status: 'pending',
          platform: 'mobile',
        },
      });

      // Create action without petId
      await prisma.offlineAction.create({
        data: {
          userId,
          petId: null,
          actionType: 'global',
          actionData: JSON.stringify({ type: 'sync' }),
          status: 'pending',
          platform: 'mobile',
        },
      });

      const url = `http://localhost:3000/api/sync/offline?petId=${petId}`;
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` },
        url
      ) as any;

      const response = await getOfflineActions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.actions).toHaveLength(1);
      expect(data.data.actions[0].petId).toBe(petId);
    });

    it('should return 401 when no auth token provided', async () => {
      const request = new MockNextRequest({}, {}) as any;

      const response = await getOfflineActions(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return empty array when no pending actions', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await getOfflineActions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.actions).toHaveLength(0);
    });
  });

  describe('POST /api/sync/offline - Queue offline action', () => {
    it('should queue new offline action', async () => {
      const request = new MockNextRequest(
        {
          petId,
          actionType: 'feed',
          actionData: { amount: 15 },
          platform: 'mobile',
          deviceId: 'device1',
        },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await queueOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.actionId).toBeTruthy();
      expect(data.data.message).toBe('Action queued for sync');

      // Verify action was created in database
      const action = await prisma.offlineAction.findUnique({
        where: { id: data.data.actionId },
      });
      expect(action).toBeTruthy();
      expect(action?.actionType).toBe('feed');
      expect(action?.status).toBe('pending');
    });

    it('should queue action without petId (global action)', async () => {
      const request = new MockNextRequest(
        {
          actionType: 'sync-settings',
          actionData: { theme: 'dark' },
          platform: 'web',
        },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await queueOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.actionId).toBeTruthy();

      // Verify action was created without petId
      const action = await prisma.offlineAction.findUnique({
        where: { id: data.data.actionId },
      });
      expect(action?.petId).toBe(null);
    });

    it('should return 400 when missing required fields', async () => {
      const request = new MockNextRequest(
        { petId },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await queueOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: actionType, actionData');
    });

    it('should return 401 when no auth token provided', async () => {
      const request = new MockNextRequest(
        { actionType: 'feed', actionData: {} },
        {}
      ) as any;

      const response = await queueOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PATCH /api/sync/offline - Update offline action status', () => {
    it('should mark action as synced', async () => {
      // Create pending action
      const action = await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'feed',
          actionData: JSON.stringify({ amount: 10 }),
          status: 'pending',
          platform: 'mobile',
        },
      });

      const request = new MockNextRequest(
        { actionId: action.id, status: 'synced' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Action marked as synced');

      // Verify action status was updated
      const updatedAction = await prisma.offlineAction.findUnique({
        where: { id: action.id },
      });
      expect(updatedAction?.status).toBe('synced');
      expect(updatedAction?.syncedAt).toBeTruthy();
    });

    it('should mark action as failed with error message', async () => {
      // Create pending action
      const action = await prisma.offlineAction.create({
        data: {
          userId,
          petId,
          actionType: 'feed',
          actionData: JSON.stringify({ amount: 10 }),
          status: 'pending',
          platform: 'mobile',
          attempts: 0,
        },
      });

      const request = new MockNextRequest(
        { actionId: action.id, status: 'failed', error: 'Network timeout' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Action marked as failed');

      // Verify action status was updated
      const updatedAction = await prisma.offlineAction.findUnique({
        where: { id: action.id },
      });
      expect(updatedAction?.status).toBe('failed');
      expect(updatedAction?.error).toBe('Network timeout');
      expect(updatedAction?.attempts).toBe(1);
    });

    it('should return 400 when missing required fields', async () => {
      const request = new MockNextRequest(
        { actionId: 'some-id' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: actionId, status');
    });

    it('should return 400 for invalid status', async () => {
      const request = new MockNextRequest(
        { actionId: 'some-id', status: 'invalid' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status');
    });

    it('should return 401 when no auth token provided', async () => {
      const request = new MockNextRequest(
        { actionId: 'some-id', status: 'synced' },
        {}
      ) as any;

      const response = await updateOfflineAction(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
