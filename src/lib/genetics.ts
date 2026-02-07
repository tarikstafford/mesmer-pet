import { prisma } from './prisma';

// Rarity distribution for random trait selection
const RARITY_DISTRIBUTION = {
  common: 0.6,      // 60%
  uncommon: 0.25,   // 25%
  rare: 0.1,        // 10%
  legendary: 0.05   // 5%
};

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
 * Generate random personality traits for a new pet
 */
export function generateRandomPersonality() {
  return {
    friendliness: Math.floor(Math.random() * 101), // 0-100
    energyTrait: Math.floor(Math.random() * 101),
    curiosity: Math.floor(Math.random() * 101),
    patience: Math.floor(Math.random() * 101),
    playfulness: Math.floor(Math.random() * 101),
  };
}

/**
 * Assign random genetic traits to a new pet based on rarity distribution
 * @param petId - The ID of the pet to assign traits to
 * @param traitCounts - Number of traits to assign by type { visual: number, personality: number, skill: number }
 */
export async function assignRandomTraits(
  petId: string,
  traitCounts: { visual: number; personality: number; skill?: number }
) {
  const assignedTraits: Array<{ traitId: string; inheritanceSource: string }> = [];

  // Get all available traits by type
  for (const [traitType, count] of Object.entries(traitCounts)) {
    if (count === 0) continue;

    for (let i = 0; i < count; i++) {
      // Determine rarity for this trait selection
      const targetRarity = getRandomRarity();

      // Fetch traits matching this type and rarity
      const availableTraits = await prisma.trait.findMany({
        where: {
          traitType,
          rarity: targetRarity,
        },
      });

      // If no traits found for this rarity, fetch from any rarity
      if (availableTraits.length === 0) {
        const fallbackTraits = await prisma.trait.findMany({
          where: { traitType },
        });

        if (fallbackTraits.length > 0) {
          const randomTrait = fallbackTraits[Math.floor(Math.random() * fallbackTraits.length)];
          assignedTraits.push({
            traitId: randomTrait.id,
            inheritanceSource: 'initial',
          });
        }
      } else {
        // Randomly select one trait from available traits
        const randomTrait = availableTraits[Math.floor(Math.random() * availableTraits.length)];
        assignedTraits.push({
          traitId: randomTrait.id,
          inheritanceSource: 'initial',
        });
      }
    }
  }

  // Create PetTrait records
  await prisma.petTrait.createMany({
    data: assignedTraits.map((trait) => ({
      petId,
      traitId: trait.traitId,
      inheritanceSource: trait.inheritanceSource,
    })),
  });

  return assignedTraits;
}

/**
 * Create a new pet with random genetics for a user
 */
export async function createPetWithGenetics(userId: string, petName: string) {
  // Generate random personality traits
  const personality = generateRandomPersonality();

  // Create the pet
  const pet = await prisma.pet.create({
    data: {
      name: petName,
      userId,
      generation: 1,
      friendliness: personality.friendliness,
      energyTrait: personality.energyTrait,
      curiosity: personality.curiosity,
      patience: personality.patience,
      playfulness: personality.playfulness,
    },
  });

  // Assign random genetic traits (4 visual, 3 personality for MVP)
  await assignRandomTraits(pet.id, {
    visual: 4,
    personality: 3,
    skill: 0, // No initial skills, they're purchased
  });

  // Fetch the complete pet with traits
  const completePet = await prisma.pet.findUnique({
    where: { id: pet.id },
    include: {
      petTraits: {
        include: {
          trait: true,
        },
      },
    },
  });

  return completePet;
}
