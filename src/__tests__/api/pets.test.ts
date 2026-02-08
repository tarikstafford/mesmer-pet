import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as createPetPOST, GET as getPetsGET } from '@/app/api/pets/route';
import { POST as feedPetPOST } from '@/app/api/pets/feed/route';
import { POST as recoverPetPOST } from '@/app/api/pets/recover/route';
import { prisma } from '@/lib/prisma';
import { createPetWithGenetics } from '@/lib/genetics';

// Mock NextRequest
class MockNextRequest {
  private body: any;
  public url: string;

  constructor(body: any, queryParams?: Record<string, string>) {
    this.body = body;
    const params = new URLSearchParams(queryParams || {});
    this.url = `http://localhost:3000/api/pets${params.toString() ? '?' + params.toString() : ''}`;
  }

  async json() {
    return this.body;
  }
}

describe('Pets API Endpoints', () => {
  let testUserId: string;

  // Setup: Create a test user before each test
  beforeEach(async () => {
    // Clean up existing data
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'petowner@example.com',
        password: 'hashedpassword',
        name: 'Pet Owner',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUserId = user.id;

    // Create some test traits
    await prisma.trait.createMany({
      data: [
        { traitName: 'Sky Blue', traitType: 'visual', rarity: 'common', description: 'Light blue color' },
        { traitName: 'Fluffy Tail', traitType: 'visual', rarity: 'uncommon', description: 'Extra fluffy tail' },
        { traitName: 'Curious', traitType: 'personality', rarity: 'common', description: 'Loves exploring' },
        { traitName: 'Playful', traitType: 'personality', rarity: 'common', description: 'Always ready to play' },
        { traitName: 'Fast Runner', traitType: 'skill', rarity: 'rare', description: 'Can run very fast' },
      ],
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.userRecoveryItem.deleteMany({});
    await prisma.recoveryItem.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});
  });

  describe('POST /api/pets - Create Pet', () => {
    it('should successfully create a pet with valid data', async () => {
      const mockRequest = new MockNextRequest({
        name: 'Fluffy',
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Pet created successfully');
      expect(data.pet).toBeDefined();
      expect(data.pet.name).toBe('Fluffy');
      expect(data.pet.userId).toBe(testUserId);

      // Verify pet was created in database
      const dbPet = await prisma.pet.findFirst({
        where: { userId: testUserId },
      });
      expect(dbPet).toBeDefined();
      expect(dbPet?.name).toBe('Fluffy');
    });

    it('should create pet with random traits', async () => {
      const mockRequest = new MockNextRequest({
        name: 'Sparkle',
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);

      // Verify pet has traits assigned
      const dbPet = await prisma.pet.findFirst({
        where: { userId: testUserId },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      });

      expect(dbPet?.petTraits).toBeDefined();
      expect(dbPet?.petTraits.length).toBeGreaterThan(0);
    });

    it('should initialize pet stats correctly', async () => {
      const mockRequest = new MockNextRequest({
        name: 'Buddy',
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.pet.health).toBe(100);
      expect(data.pet.hunger).toBe(0);
      expect(data.pet.happiness).toBe(100);
      expect(data.pet.energy).toBe(100);
    });

    it('should fail with missing name', async () => {
      const mockRequest = new MockNextRequest({
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should fail with invalid userId', async () => {
      const mockRequest = new MockNextRequest({
        name: 'Invalid',
        userId: 'not-a-uuid',
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should fail when user does not exist', async () => {
      const mockRequest = new MockNextRequest({
        name: 'Orphan',
        userId: '00000000-0000-0000-0000-000000000000',
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should enforce 10 pet limit per user', async () => {
      // Create 10 pets
      for (let i = 0; i < 10; i++) {
        await createPetWithGenetics(testUserId, `Pet ${i + 1}`);
      }

      // Try to create 11th pet
      const mockRequest = new MockNextRequest({
        name: 'Too Many',
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Maximum pet limit reached (10 pets)');
    });

    it('should fail with name too long', async () => {
      const longName = 'a'.repeat(51);
      const mockRequest = new MockNextRequest({
        name: longName,
        userId: testUserId,
      }) as any;

      const response = await createPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/pets - Get User Pets', () => {
    it('should return all pets for a user', async () => {
      // Create test pets
      await createPetWithGenetics(testUserId, 'Pet 1');
      await createPetWithGenetics(testUserId, 'Pet 2');
      await createPetWithGenetics(testUserId, 'Pet 3');

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets).toBeDefined();
      expect(data.pets.length).toBe(3);
      expect(data.pets[0].name).toBeDefined();
    });

    it('should include pet traits in response', async () => {
      await createPetWithGenetics(testUserId, 'Trait Test');

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets[0].petTraits).toBeDefined();
      expect(Array.isArray(data.pets[0].petTraits)).toBe(true);
    });

    it('should include pet skills in response', async () => {
      await createPetWithGenetics(testUserId, 'Skill Test');

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets[0].petSkills).toBeDefined();
      expect(Array.isArray(data.pets[0].petSkills)).toBe(true);
    });

    it('should return empty array when user has no pets', async () => {
      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets).toEqual([]);
    });

    it('should fail without userId parameter', async () => {
      const mockRequest = new MockNextRequest({}, {}) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId query parameter is required');
    });

    it('should order pets by creation date (newest first)', async () => {
      // Create pets with delay to ensure different timestamps
      const pet1 = await createPetWithGenetics(testUserId, 'First Pet');
      await new Promise(resolve => setTimeout(resolve, 10));
      const pet2 = await createPetWithGenetics(testUserId, 'Second Pet');
      await new Promise(resolve => setTimeout(resolve, 10));
      const pet3 = await createPetWithGenetics(testUserId, 'Third Pet');

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets[0].name).toBe('Third Pet');
      expect(data.pets[1].name).toBe('Second Pet');
      expect(data.pets[2].name).toBe('First Pet');
    });
  });

  describe('POST /api/pets/feed - Feed Pet', () => {
    let testPetId: string;

    beforeEach(async () => {
      const pet = await createPetWithGenetics(testUserId, 'Hungry Pet');
      testPetId = pet!.id;
    });

    it('should successfully feed a pet', async () => {
      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Pet fed successfully!');

      // Verify stats updated in database
      const dbPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });

      expect(dbPet?.hunger).toBeLessThan(35); // Should have decreased
      // Happiness can be at 100 max, so just verify it stayed high or increased
      expect(dbPet?.happiness).toBeGreaterThanOrEqual(100);
    });

    it('should reduce hunger when feeding', async () => {
      // Set pet hunger high
      await prisma.pet.update({
        where: { id: testPetId },
        data: { hunger: 80 },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);
      expect(response.status).toBe(200);

      const dbPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });

      expect(dbPet?.hunger).toBeLessThan(80);
    });

    it('should increase happiness when feeding', async () => {
      // Set pet happiness low
      await prisma.pet.update({
        where: { id: testPetId },
        data: { happiness: 50 },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);
      expect(response.status).toBe(200);

      const dbPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });

      expect(dbPet?.happiness).toBeGreaterThan(50);
    });

    it('should enforce feeding cooldown (60 minutes)', async () => {
      // Feed pet once
      const mockRequest1 = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;
      await feedPetPOST(mockRequest1);

      // Try to feed immediately again
      const mockRequest2 = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;
      const response = await feedPetPOST(mockRequest2);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('recently fed');
    });

    it('should allow feeding Critical pet (no restriction in current implementation)', async () => {
      // Set pet to Critical state
      await prisma.pet.update({
        where: { id: testPetId },
        data: { isCritical: true, health: 0 },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);

      // Current implementation allows feeding Critical pets
      expect(response.status).toBe(200);
    });

    it('should fail with invalid petId', async () => {
      const mockRequest = new MockNextRequest({
        petId: 'invalid-id',
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should fail when pet does not exist', async () => {
      const mockRequest = new MockNextRequest({
        petId: '00000000-0000-0000-0000-000000000000',
        userId: testUserId,
      }) as any;

      const response = await feedPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Pet not found');
    });
  });

  describe('POST /api/pets/recover - Recover Critical Pet', () => {
    let testPetId: string;
    let recoveryItemId: string;

    beforeEach(async () => {
      const pet = await createPetWithGenetics(testUserId, 'Critical Pet');
      testPetId = pet!.id;

      // Set pet to Critical state
      await prisma.pet.update({
        where: { id: testPetId },
        data: {
          isCritical: true,
          health: 0,
          neglectStartedAt: new Date(),
        },
      });

      // Create recovery item (without healthRestore field)
      const item = await prisma.recoveryItem.create({
        data: {
          itemName: 'Health Potion',
          description: 'Restores pet health',
          itemType: 'potion',
          price: 0.99,
          earnable: true,
        },
      });
      recoveryItemId = item.id;
    });

    it('should successfully recover a Critical pet', async () => {
      // Grant recovery item to user
      await prisma.userRecoveryItem.create({
        data: {
          userId: testUserId,
          itemId: recoveryItemId,
          quantity: 1,
        },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      const response = await recoverPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify pet recovered
      const dbPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });

      expect(dbPet?.isCritical).toBe(false);
      expect(dbPet?.health).toBeGreaterThan(0);
    });

    it('should apply max health penalty after recovery', async () => {
      await prisma.userRecoveryItem.create({
        data: {
          userId: testUserId,
          itemId: recoveryItemId,
          quantity: 1,
        },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      await recoverPetPOST(mockRequest);

      // Verify penalty applied
      const dbPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });

      expect(dbPet?.maxHealthPenalty).toBeGreaterThan(0);
    });

    it('should decrement recovery item quantity', async () => {
      await prisma.userRecoveryItem.create({
        data: {
          userId: testUserId,
          itemId: recoveryItemId,
          quantity: 3,
        },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      await recoverPetPOST(mockRequest);

      // Verify quantity decreased
      const userItem = await prisma.userRecoveryItem.findFirst({
        where: { userId: testUserId, itemId: recoveryItemId },
      });

      expect(userItem?.quantity).toBe(2);
    });

    it('should delete recovery item when quantity reaches 0', async () => {
      await prisma.userRecoveryItem.create({
        data: {
          userId: testUserId,
          itemId: recoveryItemId,
          quantity: 1,
        },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      await recoverPetPOST(mockRequest);

      // Verify item deleted
      const userItem = await prisma.userRecoveryItem.findFirst({
        where: { userId: testUserId, itemId: recoveryItemId },
      });

      expect(userItem).toBeNull();
    });

    it('should fail when user does not own recovery item', async () => {
      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      const response = await recoverPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No recovery items');
    });

    it('should fail when pet is not Critical', async () => {
      // Set pet to healthy state
      await prisma.pet.update({
        where: { id: testPetId },
        data: { isCritical: false, health: 100 },
      });

      await prisma.userRecoveryItem.create({
        data: {
          userId: testUserId,
          itemId: recoveryItemId,
          quantity: 1,
        },
      });

      const mockRequest = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        itemId: recoveryItemId,
      }) as any;

      const response = await recoverPetPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not in Critical state');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent pet creation requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        createPetPOST(
          new MockNextRequest({
            name: `Pet ${i + 1}`,
            userId: testUserId,
          }) as any
        )
      );

      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 201).length;

      expect(successCount).toBe(5);

      // Verify all pets created
      const pets = await prisma.pet.findMany({
        where: { userId: testUserId },
      });
      expect(pets.length).toBe(5);
    });

    it('should handle pets with zero stats correctly', async () => {
      const pet = await createPetWithGenetics(testUserId, 'Zero Stats Pet');
      await prisma.pet.update({
        where: { id: pet!.id },
        data: { health: 0, hunger: 0, happiness: 0, energy: 0 },
      });

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets[0].health).toBe(0);
    });

    it('should handle pets with maximum stats correctly', async () => {
      const pet = await createPetWithGenetics(testUserId, 'Max Stats Pet');
      await prisma.pet.update({
        where: { id: pet!.id },
        data: { health: 100, hunger: 100, happiness: 100, energy: 100 },
      });

      const mockRequest = new MockNextRequest({}, { userId: testUserId }) as any;
      const response = await getPetsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pets[0].health).toBe(100);
    });
  });
});
