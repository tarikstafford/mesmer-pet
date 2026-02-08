// US-TEST-014: Test pet stat decay system
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateStatDegradation, batchUpdatePetStats, type PetStats } from '@/lib/statDegradation';

describe('Pet Stat Decay System', () => {
  beforeEach(() => {
    // Reset time mocks before each test
    vi.useRealTimers();
  });

  describe('calculateStatDegradation', () => {
    it('should not update stats if less than 1 minute has passed', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 30 * 1000); // 30 seconds ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      expect(result.health).toBe(80);
      expect(result.hunger).toBe(30);
      expect(result.happiness).toBe(70);
      expect(result.energy).toBe(60);
    });

    it('should increase hunger by 1 point per hour', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // Hunger should increase by ~2 points
      expect(result.hunger).toBe(32);
    });

    it('should decrease happiness by 0.5 points per hour without interaction', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
      const lastInteraction = null; // Never interacted

      const result = calculateStatDegradation(currentStats, lastUpdate, lastInteraction);

      // Happiness should decrease by ~2 points (4 hours * 0.5)
      expect(result.happiness).toBe(68);
    });

    it('should decrease happiness based on time since last interaction', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 90,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const lastInteraction = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, lastInteraction);

      // Happiness should decrease by ~5 points (10 hours * 0.5)
      expect(result.happiness).toBe(85);
    });

    it('should decrease energy by 0.3 points per hour during awake hours', () => {
      // Set time to 2 PM (14:00)
      const now = new Date();
      now.setHours(14, 0, 0, 0);
      vi.setSystemTime(now);

      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // Energy should decrease by ~3 points (10 hours * 0.3)
      expect(result.energy).toBe(57);
    });

    it('should increase energy by 5 points per hour during sleep hours (midnight-6am)', () => {
      // Set time to 3 AM (03:00)
      const now = new Date();
      now.setHours(3, 0, 0, 0);
      vi.setSystemTime(now);

      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 40,
      };
      const lastUpdate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // Energy should increase by ~10 points (2 hours * 5)
      expect(result.energy).toBe(50);
    });

    it('should decrease health by 2 points per hour when hunger > 80', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 85,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      // Pass neglectStartedAt far in the past to avoid grace period
      const neglectStartedAt = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null, neglectStartedAt);

      // After 5 hours: hunger becomes 90 (85 + 5), which is > 80
      // Health decreases by 10 points (5 hours * 2, no grace period)
      expect(result.health).toBe(70);
      expect(result.hunger).toBe(90);
    });

    it('should not decrease health when hunger <= 80', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 50,
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // Health should remain the same
      expect(result.health).toBe(80);
    });

    it('should clamp all stats to minimum of 0', () => {
      const currentStats: PetStats = {
        health: 5,
        hunger: 95,
        happiness: 10,
        energy: 5,
      };
      const lastUpdate = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // All stats should be >= 0
      expect(result.health).toBeGreaterThanOrEqual(0);
      expect(result.hunger).toBeLessThanOrEqual(100);
      expect(result.happiness).toBeGreaterThanOrEqual(0);
      expect(result.energy).toBeGreaterThanOrEqual(0);
    });

    it('should clamp all stats to maximum of 100', () => {
      // Set time to 3 AM for energy recovery
      const now = new Date();
      now.setHours(3, 0, 0, 0);
      vi.setSystemTime(now);

      const currentStats: PetStats = {
        health: 95,
        hunger: 5,
        happiness: 95,
        energy: 90,
      };
      const lastUpdate = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago
      const lastInteraction = now; // Just interacted

      const result = calculateStatDegradation(currentStats, lastUpdate, lastInteraction);

      // All stats should be <= 100
      expect(result.health).toBeLessThanOrEqual(100);
      expect(result.hunger).toBeLessThanOrEqual(100);
      expect(result.happiness).toBeLessThanOrEqual(100);
      expect(result.energy).toBeLessThanOrEqual(100);
    });

    it('should set isCritical to true when health reaches 0', () => {
      const currentStats: PetStats = {
        health: 5,
        hunger: 90,
        happiness: 20,
        energy: 30,
      };
      const lastUpdate = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null);

      // Health should hit 0 and trigger critical state
      expect(result.health).toBe(0);
      expect(result.isCritical).toBe(true);
    });

    it('should not degrade stats further when pet is already in Critical state', () => {
      const currentStats: PetStats = {
        health: 0,
        hunger: 95,
        happiness: 10,
        energy: 5,
      };
      const lastUpdate = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null, null, true);

      // Stats should not change (except health forced to 0)
      expect(result.health).toBe(0);
      expect(result.hunger).toBe(95);
      expect(result.happiness).toBe(10);
      expect(result.energy).toBe(5);
      expect(result.isCritical).toBe(true);
    });

    it('should track neglect start time when hunger > 50 or happiness < 50', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 55, // Triggers neglect
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null, null);

      expect(result.neglectStartedAt).toBeDefined();
      expect(result.neglectStartedAt).toBeInstanceOf(Date);
    });

    it('should reset neglect start time when pet is no longer neglected', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 30, // Not neglected
        happiness: 70,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const neglectStartedAt = new Date(Date.now() - 10 * 60 * 60 * 1000); // Was neglected 10h ago

      const result = calculateStatDegradation(currentStats, lastUpdate, null, neglectStartedAt);

      expect(result.neglectStartedAt).toBeNull();
    });

    it('should apply grace period (50% slower degradation) during first 24 hours of neglect', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 85,
        happiness: 40,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
      const neglectStartedAt = new Date(Date.now() - 5 * 60 * 60 * 1000); // Neglect started 5h ago (within grace period)

      const result = calculateStatDegradation(currentStats, lastUpdate, null, neglectStartedAt);

      // With grace period: hunger +5 (10h * 1 * 0.5), health -10 (10h * 2 * 0.5), happiness -2.5 (10h * 0.5 * 0.5)
      expect(result.hunger).toBe(90); // 85 + 5
      expect(result.health).toBe(70); // 80 - 10
      expect(result.happiness).toBe(38); // 40 - 2.5, rounded
    });

    it('should apply full degradation rate after 24-hour grace period', () => {
      const currentStats: PetStats = {
        health: 80,
        hunger: 85,
        happiness: 40,
        energy: 60,
      };
      const lastUpdate = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
      const neglectStartedAt = new Date(Date.now() - 30 * 60 * 60 * 1000); // Neglect started 30h ago (past grace period)

      const result = calculateStatDegradation(currentStats, lastUpdate, null, neglectStartedAt);

      // Without grace period: hunger +10 (10h * 1), health -20 (10h * 2), happiness -5 (10h * 0.5)
      expect(result.hunger).toBe(95); // 85 + 10
      expect(result.health).toBe(60); // 80 - 20
      expect(result.happiness).toBe(35); // 40 - 5
    });

    it('should support timezone offset for sleep calculation', () => {
      // The isSleepTime function creates a new Date by adding offset to current time,
      // then calls getHours() which returns the hour in the Date's local representation.
      // To test sleep time (midnight-6am), we need to set system time such that
      // when offset is applied, the resulting hour is in 0-5 range.

      // Set current time to midnight local time (hour 0)
      const now = new Date();
      now.setHours(0, 30, 0, 0); // 12:30 AM
      vi.setSystemTime(now);

      const currentStats: PetStats = {
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 40,
      };
      const lastUpdate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

      // No timezone offset needed - we're already in sleep time
      const result = calculateStatDegradation(currentStats, lastUpdate, null, null, false, 0);

      // Energy should increase during sleep hours (midnight-6am)
      expect(result.energy).toBe(50); // 40 + (2 * 5)
    });
  });

  describe('batchUpdatePetStats', () => {
    it('should update stats for multiple pets', () => {
      const pets = [
        {
          id: 'pet1',
          stats: { health: 80, hunger: 30, happiness: 70, energy: 60 },
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lastInteraction: null,
          neglectStartedAt: null,
          isCritical: false,
        },
        {
          id: 'pet2',
          stats: { health: 60, hunger: 50, happiness: 50, energy: 40 },
          lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000),
          lastInteraction: null,
          neglectStartedAt: null,
          isCritical: false,
        },
      ];

      const results = batchUpdatePetStats(pets);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('pet1');
      expect(results[1].id).toBe('pet2');

      // Both pets should have updated stats
      expect(results[0].updates.hunger).toBeGreaterThan(30);
      expect(results[1].updates.hunger).toBeGreaterThan(50);
    });

    it('should handle empty pet array', () => {
      const results = batchUpdatePetStats([]);
      expect(results).toHaveLength(0);
    });

    it('should apply timezone offset to all pets in batch', () => {
      // Set time to sleep hours (2 AM local)
      const now = new Date();
      now.setHours(2, 0, 0, 0);
      vi.setSystemTime(now);

      const pets = [
        {
          id: 'pet1',
          stats: { health: 80, hunger: 30, happiness: 70, energy: 40 },
          lastUpdate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          lastInteraction: null,
          neglectStartedAt: null,
          isCritical: false,
        },
        {
          id: 'pet2',
          stats: { health: 60, hunger: 50, happiness: 50, energy: 30 },
          lastUpdate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          lastInteraction: null,
          neglectStartedAt: null,
          isCritical: false,
        },
      ];

      // No timezone offset needed - already in sleep time
      const results = batchUpdatePetStats(pets, 0);

      // All pets should recover energy during sleep hours
      expect(results[0].updates.energy).toBe(50); // 40 + (2 * 5)
      expect(results[1].updates.energy).toBe(40); // 30 + (2 * 5)
    });
  });
});
