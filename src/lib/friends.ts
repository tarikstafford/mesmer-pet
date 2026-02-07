import { prisma } from './prisma';

export const MAX_FRIENDS = 50; // MVP limit

/**
 * Send a friend request from one user to another
 */
export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  // Validate users exist
  const [requester, addressee] = await Promise.all([
    prisma.user.findUnique({ where: { id: requesterId } }),
    prisma.user.findUnique({ where: { id: addresseeId } }),
  ]);

  if (!requester || !addressee) {
    throw new Error('User not found');
  }

  if (requesterId === addresseeId) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check for existing friendship or pending request in either direction
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new Error('Already friends with this user');
    } else if (existingFriendship.status === 'pending') {
      throw new Error('Friend request already pending');
    } else if (existingFriendship.status === 'declined') {
      // Allow re-requesting after a decline
      return prisma.friendship.update({
        where: { id: existingFriendship.id },
        data: {
          status: 'pending',
          requesterId, // Update requester to current user
          addresseeId,
          updatedAt: new Date(),
        },
        include: {
          addressee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    }
  }

  // Check friend limit for requester
  const requesterFriendCount = await getFriendCount(requesterId);
  if (requesterFriendCount >= MAX_FRIENDS) {
    throw new Error(`You have reached the maximum of ${MAX_FRIENDS} friends`);
  }

  // Create new friend request
  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: 'pending',
    },
    include: {
      addressee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  if (friendship.addresseeId !== userId) {
    throw new Error('You can only accept requests sent to you');
  }

  if (friendship.status !== 'pending') {
    throw new Error('This friend request is no longer pending');
  }

  // Check friend limit for addressee
  const addresseeFriendCount = await getFriendCount(userId);
  if (addresseeFriendCount >= MAX_FRIENDS) {
    throw new Error(`You have reached the maximum of ${MAX_FRIENDS} friends`);
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'accepted' },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      addressee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(friendshipId: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  if (friendship.addresseeId !== userId) {
    throw new Error('You can only decline requests sent to you');
  }

  if (friendship.status !== 'pending') {
    throw new Error('This friend request is no longer pending');
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'declined' },
  });
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: friendId, status: 'accepted' },
        { requesterId: friendId, addresseeId: userId, status: 'accepted' },
      ],
    },
  });

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  return { success: true };
}

/**
 * Get all friends for a user
 */
export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'accepted' },
        { addresseeId: userId, status: 'accepted' },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
      addressee: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  // Extract friend info
  return friendships.map((friendship) => {
    const friend = friendship.requesterId === userId ? friendship.addressee : friendship.requester;
    return {
      friendshipId: friendship.id,
      friendId: friend.id,
      email: friend.email,
      name: friend.name,
      createdAt: friend.createdAt,
      friendsSince: friendship.updatedAt, // When friendship was accepted
    };
  });
}

/**
 * Get pending friend requests (sent to user)
 */
export async function getPendingRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: 'pending',
    },
    include: {
      requester: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get sent friend requests (by user)
 */
export async function getSentRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      requesterId: userId,
      status: 'pending',
    },
    include: {
      addressee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get friend count for a user
 */
export async function getFriendCount(userId: string): Promise<number> {
  return prisma.friendship.count({
    where: {
      OR: [
        { requesterId: userId, status: 'accepted' },
        { addresseeId: userId, status: 'accepted' },
      ],
    },
  });
}

/**
 * Check if two users are friends
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId1, addresseeId: userId2, status: 'accepted' },
        { requesterId: userId2, addresseeId: userId1, status: 'accepted' },
      ],
    },
  });

  return !!friendship;
}

/**
 * Find users by email for friend requests
 */
export async function searchUsersByEmail(email: string, currentUserId: string) {
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: email,
      },
      id: {
        not: currentUserId, // Don't include current user
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
    take: 10, // Limit results
  });

  // Check friendship status for each user
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, addresseeId: user.id },
            { requesterId: user.id, addresseeId: currentUserId },
          ],
        },
      });

      return {
        ...user,
        friendshipStatus: friendship?.status || 'none',
        friendshipId: friendship?.id || null,
      };
    })
  );

  return usersWithStatus;
}
