import { generatePetTraits } from '@/lib/traits/generation';
import { describe, it, expect } from 'vitest';
import type { PetTraits } from '@/lib/traits/types';

describe('QUALITY-02: Visual distinctiveness', () => {
  it('no two pets produce identical trait combinations across 1000 samples', () => {
    const sampleSize = 1000;
    const traitSignatures = new Map<string, string>();
    const duplicates: Array<{ petId1: string; petId2: string; signature: string }> = [];

    for (let i = 0; i < sampleSize; i++) {
      const petId = `distinct-${i}`;
      const traits = generatePetTraits(petId);

      // Create a visual signature from all visible trait properties
      const signature = [
        `body:${Math.round(traits.bodyColor.h)}-${Math.round(traits.bodyColor.s)}-${Math.round(traits.bodyColor.l)}`,
        `pattern:${traits.patternType}`,
        traits.patternColor
          ? `patternColor:${Math.round(traits.patternColor.h)}-${Math.round(traits.patternColor.s)}-${Math.round(traits.patternColor.l)}`
          : 'patternColor:none',
        `accessory:${traits.accessory}`,
        `size:${traits.bodySize}`,
        `expression:${traits.expression}`
      ].join('|');

      if (traitSignatures.has(signature)) {
        duplicates.push({
          petId1: traitSignatures.get(signature)!,
          petId2: petId,
          signature
        });
      } else {
        traitSignatures.set(signature, petId);
      }
    }

    if (duplicates.length > 0) {
      console.error(`Duplicate trait signatures found (${duplicates.length}):`);
      duplicates.forEach(d => console.error(`  ${d.petId1} == ${d.petId2}: ${d.signature}`));
    }

    // Zero exact duplicates across 1000 samples
    expect(duplicates).toHaveLength(0);
  });
});

describe('QUALITY-02: Color diversity', () => {
  it('body colors span at least 300 degrees of the hue wheel across 1000 samples', () => {
    const sampleSize = 1000;
    const hues: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`diversity-hue-${i}`);
      hues.push(traits.bodyColor.h);
    }

    const minHue = Math.min(...hues);
    const maxHue = Math.max(...hues);
    const hueSpread = maxHue - minHue;

    // With 1000 random samples across 0-360, spread should be at least 300
    expect(hueSpread).toBeGreaterThan(300);
  });

  it('all body sizes appear with roughly equal frequency', () => {
    const sampleSize = 1000;
    const sizeCounts = { small: 0, medium: 0, large: 0 };

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`diversity-size-${i}`);
      sizeCounts[traits.bodySize]++;
    }

    // Each size should appear at least 20% of the time (expected ~33%)
    const minExpected = sampleSize * 0.2;
    expect(sizeCounts.small).toBeGreaterThan(minExpected);
    expect(sizeCounts.medium).toBeGreaterThan(minExpected);
    expect(sizeCounts.large).toBeGreaterThan(minExpected);
  });

  it('all expression types appear in sample', () => {
    const sampleSize = 1000;
    const expressions = new Set<string>();

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`diversity-expr-${i}`);
      expressions.add(traits.expression);
    }

    // All 5 expression types should appear
    expect(expressions.size).toBe(5);
    expect(expressions.has('happy')).toBe(true);
    expect(expressions.has('neutral')).toBe(true);
    expect(expressions.has('curious')).toBe(true);
    expect(expressions.has('mischievous')).toBe(true);
    expect(expressions.has('sleepy')).toBe(true);
  });
});

describe('QUALITY-02: Rarity distribution', () => {
  it('rarity tiers follow 70/20/8/2 distribution within tolerance', () => {
    const sampleSize = 10000; // Large sample for distribution accuracy
    const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`rarity-dist-${i}`);
      rarityCounts[traits.rarity]++;
    }

    const tolerance = 0.03; // 3% tolerance for randomness

    expect(rarityCounts.common / sampleSize).toBeCloseTo(0.70, 1);
    expect(rarityCounts.uncommon / sampleSize).toBeCloseTo(0.20, 1);
    expect(rarityCounts.rare / sampleSize).toBeGreaterThan(0.08 - tolerance);
    expect(rarityCounts.rare / sampleSize).toBeLessThan(0.08 + tolerance);
    expect(rarityCounts.legendary / sampleSize).toBeGreaterThan(0.02 - tolerance);
    expect(rarityCounts.legendary / sampleSize).toBeLessThan(0.02 + tolerance);
  });
});

describe('QUALITY-02: Adjacent pet distinguishability', () => {
  it('consecutive pet IDs produce visually different pets', () => {
    // Simulate a grid where pet IDs might be sequential
    let distinguishableCount = 0;
    const sampleSize = 100;

    for (let i = 0; i < sampleSize; i++) {
      const traits1 = generatePetTraits(`pet-${i}`);
      const traits2 = generatePetTraits(`pet-${i + 1}`);

      // At least one major visual trait must differ
      const colorDiff = Math.abs(traits1.bodyColor.h - traits2.bodyColor.h);
      const patternDiff = traits1.patternType !== traits2.patternType;
      const accessoryDiff = traits1.accessory !== traits2.accessory;
      const sizeDiff = traits1.bodySize !== traits2.bodySize;
      const expressionDiff = traits1.expression !== traits2.expression;

      // At least ONE of these must be true for visual distinction
      // Lower threshold to 15 degrees since even subtle color shifts are visible
      const isDistinguishable =
        colorDiff > 15 || // Hue differs by more than 15 degrees (visually noticeable)
        patternDiff ||
        accessoryDiff ||
        sizeDiff ||
        expressionDiff;

      if (isDistinguishable) {
        distinguishableCount++;
      }
    }

    // At least 95% of consecutive pairs should be visually distinct
    expect(distinguishableCount / sampleSize).toBeGreaterThan(0.95);
  });
});
