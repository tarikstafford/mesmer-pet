import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cancelListing } from '@/lib/marketplace';

/**
 * POST /api/pets/marketplace/cancel
 * Cancel a marketplace listing
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

    const listing = await cancelListing(listingId, user.userId);

    return NextResponse.json(
      { listing, message: 'Listing cancelled successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error cancelling listing:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }
    if (errorMessage.includes('only cancel your own') ||
        errorMessage.includes('Only active listings')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cancel listing' },
      { status: 500 }
    );
  }
}
