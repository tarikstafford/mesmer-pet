import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { breedPets, canBreed } from '@/lib/breeding';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { requestId, offspringName } = await request.json();

    if (!requestId || !offspringName) {
      return NextResponse.json({ error: 'Request ID and offspring name are required' }, { status: 400 });
    }

    // Fetch breeding request
    const breedingRequest = await prisma.breedingRequest.findUnique({
      where: { id: requestId },
    });

    if (!breedingRequest) {
      return NextResponse.json({ error: 'Breeding request not found' }, { status: 404 });
    }

    // Verify user is the addressee
    if (breedingRequest.addresseeId !== decoded.userId) {
      return NextResponse.json({ error: 'You can only accept requests sent to you' }, { status: 403 });
    }

    if (breedingRequest.status !== 'pending') {
      return NextResponse.json({ error: 'This breeding request is no longer pending' }, { status: 400 });
    }

    // Fetch both pets with traits
    const [parent1, parent2] = await Promise.all([
      prisma.pet.findUnique({
        where: { id: breedingRequest.requesterPetId },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      }),
      prisma.pet.findUnique({
        where: { id: breedingRequest.addresseePetId },
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
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Validate breeding eligibility (recheck in case conditions changed)
    const breedCheck = canBreed(parent1, parent2);
    if (!breedCheck.canBreed) {
      return NextResponse.json({ error: breedCheck.reason }, { status: 400 });
    }

    // Check pet limit for requester
    const requesterPetCount = await prisma.pet.count({
      where: { userId: parent1.userId },
    });

    if (requesterPetCount >= 10) {
      return NextResponse.json({ error: 'Requester has reached the maximum of 10 pets' }, { status: 400 });
    }

    // Breed the pets (offspring belongs to requester)
    const offspring = await breedPets(parent1, parent2, breedingRequest.requesterId, offspringName);

    // Update lastBredAt for both parents
    await prisma.pet.updateMany({
      where: {
        id: {
          in: [parent1.id, parent2.id],
        },
      },
      data: {
        lastBredAt: new Date(),
      },
    });

    // Mark request as accepted
    await prisma.breedingRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    return NextResponse.json({
      success: true,
      offspring,
    });
  } catch (error) {
    console.error('Error accepting breeding request:', error);
    const message = error instanceof Error ? error.message : 'Failed to accept breeding request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
