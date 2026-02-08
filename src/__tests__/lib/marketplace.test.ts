import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createListing, purchasePet, cancelListing } from '@/lib/marketplace';
import { prisma } from '@/lib/prisma';
import { createPetWithGenetics } from '@/lib/genetics';

describe('Marketplace Transaction Logic', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testPet1Id: string;
  let testPet2Id: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.marketplaceListing.deleteMany({});
    await prisma.userEngagement.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'seller@example.com',
        password: 'hashedpassword',
        name: 'Seller User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUser1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'buyer@example.com',
        password: 'hashedpassword',
        name: 'Buyer User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUser2Id = user2.id;

    // Create test traits
    await prisma.trait.createMany({
      data: [
        { traitName: 'Blue Eyes', traitType: 'visual', rarity: 'common', description: 'Bright blue eyes' },
        { traitName: 'Friendly', traitType: 'personality', rarity: 'common', description: 'Very friendly' },
      ],
    });

    // Create test pets
    const pet1 = await createPetWithGenetics(testUser1Id, 'Pet for Sale');
    testPet1Id = pet1!.id;

    const pet2 = await createPetWithGenetics(testUser1Id, 'Another Pet');
    testPet2Id = pet2!.id;

    // Create engagement records with virtual currency
    await prisma.userEngagement.create({
      data: {
        userId: testUser1Id,
        virtualCurrency: 500,
      },
    });

    await prisma.userEngagement.create({
      data: {
        userId: testUser2Id,
        virtualCurrency: 1000,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.marketplaceListing.deleteMany({});
    await prisma.userEngagement.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});
  });

  describe('createListing', () => {
    it('should successfully create a listing', async () => {
      const listing = await createListing(testPet1Id, testUser1Id, 100);

      expect(listing).toBeDefined();
      expect(listing.petId).toBe(testPet1Id);
      expect(listing.sellerId).toBe(testUser1Id);
      expect(listing.price).toBe(100);
      expect(listing.status).toBe('active');
      expect(listing.buyerId).toBeNull();
      expect(listing.soldAt).toBeNull();
    });

    it('should validate price is non-negative', async () => {
      await expect(
        createListing(testPet1Id, testUser1Id, -50)
      ).rejects.toThrow('Price must be non-negative');
    });

    it('should prevent listing non-existent pet', async () => {
      await expect(
        createListing('nonexistent-pet-id', testUser1Id, 100)
      ).rejects.toThrow('Pet not found');
    });

    it('should prevent user from listing pets they do not own', async () => {
      await expect(
        createListing(testPet1Id, testUser2Id, 100)
      ).rejects.toThrow('You can only list your own pets');
    });

    it('should prevent duplicate active listings for the same pet', async () => {
      // Create first listing
      await createListing(testPet1Id, testUser1Id, 100);

      // Attempt to create duplicate listing
      await expect(
        createListing(testPet1Id, testUser1Id, 150)
      ).rejects.toThrow('Pet is already listed on the marketplace');
    });

    it('should allow relisting after cancellation', async () => {
      // Create and cancel first listing
      const listing1 = await createListing(testPet1Id, testUser1Id, 100);
      await cancelListing(listing1.id, testUser1Id);

      // Should be able to create new listing
      const listing2 = await createListing(testPet1Id, testUser1Id, 150);
      expect(listing2).toBeDefined();
      expect(listing2.price).toBe(150);
      expect(listing2.status).toBe('active');
    });

    it('should validate required fields', async () => {
      await expect(
        createListing('', testUser1Id, 100)
      ).rejects.toThrow('Pet ID and seller ID are required');

      await expect(
        createListing(testPet1Id, '', 100)
      ).rejects.toThrow('Pet ID and seller ID are required');
    });
  });

  describe('purchasePet', () => {
    let listingId: string;

    beforeEach(async () => {
      // Create a listing before each purchase test
      const listing = await createListing(testPet1Id, testUser1Id, 200);
      listingId = listing.id;
    });

    it('should successfully purchase a pet', async () => {
      const result = await purchasePet(listingId, testUser2Id);

      expect(result.listing).toBeDefined();
      expect(result.listing?.status).toBe('sold');
      expect(result.listing?.buyerId).toBe(testUser2Id);
      expect(result.listing?.soldAt).toBeDefined();

      expect(result.pet).toBeDefined();
      expect(result.pet?.userId).toBe(testUser2Id);

      // Check currency deduction
      const buyerEngagement = await prisma.userEngagement.findUnique({
        where: { userId: testUser2Id },
      });
      expect(buyerEngagement?.virtualCurrency).toBe(800); // 1000 - 200

      // Check currency credit
      const sellerEngagement = await prisma.userEngagement.findUnique({
        where: { userId: testUser1Id },
      });
      expect(sellerEngagement?.virtualCurrency).toBe(700); // 500 + 200
    });

    it('should transfer pet ownership to buyer', async () => {
      await purchasePet(listingId, testUser2Id);

      const pet = await prisma.pet.findUnique({
        where: { id: testPet1Id },
      });

      expect(pet?.userId).toBe(testUser2Id);
    });

    it('should mark listing as sold', async () => {
      await purchasePet(listingId, testUser2Id);

      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
      });

      expect(listing?.status).toBe('sold');
      expect(listing?.buyerId).toBe(testUser2Id);
      expect(listing?.soldAt).toBeInstanceOf(Date);
    });

    it('should prevent purchasing with insufficient funds', async () => {
      // Create a high-priced listing
      const expensivePet = await createPetWithGenetics(testUser1Id, 'Expensive Pet');
      const expensiveListing = await createListing(expensivePet!.id, testUser1Id, 5000);

      await expect(
        purchasePet(expensiveListing.id, testUser2Id)
      ).rejects.toThrow('Insufficient funds');
    });

    it('should prevent purchasing your own pet', async () => {
      await expect(
        purchasePet(listingId, testUser1Id)
      ).rejects.toThrow('You cannot purchase your own pet');
    });

    it('should prevent purchasing already sold listing', async () => {
      // Purchase the pet once
      await purchasePet(listingId, testUser2Id);

      // Create another buyer
      const user3 = await prisma.user.create({
        data: {
          email: 'buyer2@example.com',
          password: 'hashedpassword',
          name: 'Buyer Two',
          dateOfBirth: new Date('2000-01-01'),
        },
      });

      await prisma.userEngagement.create({
        data: {
          userId: user3.id,
          virtualCurrency: 1000,
        },
      });

      // Attempt to purchase again
      await expect(
        purchasePet(listingId, user3.id)
      ).rejects.toThrow('Listing is not available for purchase');
    });

    it('should prevent purchasing cancelled listing', async () => {
      // Cancel the listing
      await cancelListing(listingId, testUser1Id);

      // Attempt to purchase
      await expect(
        purchasePet(listingId, testUser2Id)
      ).rejects.toThrow('Listing is not available for purchase');
    });

    it('should prevent purchasing non-existent listing', async () => {
      await expect(
        purchasePet('nonexistent-listing-id', testUser2Id)
      ).rejects.toThrow('Listing not found');
    });

    it('should create seller engagement record if it does not exist', async () => {
      // Delete seller's engagement record
      await prisma.userEngagement.delete({
        where: { userId: testUser1Id },
      });

      // Purchase should still work
      await purchasePet(listingId, testUser2Id);

      // Check that seller's engagement was created
      const sellerEngagement = await prisma.userEngagement.findUnique({
        where: { userId: testUser1Id },
      });

      expect(sellerEngagement).toBeDefined();
      expect(sellerEngagement?.virtualCurrency).toBe(200); // Just the listing price
    });

    it('should handle race conditions with atomic transactions', async () => {
      // Simulate two buyers trying to purchase simultaneously
      const user3 = await prisma.user.create({
        data: {
          email: 'buyer3@example.com',
          password: 'hashedpassword',
          name: 'Buyer Three',
          dateOfBirth: new Date('2000-01-01'),
        },
      });

      await prisma.userEngagement.create({
        data: {
          userId: user3.id,
          virtualCurrency: 1000,
        },
      });

      // First purchase should succeed
      const purchase1 = purchasePet(listingId, testUser2Id);

      // Wait a tiny bit to ensure the first transaction starts
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second purchase should fail
      const purchase2 = purchasePet(listingId, user3.id);

      const results = await Promise.allSettled([purchase1, purchase2]);

      // Exactly one should succeed
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);

      // The failed one should have the correct error message
      const failedResult = failures[0] as PromiseRejectedResult;
      expect(failedResult.reason.message).toBe('Listing is not available for purchase');
    });

    it('should validate required fields', async () => {
      await expect(
        purchasePet('', testUser2Id)
      ).rejects.toThrow('Listing ID and buyer ID are required');

      await expect(
        purchasePet(listingId, '')
      ).rejects.toThrow('Listing ID and buyer ID are required');
    });

    it('should handle buyer without engagement data', async () => {
      // Delete buyer's engagement record
      await prisma.userEngagement.delete({
        where: { userId: testUser2Id },
      });

      await expect(
        purchasePet(listingId, testUser2Id)
      ).rejects.toThrow('Buyer engagement data not found');
    });
  });

  describe('cancelListing', () => {
    let listingId: string;

    beforeEach(async () => {
      // Create a listing before each cancel test
      const listing = await createListing(testPet1Id, testUser1Id, 150);
      listingId = listing.id;
    });

    it('should successfully cancel a listing', async () => {
      const cancelledListing = await cancelListing(listingId, testUser1Id);

      expect(cancelledListing).toBeDefined();
      expect(cancelledListing.status).toBe('cancelled');
    });

    it('should prevent cancelling non-existent listing', async () => {
      await expect(
        cancelListing('nonexistent-listing-id', testUser1Id)
      ).rejects.toThrow('Listing not found');
    });

    it('should prevent user from cancelling listings they do not own', async () => {
      await expect(
        cancelListing(listingId, testUser2Id)
      ).rejects.toThrow('You can only cancel your own listings');
    });

    it('should prevent cancelling already sold listing', async () => {
      // Purchase the pet
      await purchasePet(listingId, testUser2Id);

      // Attempt to cancel
      await expect(
        cancelListing(listingId, testUser1Id)
      ).rejects.toThrow('Only active listings can be cancelled');
    });

    it('should prevent cancelling already cancelled listing', async () => {
      // Cancel once
      await cancelListing(listingId, testUser1Id);

      // Attempt to cancel again
      await expect(
        cancelListing(listingId, testUser1Id)
      ).rejects.toThrow('Only active listings can be cancelled');
    });

    it('should validate required fields', async () => {
      await expect(
        cancelListing('', testUser1Id)
      ).rejects.toThrow('Listing ID and user ID are required');

      await expect(
        cancelListing(listingId, '')
      ).rejects.toThrow('Listing ID and user ID are required');
    });

    it('should not affect pet ownership when cancelling', async () => {
      await cancelListing(listingId, testUser1Id);

      const pet = await prisma.pet.findUnique({
        where: { id: testPet1Id },
      });

      expect(pet?.userId).toBe(testUser1Id); // Still owned by seller
    });
  });

  describe('Transaction Integrity', () => {
    it('should rollback purchase if currency deduction fails', async () => {
      const listing = await createListing(testPet1Id, testUser1Id, 200);

      // Mock a failure in the transaction by making buyer have insufficient funds
      await prisma.userEngagement.update({
        where: { userId: testUser2Id },
        data: { virtualCurrency: 50 }, // Not enough
      });

      await expect(
        purchasePet(listing.id, testUser2Id)
      ).rejects.toThrow('Insufficient funds');

      // Verify nothing changed
      const pet = await prisma.pet.findUnique({ where: { id: testPet1Id } });
      expect(pet?.userId).toBe(testUser1Id); // Still owned by seller

      const listingAfter = await prisma.marketplaceListing.findUnique({
        where: { id: listing.id },
      });
      expect(listingAfter?.status).toBe('active'); // Still active
    });

    it('should handle all operations atomically', async () => {
      const listing = await createListing(testPet1Id, testUser1Id, 300);

      // Record initial state
      const initialBuyerCurrency = (await prisma.userEngagement.findUnique({
        where: { userId: testUser2Id },
      }))?.virtualCurrency;

      const initialSellerCurrency = (await prisma.userEngagement.findUnique({
        where: { userId: testUser1Id },
      }))?.virtualCurrency;

      // Perform purchase
      await purchasePet(listing.id, testUser2Id);

      // Verify all changes happened atomically
      const buyerCurrency = (await prisma.userEngagement.findUnique({
        where: { userId: testUser2Id },
      }))?.virtualCurrency;

      const sellerCurrency = (await prisma.userEngagement.findUnique({
        where: { userId: testUser1Id },
      }))?.virtualCurrency;

      expect(buyerCurrency).toBe(initialBuyerCurrency! - 300);
      expect(sellerCurrency).toBe(initialSellerCurrency! + 300);

      const pet = await prisma.pet.findUnique({ where: { id: testPet1Id } });
      expect(pet?.userId).toBe(testUser2Id);

      const listingAfter = await prisma.marketplaceListing.findUnique({
        where: { id: listing.id },
      });
      expect(listingAfter?.status).toBe('sold');
      expect(listingAfter?.buyerId).toBe(testUser2Id);
    });
  });
});
