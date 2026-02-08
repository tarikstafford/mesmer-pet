/**
 * US-TEST-008: Test chat API endpoints
 * Tests for POST /api/chat and chat functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as chatPost } from '@/app/api/chat/route';
import { prisma } from '@/lib/prisma';

// Hoist the mock function
const mockCreate = vi.hoisted(() => vi.fn());

// Mock OpenAI
vi.mock('openai', () => {
  return {
    OpenAI: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

// Mock encryption (to avoid needing real encryption keys in tests)
vi.mock('@/lib/encryption', () => ({
  encrypt: (text: string) => `encrypted_${text}`,
  decrypt: (text: string) => text.replace('encrypted_', ''),
}));

// Mock performance monitor
vi.mock('@/lib/performanceMonitor', () => ({
  monitorLLMRequest: vi.fn(async (userId, petId, model, fn) => await fn()),
}));

// Mock error logger
vi.mock('@/lib/errorLogger', () => ({
  logLLMFailure: vi.fn(),
  logError: vi.fn(),
}));

// Mock engagement system
vi.mock('@/lib/engagement', () => ({
  updateChallengeProgress: vi.fn().mockResolvedValue(undefined),
}));

// Mock sync system
vi.mock('@/lib/sync', () => ({
  updateSyncState: vi.fn().mockResolvedValue(undefined),
}));

// Mock skill prompts
vi.mock('@/lib/skillPrompts', () => ({
  generateSkillPrompts: vi.fn(() => ''),
  hasChessSkill: vi.fn(() => false),
}));

// Mock chess
vi.mock('@/lib/chess', () => ({
  FENToGame: vi.fn(),
  boardToASCII: vi.fn(),
}));

// Mock NextRequest
class MockNextRequest {
  private body: any;

  constructor(body: any) {
    this.body = body;
  }

  async json() {
    return this.body;
  }
}

describe('Chat API Endpoints', () => {
  let testUserId: string;
  let testPetId: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.interaction.deleteMany({});
    await prisma.memorySummary.deleteMany({});
    await prisma.petTrait.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.trait.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'chatuser@example.com',
        password: 'hashedpassword',
        name: 'Chat User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUserId = user.id;

    // Create test pet with personality traits
    const pet = await prisma.pet.create({
      data: {
        name: 'Buddy',
        userId: testUserId,
        happiness: 80,
        health: 90,
        energy: 70,
        friendliness: 75,
        energyTrait: 60,
        curiosity: 80,
        patience: 50,
        playfulness: 70,
        generation: 1,
        isCritical: false,
      },
    });
    testPetId = pet.id;

    // Reset mock
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Hello! How can I help you today? 🐾',
          },
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.interaction.deleteMany({});
    await prisma.memorySummary.deleteMany({});
    await prisma.petTrait.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.pet.deleteMany({});
    await prisma.trait.deleteMany({});
    await prisma.user.deleteMany({});
    vi.clearAllMocks();
  });

  describe('POST /api/chat', () => {
    it('should successfully generate AI response and save to memory', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello Buddy!',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello! How can I help you today? 🐾');
      expect(data.petName).toBe('Buddy');
      expect(data.responseTime).toBeGreaterThanOrEqual(0);

      // Verify OpenAI was called
      expect(mockCreate).toHaveBeenCalledOnce();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toBe('Hello Buddy!');

      // Verify both messages stored in database
      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
        orderBy: { createdAt: 'asc' },
      });

      expect(interactions).toHaveLength(2);
      // Messages are encrypted, so check the encrypted format
      expect(interactions[0].message).toBe('encrypted_Hello Buddy!');
      expect(interactions[0].role).toBe('user');
      expect(interactions[1].message).toBe('encrypted_Hello! How can I help you today? 🐾');
      expect(interactions[1].role).toBe('assistant');

      // Verify pet lastInteractionAt was updated
      const updatedPet = await prisma.pet.findUnique({
        where: { id: testPetId },
      });
      expect(updatedPet?.lastInteractionAt).not.toBeNull();
    });

    it('should return 400 when missing required fields', async () => {
      const testCases = [
        { userId: testUserId, message: 'test' }, // missing petId
        { petId: testPetId, message: 'test' },   // missing userId
        { petId: testPetId, userId: testUserId }, // missing message
      ];

      for (const body of testCases) {
        const request = new MockNextRequest(body);
        const response = await chatPost(request as any);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Missing required fields');
      }
    });

    it('should return 404 when pet not found', async () => {
      const request = new MockNextRequest({
        petId: 'nonexistent-pet-id',
        userId: testUserId,
        message: 'Hello',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Pet not found');
    });

    it('should return 403 when user does not own the pet', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          password: 'hashedpassword',
          name: 'Other User',
          dateOfBirth: new Date('2000-01-01'),
        },
      });

      const request = new MockNextRequest({
        petId: testPetId,
        userId: otherUser.id,
        message: 'Hello',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 400 when pet is in critical state', async () => {
      // Update pet to critical state
      await prisma.pet.update({
        where: { id: testPetId },
        data: { isCritical: true },
      });

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('too weak to chat');
      expect(data.fallback).toBe(true);
    });

    it('should include personality traits in system prompt', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'What are you like?',
      });

      await chatPost(request as any);

      expect(mockCreate).toHaveBeenCalledOnce();
      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;

      // Check that personality prompt is included
      expect(systemPrompt).toContain('Buddy');
      expect(systemPrompt).toContain('personality');
      expect(systemPrompt).toContain('Guidelines:');
    });

    it('should include memory context in system prompt when available', async () => {
      // Create some prior interactions (encrypted)
      await prisma.interaction.create({
        data: {
          petId: testPetId,
          userId: testUserId,
          role: 'user',
          message: 'encrypted_My name is Alice',
          createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        },
      });

      await prisma.interaction.create({
        data: {
          petId: testPetId,
          userId: testUserId,
          role: 'assistant',
          message: 'encrypted_Nice to meet you, Alice!',
          createdAt: new Date(Date.now() - 1000 * 60 * 59), // 59 minutes ago
        },
      });

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Do you remember my name?',
      });

      await chatPost(request as any);

      expect(mockCreate).toHaveBeenCalledOnce();
      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;

      // Check that memory context is included
      expect(systemPrompt).toContain('Alice');
      expect(systemPrompt).toContain('Recent Interactions');
    });

    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI to throw an error
      mockCreate.mockRejectedValueOnce(new Error('OpenAI API Error'));

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      // Should still return 200 with fallback message
      expect(response.status).toBe(200);
      expect(data.message).toContain('distracted');

      // User message should still be saved
      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId, role: 'user' },
      });
      expect(interactions).toHaveLength(1);
    });

    it('should use correct OpenAI model and parameters', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Test message',
      });

      await chatPost(request as any);

      expect(mockCreate).toHaveBeenCalledOnce();
      const callArgs = mockCreate.mock.calls[0][0];

      expect(callArgs.model).toBe('gpt-4o-mini');
      expect(callArgs.max_tokens).toBe(200);
      expect(callArgs.temperature).toBe(0.8);
    });

    it('should limit stored interactions to last 50', async () => {
      // Create 50 existing interactions
      for (let i = 0; i < 50; i++) {
        await prisma.interaction.create({
          data: {
            petId: testPetId,
            userId: testUserId,
            role: i % 2 === 0 ? 'user' : 'assistant',
            message: `encrypted_Message ${i}`,
            createdAt: new Date(Date.now() - (51 - i) * 60000), // Spread over time
          },
        });
      }

      // Send a new chat message (which adds 2 more interactions: user + assistant)
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'New message',
      });

      await chatPost(request as any);

      // Should prune old interactions to maintain max 50
      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
      });

      expect(interactions.length).toBeLessThanOrEqual(50);
    });

    it('should handle empty OpenAI response gracefully', async () => {
      // Mock OpenAI to return empty response
      mockCreate.mockResolvedValueOnce({
        choices: [],
      });

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      const response = await chatPost(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('trouble thinking');
    });

    it('should store both user and assistant messages in correct order', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Test order',
      });

      await chatPost(request as any);

      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
        orderBy: { createdAt: 'asc' },
      });

      expect(interactions).toHaveLength(2);
      expect(interactions[0].role).toBe('user');
      expect(interactions[1].role).toBe('assistant');
      expect(interactions[0].createdAt.getTime()).toBeLessThan(
        interactions[1].createdAt.getTime()
      );
    });

    it('should include pet traits in context when pet has traits', async () => {
      // Create a trait
      const trait = await prisma.trait.create({
        data: {
          traitName: 'Fluffy',
          traitType: 'visual',
          rarity: 'common',
          description: 'Soft and fluffy fur',
        },
      });

      // Link trait to pet
      await prisma.petTrait.create({
        data: {
          petId: testPetId,
          traitId: trait.id,
          inheritanceSource: 'random',
        },
      });

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      await chatPost(request as any);

      // Pet should be fetched with traits included
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('Message Persistence', () => {
    it('should encrypt messages before storing', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Secret message',
      });

      await chatPost(request as any);

      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
        orderBy: { createdAt: 'asc' },
      });

      // Messages should be encrypted with our mock encryption
      // First is user message, second is assistant
      const userMessage = interactions.find((i) => i.role === 'user');
      const assistantMessage = interactions.find((i) => i.role === 'assistant');

      expect(userMessage?.message).toBe('encrypted_Secret message');
      expect(assistantMessage?.message).toBe('encrypted_Hello! How can I help you today? 🐾');
    });

    it('should associate interactions with correct petId and userId', async () => {
      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      await chatPost(request as any);

      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
      });

      expect(interactions.every((i) => i.petId === testPetId)).toBe(true);
      expect(interactions.every((i) => i.userId === testUserId)).toBe(true);
    });

    it('should set correct timestamps on interactions', async () => {
      const beforeTime = new Date();

      const request = new MockNextRequest({
        petId: testPetId,
        userId: testUserId,
        message: 'Hello',
      });

      await chatPost(request as any);

      const afterTime = new Date();

      const interactions = await prisma.interaction.findMany({
        where: { petId: testPetId },
      });

      for (const interaction of interactions) {
        expect(interaction.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(interaction.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });
});
