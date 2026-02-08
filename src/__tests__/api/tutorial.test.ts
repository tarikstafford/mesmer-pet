/**
 * US-TEST-010: Test tutorial/onboarding API
 * Tests for tutorial progress tracking, step completion, skip, and resume functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET as getProgress } from '@/app/api/tutorial/progress/route';
import { POST as updateStep } from '@/app/api/tutorial/update/route';
import { POST as skipTutorialEndpoint } from '@/app/api/tutorial/skip/route';
import { POST as resumeTutorialEndpoint } from '@/app/api/tutorial/resume/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { TUTORIAL_REWARD } from '@/lib/tutorial';

// Mock NextRequest with proper header handling
class MockNextRequest {
  private body: any;
  private headersMap: Map<string, string>;

  constructor(body: any, headers?: Record<string, string>) {
    this.body = body;
    this.headersMap = new Map(Object.entries(headers || {}));
  }

  async json() {
    return this.body;
  }

  get headers() {
    return {
      get: (key: string) => this.headersMap.get(key) || null,
    };
  }
}

describe('Tutorial API Endpoints', () => {
  let userId: string;
  let userToken: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.userTutorial.deleteMany({});
    await prisma.userEngagement.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    userId = user.id;
    userToken = generateToken({ userId: user.id, email: user.email });
  });

  afterEach(async () => {
    await prisma.userTutorial.deleteMany({});
    await prisma.userEngagement.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/tutorial/progress - Get tutorial state', () => {
    it('should initialize tutorial for new user', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await getProgress(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress).toMatchObject({
        userId,
        currentStep: 1,
        completed: false,
        skipped: false,
        stepCreatePet: false,
        stepFeed: false,
        stepChat: false,
        stepViewStats: false,
        stepLearnBreeding: false,
      });
    });

    it('should return existing tutorial progress', async () => {
      // Create tutorial progress manually
      await prisma.userTutorial.create({
        data: {
          userId,
          currentStep: 3,
          completed: false,
          skipped: false,
          rewardGranted: false,
          stepCreatePet: true,
          stepFeed: true,
          stepChat: false,
          stepViewStats: false,
          stepLearnBreeding: false,
        },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await getProgress(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.currentStep).toBe(3);
      expect(data.progress.stepCreatePet).toBe(true);
      expect(data.progress.stepFeed).toBe(true);
      expect(data.progress.stepChat).toBe(false);
    });

    it('should require authentication', async () => {
      const request = new MockNextRequest({}, {}) as any;

      const response = await getProgress(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing authorization header');
    });

    it('should reject invalid token', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: 'Bearer invalid-token' }
      ) as any;

      const response = await getProgress(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });
  });

  describe('POST /api/tutorial/update - Complete tutorial step', () => {
    beforeEach(async () => {
      // Initialize tutorial for user
      await prisma.userTutorial.create({
        data: {
          userId,
          currentStep: 1,
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
    });

    it('should complete create_pet step', async () => {
      const request = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.stepCreatePet).toBe(true);
      expect(data.progress.currentStep).toBe(2);
      expect(data.progress.completed).toBe(false);
    });

    it('should complete feed step', async () => {
      // Complete first step first
      await prisma.userTutorial.update({
        where: { userId },
        data: { stepCreatePet: true, currentStep: 2 },
      });

      const request = new MockNextRequest(
        { step: 'feed' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.stepFeed).toBe(true);
      expect(data.progress.currentStep).toBe(3);
    });

    it('should complete chat step', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: { stepCreatePet: true, stepFeed: true, currentStep: 3 },
      });

      const request = new MockNextRequest(
        { step: 'chat' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.stepChat).toBe(true);
      expect(data.progress.currentStep).toBe(4);
    });

    it('should complete view_stats step', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: true,
          stepFeed: true,
          stepChat: true,
          currentStep: 4,
        },
      });

      const request = new MockNextRequest(
        { step: 'view_stats' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.stepViewStats).toBe(true);
      expect(data.progress.currentStep).toBe(5);
    });

    it('should complete learn_breeding step and mark tutorial as completed', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: true,
          stepFeed: true,
          stepChat: true,
          stepViewStats: true,
          currentStep: 5,
        },
      });

      const request = new MockNextRequest(
        { step: 'learn_breeding' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.stepLearnBreeding).toBe(true);
      expect(data.progress.currentStep).toBe(6);
      expect(data.progress.completed).toBe(true);
      expect(data.progress.completedAt).toBeDefined();
    });

    it('should grant reward on tutorial completion', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: true,
          stepFeed: true,
          stepChat: true,
          stepViewStats: true,
          currentStep: 5,
        },
      });

      const request = new MockNextRequest(
        { step: 'learn_breeding' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      await updateStep(request);

      // Check that reward was granted
      const tutorial = await prisma.userTutorial.findUnique({
        where: { userId },
      });
      expect(tutorial?.rewardGranted).toBe(true);

      // Check that virtual currency was added
      const engagement = await prisma.userEngagement.findUnique({
        where: { userId },
      });
      expect(engagement?.virtualCurrency).toBe(TUTORIAL_REWARD.virtualCurrency);
    });

    it('should not grant reward twice', async () => {
      // Complete tutorial and grant reward
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: true,
          stepFeed: true,
          stepChat: true,
          stepViewStats: true,
          currentStep: 5,
        },
      });

      await prisma.userEngagement.create({
        data: {
          userId,
          virtualCurrency: 100,
          lastLoginDate: new Date(),
          currentStreak: 1,
          longestStreak: 1,
          totalLogins: 1,
        },
      });

      const request = new MockNextRequest(
        { step: 'learn_breeding' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      await updateStep(request);

      // Manually mark as rewarded and try to complete again
      await prisma.userTutorial.update({
        where: { userId },
        data: { rewardGranted: true },
      });

      // Try to complete another step (shouldn't do anything)
      const request2 = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      await updateStep(request2);

      const engagement = await prisma.userEngagement.findUnique({
        where: { userId },
      });

      // Should not have doubled the reward
      expect(engagement?.virtualCurrency).toBe(100 + TUTORIAL_REWARD.virtualCurrency);
    });

    it('should reject invalid step name', async () => {
      const request = new MockNextRequest(
        { step: 'invalid_step' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.issues).toBeDefined();
    });

    it('should require authentication', async () => {
      const request = new MockNextRequest({ step: 'create_pet' }, {}) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing authorization header');
    });

    it('should not update if tutorial already completed', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: true,
          stepFeed: true,
          stepChat: true,
          stepViewStats: true,
          stepLearnBreeding: true,
          completed: true,
          currentStep: 6,
        },
      });

      const request = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should return existing tutorial without changes
      expect(data.progress.completed).toBe(true);
    });

    it('should not update if tutorial was skipped', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: { skipped: true, currentStep: 6 },
      });

      const request = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should return existing tutorial without changes
      expect(data.progress.skipped).toBe(true);
      expect(data.progress.stepCreatePet).toBe(false);
    });
  });

  describe('POST /api/tutorial/skip - Skip tutorial', () => {
    beforeEach(async () => {
      // Initialize tutorial for user
      await prisma.userTutorial.create({
        data: {
          userId,
          currentStep: 2,
          completed: false,
          skipped: false,
          rewardGranted: false,
          stepCreatePet: true,
          stepFeed: false,
          stepChat: false,
          stepViewStats: false,
          stepLearnBreeding: false,
        },
      });
    });

    it('should skip tutorial successfully', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await skipTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.skipped).toBe(true);
      expect(data.progress.currentStep).toBe(6);
      expect(data.progress.completedAt).toBeDefined();
    });

    it('should require authentication', async () => {
      const request = new MockNextRequest({}, {}) as any;

      const response = await skipTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing authorization header');
    });
  });

  describe('POST /api/tutorial/resume - Resume skipped tutorial', () => {
    beforeEach(async () => {
      // Create skipped tutorial
      await prisma.userTutorial.create({
        data: {
          userId,
          currentStep: 6,
          completed: false,
          skipped: true,
          rewardGranted: false,
          stepCreatePet: true,
          stepFeed: true,
          stepChat: false,
          stepViewStats: false,
          stepLearnBreeding: false,
        },
      });
    });

    it('should resume tutorial from last completed step', async () => {
      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await resumeTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.skipped).toBe(false);
      expect(data.progress.currentStep).toBe(3); // Next step after feed
    });

    it('should resume from step 1 if no steps completed', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepCreatePet: false,
          stepFeed: false,
          stepChat: false,
          stepViewStats: false,
          stepLearnBreeding: false,
        },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await resumeTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.progress.currentStep).toBe(1);
    });

    it('should handle tutorial that was not skipped', async () => {
      await prisma.userTutorial.update({
        where: { userId },
        data: { skipped: false },
      });

      const request = new MockNextRequest(
        {},
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await resumeTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should return unchanged
      expect(data.progress.skipped).toBe(false);
    });

    it('should require authentication', async () => {
      const request = new MockNextRequest({}, {}) as any;

      const response = await resumeTutorialEndpoint(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing authorization header');
    });
  });

  describe('Tutorial progression edge cases', () => {
    beforeEach(async () => {
      await prisma.userTutorial.create({
        data: {
          userId,
          currentStep: 1,
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
    });

    it('should allow completing steps out of order', async () => {
      // Complete step 3 first
      const request = new MockNextRequest(
        { step: 'chat' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.stepChat).toBe(true);
      expect(data.progress.currentStep).toBe(4); // Jumps to step 4
    });

    it('should calculate correct current step when steps completed out of order', async () => {
      // Complete last step first
      await prisma.userTutorial.update({
        where: { userId },
        data: { stepLearnBreeding: true, currentStep: 6 },
      });

      // Then complete first step
      const request = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.stepCreatePet).toBe(true);
      expect(data.progress.currentStep).toBe(6); // Stays at 6 (max)
    });

    it('should mark completed when all steps done even if completed out of order', async () => {
      // Complete steps in reverse order
      await prisma.userTutorial.update({
        where: { userId },
        data: {
          stepLearnBreeding: true,
          stepViewStats: true,
          stepChat: true,
          stepFeed: true,
          currentStep: 5,
        },
      });

      const request = new MockNextRequest(
        { step: 'create_pet' },
        { authorization: `Bearer ${userToken}` }
      ) as any;

      const response = await updateStep(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.progress.completed).toBe(true);
      expect(data.progress.currentStep).toBe(6);
    });
  });
});
