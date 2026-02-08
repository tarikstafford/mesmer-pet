/**
 * US-TEST-007: Test marketplace API endpoints
 * Tests for skill marketplace GET, POST (checkout), and Stripe integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as getMarketplaceSkills } from '@/app/api/marketplace/skills/route';
import { POST as createCheckout } from '@/app/api/checkout/route';
import { prisma } from '@/lib/prisma';
import * as stripeLib from '@/lib/stripe';

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {},
    webhooks: {},
  },
  createCheckoutSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

// Mock NextRequest
class MockNextRequest {
  private body: any;
  public url: string;

  constructor(body: any = null, queryParams?: Record<string, string>) {
    this.body = body;
    const params = new URLSearchParams(queryParams || {});
    this.url = `http://localhost:3000/api/marketplace/skills${params.toString() ? '?' + params.toString() : ''}`;
  }

  async json() {
    return this.body;
  }
}

describe('Marketplace API Endpoints', () => {
  let testUserId: string;
  let testUser2Id: string;
  let testSkillId: string;
  let testSkill2Id: string;
  let testSkill3Id: string;

  beforeEach(async () => {
    // Clean up existing data
    await prisma.userSkill.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'buyer@example.com',
        password: 'hashedpassword',
        name: 'Buyer User',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUserId = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'buyer2@example.com',
        password: 'hashedpassword',
        name: 'Buyer User 2',
        dateOfBirth: new Date('2000-01-01'),
      },
    });
    testUser2Id = user2.id;

    // Create test skills
    const skill1 = await prisma.skill.create({
      data: {
        skillName: 'Chess Master',
        category: 'games',
        description: 'Teach your pet to play chess',
        price: 1.99,
        featured: true,
        icon: '♟️',
        active: true,
      },
    });
    testSkillId = skill1.id;

    const skill2 = await prisma.skill.create({
      data: {
        skillName: 'Math Genius',
        category: 'education',
        description: 'Advanced mathematics skills',
        price: 2.99,
        featured: false,
        icon: '🧮',
        active: true,
      },
    });
    testSkill2Id = skill2.id;

    const skill3 = await prisma.skill.create({
      data: {
        skillName: 'Painting',
        category: 'arts',
        description: 'Learn to paint beautiful pictures',
        price: 0.99,
        featured: false,
        icon: '🎨',
        active: true,
      },
    });
    testSkill3Id = skill3.id;

    // Create inactive skill (should not appear in marketplace)
    await prisma.skill.create({
      data: {
        skillName: 'Inactive Skill',
        category: 'sports',
        description: 'This skill is inactive',
        price: 5.99,
        featured: false,
        active: false,
      },
    });

    // User1 owns skill1
    await prisma.userSkill.create({
      data: {
        userId: testUserId,
        skillId: testSkillId,
      },
    });
  });

  afterEach(async () => {
    await prisma.userSkill.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.user.deleteMany({});
    vi.clearAllMocks();
  });

  describe('GET /api/marketplace/skills - List Skills', () => {
    it('should return all active skills without userId', async () => {
      const mockRequest = new MockNextRequest() as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(3); // Only active skills
      expect(data.total).toBe(3);
      expect(data.skills.every((s: any) => s.active)).toBe(true);
    });

    it('should mark owned skills when userId is provided', async () => {
      const mockRequest = new MockNextRequest(null, { userId: testUserId }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(3);

      const ownedSkill = data.skills.find((s: any) => s.id === testSkillId);
      expect(ownedSkill.owned).toBe(true);

      const notOwnedSkill = data.skills.find((s: any) => s.id === testSkill2Id);
      expect(notOwnedSkill.owned).toBe(false);
    });

    it('should filter by category', async () => {
      const mockRequest = new MockNextRequest(null, { category: 'education' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].category).toBe('education');
      expect(data.skills[0].skillName).toBe('Math Genius');
    });

    it('should filter by price range', async () => {
      const mockRequest = new MockNextRequest(null, { minPrice: '1.5', maxPrice: '2.5' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Chess Master');
      expect(data.skills[0].price).toBe(1.99);
    });

    it('should filter by minimum price only', async () => {
      const mockRequest = new MockNextRequest(null, { minPrice: '2' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Math Genius');
    });

    it('should filter by maximum price only', async () => {
      const mockRequest = new MockNextRequest(null, { maxPrice: '1' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Painting');
    });

    it('should search by skill name (case insensitive)', async () => {
      const mockRequest = new MockNextRequest(null, { search: 'chess master' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Chess Master');
    });

    it('should search by description (case insensitive)', async () => {
      const mockRequest = new MockNextRequest(null, { search: 'advanced mathematics' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Math Genius');
    });

    it('should filter featured skills only', async () => {
      const mockRequest = new MockNextRequest(null, { featured: 'true' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Chess Master');
      expect(data.skills[0].featured).toBe(true);
    });

    it('should return skills ordered by featured, price, then name', async () => {
      const mockRequest = new MockNextRequest() as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Featured first (Chess Master), then by price (Painting 0.99, Math Genius 2.99)
      expect(data.skills[0].skillName).toBe('Chess Master');
      expect(data.skills[1].skillName).toBe('Painting');
      expect(data.skills[2].skillName).toBe('Math Genius');
    });

    it('should combine multiple filters (category + price + search)', async () => {
      const mockRequest = new MockNextRequest(null, {
        category: 'education',
        minPrice: '2',
        search: 'math',
      }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].skillName).toBe('Math Genius');
    });

    it('should get single skill by skillId', async () => {
      const mockRequest = new MockNextRequest(null, { skillId: testSkillId }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.skills[0].id).toBe(testSkillId);
      expect(data.skills[0].skillName).toBe('Chess Master');
    });

    it('should return 404 for inactive skill by skillId', async () => {
      const inactiveSkill = await prisma.skill.findFirst({
        where: { active: false },
      });

      const mockRequest = new MockNextRequest(null, { skillId: inactiveSkill!.id }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Skill not found');
    });

    it('should return 404 for nonexistent skill by skillId', async () => {
      const mockRequest = new MockNextRequest(null, { skillId: 'nonexistent-id' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Skill not found');
    });

    it('should mark skill as owned when getting single skill with userId', async () => {
      const mockRequest = new MockNextRequest(null, {
        skillId: testSkillId,
        userId: testUserId,
      }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills[0].owned).toBe(true);
    });

    it('should return empty array when no skills match filters', async () => {
      const mockRequest = new MockNextRequest(null, { search: 'nonexistent-skill' }) as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toHaveLength(0);
      expect(data.total).toBe(0);
    });
  });

  describe('POST /api/checkout - Create Checkout Session', () => {
    it('should create checkout session with valid data', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      vi.mocked(stripeLib.createCheckoutSession).mockResolvedValue(mockSession as any);

      const mockRequest = new MockNextRequest({
        skillId: testSkill2Id,
        userId: testUser2Id, // User2 doesn't own this skill
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.url).toBe('https://checkout.stripe.com/test');

      // Verify createCheckoutSession was called with correct params
      expect(stripeLib.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          skillId: testSkill2Id,
          skillName: 'Math Genius',
          price: 2.99,
          userId: testUser2Id,
          userEmail: 'buyer2@example.com',
        })
      );
    });

    it('should return 400 if skillId is missing', async () => {
      const mockRequest = new MockNextRequest({
        userId: testUserId,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: skillId, userId');
    });

    it('should return 400 if userId is missing', async () => {
      const mockRequest = new MockNextRequest({
        skillId: testSkillId,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: skillId, userId');
    });

    it('should return 404 if skill not found', async () => {
      const mockRequest = new MockNextRequest({
        skillId: 'nonexistent-skill-id',
        userId: testUserId,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Skill not found');
    });

    it('should return 404 if user not found', async () => {
      const mockRequest = new MockNextRequest({
        skillId: testSkillId,
        userId: 'nonexistent-user-id',
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 400 if user already owns the skill', async () => {
      const mockRequest = new MockNextRequest({
        skillId: testSkillId, // User1 already owns this
        userId: testUserId,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('You already own this skill');
    });

    it('should handle Stripe errors gracefully', async () => {
      vi.mocked(stripeLib.createCheckoutSession).mockRejectedValue(
        new Error('Stripe API error')
      );

      const mockRequest = new MockNextRequest({
        skillId: testSkill2Id,
        userId: testUser2Id,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should include correct success and cancel URLs', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      vi.mocked(stripeLib.createCheckoutSession).mockResolvedValue(mockSession as any);

      const mockRequest = new MockNextRequest({
        skillId: testSkill2Id,
        userId: testUser2Id,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      await createCheckout(mockRequest);

      const callArgs = vi.mocked(stripeLib.createCheckoutSession).mock.calls[0][0];

      expect(callArgs.successUrl).toContain('/marketplace/success');
      expect(callArgs.cancelUrl).toContain('/marketplace');
      expect(callArgs.cancelUrl).toContain('canceled=true');
    });

    it('should pass skill metadata to Stripe session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };

      vi.mocked(stripeLib.createCheckoutSession).mockResolvedValue(mockSession as any);

      const mockRequest = new MockNextRequest({
        skillId: testSkill3Id,
        userId: testUser2Id,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      await createCheckout(mockRequest);

      expect(stripeLib.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          skillId: testSkill3Id,
          skillName: 'Painting',
          price: 0.99,
          userId: testUser2Id,
          userEmail: 'buyer2@example.com',
        })
      );
    });
  });

  describe('Marketplace - Integration Tests', () => {
    it('should not show inactive skills in marketplace listings', async () => {
      const mockRequest = new MockNextRequest() as any;

      const response = await getMarketplaceSkills(mockRequest);
      const data = await response.json();

      // Verify inactive skill is not in results
      const hasInactiveSkill = data.skills.some((s: any) => s.skillName === 'Inactive Skill');
      expect(hasInactiveSkill).toBe(false);
    });

    it('should correctly track ownership across multiple users', async () => {
      // User 1 owns Chess Master
      const user1Request = new MockNextRequest(null, { userId: testUserId }) as any;
      const user1Response = await getMarketplaceSkills(user1Request);
      const user1Data = await user1Response.json();

      const user1ChessSkill = user1Data.skills.find((s: any) => s.skillName === 'Chess Master');
      expect(user1ChessSkill.owned).toBe(true);

      // User 2 does not own Chess Master
      const user2Request = new MockNextRequest(null, { userId: testUser2Id }) as any;
      const user2Response = await getMarketplaceSkills(user2Request);
      const user2Data = await user2Response.json();

      const user2ChessSkill = user2Data.skills.find((s: any) => s.skillName === 'Chess Master');
      expect(user2ChessSkill.owned).toBe(false);
    });

    it('should prevent checkout for already owned skills', async () => {
      // Try to purchase a skill that user already owns
      const mockRequest = new MockNextRequest({
        skillId: testSkillId,
        userId: testUserId,
      }) as any;
      mockRequest.url = 'http://localhost:3000/api/checkout';

      const response = await createCheckout(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('You already own this skill');

      // Verify no Stripe session was created
      expect(stripeLib.createCheckoutSession).not.toHaveBeenCalled();
    });
  });
});
