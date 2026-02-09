import type { HSLColor } from './types';

export interface ColorConstraints {
  hueRange: [number, number];
  satRange: [number, number];
  lightRange: [number, number];
}

/**
 * Generate a harmonized HSL color within specified constraints
 * Prevents muddy, clashing, or unpleasant color combinations
 *
 * @param rng - Seeded random number generator (0-1)
 * @param constraints - HSL range constraints
 * @returns HSL color object
 */
export function generateHarmonizedColor(
  rng: () => number,
  constraints: ColorConstraints
): HSLColor {
  const [hMin, hMax] = constraints.hueRange;
  const [sMin, sMax] = constraints.satRange;
  const [lMin, lMax] = constraints.lightRange;

  return {
    h: hMin + rng() * (hMax - hMin),
    s: sMin + rng() * (sMax - sMin),
    l: lMin + rng() * (lMax - lMin)
  };
}

/**
 * Generate a complementary color (opposite on color wheel)
 * Adds variance to avoid exact opposites which can clash
 *
 * @param baseColor - Base HSL color
 * @param rng - Seeded random number generator
 * @returns Complementary HSL color
 */
export function generateComplementaryColor(
  baseColor: HSLColor,
  rng: () => number
): HSLColor {
  // Complementary: rotate hue by ~180° with ±15° variance
  const hueVariance = (rng() - 0.5) * 30;

  return {
    h: (baseColor.h + 180 + hueVariance) % 360,
    s: Math.max(50, Math.min(90, baseColor.s + (rng() - 0.5) * 20)),
    l: Math.max(25, Math.min(75, baseColor.l + (rng() - 0.5) * 20))
  };
}

/**
 * Convert HSL color object to CSS hsl() string
 *
 * @param color - HSL color object
 * @returns CSS hsl string like "hsl(120, 70%, 50%)"
 */
export function hslToString(color: HSLColor): string {
  return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
}

/**
 * Validate that color combinations are aesthetically pleasing
 * Rejects muddy colors (low saturation + mid lightness)
 * Rejects extreme contrast (very dark + very light together)
 *
 * @param colors - Array of HSL colors to validate
 * @returns true if colors harmonize, false if muddy or clashing
 */
export function validateColorHarmony(colors: HSLColor[]): boolean {
  // Check for muddy colors (low saturation + mid lightness)
  const hasMuddy = colors.some(c => c.s < 30 && c.l > 40 && c.l < 60);
  if (hasMuddy) return false;

  // Check for excessive contrast (very dark + very light)
  const lights = colors.filter(c => c.l > 75);
  const darks = colors.filter(c => c.l < 25);
  if (lights.length > 0 && darks.length > 0) return false;

  return true;
}
