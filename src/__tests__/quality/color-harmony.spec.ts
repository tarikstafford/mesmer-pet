import { generatePetTraits } from '@/lib/traits/generation';
import { validateColorHarmony, hslToString } from '@/lib/traits/colorHarmony';
import { describe, it, expect } from 'vitest';
import type { HSLColor } from '@/lib/traits/types';

describe('QUALITY-01: Color combination harmony', () => {
  it('validates harmony across 1000+ random pet samples', () => {
    const sampleSize = 1500; // Exceeds 1000+ requirement
    const failures: string[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const petId = `quality-color-${i}`;
      const traits = generatePetTraits(petId);

      const colors: HSLColor[] = [traits.bodyColor];
      if (traits.patternColor) {
        colors.push(traits.patternColor);
      }

      const isValid = validateColorHarmony(colors);
      if (!isValid) {
        failures.push(
          `Pet ${petId}: ${colors.map(hslToString).join(' + ')} (rarity: ${traits.rarity})`
        );
      }
    }

    // Log failures for debugging if any exist
    if (failures.length > 0) {
      console.error(`Color harmony failures (${failures.length}/${sampleSize}):`);
      failures.forEach(f => console.error(`  ${f}`));
    }

    // QUALITY-01: Zero clashing colors across entire sample
    expect(failures).toHaveLength(0);
  });
});

describe('QUALITY-01: HSL constraint enforcement', () => {
  it('all body colors fall within saturation 50-90% and lightness 25-75%', () => {
    const sampleSize = 1000;
    const violations: string[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const petId = `quality-hsl-${i}`;
      const traits = generatePetTraits(petId);
      const c = traits.bodyColor;

      if (c.s < 50 || c.s > 90) {
        violations.push(`Pet ${petId}: saturation ${c.s.toFixed(1)}% out of range [50, 90]`);
      }
      if (c.l < 25 || c.l > 75) {
        violations.push(`Pet ${petId}: lightness ${c.l.toFixed(1)}% out of range [25, 75]`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('pattern colors maintain harmony with body colors', () => {
    const sampleSize = 1000;
    const petsWithPatterns: Array<{ petId: string; bodyColor: HSLColor; patternColor: HSLColor }> = [];

    for (let i = 0; i < sampleSize; i++) {
      const petId = `quality-pattern-${i}`;
      const traits = generatePetTraits(petId);

      if (traits.patternColor && traits.patternType !== 'none') {
        petsWithPatterns.push({
          petId,
          bodyColor: traits.bodyColor,
          patternColor: traits.patternColor
        });
      }
    }

    // Should have a significant number of patterned pets (most pets have patterns)
    expect(petsWithPatterns.length).toBeGreaterThan(100);

    // All pattern colors should pass harmony check with body color
    const failures = petsWithPatterns.filter(p =>
      !validateColorHarmony([p.bodyColor, p.patternColor])
    );

    expect(failures).toHaveLength(0);
  });
});

describe('QUALITY-01: No muddy or extreme colors', () => {
  it('no pet has muddy colors (low saturation + mid lightness)', () => {
    const sampleSize = 1000;

    for (let i = 0; i < sampleSize; i++) {
      const traits = generatePetTraits(`quality-muddy-${i}`);
      const c = traits.bodyColor;

      // Muddy = saturation < 30 AND lightness between 40-60
      const isMuddy = c.s < 30 && c.l > 40 && c.l < 60;
      expect(isMuddy).toBe(false);
    }
  });
});
