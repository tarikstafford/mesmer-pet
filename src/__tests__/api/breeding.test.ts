import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as breedPetsPOST } from '@/app/api/pets/breed/route';
import { prisma } from '@/lib/prisma';
import { createPetWithGenetics } from '@/lib/genetics';
import { generateToken } from '@/lib/auth';

// Mock NextRequest with auth headers
class MockNextRequest {
  private body: any;
  private headers: Map<string, string>;

  constructor(body: any, authToken?: string) {
    this.body = body;
    this.headers = new Map();
    if (authToken) {
      this.headers.set('authorization', `Bearer ${authToken}`);
    }
  }

  async json() {
    return this.body;
  }

  get(headerName: string) {
    return this.headers.get(headerName.toLowerCase());
  }
}

// Extend MockNextRequest with headers property
(MockNextRequest.prototype as any).headers = {
  get(headerName: string) {
    return (this as any).headers.get(headerName.toLowerCase());
  }
};

describe('Breeding API Endpoints', () => {
  let testUserId: string;
  let testUser2Id: string;
  let authToken: string;
  let authToken2: string;

  // Setup: Create test users before each test
  beforeEach(async () => {
    // Clean up existing data
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'breeder1@example.com',
        password: 'hashedpassword',
        name: 'Breeder One',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUserId = user1.id;
    authToken = generateToken({ userId: testUserId, email: user1.email });

    const user2 = await prisma.user.create({
      data: {
        email: 'breeder2@example.com',
        password: 'hashedpassword',
        name: 'Breeder Two',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUser2Id = user2.id;
    authToken2 = generateToken({ userId: testUser2Id, email: user2.email });

    // Create test traits
    await prisma.trait.createMany({
      data: [
        { traitName: 'Sky Blue', traitType: 'visual', rarity: 'common', description: 'Light blue color' },
        { traitName: 'Fluffy Tail', traitType: 'visual', rarity: 'uncommon', description: 'Extra fluffy tail' },
        { traitName: 'Curious', traitType: 'personality', rarity: 'common', description: 'Loves exploring' },
        { traitName: 'Playful', traitType: 'personality', rarity: 'common', description: 'Always ready to play' },
        { traitName: 'Fast Runner', traitType: 'skill', rarity: 'rare', description: 'Can run very fast' },
        { traitName: 'Golden Fur', traitType: 'visual', rarity: 'legendary', description: 'Rare golden fur' },
        { traitName: 'Energetic', traitType: 'personality', rarity: 'uncommon', description: 'Full of energy' },
      ],
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});
  });

  describe('POST /api/pets/breed - Breed Pets', () => {
    it('should successfully breed two pets', async () => {
      // Create two parent pets (7+ days old to be eligible)
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      // Update created dates to make them eligible for breeding
      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Baby Pet',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Breeding successful!');
      expect(data.offspring).toBeDefined();
      expect(data.offspring.name).toBe('Baby Pet');
      expect(data.offspring.parent1Id).toBe(parent1!.id);
      expect(data.offspring.parent2Id).toBe(parent2!.id);
      expect(data.offspring.generation).toBe(2); // parents are gen 1 (from createPetWithGenetics), offspring is gen 2
    });

    it('should inherit traits from both parents', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Baby Pet',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify offspring has traits
      const offspring = await prisma.pet.findUnique({
        where: { id: data.offspring.id },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      });

      expect(offspring?.petTraits).toBeDefined();
      expect(offspring?.petTraits.length).toBeGreaterThan(0);

      // Verify inheritance source is tracked
      const hasParent1Traits = offspring?.petTraits.some(pt => pt.inheritanceSource === 'parent1');
      const hasParent2Traits = offspring?.petTraits.some(pt => pt.inheritanceSource === 'parent2');

      // At least one trait should come from parents (or mutation)
      expect(hasParent1Traits || hasParent2Traits).toBe(true);
    });

    it('should calculate offspring personality as average of parents with variance', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      // Set specific personality values for parents
      await prisma.pet.update({
        where: { id: parent1!.id },
        data: {
          createdAt: sevenDaysAgo,
          health: 100,
          friendliness: 80,
          energyTrait: 60,
          curiosity: 70,
          patience: 50,
          playfulness: 90,
        },
      });

      await prisma.pet.update({
        where: { id: parent2!.id },
        data: {
          createdAt: sevenDaysAgo,
          health: 100,
          friendliness: 60,
          energyTrait: 80,
          curiosity: 50,
          patience: 70,
          playfulness: 70,
        },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Baby Pet',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Offspring values should be roughly average of parents (±15 variance)
      // Average friendliness: (80 + 60) / 2 = 70, so should be 55-85
      expect(data.offspring.friendliness).toBeGreaterThanOrEqual(55);
      expect(data.offspring.friendliness).toBeLessThanOrEqual(85);

      // Average energyTrait: (60 + 80) / 2 = 70, so should be 55-85
      expect(data.offspring.energyTrait).toBeGreaterThanOrEqual(55);
      expect(data.offspring.energyTrait).toBeLessThanOrEqual(85);
    });

    it('should update lastBredAt for both parents', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Baby Pet',
        },
        authToken
      ) as any;

      await breedPetsPOST(mockRequest);

      // Verify both parents have lastBredAt updated
      const updatedParent1 = await prisma.pet.findUnique({ where: { id: parent1!.id } });
      const updatedParent2 = await prisma.pet.findUnique({ where: { id: parent2!.id } });

      expect(updatedParent1?.lastBredAt).toBeDefined();
      expect(updatedParent2?.lastBredAt).toBeDefined();
      expect(updatedParent1?.lastBredAt).toBeInstanceOf(Date);
      expect(updatedParent2?.lastBredAt).toBeInstanceOf(Date);
    });

    it('should enforce breeding cooldown (7 days)', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      // Make pets eligible and set lastBredAt to 1 day ago (still in cooldown)
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100, lastBredAt: oneDayAgo },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Too Soon Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('must wait');
      expect(data.error).toContain('day(s) before breeding again');
    });

    it('should reject breeding when pets are too young (<7 days)', async () => {
      const parent1 = await createPetWithGenetics(testUserId, 'Young Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Young Parent 2');

      // Pets just created, so they're < 7 days old
      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Too Young Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Both pets must be at least 7 days old');
    });

    it('should reject breeding when pet health is too low (<=50)', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Healthy Parent');
      const parent2 = await createPetWithGenetics(testUserId, 'Unhealthy Parent');

      await prisma.pet.update({
        where: { id: parent1!.id },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      await prisma.pet.update({
        where: { id: parent2!.id },
        data: { createdAt: sevenDaysAgo, health: 50 }, // Too low for breeding
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Unhealthy Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Both pets must have health > 50');
    });

    it('should reject breeding when pet is in critical state', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Healthy Parent');
      const parent2 = await createPetWithGenetics(testUserId, 'Critical Parent');

      await prisma.pet.update({
        where: { id: parent1!.id },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      await prisma.pet.update({
        where: { id: parent2!.id },
        data: { createdAt: sevenDaysAgo, health: 100, isCritical: true },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Critical Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Pets in critical state cannot breed');
    });

    it('should reject breeding a pet with itself', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent = await createPetWithGenetics(testUserId, 'Lonely Pet');

      await prisma.pet.update({
        where: { id: parent!.id },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent!.id,
          parent2Id: parent!.id,
          offspringName: 'Self Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot breed a pet with itself');
    });

    it('should reject breeding without auth token', async () => {
      const mockRequest = new MockNextRequest({
        parent1Id: 'some-id',
        parent2Id: 'other-id',
        offspringName: 'Unauthorized Baby',
      }) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject breeding with invalid auth token', async () => {
      const mockRequest = new MockNextRequest(
        {
          parent1Id: 'some-id',
          parent2Id: 'other-id',
          offspringName: 'Invalid Auth Baby',
        },
        'invalid-token-xyz'
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });

    it('should reject breeding when user does not own either parent', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      // User 2 creates pets
      const parent1 = await createPetWithGenetics(testUser2Id, 'Other User Pet 1');
      const parent2 = await createPetWithGenetics(testUser2Id, 'Other User Pet 2');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      // User 1 tries to breed user 2's pets
      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Stolen Baby',
        },
        authToken // User 1's token
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must own at least one of the parent pets');
    });

    it('should allow breeding when user owns at least one parent', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      // User 1 owns parent1, user 2 owns parent2
      const parent1 = await createPetWithGenetics(testUserId, 'My Pet');
      const parent2 = await createPetWithGenetics(testUser2Id, 'Friend Pet');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      // User 1 breeds their pet with user 2's pet
      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Friendship Baby',
        },
        authToken // User 1's token
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Breeding successful!');
      expect(data.offspring.userId).toBe(testUserId); // Offspring belongs to user 1
    });

    it('should fail when one parent pet does not exist', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const parent1 = await createPetWithGenetics(testUserId, 'Real Pet');

      await prisma.pet.update({
        where: { id: parent1!.id },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: '00000000-0000-0000-0000-000000000000', // Non-existent ID
          offspringName: 'Ghost Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('One or both parent pets not found');
    });

    it('should fail when missing required fields', async () => {
      const mockRequest = new MockNextRequest(
        {
          parent1Id: 'some-id',
          // Missing parent2Id and offspringName
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: parent1Id, parent2Id, offspringName');
    });

    it('should enforce 10 pet limit when breeding', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      // Create 10 pets for user
      for (let i = 0; i < 10; i++) {
        await createPetWithGenetics(testUserId, `Pet ${i + 1}`);
      }

      // Create two additional pets for breeding (owned by user 2)
      const parent1 = await createPetWithGenetics(testUser2Id, 'Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Parent 2');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100 },
      });

      // User 1 tries to breed (already has 10 pets)
      const mockRequest = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Too Many Baby',
        },
        authToken
      ) as any;

      const response = await breedPetsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('You have reached the maximum number of pets (10)');
    });

    it('should track generation number correctly', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      // Create gen 0 parents
      const parent1 = await createPetWithGenetics(testUserId, 'Gen 0 Parent 1');
      const parent2 = await createPetWithGenetics(testUserId, 'Gen 0 Parent 2');

      await prisma.pet.updateMany({
        where: { id: { in: [parent1!.id, parent2!.id] } },
        data: { createdAt: sevenDaysAgo, health: 100, generation: 0 },
      });

      // Breed to create gen 1
      const mockRequest1 = new MockNextRequest(
        {
          parent1Id: parent1!.id,
          parent2Id: parent2!.id,
          offspringName: 'Gen 1 Baby',
        },
        authToken
      ) as any;

      const response1 = await breedPetsPOST(mockRequest1);
      const data1 = await response1.json();

      expect(data1.offspring.generation).toBe(1);

      // Create another gen 0 pet
      const parent3 = await createPetWithGenetics(testUserId, 'Gen 0 Parent 3');
      await prisma.pet.update({
        where: { id: parent3!.id },
        data: { createdAt: sevenDaysAgo, health: 100, generation: 0 },
      });

      // Breed gen 1 with gen 0 to create gen 2
      const gen1Id = data1.offspring.id;
      await prisma.pet.update({
        where: { id: gen1Id },
        data: { createdAt: sevenDaysAgo, health: 100, lastBredAt: null },
      });

      const mockRequest2 = new MockNextRequest(
        {
          parent1Id: gen1Id,
          parent2Id: parent3!.id,
          offspringName: 'Gen 2 Baby',
        },
        authToken
      ) as any;

      const response2 = await breedPetsPOST(mockRequest2);
      const data2 = await response2.json();

      expect(data2.offspring.generation).toBe(2); // max(1, 0) + 1 = 2
    });
  });
});
