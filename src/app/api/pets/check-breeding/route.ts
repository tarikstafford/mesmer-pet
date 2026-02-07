import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canBreed, calculateCompatibility } from '@/lib/breeding';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Get auth token from headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const parent1Id = searchParams.get('parent1Id');
    const parent2Id = searchParams.get('parent2Id');

    if (!parent1Id || !parent2Id) {
      return NextResponse.json(
        { error: 'Missing required parameters: parent1Id, parent2Id' },
        { status: 400 }
      );
    }

    // Fetch both parent pets
    const [parent1, parent2] = await Promise.all([
      prisma.pet.findUnique({
        where: { id: parent1Id },
      }),
      prisma.pet.findUnique({
        where: { id: parent2Id },
      }),
    ]);

    if (!parent1 || !parent2) {
      return NextResponse.json({ error: 'One or both parent pets not found' }, { status: 404 });
    }

    // Check ownership
    if (parent1.userId !== userId && parent2.userId !== userId) {
      return NextResponse.json(
        { error: 'You must own at least one of the parent pets' },
        { status: 403 }
      );
    }

    // Check breeding eligibility
    const breedingCheck = canBreed(parent1, parent2);
    const compatibility = calculateCompatibility(parent1, parent2);

    return NextResponse.json({
      canBreed: breedingCheck.canBreed,
      reason: breedingCheck.reason,
      compatibility,
      parent1: {
        id: parent1.id,
        name: parent1.name,
        generation: parent1.generation,
        health: parent1.health,
        age: Math.floor((Date.now() - parent1.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      },
      parent2: {
        id: parent2.id,
        name: parent2.name,
        generation: parent2.generation,
        health: parent2.health,
        age: Math.floor((Date.now() - parent2.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      },
    });
  } catch (error) {
    console.error('Error checking breeding eligibility:', error);
    return NextResponse.json({ error: 'Failed to check breeding eligibility' }, { status: 500 });
  }
}
