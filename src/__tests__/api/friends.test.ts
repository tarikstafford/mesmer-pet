/**
 * US-TEST-009: Test friends/social API endpoints
 * Tests for friend request, accept, decline, list, and remove functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as sendRequest } from '@/app/api/friends/send/route';
import { POST as acceptRequest } from '@/app/api/friends/accept/route';
import { POST as declineRequest } from '@/app/api/friends/decline/route';
import { GET as listFriends } from '@/app/api/friends/list/route';
import { DELETE as removeFriend } from '@/app/api/friends/remove/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { MAX_FRIENDS } from '@/lib/friends';

// Mock NextRequest with proper header handling
class MockNextRequest {
  private body: any;
  private headersMap: Map<string, string>;

  constructor(body: any, headers?: Record<string, string>) {
    this.body = body;
    this.headersMap = new Map(Object.entries(headers || {}));
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

describe('Friends API Endpoints', () => {
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.friendship.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        password: 'hashedpassword',
        name: 'User One',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    user1Id = user1.id;
    user1Token = generateToken({ userId: user1.id, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        password: 'hashedpassword',
        name: 'User Two',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    user2Id = user2.id;
    user2Token = generateToken({ userId: user2.id, email: user2.email });

    const user3 = await prisma.user.create({
      data: {
        email: 'user3@example.com',
        password: 'hashedpassword',
        name: 'User Three',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    user3Id = user3.id;
    user3Token = generateToken({ userId: user3.id, email: user3.email });
  });

  afterEach(async () => {
    await prisma.friendship.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/friends/send - Send friend request', () => {
    it('should send friend request successfully', async () => {
      const request = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friendship).toBeDefined();
      expect(data.friendship.requesterId).toBe(user1Id);
      expect(data.friendship.addresseeId).toBe(user2Id);
      expect(data.friendship.status).toBe('pending');
      expect(data.friendship.addressee.email).toBe('user2@example.com');
    });

    it('should reject request without auth token', async () => {
      const request = new MockNextRequest({ addresseeId: user2Id }) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const request = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: 'Bearer invalid_token' }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });

    it('should reject request without addresseeId', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Addressee ID is required');
    });

    it('should reject duplicate friend requests', async () => {
      // Send first request
      const request1 = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;
      await sendRequest(request1);

      // Try to send again
      const request2 = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friend request already pending');
    });

    it('should reject friend request to non-existent user', async () => {
      const request = new MockNextRequest(
        { addresseeId: 'non-existent-id' },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User not found');
    });

    it('should reject friend request to self', async () => {
      const request = new MockNextRequest(
        { addresseeId: user1Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot send friend request to yourself');
    });

    it('should reject request when already friends', async () => {
      // Create accepted friendship
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        },
      });

      const request = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Already friends with this user');
    });

    it('should allow re-requesting after decline', async () => {
      // Create declined friendship
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'declined',
        },
      });

      const request = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friendship.status).toBe('pending');
    });

    it('should reject when user reaches max friends limit', async () => {
      // Create MAX_FRIENDS accepted friendships for user1
      for (let i = 0; i < MAX_FRIENDS; i++) {
        const user = await prisma.user.create({
          data: {
            email: `friend${i}@example.com`,
            password: 'hashedpassword',
            name: `Friend ${i}`,
            dateOfBirth: new Date('2000-01-01'),
          },
        });

        await prisma.friendship.create({
          data: {
            requesterId: user1Id,
            addresseeId: user.id,
            status: 'accepted',
          },
        });
      }

      const request = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(`You have reached the maximum of ${MAX_FRIENDS} friends`);
    });
  });

  describe('POST /api/friends/accept - Accept friend request', () => {
    let friendshipId: string;

    beforeEach(async () => {
      // Create pending friendship
      const friendship = await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'pending',
        },
      });
      friendshipId = friendship.id;
    });

    it('should accept friend request successfully', async () => {
      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.friendship.status).toBe('accepted');
      expect(data.friendship.requester.email).toBe('user1@example.com');
      expect(data.friendship.addressee.email).toBe('user2@example.com');

      // Verify in database
      const updatedFriendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });
      expect(updatedFriendship?.status).toBe('accepted');
    });

    it('should reject accept without auth token', async () => {
      const request = new MockNextRequest({ friendshipId }) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject accept without friendshipId', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friendship ID is required');
    });

    it('should reject accept from non-addressee', async () => {
      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user3Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('You can only accept requests sent to you');
    });

    it('should reject accept for non-existent friendship', async () => {
      const request = new MockNextRequest(
        { friendshipId: 'non-existent-id' },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friend request not found');
    });

    it('should reject accept for non-pending friendship', async () => {
      // Update to accepted
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      });

      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This friend request is no longer pending');
    });

    it('should reject accept when addressee reaches max friends limit', async () => {
      // Create MAX_FRIENDS accepted friendships for user2 (addressee)
      for (let i = 0; i < MAX_FRIENDS; i++) {
        const user = await prisma.user.create({
          data: {
            email: `friend${i}@example.com`,
            password: 'hashedpassword',
            name: `Friend ${i}`,
            dateOfBirth: new Date('2000-01-01'),
          },
        });

        await prisma.friendship.create({
          data: {
            requesterId: user2Id,
            addresseeId: user.id,
            status: 'accepted',
          },
        });
      }

      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await acceptRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(`You have reached the maximum of ${MAX_FRIENDS} friends`);
    });
  });

  describe('POST /api/friends/decline - Decline friend request', () => {
    let friendshipId: string;

    beforeEach(async () => {
      // Create pending friendship
      const friendship = await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'pending',
        },
      });
      friendshipId = friendship.id;
    });

    it('should decline friend request successfully', async () => {
      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify in database
      const updatedFriendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });
      expect(updatedFriendship?.status).toBe('declined');
    });

    it('should reject decline without auth token', async () => {
      const request = new MockNextRequest({ friendshipId }) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject decline without friendshipId', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friendship ID is required');
    });

    it('should reject decline from non-addressee', async () => {
      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user3Token}` }
      ) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('You can only decline requests sent to you');
    });

    it('should reject decline for non-existent friendship', async () => {
      const request = new MockNextRequest(
        { friendshipId: 'non-existent-id' },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friend request not found');
    });

    it('should reject decline for non-pending friendship', async () => {
      // Update to accepted
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      });

      const request = new MockNextRequest(
        { friendshipId },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await declineRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('This friend request is no longer pending');
    });
  });

  describe('GET /api/friends/list - Get friends list', () => {
    it('should return empty list when user has no friends', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await listFriends(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.friends).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should return list of accepted friends', async () => {
      // Create accepted friendships
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        },
      });

      await prisma.friendship.create({
        data: {
          requesterId: user3Id,
          addresseeId: user1Id,
          status: 'accepted',
        },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await listFriends(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.friends).toHaveLength(2);
      expect(data.count).toBe(2);

      // Verify friend data
      const friendIds = data.friends.map((f: any) => f.friendId);
      expect(friendIds).toContain(user2Id);
      expect(friendIds).toContain(user3Id);

      const friend2 = data.friends.find((f: any) => f.friendId === user2Id);
      expect(friend2.email).toBe('user2@example.com');
      expect(friend2.name).toBe('User Two');
      expect(friend2.friendshipId).toBeDefined();
      expect(friend2.friendsSince).toBeDefined();
    });

    it('should not include pending or declined friendships', async () => {
      // Create various friendships
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'pending',
        },
      });

      await prisma.friendship.create({
        data: {
          requesterId: user3Id,
          addresseeId: user1Id,
          status: 'declined',
        },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await listFriends(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.friends).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should reject list request without auth token', async () => {
      const request = new MockNextRequest({}) as any;

      const response = await listFriends(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/friends/remove - Remove friend', () => {
    let friendshipId: string;

    beforeEach(async () => {
      // Create accepted friendship
      const friendship = await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        },
      });
      friendshipId = friendship.id;
    });

    it('should remove friend successfully (as requester)', async () => {
      const request = new MockNextRequest(
        { friendId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify friendship is deleted
      const deletedFriendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });
      expect(deletedFriendship).toBeNull();
    });

    it('should remove friend successfully (as addressee)', async () => {
      const request = new MockNextRequest(
        { friendId: user1Id },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify friendship is deleted
      const deletedFriendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
      });
      expect(deletedFriendship).toBeNull();
    });

    it('should reject remove without auth token', async () => {
      const request = new MockNextRequest({ friendId: user2Id }) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject remove without friendId', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friend ID is required');
    });

    it('should reject remove for non-existent friendship', async () => {
      const request = new MockNextRequest(
        { friendId: user3Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friendship not found');
    });

    it('should reject remove for pending friendship', async () => {
      // Create pending friendship with user3
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user3Id,
          status: 'pending',
        },
      });

      const request = new MockNextRequest(
        { friendId: user3Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;

      const response = await removeFriend(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friendship not found');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle bidirectional friendship checks', async () => {
      // Create friendship with user1 as requester
      await prisma.friendship.create({
        data: {
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        },
      });

      // Try to send request in opposite direction
      const request = new MockNextRequest(
        { addresseeId: user1Id },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await sendRequest(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Already friends with this user');
    });

    it('should handle multiple concurrent requests correctly', async () => {
      // Send request from user1 to user2
      const request1 = new MockNextRequest(
        { addresseeId: user2Id },
        { authorization: `Bearer ${user1Token}` }
      ) as any;
      await sendRequest(request1);

      // User2 tries to send request to user1 while pending
      const request2 = new MockNextRequest(
        { addresseeId: user1Id },
        { authorization: `Bearer ${user2Token}` }
      ) as any;

      const response = await sendRequest(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Friend request already pending');
    });
  });
});
