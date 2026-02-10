import { describe, it, expect } from 'vitest';
import { generatePetTraits } from '@/lib/traits/generation';
import { generateHarmonizedColor, generateComplementaryColor, hslToString, validateColorHarmony } from '@/lib/traits/colorHarmony';
import { PetTraitsSchema } from '@/lib/traits/validation';
import type { PetTraits, HSLColor } from '@/lib/traits/types';

describe('Trait Determinism', () => {
  it('generates identical traits for same pet ID', () => {
    const petId = 'test-pet-123';

    const traits1 = generatePetTraits(petId);
    const traits2 = generatePetTraits(petId);

    expect(traits1).toEqual(traits2);
    expect(traits1.bodyColor.h).toBe(traits2.bodyColor.h);
    expect(traits1.bodyColor.s).toBe(traits2.bodyColor.s);
    expect(traits1.bodyColor.l).toBe(traits2.bodyColor.l);
    expect(traits1.patternType).toBe(traits2.patternType);
    expect(traits1.accessory).toBe(traits2.accessory);
    expect(traits1.bodySize).toBe(traits2.bodySize);
    expect(traits1.expression).toBe(traits2.expression);
    expect(traits1.rarity).toBe(traits2.rarity);
  });

  it('generates different traits for different pet IDs', () => {
    const traits1 = generatePetTraits('pet-1');
    const traits2 = generatePetTraits('pet-2');

    expect(traits1).not.toEqual(traits2);
  });

  it('maintains determinism across sequential calls', () => {
    const petId = 'sequential-test';

    // Generate traits multiple times in sequence
    const traits1 = generatePetTraits(petId);
    const traits2 = generatePetTraits(petId);
    const traits3 = generatePetTraits(petId);

    expect(traits1).toEqual(traits2);
    expect(traits2).toEqual(traits3);
  });
});

describe('Color Harmony', () => {
  it('constrains body color saturation to 50-90%', () => {
    // Test 100 random pets to ensure saturation constraint
    for (let i = 0; i < 100; i++) {
      const traits = generatePetTraits(`pet-saturation-${i}`);
      expect(traits.bodyColor.s).toBeGreaterThanOrEqual(50);
      expect(traits.bodyColor.s).toBeLessThanOrEqual(90);
    }
  });

  it('constrains body color lightness to 25-75%', () => {
    // Test 100 random pets to ensure lightness constraint
    for (let i = 0; i < 100; i++) {
      const traits = generatePetTraits(`pet-lightness-${i}`);
      expect(traits.bodyColor.l).toBeGreaterThanOrEqual(25);
      expect(traits.bodyColor.l).toBeLessThanOrEqual(75);
    }
  });

  it('generates complementary pattern colors', () => {
    // Test pets with patterns to ensure complementary colors
    for (let i = 0; i < 50; i++) {
      const traits = generatePetTraits(`pet-complementary-${i}`);

      if (traits.patternType !== 'none' && traits.patternColor) {
        const bodyHue = traits.bodyColor.h;
        const patternHue = traits.patternColor.h;

        // Complementary should be ~180 degrees apart, with ±15 variance
        const hueDiff = Math.abs(((patternHue - bodyHue + 180) % 360) - 180);
        expect(hueDiff).toBeGreaterThanOrEqual(165);
        expect(hueDiff).toBeLessThanOrEqual(195);
      }
    }
  });

  it('converts HSL to CSS string correctly', () => {
    const color: HSLColor = { h: 120, s: 70, l: 50 };
    const cssString = hslToString(color);

    expect(cssString).toBe('hsl(120, 70%, 50%)');
  });

  it('rejects muddy color combinations', () => {
    const muddyColors: HSLColor[] = [
      { h: 30, s: 20, l: 50 },  // Muddy brown (low sat, mid light)
      { h: 180, s: 15, l: 45 }  // Muddy gray-blue
    ];

    expect(validateColorHarmony(muddyColors)).toBe(false);
  });

  it('accepts vibrant color combinations', () => {
    const vibrantColors: HSLColor[] = [
      { h: 200, s: 70, l: 50 },  // Vibrant blue
      { h: 20, s: 80, l: 60 }    // Vibrant orange
    ];

    expect(validateColorHarmony(vibrantColors)).toBe(true);
  });
});

describe('Rarity Distribution', () => {
  it('matches expected percentages over 10,000 samples', () => {
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    const sampleSize = 10000;

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`pet-rarity-${i}`);
      counts[traits.rarity]++;
    }

    // Target: Common 70%, Uncommon 20%, Rare 8%, Legendary 2%
    // Allow ±5% margin of error
    const commonPercent = (counts.common / sampleSize) * 100;
    const uncommonPercent = (counts.uncommon / sampleSize) * 100;
    const rarePercent = (counts.rare / sampleSize) * 100;
    const legendaryPercent = (counts.legendary / sampleSize) * 100;

    expect(commonPercent).toBeGreaterThan(65);
    expect(commonPercent).toBeLessThan(75);

    expect(uncommonPercent).toBeGreaterThan(15);
    expect(uncommonPercent).toBeLessThan(25);

    expect(rarePercent).toBeGreaterThan(3);
    expect(rarePercent).toBeLessThan(13);

    expect(legendaryPercent).toBeGreaterThan(0);
    expect(legendaryPercent).toBeLessThan(7);
  });
});

describe('Trait Validation', () => {
  it('validates correct trait objects', () => {
    const traits = generatePetTraits('valid-pet');

    // Should not throw
    expect(() => PetTraitsSchema.parse(traits)).not.toThrow();
  });

  it('rejects empty objects', () => {
    expect(() => PetTraitsSchema.parse({})).toThrow();
  });

  it('rejects out-of-range HSL values', () => {
    const invalidTraits = {
      bodyColor: { h: 400, s: 50, l: 50 }, // h > 360
      patternType: 'none',
      accessory: 'none',
      bodySize: 'medium',
      expression: 'happy',
      rarity: 'common',
      traitVersion: 1
    };

    expect(() => PetTraitsSchema.parse(invalidTraits)).toThrow();
  });

  it('rejects invalid pattern types', () => {
    const invalidTraits = {
      bodyColor: { h: 120, s: 70, l: 50 },
      patternType: 'invalid-pattern', // Not in enum
      accessory: 'none',
      bodySize: 'medium',
      expression: 'happy',
      rarity: 'common',
      traitVersion: 1
    };

    expect(() => PetTraitsSchema.parse(invalidTraits)).toThrow();
  });
});

describe('Weighted Selection', () => {
  it('respects weight proportions over 1000 samples', () => {
    // This is tested indirectly through rarity distribution
    // but we can also test the weighted selection helper by checking
    // that higher-weight options appear more frequently

    const samples = 1000;
    const rarities: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0
    };

    for (let i = 0; i < samples; i++) {
      const traits = generatePetTraits(`weighted-${i}`);
      rarities[traits.rarity]++;
    }

    // Common should have highest count, legendary lowest
    expect(rarities.common).toBeGreaterThan(rarities.uncommon);
    expect(rarities.uncommon).toBeGreaterThan(rarities.rare);
    expect(rarities.rare).toBeGreaterThan(rarities.legendary);
  });
});

describe('Combination Count', () => {
  it('generates diverse body color hues', () => {
    const hues = new Set<number>();

    for (let i = 0; i < 1000; i++) {
      const traits = generatePetTraits(`pet-hue-${i}`);
      // Bucket hues into 45-degree ranges (8 buckets: 0-45, 45-90, etc.)
      const hueBucket = Math.floor(traits.bodyColor.h / 45);
      hues.add(hueBucket);
    }

    // Should generate at least 8 different hue buckets
    expect(hues.size).toBeGreaterThanOrEqual(8);
  });

  it('generates all pattern types', () => {
    const patterns = new Set<string>();

    for (let i = 0; i < 500; i++) {
      const traits = generatePetTraits(`pet-pattern-${i}`);
      patterns.add(traits.patternType);
    }

    // Should have at least 4 pattern types
    expect(patterns.size).toBeGreaterThanOrEqual(4);
    expect(patterns.has('none')).toBe(true);
  });

  it('generates all accessories', () => {
    const accessories = new Set<string>();

    for (let i = 0; i < 500; i++) {
      const traits = generatePetTraits(`pet-accessory-${i}`);
      accessories.add(traits.accessory);
    }

    // Should have at least 5 accessory types
    expect(accessories.size).toBeGreaterThanOrEqual(5);
  });

  it('generates all body sizes', () => {
    const sizes = new Set<string>();

    for (let i = 0; i < 200; i++) {
      const traits = generatePetTraits(`pet-size-${i}`);
      sizes.add(traits.bodySize);
    }

    // Should have all 3 sizes
    expect(sizes.size).toBeGreaterThanOrEqual(3);
  });

  it('generates all expressions', () => {
    const expressions = new Set<string>();

    for (let i = 0; i < 500; i++) {
      const traits = generatePetTraits(`pet-expression-${i}`);
      expressions.add(traits.expression);
    }

    // Should have at least 5 expression types
    expect(expressions.size).toBeGreaterThanOrEqual(5);
  });
});
