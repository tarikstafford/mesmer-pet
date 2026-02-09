/**
 * HSL Color representation
 * H: Hue (0-360 degrees)
 * S: Saturation (0-100%)
 * L: Lightness (0-100%)
 */
export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Visual pattern types for pet body
 */
export type PatternType = 'none' | 'striped' | 'spotted' | 'gradient';

/**
 * Accessory types that can be added to pets
 */
export type AccessoryType = 'none' | 'horns' | 'wings' | 'crown' | 'collar';

/**
 * Pet body size variants
 */
export type BodySize = 'small' | 'medium' | 'large';

/**
 * Pet facial expressions
 */
export type ExpressionType = 'happy' | 'neutral' | 'curious' | 'mischievous' | 'sleepy';

/**
 * Rarity tier for trait distribution
 */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Complete pet visual traits
 * Generated deterministically from pet ID using seeded PRNG
 */
export interface PetTraits {
  bodyColor: HSLColor;
  patternType: PatternType;
  patternColor?: HSLColor;
  accessory: AccessoryType;
  bodySize: BodySize;
  expression: ExpressionType;
  rarity: RarityTier;
  traitVersion: number; // For future schema evolution
}
