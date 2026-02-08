import { prisma } from '@/lib/prisma';

/**
 * Create a marketplace listing for a pet
 * @param petId - ID of the pet to list
 * @param sellerId - ID of the user listing the pet
 * @param price - Price in virtual currency
 * @returns The created MarketplaceListing
 */
export async function createListing(
  petId: string,
  sellerId: string,
  price: number
) {
  // Validate inputs
  if (!petId || !sellerId) {
    throw new Error('Pet ID and seller ID are required');
  }

  if (price < 0) {
    throw new Error('Price must be non-negative');
  }

  // Check if pet exists and belongs to seller
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });

  if (!pet) {
    throw new Error('Pet not found');
  }

  if (pet.userId !== sellerId) {
    throw new Error('You can only list your own pets');
  }

  // Check if pet is already listed
  const existingListing = await prisma.marketplaceListing.findUnique({
    where: { petId },
  });

  if (existingListing && existingListing.status === 'active') {
    throw new Error('Pet is already listed on the marketplace');
  }

  // Create or update the listing (upsert to handle relisting after cancellation)
  const listing = await prisma.marketplaceListing.upsert({
    where: { petId },
    create: {
      petId,
      sellerId,
      price,
      status: 'active',
    },
    update: {
      sellerId,
      price,
      status: 'active',
      listedAt: new Date(),
      buyerId: null,
      soldAt: null,
    },
  });

  return listing;
}

/**
 * Purchase a pet from the marketplace
 * @param listingId - ID of the marketplace listing
 * @param buyerId - ID of the user purchasing the pet
 * @returns The updated listing and pet
 */
export async function purchasePet(listingId: string, buyerId: string) {
  // Validate inputs
  if (!listingId || !buyerId) {
    throw new Error('Listing ID and buyer ID are required');
  }

  // Use a transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Get the listing
    const listing = await tx.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not available for purchase');
    }

    if (listing.sellerId === buyerId) {
      throw new Error('You cannot purchase your own pet');
    }

    // Get the pet
    const pet = await tx.pet.findUnique({
      where: { id: listing.petId },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    // Get buyer's engagement data to check currency
    const buyerEngagement = await tx.userEngagement.findUnique({
      where: { userId: buyerId },
    });

    if (!buyerEngagement) {
      throw new Error('Buyer engagement data not found');
    }

    if (buyerEngagement.virtualCurrency < listing.price) {
      throw new Error('Insufficient funds');
    }

    // Deduct currency from buyer
    await tx.userEngagement.update({
      where: { userId: buyerId },
      data: {
        virtualCurrency: {
          decrement: listing.price,
        },
      },
    });

    // Credit currency to seller
    const sellerEngagement = await tx.userEngagement.findUnique({
      where: { userId: listing.sellerId },
    });

    if (sellerEngagement) {
      await tx.userEngagement.update({
        where: { userId: listing.sellerId },
        data: {
          virtualCurrency: {
            increment: listing.price,
          },
        },
      });
    } else {
      // Create engagement record for seller if it doesn't exist
      await tx.userEngagement.create({
        data: {
          userId: listing.sellerId,
          virtualCurrency: listing.price,
        },
      });
    }

    // Transfer pet ownership
    await tx.pet.update({
      where: { id: listing.petId },
      data: {
        userId: buyerId,
      },
    });

    // Mark listing as sold
    await tx.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: 'sold',
        buyerId,
        soldAt: new Date(),
      },
    });

    return {
      listing: await tx.marketplaceListing.findUnique({
        where: { id: listingId },
      }),
      pet: await tx.pet.findUnique({
        where: { id: listing.petId },
      }),
    };
  });
}

/**
 * Cancel a marketplace listing
 * @param listingId - ID of the marketplace listing
 * @param userId - ID of the user canceling the listing (must be the seller)
 * @returns The updated listing
 */
export async function cancelListing(listingId: string, userId: string) {
  // Validate inputs
  if (!listingId || !userId) {
    throw new Error('Listing ID and user ID are required');
  }

  // Get the listing
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new Error('Listing not found');
  }

  if (listing.sellerId !== userId) {
    throw new Error('You can only cancel your own listings');
  }

  if (listing.status !== 'active') {
    throw new Error('Only active listings can be cancelled');
  }

  // Update listing status to cancelled
  const updatedListing = await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: {
      status: 'cancelled',
    },
  });

  return updatedListing;
}
