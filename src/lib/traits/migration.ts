import { generatePetTraits } from '@/lib/traits/generation';
import { PetTraitsSchema } from '@/lib/traits/validation';
import type { PetTraits } from '@/lib/traits/types';

/**
 * Load and validate pet traits from database JSON field
 * Handles missing/malformed trait data by regenerating from pet ID
 *
 * This is the main entry point for loading traits from the database.
 * Never throws - always returns valid PetTraits.
 *
 * @param rawTraits - Raw JSON value from database traits column
 * @param petId - Pet ID used for regeneration if needed
 * @returns Validated PetTraits object
 */
export function loadTraits(rawTraits: unknown, petId: string): PetTraits {
  // Handle null/undefined (legacy pet without traits)
  if (rawTraits == null) {
    console.warn(`[traits] Missing traits for pet ${petId}, regenerating`);
    return generatePetTraits(petId);
  }

  // Handle non-object values (corrupted data)
  if (typeof rawTraits !== 'object') {
    console.warn(`[traits] Invalid traits type for pet ${petId} (got ${typeof rawTraits}), regenerating`);
    return generatePetTraits(petId);
  }

  // Delegate to version-aware migration
  return migrateTraits(rawTraits as Record<string, unknown>, petId);
}

/**
 * Migrate trait data from any version to current version
 * Validates trait schema and handles version upgrades
 *
 * Future version migrations should be added here:
 * - Check traitVersion field
 * - Apply transformations to upgrade older versions
 * - Validate with current schema
 *
 * Never throws - always returns valid PetTraits.
 *
 * @param traits - Trait object with unknown version
 * @param petId - Pet ID used for regeneration if validation fails
 * @returns Validated PetTraits object
 */
export function migrateTraits(traits: Record<string, unknown>, petId: string): PetTraits {
  const version = traits.traitVersion;

  // Handle missing or unknown version
  if (typeof version !== 'number') {
    console.warn(`[traits] Missing traitVersion for pet ${petId}, regenerating`);
    return generatePetTraits(petId);
  }

  // Future: if traitVersion === 2, migrate v2 -> v1 schema before validation

  // Handle version 1 (current version)
  if (version === 1) {
    const result = PetTraitsSchema.safeParse(traits);

    if (result.success) {
      return result.data;
    }

    // Validation failed - log errors and regenerate
    console.warn(`[traits] Invalid v1 traits for pet ${petId}: ${JSON.stringify(result.error.issues)}, regenerating`);
    return generatePetTraits(petId);
  }

  // Unknown future version - regenerate
  console.warn(`[traits] Unknown traitVersion ${version} for pet ${petId}, regenerating`);
  return generatePetTraits(petId);
}
