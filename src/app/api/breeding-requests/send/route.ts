import { NextRequest, NextResponse } from 'next/server';
import { areFriends } from '@/lib/friends';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { canBreed } from '@/lib/breeding';

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

    const { requesterPetId, addresseePetId } = await request.json();

    if (!requesterPetId || !addresseePetId) {
      return NextResponse.json({ error: 'Both pet IDs are required' }, { status: 400 });
    }

    // Fetch both pets
    const [requesterPet, addresseePet] = await Promise.all([
      prisma.pet.findUnique({ where: { id: requesterPetId } }),
      prisma.pet.findUnique({ where: { id: addresseePetId } }),
    ]);

    if (!requesterPet || !addresseePet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    // Verify ownership of requester pet
    if (requesterPet.userId !== decoded.userId) {
      return NextResponse.json({ error: 'You do not own this pet' }, { status: 403 });
    }

    // Verify friendship
    const isFriend = await areFriends(decoded.userId, addresseePet.userId);
    if (!isFriend) {
      return NextResponse.json({ error: "You can only request breeding with friends' pets" }, { status: 403 });
    }

    // Validate breeding eligibility
    const breedCheck = canBreed(requesterPet, addresseePet);
    if (!breedCheck.canBreed) {
      return NextResponse.json({ error: breedCheck.reason }, { status: 400 });
    }

    // Check for existing pending request
    const existingRequest = await prisma.breedingRequest.findFirst({
      where: {
        requesterPetId,
        addresseePetId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'A breeding request is already pending for these pets' }, { status: 400 });
    }

    // Create breeding request
    const breedingRequest = await prisma.breedingRequest.create({
      data: {
        requesterId: decoded.userId,
        requesterPetId,
        addresseeId: addresseePet.userId,
        addresseePetId,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      breedingRequest,
    });
  } catch (error) {
    console.error('Error sending breeding request:', error);
    const message = error instanceof Error ? error.message : 'Failed to send breeding request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
