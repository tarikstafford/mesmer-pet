import { describe, it, expect } from 'vitest';
import { loadTraits, migrateTraits } from '@/lib/traits/migration';
import { generatePetTraits } from '@/lib/traits/generation';
import { PetTraitsSchema } from '@/lib/traits/validation';

describe('loadTraits', () => {
  it('returns valid traits when database has valid v1 trait data', () => {
    const validTraits = generatePetTraits('test-pet-1');
    const result = loadTraits(validTraits, 'test-pet-1');

    expect(result).toEqual(validTraits);
  });

  it('regenerates traits when rawTraits is null', () => {
    const result = loadTraits(null, 'test-pet-2');

    // Validate structure with Zod
    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('regenerates traits when rawTraits is undefined', () => {
    const result = loadTraits(undefined, 'test-pet-3');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('regenerates traits when rawTraits is not an object (string)', () => {
    const result = loadTraits('invalid', 'test-pet-4');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('regenerates traits when rawTraits is not an object (number)', () => {
    const result = loadTraits(42, 'test-pet-5');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('produces identical traits for same petId on repeated calls', () => {
    const petId = 'consistency-test-pet';
    const result1 = loadTraits(null, petId);
    const result2 = loadTraits(null, petId);

    // Deep equality check for PERSIST-02: cross-session consistency
    expect(result1).toEqual(result2);
  });
});

describe('migrateTraits', () => {
  it('validates and returns v1 traits', () => {
    const validTraits = generatePetTraits('test-pet-6');
    const result = migrateTraits(validTraits as unknown as Record<string, unknown>, 'test-pet-6');

    expect(result).toEqual(validTraits);
  });

  it('regenerates when v1 traits have invalid fields', () => {
    const brokenTraits = {
      traitVersion: 1,
      // Missing bodyColor and other required fields
      accessory: 'crown' as const,
      bodySize: 'medium' as const
    };

    const result = migrateTraits(brokenTraits, 'test-pet-7');

    // Should NOT return broken input
    expect(result).not.toEqual(brokenTraits);
    // Should return valid traits
    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('regenerates when v1 traits have wrong types', () => {
    const brokenTraits = {
      traitVersion: 1,
      bodyColor: 'red', // Wrong type - should be HSLColor object
      patternType: 'striped',
      accessory: 'none',
      bodySize: 'medium',
      expression: 'happy',
      rarity: 'common'
    };

    const result = migrateTraits(brokenTraits, 'test-pet-8');

    // Should NOT return broken input
    expect(result.bodyColor).not.toBe('red');
    expect(typeof result.bodyColor).toBe('object');
    // Should return valid traits
    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
  });

  it('regenerates when traitVersion is missing', () => {
    const noVersionTraits = {
      bodyColor: { h: 180, s: 70, l: 50 },
      patternType: 'spotted',
      accessory: 'collar',
      bodySize: 'large',
      expression: 'curious',
      rarity: 'uncommon'
      // traitVersion missing
    };

    const result = migrateTraits(noVersionTraits, 'test-pet-9');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('regenerates when traitVersion is unknown (999)', () => {
    const futureVersionTraits = {
      traitVersion: 999,
      bodyColor: { h: 180, s: 70, l: 50 },
      patternType: 'gradient',
      accessory: 'wings',
      bodySize: 'small',
      expression: 'sleepy',
      rarity: 'legendary'
    };

    const result = migrateTraits(futureVersionTraits, 'test-pet-10');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    expect(result.traitVersion).toBe(1);
  });

  it('handles partial trait data gracefully', () => {
    const partialTraits = {
      traitVersion: 1,
      bodyColor: { h: 120, s: 80, l: 60 }
      // Missing other required fields
    };

    const result = migrateTraits(partialTraits, 'test-pet-11');

    const validation = PetTraitsSchema.safeParse(result);
    expect(validation.success).toBe(true);
    // Should have all required fields
    expect(result.bodyColor).toBeDefined();
    expect(result.patternType).toBeDefined();
    expect(result.accessory).toBeDefined();
    expect(result.bodySize).toBeDefined();
    expect(result.expression).toBeDefined();
    expect(result.rarity).toBeDefined();
  });
});

describe('deterministic regeneration (PERSIST-02)', () => {
  it('same petId always regenerates identical traits', () => {
    // Test 3 different pet IDs
    const petIds = ['pet-alpha', 'pet-beta', 'pet-gamma'];

    for (const petId of petIds) {
      const result1 = loadTraits(null, petId);
      const result2 = loadTraits(null, petId);

      // Deep equality check
      expect(result1).toEqual(result2);
    }
  });

  it('different petIds produce different traits', () => {
    const traitsA = loadTraits(null, 'pet-a');
    const traitsB = loadTraits(null, 'pet-b');

    // Should not be identical
    expect(traitsA).not.toEqual(traitsB);
  });
});
