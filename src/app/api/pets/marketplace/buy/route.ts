import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { purchasePet } from '@/lib/marketplace';

/**
 * POST /api/pets/marketplace/buy
 * Purchase a pet from the marketplace
 * Body: { listingId: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const result = await purchasePet(listingId, user.userId);

    return NextResponse.json(
      {
        listing: result.listing,
        pet: result.pet,
        message: 'Pet purchased successfully'
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error purchasing pet:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }
    if (errorMessage.includes('Insufficient funds') ||
        errorMessage.includes('not available') ||
        errorMessage.includes('your own pet')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to purchase pet' },
      { status: 500 }
    );
  }
}
