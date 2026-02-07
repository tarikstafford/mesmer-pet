import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPetWithGenetics } from '@/lib/genetics';
import { z } from 'zod';

// Validation schema for pet creation
const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50, 'Pet name must be less than 50 characters'),
  userId: z.string().uuid('Invalid user ID'),
});

// POST /api/pets - Create a new pet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = createPetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, userId } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check pet limit (10 pets max for MVP)
    const petCount = await prisma.pet.count({
      where: { userId },
    });

    if (petCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum pet limit reached (10 pets)' },
        { status: 400 }
      );
    }

    // Create pet with random genetics
    const pet = await createPetWithGenetics(userId, name);

    return NextResponse.json(
      {
        message: 'Pet created successfully',
        pet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Pet creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}

// GET /api/pets?userId=xxx - Get all pets for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const pets = await prisma.pet.findMany({
      where: { userId },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ pets }, { status: 200 });
  } catch (error) {
    console.error('Pet fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}
