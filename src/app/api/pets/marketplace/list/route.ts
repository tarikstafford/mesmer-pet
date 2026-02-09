import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createListing } from '@/lib/marketplace';

/**
 * POST /api/pets/marketplace/list
 * Create a marketplace listing for a pet
 * Body: { petId: string, price: number }
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
    const { petId, price } = body;

    if (!petId || price === undefined) {
      return NextResponse.json(
        { error: 'Pet ID and price are required' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number' },
        { status: 400 }
      );
    }

    const listing = await createListing(petId, user.userId, price);

    return NextResponse.json(
      { listing, message: 'Pet listed successfully' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating marketplace listing:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }
    if (errorMessage.includes('only list your own') || errorMessage.includes('already listed')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create marketplace listing' },
      { status: 500 }
    );
  }
}
