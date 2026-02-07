/**
 * US-017: Skill Activation and Storage
 * Utility functions for skill management and validation
 */

import { prisma } from './prisma';

const MAX_ACTIVE_SKILLS_PER_PET = 5;

/**
 * Check if a pet has reached the maximum number of active skills
 * @param petId - The ID of the pet
 * @returns True if pet can add more skills, false if at limit
 */
export async function canAddSkillToPet(petId: string): Promise<boolean> {
  const activeSkillCount = await prisma.petSkill.count({
    where: { petId },
  });

  return activeSkillCount < MAX_ACTIVE_SKILLS_PER_PET;
}

/**
 * Get the current number of active skills for a pet
 * @param petId - The ID of the pet
 * @returns Number of active skills
 */
export async function getActiveSkillCount(petId: string): Promise<number> {
  return await prisma.petSkill.count({
    where: { petId },
  });
}

/**
 * Assign a skill to a pet (requires user to own the skill)
 * @param petId - The ID of the pet
 * @param skillId - The ID of the skill to assign
 * @param userId - The ID of the user (for validation)
 * @returns The created PetSkill or null if failed
 */
export async function assignSkillToPet(
  petId: string,
  skillId: string,
  userId: string
) {
  // Verify user owns the skill
  const userSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  if (!userSkill || !userSkill.active) {
    throw new Error('User does not own this skill or it is inactive');
  }

  // Verify user owns the pet
  const pet = await prisma.pet.findFirst({
    where: {
      id: petId,
      userId,
    },
  });

  if (!pet) {
    throw new Error('Pet not found or does not belong to user');
  }

  // Check if pet already has this skill
  const existingPetSkill = await prisma.petSkill.findUnique({
    where: {
      petId_skillId: {
        petId,
        skillId,
      },
    },
  });

  if (existingPetSkill) {
    throw new Error('Pet already has this skill');
  }

  // Check max skills limit
  const canAdd = await canAddSkillToPet(petId);
  if (!canAdd) {
    throw new Error(
      `Pet has reached the maximum of ${MAX_ACTIVE_SKILLS_PER_PET} active skills`
    );
  }

  // Assign skill to pet
  return await prisma.petSkill.create({
    data: {
      petId,
      skillId,
      proficiency: 0, // Start at 0
    },
    include: {
      skill: true,
    },
  });
}

/**
 * Remove a skill from a pet
 * @param petId - The ID of the pet
 * @param skillId - The ID of the skill to remove
 * @param userId - The ID of the user (for validation)
 */
export async function removeSkillFromPet(
  petId: string,
  skillId: string,
  userId: string
) {
  // Verify user owns the pet
  const pet = await prisma.pet.findFirst({
    where: {
      id: petId,
      userId,
    },
  });

  if (!pet) {
    throw new Error('Pet not found or does not belong to user');
  }

  // Remove the skill
  await prisma.petSkill.delete({
    where: {
      petId_skillId: {
        petId,
        skillId,
      },
    },
  });
}

/**
 * Get all skills assigned to a pet
 * @param petId - The ID of the pet
 * @returns Array of PetSkills with skill details
 */
export async function getPetSkills(petId: string) {
  return await prisma.petSkill.findMany({
    where: { petId },
    include: {
      skill: true,
    },
    orderBy: {
      activatedDate: 'desc',
    },
  });
}

/**
 * Get all skills owned by a user
 * @param userId - The ID of the user
 * @returns Array of UserSkills with skill details
 */
export async function getUserSkills(userId: string) {
  return await prisma.userSkill.findMany({
    where: {
      userId,
      active: true,
    },
    include: {
      skill: true,
    },
    orderBy: {
      purchaseDate: 'desc',
    },
  });
}
