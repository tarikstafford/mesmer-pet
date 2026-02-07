'use client';

/**
 * US-029: Onboarding Tutorial - Interactive Tutorial Component
 * Displays step-by-step tutorial overlay with progress tracking
 */

import { useState, useEffect } from 'react';
import { TUTORIAL_STEPS, TutorialProgress, TUTORIAL_REWARD } from '@/lib/tutorial';

interface TutorialOverlayProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({ userId, onComplete, onSkip }: TutorialOverlayProps) {
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/tutorial/progress', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);

        // Show reward if tutorial just completed
        if (data.progress.completed && data.progress.rewardGranted) {
          setShowReward(true);
          setTimeout(() => {
            setShowReward(false);
            onComplete();
          }, 5000); // Show reward for 5 seconds
        }
      }
    } catch (error) {
      console.error('Error fetching tutorial progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/tutorial/skip', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onSkip();
      }
    } catch (error) {
      console.error('Error skipping tutorial:', error);
    }
  };

  const getCurrentStepInfo = () => {
    if (!progress) return null;

    const currentStepNumber = progress.currentStep;
    if (currentStepNumber < 1 || currentStepNumber > 5) return null;

    return TUTORIAL_STEPS[currentStepNumber - 1];
  };

  const getCompletedStepsCount = () => {
    if (!progress) return 0;

    let count = 0;
    if (progress.stepCreatePet) count++;
    if (progress.stepFeed) count++;
    if (progress.stepChat) count++;
    if (progress.stepViewStats) count++;
    if (progress.stepLearnBreeding) count++;

    return count;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!progress || progress.completed || progress.skipped) {
    return null; // Don't show overlay if tutorial is done or skipped
  }

  const currentStep = getCurrentStepInfo();
  const completedCount = getCompletedStepsCount();
  const progressPercentage = (completedCount / 5) * 100;

  // Reward screen
  if (showReward) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 max-w-md text-center text-white shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4">Tutorial Complete!</h2>
          <p className="text-lg mb-6">{TUTORIAL_REWARD.message}</p>
          <div className="space-y-2">
            <div className="bg-white/20 rounded-lg p-4">
              <span className="text-2xl">💰</span>
              <span className="ml-2 text-xl font-semibold">
                +{TUTORIAL_REWARD.virtualCurrency} Coins
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Welcome Tutorial</h2>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white text-sm underline"
            >
              Skip Tutorial
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm mt-2 text-white/90">
            Step {completedCount + 1} of 5 • {Math.round(progressPercentage)}% Complete
          </p>
        </div>

        {/* Current Step */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{currentStep.icon}</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">{currentStep.title}</h3>
            <p className="text-gray-600 mb-4">{currentStep.description}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-purple-900 mb-2">What to do:</h4>
            <p className="text-purple-800">{currentStep.instructions}</p>
          </div>

          {/* Step checklist */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 mb-3">Tutorial Progress:</h4>
            {TUTORIAL_STEPS.map((step, index) => {
              const isComplete =
                (step.action === 'create_pet' && progress.stepCreatePet) ||
                (step.action === 'feed' && progress.stepFeed) ||
                (step.action === 'chat' && progress.stepChat) ||
                (step.action === 'view_stats' && progress.stepViewStats) ||
                (step.action === 'learn_breeding' && progress.stepLearnBreeding);

              const isCurrent = step.id === currentStep.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrent
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : isComplete
                      ? 'bg-green-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{step.icon}</span>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isComplete ? 'text-green-700' : isCurrent ? 'text-purple-700' : 'text-gray-600'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {isComplete && <span className="text-green-600 text-xl">✓</span>}
                  {isCurrent && <span className="text-purple-600 font-bold">→</span>}
                </div>
              );
            })}
          </div>

          {/* Reward preview */}
          <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">🎁 Completion Reward:</span> {TUTORIAL_REWARD.virtualCurrency} coins
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">Complete all steps to earn your reward!</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}
