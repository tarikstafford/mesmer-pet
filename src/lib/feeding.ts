/**
 * US-006: Feeding System
 * Logic for feeding pets with cooldown and stat updates
 */

import { prisma } from './prisma';

export const FEEDING_COOLDOWN_MINUTES = 60; // 1 hour cooldown
export const HUNGER_REDUCTION = 35; // Reduces hunger by 30-40 (using 35 as midpoint)
export const HAPPINESS_INCREASE = 7; // Increases happiness by 5-10 (using 7 as midpoint)

export interface FeedingResult {
  success: boolean;
  message: string;
  pet?: {
    id: string;
    hunger: number;
    happiness: number;
    health: number;
    lastFedAt: Date | null;
  };
  cooldownRemaining?: number; // minutes remaining
}

/**
 * Check if pet can be fed (cooldown check)
 */
export function canFeedPet(lastFedAt: Date | null): { canFeed: boolean; cooldownRemaining: number } {
  if (!lastFedAt) {
    return { canFeed: true, cooldownRemaining: 0 };
  }

  const now = new Date();
  const timeSinceLastFeed = (now.getTime() - lastFedAt.getTime()) / (1000 * 60); // minutes
  const cooldownRemaining = Math.max(0, FEEDING_COOLDOWN_MINUTES - timeSinceLastFeed);

  return {
    canFeed: timeSinceLastFeed >= FEEDING_COOLDOWN_MINUTES,
    cooldownRemaining: Math.ceil(cooldownRemaining),
  };
}

/**
 * Feed a pet and update stats
 */
export async function feedPet(petId: string, userId: string): Promise<FeedingResult> {
  // Fetch the pet
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      id: true,
      userId: true,
      hunger: true,
      happiness: true,
      health: true,
      lastFedAt: true,
    },
  });

  if (!pet) {
    return { success: false, message: 'Pet not found' };
  }

  // Verify ownership
  if (pet.userId !== userId) {
    return { success: false, message: 'You do not own this pet' };
  }

  // Check cooldown
  const { canFeed, cooldownRemaining } = canFeedPet(pet.lastFedAt);
  if (!canFeed) {
    return {
      success: false,
      message: `Pet was recently fed. Please wait ${cooldownRemaining} more minutes.`,
      cooldownRemaining,
    };
  }

  // Calculate new stats
  const newHunger = Math.max(0, pet.hunger - HUNGER_REDUCTION);
  const newHappiness = Math.min(100, pet.happiness + HAPPINESS_INCREASE);

  // Update pet
  const updatedPet = await prisma.pet.update({
    where: { id: petId },
    data: {
      hunger: newHunger,
      happiness: newHappiness,
      lastFedAt: new Date(),
      lastInteractionAt: new Date(),
    },
    select: {
      id: true,
      hunger: true,
      happiness: true,
      health: true,
      lastFedAt: true,
    },
  });

  return {
    success: true,
    message: 'Pet fed successfully!',
    pet: updatedPet,
  };
}
