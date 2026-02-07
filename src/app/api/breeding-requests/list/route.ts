import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Fetch both received and sent breeding requests
    const [receivedRequests, sentRequests] = await Promise.all([
      prisma.breedingRequest.findMany({
        where: {
          addresseeId: decoded.userId,
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.breedingRequest.findMany({
        where: {
          requesterId: decoded.userId,
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Fetch pet details for each request
    const enrichedReceived = await Promise.all(
      receivedRequests.map(async (req) => {
        const [requesterPet, addresseePet, requester] = await Promise.all([
          prisma.pet.findUnique({
            where: { id: req.requesterPetId },
            include: {
              petTraits: {
                include: {
                  trait: true,
                },
              },
            },
          }),
          prisma.pet.findUnique({
            where: { id: req.addresseePetId },
            include: {
              petTraits: {
                include: {
                  trait: true,
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: req.requesterId },
            select: {
              id: true,
              email: true,
              name: true,
            },
          }),
        ]);

        return {
          ...req,
          requesterPet,
          addresseePet,
          requester,
        };
      })
    );

    const enrichedSent = await Promise.all(
      sentRequests.map(async (req) => {
        const [requesterPet, addresseePet, addressee] = await Promise.all([
          prisma.pet.findUnique({
            where: { id: req.requesterPetId },
            include: {
              petTraits: {
                include: {
                  trait: true,
                },
              },
            },
          }),
          prisma.pet.findUnique({
            where: { id: req.addresseePetId },
            include: {
              petTraits: {
                include: {
                  trait: true,
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: req.addresseeId },
            select: {
              id: true,
              email: true,
              name: true,
            },
          }),
        ]);

        return {
          ...req,
          requesterPet,
          addresseePet,
          addressee,
        };
      })
    );

    return NextResponse.json({
      received: enrichedReceived,
      sent: enrichedSent,
    });
  } catch (error) {
    console.error('Error fetching breeding requests:', error);
    return NextResponse.json({ error: 'Failed to fetch breeding requests' }, { status: 500 });
  }
}
