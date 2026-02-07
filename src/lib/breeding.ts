import { prisma } from './prisma';
import type { Pet, PetTrait, Trait } from '@prisma/client';

// Rarity distribution for mutations (same as initial generation)
const RARITY_DISTRIBUTION = {
  common: 0.6,      // 60%
  uncommon: 0.25,   // 25%
  rare: 0.1,        // 10%
  legendary: 0.05   // 5%
};

const MUTATION_CHANCE = 0.15; // 15% chance per trait

/**
 * Get a random rarity based on the distribution
 */
function getRandomRarity(): string {
  const rand = Math.random();
  let cumulative = 0;

  for (const [rarity, probability] of Object.entries(RARITY_DISTRIBUTION)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return rarity;
    }
  }

  return 'common'; // fallback
}

/**
 * Calculate offspring personality as average of parents with random variance (±15)
 */
function calculateOffspringPersonality(
  parent1: Pet,
  parent2: Pet
): {
  friendliness: number;
  energyTrait: number;
  curiosity: number;
  patience: number;
  playfulness: number;
} {
  const variance = () => Math.floor(Math.random() * 31) - 15; // -15 to +15

  const clamp = (value: number) => Math.max(0, Math.min(100, value));

  return {
    friendliness: clamp(Math.floor((parent1.friendliness + parent2.friendliness) / 2) + variance()),
    energyTrait: clamp(Math.floor((parent1.energyTrait + parent2.energyTrait) / 2) + variance()),
    curiosity: clamp(Math.floor((parent1.curiosity + parent2.curiosity) / 2) + variance()),
    patience: clamp(Math.floor((parent1.patience + parent2.patience) / 2) + variance()),
    playfulness: clamp(Math.floor((parent1.playfulness + parent2.playfulness) / 2) + variance()),
  };
}

/**
 * Get a random mutation trait of the same type
 */
async function getMutationTrait(originalTraitType: string): Promise<Trait | null> {
  const targetRarity = getRandomRarity();

  // Try to find a trait with the target rarity
  const availableTraits = await prisma.trait.findMany({
    where: {
      traitType: originalTraitType,
      rarity: targetRarity,
    },
  });

  if (availableTraits.length > 0) {
    return availableTraits[Math.floor(Math.random() * availableTraits.length)];
  }

  // Fallback: any trait of the same type
  const fallbackTraits = await prisma.trait.findMany({
    where: { traitType: originalTraitType },
  });

  if (fallbackTraits.length > 0) {
    return fallbackTraits[Math.floor(Math.random() * fallbackTraits.length)];
  }

  return null;
}

/**
 * Breed two pets to create offspring with genetics inheritance
 *
 * @param parent1 - First parent pet (with petTraits)
 * @param parent2 - Second parent pet (with petTraits)
 * @param userId - Owner of the offspring
 * @param offspringName - Name for the offspring
 * @returns The newly created offspring pet with traits
 */
export async function breedPets(
  parent1: Pet & { petTraits: (PetTrait & { trait: Trait })[] },
  parent2: Pet & { petTraits: (PetTrait & { trait: Trait })[] },
  userId: string,
  offspringName: string
) {
  // Calculate generation number
  const generation = Math.max(parent1.generation, parent2.generation) + 1;

  // Calculate offspring personality
  const personality = calculateOffspringPersonality(parent1, parent2);

  // Create the offspring pet
  const offspring = await prisma.pet.create({
    data: {
      name: offspringName,
      userId,
      generation,
      parent1Id: parent1.id,
      parent2Id: parent2.id,
      friendliness: personality.friendliness,
      energyTrait: personality.energyTrait,
      curiosity: personality.curiosity,
      patience: personality.patience,
      playfulness: personality.playfulness,
    },
  });

  // Group parent traits by type
  const parent1TraitsByType: Record<string, (PetTrait & { trait: Trait })[]> = {};
  const parent2TraitsByType: Record<string, (PetTrait & { trait: Trait })[]> = {};

  parent1.petTraits.forEach((pt) => {
    const type = pt.trait.traitType;
    if (!parent1TraitsByType[type]) parent1TraitsByType[type] = [];
    parent1TraitsByType[type].push(pt);
  });

  parent2.petTraits.forEach((pt) => {
    const type = pt.trait.traitType;
    if (!parent2TraitsByType[type]) parent2TraitsByType[type] = [];
    parent2TraitsByType[type].push(pt);
  });

  // Get all unique trait types
  const allTraitTypes = new Set([
    ...Object.keys(parent1TraitsByType),
    ...Object.keys(parent2TraitsByType),
  ]);

  // Inherit traits: 50% from each parent
  const inheritedTraits: Array<{ traitId: string; inheritanceSource: string }> = [];
  const usedTraitIds = new Set<string>(); // Prevent duplicate traits

  for (const traitType of allTraitTypes) {
    const parent1Traits = parent1TraitsByType[traitType] || [];
    const parent2Traits = parent2TraitsByType[traitType] || [];

    // Determine how many traits to inherit of this type
    const totalTraitsOfType = parent1Traits.length + parent2Traits.length;
    const traitsToInherit = Math.max(1, Math.floor(totalTraitsOfType / 2));

    // Randomly select traits from both parents
    const combinedTraits = [
      ...parent1Traits.map((pt) => ({ ...pt, parentSource: 'parent1' as const })),
      ...parent2Traits.map((pt) => ({ ...pt, parentSource: 'parent2' as const })),
    ];

    // Shuffle and take the number we need
    const shuffled = combinedTraits.sort(() => Math.random() - 0.5);
    const selectedTraits = shuffled.slice(0, traitsToInherit);

    for (const selected of selectedTraits) {
      // Check for mutation (15% chance)
      const shouldMutate = Math.random() < MUTATION_CHANCE;

      if (shouldMutate) {
        // Mutation: get a random trait of the same type
        const mutationTrait = await getMutationTrait(selected.trait.traitType);
        if (mutationTrait && !usedTraitIds.has(mutationTrait.id)) {
          inheritedTraits.push({
            traitId: mutationTrait.id,
            inheritanceSource: 'mutation',
          });
          usedTraitIds.add(mutationTrait.id);
        } else if (!usedTraitIds.has(selected.traitId)) {
          // If mutation failed, inherit normally
          inheritedTraits.push({
            traitId: selected.traitId,
            inheritanceSource: selected.parentSource,
          });
          usedTraitIds.add(selected.traitId);
        }
      } else if (!usedTraitIds.has(selected.traitId)) {
        // Normal inheritance
        inheritedTraits.push({
          traitId: selected.traitId,
          inheritanceSource: selected.parentSource,
        });
        usedTraitIds.add(selected.traitId);
      }
    }
  }

  // Create PetTrait records for offspring
  if (inheritedTraits.length > 0) {
    await prisma.petTrait.createMany({
      data: inheritedTraits.map((trait) => ({
        petId: offspring.id,
        traitId: trait.traitId,
        inheritanceSource: trait.inheritanceSource,
      })),
    });
  }

  // Fetch the complete offspring with traits
  const completeOffspring = await prisma.pet.findUnique({
    where: { id: offspring.id },
    include: {
      petTraits: {
        include: {
          trait: true,
        },
      },
    },
  });

  return completeOffspring;
}

/**
 * Validate if two pets can breed
 */
export function canBreed(
  pet1: Pet,
  pet2: Pet,
  currentTime: Date = new Date()
): { canBreed: boolean; reason?: string } {
  // Check if pets are the same
  if (pet1.id === pet2.id) {
    return { canBreed: false, reason: 'Cannot breed a pet with itself' };
  }

  // Check if both pets are adults (7+ days old)
  const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (pet1.createdAt > sevenDaysAgo || pet2.createdAt > sevenDaysAgo) {
    return { canBreed: false, reason: 'Both pets must be at least 7 days old' };
  }

  // Check health requirements (both must have Health > 50)
  if (pet1.health <= 50 || pet2.health <= 50) {
    return { canBreed: false, reason: 'Both pets must have health > 50' };
  }

  // Check if either pet is in critical state
  if (pet1.isCritical || pet2.isCritical) {
    return { canBreed: false, reason: 'Pets in critical state cannot breed' };
  }

  // Check breeding cooldown (7 days since last breeding)
  // Note: This would require tracking last breeding time, which we'll add in US-012
  // For now, we'll skip this check as the database schema doesn't have this field yet

  return { canBreed: true };
}
