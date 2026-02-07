// US-007: Health Warning System
// Handles warning generation and validation for pet health states

export type WarningType = 'hunger' | 'health' | 'critical';
export type WarningSeverity = 'warning' | 'critical';

export interface PetWarning {
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  timestamp: Date;
}

export interface PetHealthState {
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
}

/**
 * Check if pet needs warnings based on current stats
 * Returns array of active warnings
 */
export function checkPetWarnings(stats: PetHealthState): PetWarning[] {
  const warnings: PetWarning[] = [];
  const now = new Date();

  // Warning when Hunger > 80
  if (stats.hunger > 80) {
    warnings.push({
      type: 'hunger',
      severity: 'warning',
      message: 'Your pet is very hungry!',
      timestamp: now,
    });
  }

  // Critical warning when Health < 20
  if (stats.health < 20) {
    warnings.push({
      type: 'critical',
      severity: 'critical',
      message: 'CRITICAL: Your pet is in critical condition! Immediate care needed!',
      timestamp: now,
    });
  }
  // Warning when Health < 30
  else if (stats.health < 30) {
    warnings.push({
      type: 'health',
      severity: 'critical',
      message: 'Your pet is getting sick!',
      timestamp: now,
    });
  }

  return warnings;
}

/**
 * Check if pet should display sick appearance
 * Pet looks sick when Health < 40
 */
export function isPetSick(health: number): boolean {
  return health < 40;
}

/**
 * Get visual state for pet based on health
 * Returns 'healthy', 'sick', or 'critical'
 */
export function getPetVisualState(health: number): 'healthy' | 'sick' | 'critical' {
  if (health < 20) return 'critical';
  if (health < 40) return 'sick';
  return 'healthy';
}

/**
 * Determine if any warnings have cleared based on previous and current state
 * Returns true if stats have improved above warning thresholds
 */
export function hasWarningsCleared(
  previousStats: PetHealthState,
  currentStats: PetHealthState
): boolean {
  const previousWarnings = checkPetWarnings(previousStats);
  const currentWarnings = checkPetWarnings(currentStats);

  // Warnings cleared if we had warnings before but don't now
  return previousWarnings.length > 0 && currentWarnings.length === 0;
}

/**
 * Format warning message for display with appropriate styling
 */
export function formatWarningMessage(warning: PetWarning): {
  message: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  switch (warning.severity) {
    case 'critical':
      return {
        message: warning.message,
        color: 'text-red-900',
        bgColor: 'bg-red-100',
        icon: '🚨',
      };
    case 'warning':
      return {
        message: warning.message,
        color: 'text-yellow-900',
        bgColor: 'bg-yellow-100',
        icon: '⚠️',
      };
  }
}
