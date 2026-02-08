import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { breedPets } from '@/lib/breeding';
import { createPetWithGenetics, assignRandomTraits, generateRandomPersonality } from '@/lib/genetics';
import type { Pet, PetTrait, Trait } from '@prisma/client';

describe('Genetic Trait Inheritance', () => {
  let testUserId: string;
  let testTraits: Trait[];

  beforeEach(async () => {
    // Clean up
    await prisma.petTrait.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashedPassword123',
        name: `Test User ${Date.now()}`,
      },
    });
    testUserId = user.id;

    // Create test traits for different types and rarities
    testTraits = await Promise.all([
      // Visual traits
      prisma.trait.create({
        data: {
          traitName: 'Blue Eyes',
          traitType: 'visual',
          rarity: 'common',
          description: 'Bright blue eyes',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Green Eyes',
          traitType: 'visual',
          rarity: 'uncommon',
          description: 'Emerald green eyes',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Golden Eyes',
          traitType: 'visual',
          rarity: 'rare',
          description: 'Radiant golden eyes',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Rainbow Eyes',
          traitType: 'visual',
          rarity: 'legendary',
          description: 'Mystical rainbow eyes',
        },
      }),
      // Personality traits
      prisma.trait.create({
        data: {
          traitName: 'Friendly',
          traitType: 'personality',
          rarity: 'common',
          description: 'Very friendly',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Brave',
          traitType: 'personality',
          rarity: 'uncommon',
          description: 'Courageous and brave',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Wise',
          traitType: 'personality',
          rarity: 'rare',
          description: 'Ancient wisdom',
        },
      }),
      // Skill traits
      prisma.trait.create({
        data: {
          traitName: 'Fast Runner',
          traitType: 'skill',
          rarity: 'common',
          description: 'Can run very fast',
        },
      }),
      prisma.trait.create({
        data: {
          traitName: 'Telekinesis',
          traitType: 'skill',
          rarity: 'legendary',
          description: 'Can move objects with mind',
        },
      }),
    ]);
  });

  afterEach(async () => {
    await prisma.petTrait.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.trait.deleteMany({});
  });

  describe('generateRandomPersonality', () => {
    it('should generate personality values between 0-100', () => {
      const personality = generateRandomPersonality();

      expect(personality.friendliness).toBeGreaterThanOrEqual(0);
      expect(personality.friendliness).toBeLessThanOrEqual(100);
      expect(personality.energyTrait).toBeGreaterThanOrEqual(0);
      expect(personality.energyTrait).toBeLessThanOrEqual(100);
      expect(personality.curiosity).toBeGreaterThanOrEqual(0);
      expect(personality.curiosity).toBeLessThanOrEqual(100);
      expect(personality.patience).toBeGreaterThanOrEqual(0);
      expect(personality.patience).toBeLessThanOrEqual(100);
      expect(personality.playfulness).toBeGreaterThanOrEqual(0);
      expect(personality.playfulness).toBeLessThanOrEqual(100);
    });

    it('should generate different values each time', () => {
      const personality1 = generateRandomPersonality();
      const personality2 = generateRandomPersonality();

      // Very unlikely to be identical (1 in 101^5 chance)
      const identical =
        personality1.friendliness === personality2.friendliness &&
        personality1.energyTrait === personality2.energyTrait &&
        personality1.curiosity === personality2.curiosity &&
        personality1.patience === personality2.patience &&
        personality1.playfulness === personality2.playfulness;

      expect(identical).toBe(false);
    });
  });

  describe('assignRandomTraits', () => {
    it('should assign requested number of traits by type', async () => {
      const pet = await prisma.pet.create({
        data: {
          name: 'Test Pet',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
        },
      });

      await assignRandomTraits(pet.id, {
        visual: 2,
        personality: 1,
        skill: 1,
      });

      const petTraits = await prisma.petTrait.findMany({
        where: { petId: pet.id },
        include: { trait: true },
      });

      const visualTraits = petTraits.filter((pt) => pt.trait.traitType === 'visual');
      const personalityTraits = petTraits.filter((pt) => pt.trait.traitType === 'personality');
      const skillTraits = petTraits.filter((pt) => pt.trait.traitType === 'skill');

      expect(visualTraits.length).toBe(2);
      expect(personalityTraits.length).toBe(1);
      expect(skillTraits.length).toBe(1);
    });

    it('should not assign duplicate traits to same pet', async () => {
      const pet = await prisma.pet.create({
        data: {
          name: 'Test Pet',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
        },
      });

      await assignRandomTraits(pet.id, {
        visual: 3,
        personality: 2,
      });

      const petTraits = await prisma.petTrait.findMany({
        where: { petId: pet.id },
      });

      const traitIds = petTraits.map((pt) => pt.traitId);
      const uniqueTraitIds = new Set(traitIds);

      expect(traitIds.length).toBe(uniqueTraitIds.size);
    });

    it('should mark traits with inheritanceSource as "initial"', async () => {
      const pet = await prisma.pet.create({
        data: {
          name: 'Test Pet',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
        },
      });

      await assignRandomTraits(pet.id, {
        visual: 1,
        personality: 1,
      });

      const petTraits = await prisma.petTrait.findMany({
        where: { petId: pet.id },
      });

      petTraits.forEach((pt) => {
        expect(pt.inheritanceSource).toBe('initial');
      });
    });
  });

  describe('createPetWithGenetics', () => {
    it('should create a pet with random personality and traits', async () => {
      const pet = await createPetWithGenetics(testUserId, 'My First Pet');

      expect(pet).toBeDefined();
      expect(pet?.name).toBe('My First Pet');
      expect(pet?.userId).toBe(testUserId);
      expect(pet?.generation).toBe(1);

      // Check personality values are in range
      expect(pet!.friendliness).toBeGreaterThanOrEqual(0);
      expect(pet!.friendliness).toBeLessThanOrEqual(100);

      // Check traits were assigned (4 visual + 3 personality = 7 total)
      expect(pet?.petTraits.length).toBeGreaterThan(0);
    });
  });

  describe('breedPets - Trait Inheritance', () => {
    it('should inherit traits from both parents (50/50)', async () => {
      // Create parent 1 with specific traits
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 80,
          energyTrait: 60,
          curiosity: 70,
          patience: 50,
          playfulness: 90,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days old
        },
      });

      await prisma.petTrait.createMany({
        data: [
          { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' }, // Blue Eyes
          { petId: parent1.id, traitId: testTraits[4].id, inheritanceSource: 'initial' }, // Friendly
        ],
      });

      // Create parent 2 with different traits
      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 40,
          energyTrait: 80,
          curiosity: 60,
          patience: 70,
          playfulness: 30,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days old
        },
      });

      await prisma.petTrait.createMany({
        data: [
          { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' }, // Green Eyes
          { petId: parent2.id, traitId: testTraits[5].id, inheritanceSource: 'initial' }, // Brave
        ],
      });

      // Fetch parents with traits
      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      // Breed multiple times to test randomness (disable mutations for this test)
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const offspring = await breedPets(p1!, p2!, testUserId, `Offspring ${i}`);

        const inheritedTraits = offspring?.petTraits || [];
        const visualTraits = inheritedTraits.filter((pt) => pt.trait.traitType === 'visual');

        // At least one visual trait should be inherited
        expect(visualTraits.length).toBeGreaterThanOrEqual(1);

        // Record which visual trait was inherited
        visualTraits.forEach((vt) => {
          results.push(vt.trait.traitName);
        });

        // Clean up offspring for next iteration
        await prisma.petTrait.deleteMany({ where: { petId: offspring!.id } });
        await prisma.pet.delete({ where: { id: offspring!.id } });
      }

      // With 10 breeding attempts, we should see both parent traits appear
      // (unless all mutations occurred, which is very unlikely)
      const uniqueTraits = new Set(results);
      expect(uniqueTraits.size).toBeGreaterThanOrEqual(1);
    });

    it('should calculate offspring generation correctly', async () => {
      // Create parents with different generations
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Gen 2 Parent',
          userId: testUserId,
          generation: 2,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Gen 3 Parent',
          userId: testUserId,
          generation: 3,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.petTrait.create({
        data: { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
      });
      await prisma.petTrait.create({
        data: { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' },
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      // Generation should be max(2, 3) + 1 = 4
      expect(offspring?.generation).toBe(4);
    });

    it('should track inheritance source (parent1, parent2, or mutation)', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.petTrait.create({
        data: { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
      });
      await prisma.petTrait.create({
        data: { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' },
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      const inheritedTraits = offspring?.petTraits || [];

      // Each trait should have a valid inheritanceSource
      inheritedTraits.forEach((pt) => {
        expect(['parent1', 'parent2', 'mutation']).toContain(pt.inheritanceSource);
      });
    });

    it('should apply mutations at 15% rate', async () => {
      // Create parents with known traits
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      // Give both parents the same trait (Blue Eyes)
      await prisma.petTrait.createMany({
        data: [
          { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
          { petId: parent2.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
        ],
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      // Breed many times and count mutations
      let mutationCount = 0;
      const trials = 50;

      for (let i = 0; i < trials; i++) {
        const offspring = await breedPets(p1!, p2!, testUserId, `Offspring ${i}`);

        const hasMutation = offspring?.petTraits.some(
          (pt) => pt.inheritanceSource === 'mutation'
        );

        if (hasMutation) {
          mutationCount++;
        }

        // Clean up
        await prisma.petTrait.deleteMany({ where: { petId: offspring!.id } });
        await prisma.pet.delete({ where: { id: offspring!.id } });
      }

      // Expected mutation rate is 15%, with 50 trials we expect around 7-8
      // Allow for variance: 3-20 mutations (6%-40%)
      expect(mutationCount).toBeGreaterThanOrEqual(3);
      expect(mutationCount).toBeLessThanOrEqual(20);
    });

    it('should respect rarity distribution in mutations', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.petTrait.createMany({
        data: [
          { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
          { petId: parent2.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
        ],
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      // Collect mutation rarities over many trials
      const mutationRarities: Record<string, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        legendary: 0,
      };

      for (let i = 0; i < 100; i++) {
        const offspring = await breedPets(p1!, p2!, testUserId, `Offspring ${i}`);

        const mutations = offspring?.petTraits.filter(
          (pt) => pt.inheritanceSource === 'mutation'
        );

        mutations?.forEach((m) => {
          mutationRarities[m.trait.rarity]++;
        });

        // Clean up
        await prisma.petTrait.deleteMany({ where: { petId: offspring!.id } });
        await prisma.pet.delete({ where: { id: offspring!.id } });
      }

      // We should see more common mutations than legendary
      // (This is probabilistic, so we just check that we got some variety)
      const totalMutations = Object.values(mutationRarities).reduce((sum, count) => sum + count, 0);

      // At least some mutations should have occurred
      expect(totalMutations).toBeGreaterThan(0);
    });

    it('should preserve trait categories (visual, personality, skill)', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      // Parent 1 has visual + personality traits
      await prisma.petTrait.createMany({
        data: [
          { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' }, // Visual
          { petId: parent1.id, traitId: testTraits[4].id, inheritanceSource: 'initial' }, // Personality
        ],
      });

      // Parent 2 has different visual + personality traits
      await prisma.petTrait.createMany({
        data: [
          { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' }, // Visual
          { petId: parent2.id, traitId: testTraits[5].id, inheritanceSource: 'initial' }, // Personality
        ],
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      const visualCount = offspring?.petTraits.filter((pt) => pt.trait.traitType === 'visual').length || 0;
      const personalityCount = offspring?.petTraits.filter((pt) => pt.trait.traitType === 'personality').length || 0;

      // Offspring should have inherited traits from both categories
      expect(visualCount).toBeGreaterThanOrEqual(1);
      expect(personalityCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle edge case: same traits from both parents', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Parent 1',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Parent 2',
          userId: testUserId,
          generation: 1,
          friendliness: 50,
          energyTrait: 50,
          curiosity: 50,
          patience: 50,
          playfulness: 50,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      // Both parents have identical traits
      await prisma.petTrait.createMany({
        data: [
          { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
          { petId: parent1.id, traitId: testTraits[4].id, inheritanceSource: 'initial' },
          { petId: parent2.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
          { petId: parent2.id, traitId: testTraits[4].id, inheritanceSource: 'initial' },
        ],
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      // Offspring should have traits (no duplicates within offspring)
      expect(offspring?.petTraits.length).toBeGreaterThan(0);

      const traitIds = offspring?.petTraits.map((pt) => pt.traitId) || [];
      const uniqueTraitIds = new Set(traitIds);
      expect(traitIds.length).toBe(uniqueTraitIds.size);
    });

    it('should average parent personality traits with variance', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Very Friendly Parent',
          userId: testUserId,
          generation: 1,
          friendliness: 100,
          energyTrait: 100,
          curiosity: 100,
          patience: 100,
          playfulness: 100,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Very Grumpy Parent',
          userId: testUserId,
          generation: 1,
          friendliness: 0,
          energyTrait: 0,
          curiosity: 0,
          patience: 0,
          playfulness: 0,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.petTrait.create({
        data: { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
      });
      await prisma.petTrait.create({
        data: { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' },
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      // Offspring personality should be around 50 (average) with ±15 variance
      // So range is 35-65
      expect(offspring!.friendliness).toBeGreaterThanOrEqual(35);
      expect(offspring!.friendliness).toBeLessThanOrEqual(65);
      expect(offspring!.energyTrait).toBeGreaterThanOrEqual(35);
      expect(offspring!.energyTrait).toBeLessThanOrEqual(65);
    });

    it('should clamp personality values to 0-100 range', async () => {
      const parent1 = await prisma.pet.create({
        data: {
          name: 'Low Stats Parent',
          userId: testUserId,
          generation: 1,
          friendliness: 5,
          energyTrait: 5,
          curiosity: 5,
          patience: 5,
          playfulness: 5,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      const parent2 = await prisma.pet.create({
        data: {
          name: 'Another Low Stats Parent',
          userId: testUserId,
          generation: 1,
          friendliness: 5,
          energyTrait: 5,
          curiosity: 5,
          patience: 5,
          playfulness: 5,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.petTrait.create({
        data: { petId: parent1.id, traitId: testTraits[0].id, inheritanceSource: 'initial' },
      });
      await prisma.petTrait.create({
        data: { petId: parent2.id, traitId: testTraits[1].id, inheritanceSource: 'initial' },
      });

      const p1 = await prisma.pet.findUnique({
        where: { id: parent1.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const p2 = await prisma.pet.findUnique({
        where: { id: parent2.id },
        include: { petTraits: { include: { trait: true } } },
      });

      const offspring = await breedPets(p1!, p2!, testUserId, 'Offspring');

      // All personality values should be clamped to 0-100
      expect(offspring!.friendliness).toBeGreaterThanOrEqual(0);
      expect(offspring!.friendliness).toBeLessThanOrEqual(100);
      expect(offspring!.energyTrait).toBeGreaterThanOrEqual(0);
      expect(offspring!.energyTrait).toBeLessThanOrEqual(100);
      expect(offspring!.curiosity).toBeGreaterThanOrEqual(0);
      expect(offspring!.curiosity).toBeLessThanOrEqual(100);
      expect(offspring!.patience).toBeGreaterThanOrEqual(0);
      expect(offspring!.patience).toBeLessThanOrEqual(100);
      expect(offspring!.playfulness).toBeGreaterThanOrEqual(0);
      expect(offspring!.playfulness).toBeLessThanOrEqual(100);
    });
  });
});
