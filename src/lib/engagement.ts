// US-022: Daily Engagement System Logic
import { prisma } from './prisma';

const DAILY_LOGIN_BONUS = 5; // Virtual currency
const STREAK_BONUS = 2; // Bonus per consecutive day

// Milestone rewards
const MILESTONE_REWARDS = {
  7: 50,   // 7-day streak
  30: 200, // 30-day streak
  100: 1000, // 100-day streak
};

interface DailyLoginResult {
  isFirstLoginToday: boolean;
  streakContinued: boolean;
  streakBroken: boolean;
  currentStreak: number;
  longestStreak: number;
  currencyEarned: number;
  totalCurrency: number;
  milestoneReached?: number;
  milestoneReward?: number;
}

/**
 * Process daily login for a user
 * Updates streak, grants daily bonus, checks milestones
 */
export async function processDailyLogin(userId: string): Promise<DailyLoginResult> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get or create user engagement record
  let engagement = await prisma.userEngagement.findUnique({
    where: { userId },
  });

  if (!engagement) {
    // First time user - create engagement record
    engagement = await prisma.userEngagement.create({
      data: {
        userId,
        lastLoginDate: now,
        currentStreak: 1,
        longestStreak: 1,
        totalLogins: 1,
        virtualCurrency: DAILY_LOGIN_BONUS,
      },
    });

    return {
      isFirstLoginToday: true,
      streakContinued: true,
      streakBroken: false,
      currentStreak: 1,
      longestStreak: 1,
      currencyEarned: DAILY_LOGIN_BONUS,
      totalCurrency: DAILY_LOGIN_BONUS,
    };
  }

  // Check if user already logged in today
  const lastLoginDate = new Date(engagement.lastLoginDate);
  const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());

  if (lastLoginDay.getTime() === today.getTime()) {
    // Already logged in today, no bonus
    return {
      isFirstLoginToday: false,
      streakContinued: false,
      streakBroken: false,
      currentStreak: engagement.currentStreak,
      longestStreak: engagement.longestStreak,
      currencyEarned: 0,
      totalCurrency: engagement.virtualCurrency,
    };
  }

  // Calculate if streak continues (yesterday) or breaks
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const streakContinued = lastLoginDay.getTime() === yesterday.getTime();
  const streakBroken = !streakContinued;

  // Update streak
  const newStreak = streakContinued ? engagement.currentStreak + 1 : 1;
  const newLongestStreak = Math.max(engagement.longestStreak, newStreak);

  // Calculate currency earned
  let currencyEarned = DAILY_LOGIN_BONUS;
  if (streakContinued) {
    currencyEarned += STREAK_BONUS;
  }

  // Check for milestone rewards
  let milestoneReached: number | undefined;
  let milestoneReward: number | undefined;

  if (newStreak === 7 && !engagement.milestone7Days) {
    milestoneReached = 7;
    milestoneReward = MILESTONE_REWARDS[7];
    currencyEarned += milestoneReward;
  } else if (newStreak === 30 && !engagement.milestone30Days) {
    milestoneReached = 30;
    milestoneReward = MILESTONE_REWARDS[30];
    currencyEarned += milestoneReward;
  } else if (newStreak === 100 && !engagement.milestone100Days) {
    milestoneReached = 100;
    milestoneReward = MILESTONE_REWARDS[100];
    currencyEarned += milestoneReward;
  }

  // Update engagement record
  const updatedEngagement = await prisma.userEngagement.update({
    where: { userId },
    data: {
      lastLoginDate: now,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalLogins: engagement.totalLogins + 1,
      virtualCurrency: engagement.virtualCurrency + currencyEarned,
      milestone7Days: engagement.milestone7Days || milestoneReached === 7,
      milestone30Days: engagement.milestone30Days || milestoneReached === 30,
      milestone100Days: engagement.milestone100Days || milestoneReached === 100,
    },
  });

  return {
    isFirstLoginToday: true,
    streakContinued,
    streakBroken,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    currencyEarned,
    totalCurrency: updatedEngagement.virtualCurrency,
    milestoneReached,
    milestoneReward,
  };
}

/**
 * Get user's engagement statistics
 */
export async function getUserEngagement(userId: string) {
  return await prisma.userEngagement.findUnique({
    where: { userId },
  });
}

/**
 * Assign a daily challenge to a user
 * Returns the challenge if successfully assigned, null if already assigned today
 */
export async function assignDailyChallenge(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if user already has a challenge for today
  const existingChallenge = await prisma.userChallenge.findFirst({
    where: {
      userId,
      assignedDate: {
        gte: today,
      },
    },
    include: {
      challenge: true,
    },
  });

  if (existingChallenge) {
    return existingChallenge;
  }

  // Get all active challenges
  const activeChallenges = await prisma.dailyChallenge.findMany({
    where: { active: true },
  });

  if (activeChallenges.length === 0) {
    return null;
  }

  // Randomly select a challenge
  const randomChallenge = activeChallenges[Math.floor(Math.random() * activeChallenges.length)];

  // Assign challenge to user
  const userChallenge = await prisma.userChallenge.create({
    data: {
      userId,
      challengeId: randomChallenge.id,
      assignedDate: new Date(),
    },
    include: {
      challenge: true,
    },
  });

  return userChallenge;
}

/**
 * Get user's daily challenge for today
 */
export async function getTodayChallenge(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.userChallenge.findFirst({
    where: {
      userId,
      assignedDate: {
        gte: today,
      },
    },
    include: {
      challenge: true,
    },
  });
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeType: string,
  incrementBy: number = 1
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's challenge matching the type
  const userChallenge = await prisma.userChallenge.findFirst({
    where: {
      userId,
      assignedDate: {
        gte: today,
      },
      completed: false,
      challenge: {
        challengeType,
      },
    },
    include: {
      challenge: true,
    },
  });

  if (!userChallenge) {
    return null;
  }

  const newCount = userChallenge.currentCount + incrementBy;
  const isCompleted = newCount >= userChallenge.challenge.targetCount;

  // Update challenge progress
  const updated = await prisma.userChallenge.update({
    where: { id: userChallenge.id },
    data: {
      currentCount: newCount,
      completed: isCompleted,
      completedDate: isCompleted ? new Date() : null,
    },
    include: {
      challenge: true,
    },
  });

  // If completed, grant reward
  if (isCompleted) {
    await prisma.userEngagement.update({
      where: { userId },
      data: {
        virtualCurrency: {
          increment: userChallenge.challenge.reward,
        },
      },
    });
  }

  return {
    userChallenge: updated,
    completed: isCompleted,
    reward: isCompleted ? userChallenge.challenge.reward : 0,
  };
}

/**
 * Get all completed challenges for a user
 */
export async function getUserChallengeHistory(userId: string, limit: number = 10) {
  return await prisma.userChallenge.findMany({
    where: {
      userId,
      completed: true,
    },
    include: {
      challenge: true,
    },
    orderBy: {
      completedDate: 'desc',
    },
    take: limit,
  });
}
