'use client';

/**
 * US-022: Daily Engagement Panel
 * Displays daily login bonus, streak counter, and daily challenge
 */

import { useState, useEffect } from 'react';

interface EngagementStats {
  currentStreak: number;
  longestStreak: number;
  virtualCurrency: number;
  totalLogins: number;
  milestone7Days: boolean;
  milestone30Days: boolean;
  milestone100Days: boolean;
}

interface DailyChallenge {
  id: string;
  currentCount: number;
  completed: boolean;
  challenge: {
    challengeName: string;
    description: string;
    targetCount: number;
    reward: number;
    challengeType: string;
  };
}

interface LoginResult {
  isFirstLoginToday: boolean;
  currentStreak: number;
  currencyEarned: number;
  totalCurrency: number;
  milestoneReached?: number;
  milestoneReward?: number;
  streakContinued: boolean;
  streakBroken: boolean;
}

export default function EngagementPanel({ userId }: { userId: string }) {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    loadEngagementData();
  }, [userId]);

  const loadEngagementData = async () => {
    try {
      // Process daily login
      const loginRes = await fetch('/api/engagement/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const loginData = await loginRes.json();

      if (loginData.isFirstLoginToday) {
        setLoginResult(loginData);
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 5000);
      }

      // Load engagement stats
      const statsRes = await fetch(`/api/engagement/stats/${userId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load or assign today's challenge
      let challengeRes = await fetch(`/api/challenges/today/${userId}`);
      if (!challengeRes.ok) {
        // No challenge yet, assign one
        const assignRes = await fetch('/api/challenges/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (assignRes.ok) {
          challengeRes = await fetch(`/api/challenges/today/${userId}`);
        }
      }

      if (challengeRes.ok) {
        const challengeData = await challengeRes.json();
        setChallenge(challengeData);
      }
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshChallenge = async () => {
    try {
      const res = await fetch(`/api/challenges/today/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChallenge(data);
      }
    } catch (error) {
      console.error('Failed to refresh challenge:', error);
    }
  };

  // Refresh challenge every 10 seconds to show live progress
  useEffect(() => {
    if (challenge && !challenge.completed) {
      const interval = setInterval(refreshChallenge, 10000);
      return () => clearInterval(interval);
    }
  }, [challenge?.completed]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 text-white">
        <p>Loading engagement data...</p>
      </div>
    );
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'feed': return '🍖';
      case 'chat': return '💬';
      case 'health_check': return '🏥';
      case 'play_game': return '🎮';
      case 'breed': return '🧬';
      default: return '⭐';
    }
  };

  const getMilestoneProgress = () => {
    if (!stats) return null;
    const streak = stats.currentStreak;

    if (streak < 7) {
      return { next: 7, progress: (streak / 7) * 100, reward: 50 };
    } else if (streak < 30) {
      return { next: 30, progress: ((streak - 7) / (30 - 7)) * 100, reward: 200 };
    } else if (streak < 100) {
      return { next: 100, progress: ((streak - 30) / (100 - 30)) * 100, reward: 1000 };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Welcome Back / Daily Login Bonus */}
      {showWelcome && loginResult && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white shadow-lg animate-pulse">
          <h3 className="text-xl font-bold mb-2">
            {loginResult.milestoneReached
              ? `🎉 ${loginResult.milestoneReached}-Day Milestone!`
              : loginResult.streakContinued
              ? `🔥 ${loginResult.currentStreak}-Day Streak!`
              : '👋 Welcome Back!'}
          </h3>
          <p className="text-lg">
            +{loginResult.currencyEarned} coins earned!
            {loginResult.milestoneReached && (
              <span className="ml-2 font-bold">
                🏆 Milestone Reward: +{loginResult.milestoneReward}!
              </span>
            )}
          </p>
          {loginResult.streakBroken && loginResult.currentStreak === 1 && (
            <p className="text-sm mt-1 opacity-90">
              Your streak was broken, but you're starting fresh! 💪
            </p>
          )}
        </div>
      )}

      {/* Engagement Stats Panel */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Daily Engagement</h3>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats?.virtualCurrency || 0} 💰</div>
            <div className="text-sm opacity-90">Virtual Coins</div>
          </div>
        </div>

        {/* Streak Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-3xl font-bold">🔥 {stats?.currentStreak || 0}</div>
            <div className="text-sm opacity-90">Current Streak</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-3xl font-bold">🏆 {stats?.longestStreak || 0}</div>
            <div className="text-sm opacity-90">Best Streak</div>
          </div>
        </div>

        {/* Milestone Progress */}
        {getMilestoneProgress() && (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span>Next Milestone: {getMilestoneProgress()!.next} days</span>
              <span>+{getMilestoneProgress()!.reward} coins</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getMilestoneProgress()!.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestones Achieved */}
        <div className="flex gap-2 mt-4">
          <div className={`px-3 py-1 rounded-full text-sm ${stats?.milestone7Days ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}>
            ⭐ 7 Days
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${stats?.milestone30Days ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}>
            ⭐ 30 Days
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${stats?.milestone100Days ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}>
            ⭐ 100 Days
          </div>
        </div>
      </div>

      {/* Daily Challenge */}
      {challenge && (
        <div className={`rounded-lg p-6 shadow-lg ${
          challenge.completed
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {getChallengeIcon(challenge.challenge.challengeType)}
                {challenge.challenge.challengeName}
              </h3>
              <p className="text-sm opacity-90 mt-1">{challenge.challenge.description}</p>
            </div>
            {challenge.completed && (
              <div className="text-4xl">✅</div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress: {challenge.currentCount} / {challenge.challenge.targetCount}</span>
              <span>Reward: +{challenge.challenge.reward} coins</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  challenge.completed ? 'bg-white' : 'bg-yellow-400'
                }`}
                style={{
                  width: `${Math.min(100, (challenge.currentCount / challenge.challenge.targetCount) * 100)}%`
                }}
              />
            </div>
          </div>

          {challenge.completed ? (
            <p className="text-center font-bold text-lg">🎉 Challenge Completed!</p>
          ) : (
            <p className="text-sm opacity-90 text-center">
              Keep going! Complete this challenge to earn bonus coins.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
