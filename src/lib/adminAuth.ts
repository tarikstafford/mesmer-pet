import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export interface AdminUser {
  userId: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Verify that the request is from an admin user
 * Returns the admin user object or throws an error
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminUser> {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify JWT token
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    throw new Error('Invalid token');
  }

  // Fetch user and verify admin status
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  return {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
}

/**
 * Helper function to check if a user is an admin (for non-API usage)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return user?.isAdmin ?? false;
}
