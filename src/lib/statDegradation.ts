// US-021: Stat Degradation System
// Handles automatic stat changes over time

export interface PetStats {
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
}

export interface StatUpdateResult {
  health: number;
  hunger: number;
  happiness: number;
  energy: number;
  lastStatUpdate: Date;
}

// Clamp value between 0 and 100
function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

// Check if current time is in sleep hours (midnight-6am in given timezone offset)
function isSleepTime(now: Date, timezoneOffset: number = 0): boolean {
  // Convert to user's local time (timezoneOffset in minutes)
  const localTime = new Date(now.getTime() + timezoneOffset * 60000);
  const hour = localTime.getHours();
  return hour >= 0 && hour < 6;
}

/**
 * Calculate stat degradation based on time elapsed
 * @param currentStats Current pet stats
 * @param lastUpdate Last time stats were updated
 * @param lastInteraction Last time user interacted with pet (for happiness)
 * @param timezoneOffset User's timezone offset in minutes (for sleep calculation)
 * @returns Updated stats
 */
export function calculateStatDegradation(
  currentStats: PetStats,
  lastUpdate: Date,
  lastInteraction: Date | null,
  timezoneOffset: number = 0
): StatUpdateResult {
  const now = new Date();
  const hoursElapsed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  // Don't update if less than a minute has passed (prevent excessive updates)
  if (hoursElapsed < 0.0167) { // ~1 minute
    return {
      ...currentStats,
      lastStatUpdate: now,
    };
  }

  let { health, hunger, happiness, energy } = currentStats;

  // 1. Hunger increases by 1 point per hour
  hunger = clamp(hunger + hoursElapsed * 1);

  // 2. Happiness decreases by 0.5 points per hour without interaction
  const hoursSinceInteraction = lastInteraction
    ? (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60)
    : hoursElapsed;
  happiness = clamp(happiness - hoursSinceInteraction * 0.5);

  // 3. Energy decreases by 0.3 points per hour, recovers during sleep (midnight-6am)
  if (isSleepTime(now, timezoneOffset)) {
    // During sleep: recover energy at 5 points per hour
    energy = clamp(energy + hoursElapsed * 5);
  } else {
    // Awake: energy decreases
    energy = clamp(energy - hoursElapsed * 0.3);
  }

  // 4. Health decreases by 2 points per hour if Hunger > 80
  if (hunger > 80) {
    health = clamp(health - hoursElapsed * 2);
  }

  return {
    health: Math.round(health),
    hunger: Math.round(hunger),
    happiness: Math.round(happiness),
    energy: Math.round(energy),
    lastStatUpdate: now,
  };
}

/**
 * Batch update stats for multiple pets
 * @param pets Array of pets with their current stats and last update time
 * @param timezoneOffset User's timezone offset in minutes
 * @returns Array of updated stats
 */
export function batchUpdatePetStats(
  pets: Array<{
    id: string;
    stats: PetStats;
    lastUpdate: Date;
    lastInteraction: Date | null;
  }>,
  timezoneOffset: number = 0
): Array<{ id: string; updates: StatUpdateResult }> {
  return pets.map((pet) => ({
    id: pet.id,
    updates: calculateStatDegradation(
      pet.stats,
      pet.lastUpdate,
      pet.lastInteraction,
      timezoneOffset
    ),
  }));
}
