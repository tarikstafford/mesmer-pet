// US-008: Pet Death Prevention and Recovery
// Handles Critical state management and recovery mechanics

export interface RecoveryResult {
  success: boolean;
  health: number;
  maxHealthPenalty: number;
  isCritical: boolean;
  message: string;
}

export const RECOVERY_HEALTH_RESTORE = 50;
export const RECOVERY_PENALTY_PERCENT = 10; // 10% max stat reduction per recovery
export const GRACE_PERIOD_HOURS = 24;

/**
 * Check if a pet should enter Critical state
 * @param health Current health value
 * @returns True if health is 0 or below
 */
export function shouldEnterCriticalState(health: number): boolean {
  return health <= 0;
}

/**
 * Check if pet is in grace period for slower stat degradation
 * @param neglectStartedAt When neglect period started
 * @returns True if within 24 hours of neglect start
 */
export function isInGracePeriod(neglectStartedAt: Date | null): boolean {
  if (!neglectStartedAt) return false;

  const now = new Date();
  const hoursElapsed = (now.getTime() - neglectStartedAt.getTime()) / (1000 * 60 * 60);
  return hoursElapsed < GRACE_PERIOD_HOURS;
}

/**
 * Apply recovery to a Critical pet
 * @param currentHealth Current health value (should be 0 or very low)
 * @param currentPenalty Current accumulated penalty
 * @returns Recovery result with updated stats
 */
export function applyRecovery(
  currentHealth: number,
  currentPenalty: number
): RecoveryResult {
  // Calculate new penalty (10% reduction, capped at 100)
  const newPenalty = Math.min(100, currentPenalty + RECOVERY_PENALTY_PERCENT);

  // Restore health to 50, accounting for penalty
  const effectiveMaxHealth = 100 - newPenalty;
  const restoredHealth = Math.min(RECOVERY_HEALTH_RESTORE, effectiveMaxHealth);

  return {
    success: true,
    health: restoredHealth,
    maxHealthPenalty: newPenalty,
    isCritical: false,
    message: `Pet recovered! Health restored to ${restoredHealth}. Max health reduced by ${RECOVERY_PENALTY_PERCENT}% (total penalty: ${newPenalty}%).`,
  };
}

/**
 * Check if user can use a recovery item on a pet
 * @param petIsCritical Whether the pet is in Critical state
 * @param userItemQuantity How many recovery items the user has
 * @returns Validation result
 */
export function canUseRecoveryItem(
  petIsCritical: boolean,
  userItemQuantity: number
): { allowed: boolean; reason?: string } {
  if (!petIsCritical) {
    return { allowed: false, reason: 'Pet is not in Critical state' };
  }

  if (userItemQuantity <= 0) {
    return { allowed: false, reason: 'No recovery items available' };
  }

  return { allowed: true };
}

/**
 * Calculate stat degradation rate with grace period
 * Slower degradation in the first 24 hours of neglect
 * @param baseRate Normal degradation rate
 * @param neglectStartedAt When neglect period started
 * @returns Adjusted degradation rate
 */
export function getAdjustedDegradationRate(
  baseRate: number,
  neglectStartedAt: Date | null
): number {
  if (isInGracePeriod(neglectStartedAt)) {
    // 50% slower degradation during grace period
    return baseRate * 0.5;
  }
  return baseRate;
}
