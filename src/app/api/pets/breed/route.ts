import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { breedPets, canBreed } from '@/lib/breeding';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
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

    // Parse request body
    const body = await req.json();
    const { parent1Id, parent2Id, offspringName } = body;

    if (!parent1Id || !parent2Id || !offspringName) {
      return NextResponse.json(
        { error: 'Missing required fields: parent1Id, parent2Id, offspringName' },
        { status: 400 }
      );
    }

    // Fetch both parent pets with traits
    const [parent1, parent2] = await Promise.all([
      prisma.pet.findUnique({
        where: { id: parent1Id },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      }),
      prisma.pet.findUnique({
        where: { id: parent2Id },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      }),
    ]);

    if (!parent1 || !parent2) {
      return NextResponse.json({ error: 'One or both parent pets not found' }, { status: 404 });
    }

    // Validate breeding eligibility
    const breedingCheck = canBreed(parent1, parent2);
    if (!breedingCheck.canBreed) {
      return NextResponse.json({ error: breedingCheck.reason }, { status: 400 });
    }

    // Check pet ownership (at least one parent must be owned by user)
    // For MVP, we'll allow breeding if user owns at least one parent
    // US-012 will add friend breeding logic
    if (parent1.userId !== userId && parent2.userId !== userId) {
      return NextResponse.json(
        { error: 'You must own at least one of the parent pets' },
        { status: 403 }
      );
    }

    // Check if user has reached pet limit (10 pets)
    const userPetCount = await prisma.pet.count({
      where: { userId },
    });

    if (userPetCount >= 10) {
      return NextResponse.json(
        { error: 'You have reached the maximum number of pets (10)' },
        { status: 400 }
      );
    }

    // Breed the pets
    const offspring = await breedPets(parent1, parent2, userId, offspringName);

    // Update lastBredAt for both parents
    const now = new Date();
    await Promise.all([
      prisma.pet.update({
        where: { id: parent1.id },
        data: { lastBredAt: now },
      }),
      prisma.pet.update({
        where: { id: parent2.id },
        data: { lastBredAt: now },
      }),
    ]);

    return NextResponse.json({
      message: 'Breeding successful!',
      offspring,
    });
  } catch (error) {
    console.error('Error breeding pets:', error);
    return NextResponse.json({ error: 'Failed to breed pets' }, { status: 500 });
  }
}
