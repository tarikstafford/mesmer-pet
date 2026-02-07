/**
 * US-029: Onboarding Tutorial
 * Tutorial step logic and progression management
 */

import { prisma } from './prisma';

export const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'Create Your Pet',
    description: 'Start your journey by creating your first virtual pet companion!',
    instructions: 'Click the "Create Pet" button to bring your pet to life.',
    action: 'create_pet',
    icon: '🐾',
  },
  {
    id: 2,
    title: 'Feed Your Pet',
    description: 'Keep your pet healthy and happy by feeding it regularly.',
    instructions: 'Click the "Feed Pet" button on your pet\'s card to reduce hunger.',
    action: 'feed',
    icon: '🍖',
  },
  {
    id: 3,
    title: 'Chat with Your Pet',
    description: 'Build a bond with your pet through conversation.',
    instructions: 'Click "Chat" to start talking with your AI-powered companion.',
    action: 'chat',
    icon: '💬',
  },
  {
    id: 4,
    title: 'View Pet Stats',
    description: 'Monitor your pet\'s health, hunger, happiness, and energy levels.',
    instructions: 'Notice the color-coded stat bars on your pet\'s card.',
    action: 'view_stats',
    icon: '📊',
  },
  {
    id: 5,
    title: 'Learn About Breeding',
    description: 'Discover how to create new pets with unique genetic traits.',
    instructions: 'Click "View Tutorial" to learn about the breeding system.',
    action: 'learn_breeding',
    icon: '🧬',
  },
];

export const TUTORIAL_REWARD = {
  virtualCurrency: 50,
  skillName: 'Basic Training', // Optional starter skill
  message: 'Tutorial completed! You earned 50 coins and unlocked Basic Training!',
};

export interface TutorialProgress {
  userId: string;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  stepCreatePet: boolean;
  stepFeed: boolean;
  stepChat: boolean;
  stepViewStats: boolean;
  stepLearnBreeding: boolean;
}

/**
 * Get user's tutorial progress
 */
export async function getTutorialProgress(userId: string): Promise<TutorialProgress | null> {
  const tutorial = await prisma.userTutorial.findUnique({
    where: { userId },
  });

  return tutorial;
}

/**
 * Initialize tutorial for a new user
 */
export async function initializeTutorial(userId: string) {
  const existing = await prisma.userTutorial.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return await prisma.userTutorial.create({
    data: {
      userId,
      currentStep: 1, // Start at step 1
      completed: false,
      skipped: false,
      rewardGranted: false,
      stepCreatePet: false,
      stepFeed: false,
      stepChat: false,
      stepViewStats: false,
      stepLearnBreeding: false,
    },
  });
}

/**
 * Update tutorial step progress
 */
export async function updateTutorialStep(
  userId: string,
  step: 'create_pet' | 'feed' | 'chat' | 'view_stats' | 'learn_breeding'
) {
  const tutorial = await prisma.userTutorial.findUnique({
    where: { userId },
  });

  if (!tutorial || tutorial.completed || tutorial.skipped) {
    return tutorial; // Don't update if already completed or skipped
  }

  // Map step to field name
  const stepFieldMap = {
    create_pet: 'stepCreatePet',
    feed: 'stepFeed',
    chat: 'stepChat',
    view_stats: 'stepViewStats',
    learn_breeding: 'stepLearnBreeding',
  };

  const stepField = stepFieldMap[step];

  // Map step to step number
  const stepNumberMap = {
    create_pet: 1,
    feed: 2,
    chat: 3,
    view_stats: 4,
    learn_breeding: 5,
  };

  const stepNumber = stepNumberMap[step];

  // Calculate next step
  const completedSteps = {
    stepCreatePet: step === 'create_pet' || tutorial.stepCreatePet,
    stepFeed: step === 'feed' || tutorial.stepFeed,
    stepChat: step === 'chat' || tutorial.stepChat,
    stepViewStats: step === 'view_stats' || tutorial.stepViewStats,
    stepLearnBreeding: step === 'learn_breeding' || tutorial.stepLearnBreeding,
  };

  const allStepsComplete =
    completedSteps.stepCreatePet &&
    completedSteps.stepFeed &&
    completedSteps.stepChat &&
    completedSteps.stepViewStats &&
    completedSteps.stepLearnBreeding;

  const nextStep = allStepsComplete ? 6 : Math.max(tutorial.currentStep, stepNumber + 1);

  const updated = await prisma.userTutorial.update({
    where: { userId },
    data: {
      [stepField]: true,
      currentStep: nextStep,
      completed: allStepsComplete,
      completedAt: allStepsComplete ? new Date() : undefined,
    },
  });

  // Grant reward if tutorial just completed
  if (allStepsComplete && !tutorial.rewardGranted) {
    await grantTutorialReward(userId);
  }

  return updated;
}

/**
 * Skip the tutorial
 */
export async function skipTutorial(userId: string) {
  return await prisma.userTutorial.update({
    where: { userId },
    data: {
      skipped: true,
      currentStep: 6, // Mark as finished
      completedAt: new Date(),
    },
  });
}

/**
 * Resume tutorial (unskip)
 */
export async function resumeTutorial(userId: string) {
  const tutorial = await prisma.userTutorial.findUnique({
    where: { userId },
  });

  if (!tutorial || !tutorial.skipped) {
    return tutorial;
  }

  // Calculate current step based on completed steps
  let currentStep = 1;
  if (tutorial.stepCreatePet) currentStep = 2;
  if (tutorial.stepFeed) currentStep = 3;
  if (tutorial.stepChat) currentStep = 4;
  if (tutorial.stepViewStats) currentStep = 5;
  if (tutorial.stepLearnBreeding) currentStep = 6;

  return await prisma.userTutorial.update({
    where: { userId },
    data: {
      skipped: false,
      currentStep,
    },
  });
}

/**
 * Grant tutorial completion reward
 */
export async function grantTutorialReward(userId: string) {
  // Update tutorial reward status
  await prisma.userTutorial.update({
    where: { userId },
    data: {
      rewardGranted: true,
    },
  });

  // Grant virtual currency
  const engagement = await prisma.userEngagement.findUnique({
    where: { userId },
  });

  if (engagement) {
    await prisma.userEngagement.update({
      where: { userId },
      data: {
        virtualCurrency: {
          increment: TUTORIAL_REWARD.virtualCurrency,
        },
      },
    });
  } else {
    // Create engagement record if it doesn't exist
    await prisma.userEngagement.create({
      data: {
        userId,
        virtualCurrency: TUTORIAL_REWARD.virtualCurrency,
        lastLoginDate: new Date(),
        currentStreak: 1,
        longestStreak: 1,
        totalLogins: 1,
      },
    });
  }

  return {
    success: true,
    reward: TUTORIAL_REWARD,
  };
}

/**
 * Get next incomplete step
 */
export function getNextStep(tutorial: TutorialProgress): number {
  if (tutorial.completed || tutorial.skipped) {
    return 6; // All done
  }

  if (!tutorial.stepCreatePet) return 1;
  if (!tutorial.stepFeed) return 2;
  if (!tutorial.stepChat) return 3;
  if (!tutorial.stepViewStats) return 4;
  if (!tutorial.stepLearnBreeding) return 5;

  return 6; // All complete
}

/**
 * Check if a specific step is complete
 */
export function isStepComplete(tutorial: TutorialProgress, stepNumber: number): boolean {
  switch (stepNumber) {
    case 1:
      return tutorial.stepCreatePet;
    case 2:
      return tutorial.stepFeed;
    case 3:
      return tutorial.stepChat;
    case 4:
      return tutorial.stepViewStats;
    case 5:
      return tutorial.stepLearnBreeding;
    default:
      return false;
  }
}
