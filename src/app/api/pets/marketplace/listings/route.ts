import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/pets/marketplace/listings
 * Get all active marketplace listings
 */
export async function GET(req: NextRequest) {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: {
        status: 'active',
      },
      orderBy: {
        listedAt: 'desc',
      },
    });

    // Fetch related pet and seller data for each listing
    const listingsWithData = await Promise.all(
      listings.map(async (listing) => {
        const pet = await prisma.pet.findUnique({
          where: { id: listing.petId },
        });

        const seller = await prisma.user.findUnique({
          where: { id: listing.sellerId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          ...listing,
          pet,
          seller,
        };
      })
    );

    return NextResponse.json({ listings: listingsWithData }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}
