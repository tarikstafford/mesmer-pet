import seedrandom from 'seedrandom';
import type { PetTraits, RarityTier, PatternType, AccessoryType, BodySize, ExpressionType } from './types';
import { generateHarmonizedColor, generateComplementaryColor } from './colorHarmony';

/**
 * Weighted random selection helper
 * Uses cumulative distribution to select from weighted options
 *
 * @param rng - Seeded random number generator
 * @param weights - Map of choices to their weights
 * @returns Selected choice
 *
 * @example
 * const rng = seedrandom('my-seed');
 * const rarity = weightedChoice(rng, {
 *   common: 0.7,
 *   rare: 0.3
 * }); // Returns 'common' 70% of the time
 */
export function weightedChoice<T extends string>(
  rng: () => number,
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [_, weight]) => sum + weight, 0);

  let roll = rng() * total;

  for (const [choice, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return choice;
  }

  // Fallback to first choice (handles floating point errors)
  return entries[0][0];
}

/**
 * Get rarity tier using weighted probability
 * Common: 70%, Uncommon: 20%, Rare: 8%, Legendary: 2%
 *
 * @param rng - Seeded random number generator
 * @returns Rarity tier
 */
function getRarityTier(rng: () => number): RarityTier {
  const roll = rng();

  if (roll < 0.70) return 'common';      // 70%
  if (roll < 0.90) return 'uncommon';    // 20%
  if (roll < 0.98) return 'rare';        // 8%
  return 'legendary';                     // 2%
}

// Pattern weights influenced by rarity
const PATTERN_WEIGHTS: Record<RarityTier, Record<PatternType, number>> = {
  common: {
    none: 0.5,
    striped: 0.25,
    spotted: 0.15,
    gradient: 0.1
  },
  uncommon: {
    none: 0.3,
    striped: 0.3,
    spotted: 0.25,
    gradient: 0.15
  },
  rare: {
    none: 0.15,
    striped: 0.25,
    spotted: 0.35,
    gradient: 0.25
  },
  legendary: {
    none: 0.1,
    striped: 0.15,
    spotted: 0.25,
    gradient: 0.5
  }
};

// Accessory weights influenced by rarity
const ACCESSORY_WEIGHTS: Record<RarityTier, Record<AccessoryType, number>> = {
  common: {
    none: 0.5,
    collar: 0.3,
    horns: 0.1,
    wings: 0.05,
    crown: 0.05
  },
  uncommon: {
    none: 0.3,
    collar: 0.3,
    horns: 0.2,
    wings: 0.1,
    crown: 0.1
  },
  rare: {
    none: 0.15,
    collar: 0.2,
    horns: 0.3,
    wings: 0.2,
    crown: 0.15
  },
  legendary: {
    none: 0.05,
    collar: 0.1,
    horns: 0.2,
    wings: 0.3,
    crown: 0.35
  }
};

// Body size weights (equal distribution)
const SIZE_WEIGHTS: Record<BodySize, number> = {
  small: 0.33,
  medium: 0.34,
  large: 0.33
};

// Expression weights (equal distribution)
const EXPRESSION_WEIGHTS: Record<ExpressionType, number> = {
  happy: 0.25,
  neutral: 0.2,
  curious: 0.2,
  mischievous: 0.2,
  sleepy: 0.15
};

/**
 * Generate deterministic pet traits from pet ID
 * PURE FUNCTION - only depends on petId seed, no external state
 *
 * Same pet ID always produces identical traits across all platforms
 *
 * @param petId - Unique pet identifier used as PRNG seed
 * @returns Complete pet visual traits
 */
export function generatePetTraits(petId: string): PetTraits {
  // Create seeded RNG - same petId always produces same sequence
  const rng = seedrandom(petId);

  // Generate rarity first (affects other trait probabilities)
  const rarity = getRarityTier(rng);

  // Generate body color with HSL constraints to prevent muddy colors
  const bodyColor = generateHarmonizedColor(rng, {
    hueRange: [0, 360],
    satRange: [50, 90],  // Avoid muddy colors
    lightRange: [25, 75] // Avoid pure black/white
  });

  // Select pattern type based on rarity
  const patternType = weightedChoice(rng, PATTERN_WEIGHTS[rarity]);

  // Generate complementary pattern color if pattern exists
  const patternColor = patternType !== 'none'
    ? generateComplementaryColor(bodyColor, rng)
    : undefined;

  // Select accessory based on rarity
  const accessory = weightedChoice(rng, ACCESSORY_WEIGHTS[rarity]);

  // Select body size (equal distribution)
  const bodySize = weightedChoice(rng, SIZE_WEIGHTS);

  // Select expression (equal distribution)
  const expression = weightedChoice(rng, EXPRESSION_WEIGHTS);

  return {
    bodyColor,
    patternType,
    patternColor,
    accessory,
    bodySize,
    expression,
    rarity,
    traitVersion: 1
  };
}
