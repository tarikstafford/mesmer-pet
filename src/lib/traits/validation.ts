import { z } from 'zod';

/**
 * Zod schema for HSL color validation
 * Ensures all values are within valid ranges
 */
export const HSLColorSchema = z.object({
  h: z.number().min(0).max(360),
  s: z.number().min(0).max(100),
  l: z.number().min(0).max(100)
});

/**
 * Zod schema for complete pet traits
 * Used for runtime validation of trait data from database
 */
export const PetTraitsSchema = z.object({
  bodyColor: HSLColorSchema,
  patternType: z.enum(['none', 'striped', 'spotted', 'gradient']),
  patternColor: HSLColorSchema.optional(),
  accessory: z.enum(['none', 'horns', 'wings', 'crown', 'collar']),
  bodySize: z.enum(['small', 'medium', 'large']),
  expression: z.enum(['happy', 'neutral', 'curious', 'mischievous', 'sleepy']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  traitVersion: z.number().int().positive()
});

// Type inference from schema (for reference, but prefer manual types.ts interface)
export type PetTraitsInferred = z.infer<typeof PetTraitsSchema>;
