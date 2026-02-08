import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as listSkillsGET } from '@/app/api/admin/skills/list/route';
import { POST as createSkillPOST } from '@/app/api/admin/skills/create/route';
import { PATCH as updateSkillPATCH } from '@/app/api/admin/skills/update/route';
import { PATCH as toggleSkillPATCH } from '@/app/api/admin/skills/toggle/route';
import { GET as analyticsGET } from '@/app/api/admin/analytics/skills/route';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

// Mock NextRequest with headers support
class MockNextRequest {
  private body: any;
  private headersMap: Map<string, string>;

  constructor(body: any, headers: Record<string, string> = {}) {
    this.body = body;
    this.headersMap = new Map(Object.entries(headers));
  }

  async json() {
    return this.body;
  }

  get headers() {
    return {
      get: (key: string) => this.headersMap.get(key.toLowerCase()) || null,
    };
  }
}

describe('Admin API Endpoints', () => {
  let adminUserId: string;
  let adminToken: string;
  let regularUserId: string;
  let regularToken: string;
  let testSkillId: string;

  beforeEach(async () => {
    // Cleanup
    await prisma.userSkill.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: 'hashedpassword',
        name: 'Admin User',
        isAdmin: true,
      },
    });
    adminUserId = adminUser.id;
    adminToken = generateToken({ userId: adminUser.id, email: adminUser.email });

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Regular User',
        isAdmin: false,
      },
    });
    regularUserId = regularUser.id;
    regularToken = generateToken({ userId: regularUser.id, email: regularUser.email });

    // Create test skill
    const skill = await prisma.skill.create({
      data: {
        skillName: 'Math Basics',
        category: 'education',
        description: 'Learn basic math',
        price: 5.99,
        featured: true,
        active: true,
      },
    });
    testSkillId = skill.id;
  });

  afterEach(async () => {
    await prisma.userSkill.deleteMany({});
    await prisma.petSkill.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/admin/skills/list', () => {
    it('should return all skills for admin user', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skills).toBeDefined();
      expect(Array.isArray(data.skills)).toBe(true);
      expect(data.skills.length).toBeGreaterThan(0);
      expect(data.skills[0]).toHaveProperty('skillName');
      expect(data.skills[0]).toHaveProperty('_count');
    });

    it('should return 403 for non-admin user', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${regularToken}` }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should return 401 when no token provided', async () => {
      const mockRequest = new MockNextRequest({}, {}) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should return 401 with invalid token', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: 'Bearer invalidtoken123' }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should include both active and inactive skills', async () => {
      // Create inactive skill
      await prisma.skill.create({
        data: {
          skillName: 'Inactive Skill',
          category: 'games',
          description: 'This is inactive',
          price: 3.99,
          active: false,
        },
      });

      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const activeSkills = data.skills.filter((s: any) => s.active);
      const inactiveSkills = data.skills.filter((s: any) => !s.active);
      expect(activeSkills.length).toBeGreaterThan(0);
      expect(inactiveSkills.length).toBeGreaterThan(0);
    });

    it('should include purchase and activation counts', async () => {
      // Add a purchase
      await prisma.userSkill.create({
        data: {
          userId: regularUserId,
          skillId: testSkillId,
        },
      });

      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const skill = data.skills.find((s: any) => s.id === testSkillId);
      expect(skill._count.userSkills).toBe(1);
      expect(skill._count.petSkills).toBe(0);
    });
  });

  describe('POST /api/admin/skills/create', () => {
    it('should create new skill successfully', async () => {
      const newSkill = {
        skillName: 'Science Lab',
        category: 'education',
        description: 'Learn science through experiments',
        price: 7.99,
        featured: false,
        active: true,
      };

      const mockRequest = new MockNextRequest(newSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.skill).toBeDefined();
      expect(data.skill.skillName).toBe('Science Lab');
      expect(data.skill.category).toBe('education');
      expect(data.skill.price).toBe(7.99);

      // Verify in database
      const dbSkill = await prisma.skill.findUnique({
        where: { skillName: 'Science Lab' },
      });
      expect(dbSkill).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      const newSkill = {
        skillName: 'Test Skill',
        category: 'games',
        description: 'Test',
        price: 5.0,
      };

      const mockRequest = new MockNextRequest(newSkill, {
        authorization: `Bearer ${regularToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should reject duplicate skill name', async () => {
      const duplicateSkill = {
        skillName: 'Math Basics', // Already exists
        category: 'education',
        description: 'Duplicate',
        price: 5.99,
      };

      const mockRequest = new MockNextRequest(duplicateSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidSkill = {
        skillName: '', // Empty name
        category: 'education',
        description: 'Test',
        price: 5.0,
      };

      const mockRequest = new MockNextRequest(invalidSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
      expect(data.details).toBeDefined();
    });

    it('should validate category enum', async () => {
      const invalidSkill = {
        skillName: 'Test',
        category: 'invalid_category',
        description: 'Test',
        price: 5.0,
      };

      const mockRequest = new MockNextRequest(invalidSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should validate price range', async () => {
      const invalidSkill = {
        skillName: 'Test',
        category: 'education',
        description: 'Test',
        price: -5.0, // Negative price
      };

      const mockRequest = new MockNextRequest(invalidSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should set defaults for optional fields', async () => {
      const minimalSkill = {
        skillName: 'Minimal Skill',
        category: 'arts',
        description: 'Test',
        price: 3.99,
      };

      const mockRequest = new MockNextRequest(minimalSkill, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await createSkillPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.skill.featured).toBe(false);
      expect(data.skill.active).toBe(true);
      expect(data.skill.icon).toBeNull();
    });
  });

  describe('PATCH /api/admin/skills/update', () => {
    it('should update skill successfully', async () => {
      const updates = {
        skillId: testSkillId,
        skillName: 'Advanced Math',
        price: 9.99,
        featured: false,
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skill.skillName).toBe('Advanced Math');
      expect(data.skill.price).toBe(9.99);
      expect(data.skill.featured).toBe(false);

      // Verify in database
      const dbSkill = await prisma.skill.findUnique({
        where: { id: testSkillId },
      });
      expect(dbSkill?.skillName).toBe('Advanced Math');
    });

    it('should return 403 for non-admin user', async () => {
      const updates = {
        skillId: testSkillId,
        skillName: 'Hacked',
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${regularToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should return 404 for non-existent skill', async () => {
      const updates = {
        skillId: '00000000-0000-0000-0000-000000000000',
        skillName: 'Not Found',
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject duplicate skill name on update', async () => {
      // Create another skill
      await prisma.skill.create({
        data: {
          skillName: 'Physics 101',
          category: 'education',
          description: 'Physics',
          price: 6.99,
        },
      });

      const updates = {
        skillId: testSkillId,
        skillName: 'Physics 101', // Trying to rename to existing skill
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should allow updating to same name', async () => {
      const updates = {
        skillId: testSkillId,
        skillName: 'Math Basics', // Same name
        price: 6.99, // But different price
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skill.price).toBe(6.99);
    });

    it('should validate updated fields', async () => {
      const updates = {
        skillId: testSkillId,
        price: 150.0, // Exceeds max of 100
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });

    it('should update only provided fields', async () => {
      const originalSkill = await prisma.skill.findUnique({
        where: { id: testSkillId },
      });

      const updates = {
        skillId: testSkillId,
        price: 8.99, // Only update price
      };

      const mockRequest = new MockNextRequest(updates, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await updateSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skill.price).toBe(8.99);
      expect(data.skill.skillName).toBe(originalSkill?.skillName);
      expect(data.skill.category).toBe(originalSkill?.category);
    });
  });

  describe('PATCH /api/admin/skills/toggle', () => {
    it('should deactivate skill successfully', async () => {
      const toggleData = {
        skillId: testSkillId,
        active: false,
      };

      const mockRequest = new MockNextRequest(toggleData, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await toggleSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skill.active).toBe(false);
      expect(data.message).toContain('deactivated');

      // Verify in database
      const dbSkill = await prisma.skill.findUnique({
        where: { id: testSkillId },
      });
      expect(dbSkill?.active).toBe(false);
    });

    it('should activate skill successfully', async () => {
      // First deactivate
      await prisma.skill.update({
        where: { id: testSkillId },
        data: { active: false },
      });

      const toggleData = {
        skillId: testSkillId,
        active: true,
      };

      const mockRequest = new MockNextRequest(toggleData, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await toggleSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.skill.active).toBe(true);
      expect(data.message).toContain('activated');
    });

    it('should return 403 for non-admin user', async () => {
      const toggleData = {
        skillId: testSkillId,
        active: false,
      };

      const mockRequest = new MockNextRequest(toggleData, {
        authorization: `Bearer ${regularToken}`,
      }) as any;

      const response = await toggleSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should return 404 for non-existent skill', async () => {
      const toggleData = {
        skillId: '00000000-0000-0000-0000-000000000000',
        active: false,
      };

      const mockRequest = new MockNextRequest(toggleData, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await toggleSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        skillId: testSkillId,
        // Missing active field
      };

      const mockRequest = new MockNextRequest(invalidData, {
        authorization: `Bearer ${adminToken}`,
      }) as any;

      const response = await toggleSkillPATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation error');
    });
  });

  describe('GET /api/admin/analytics/skills', () => {
    beforeEach(async () => {
      // Create additional test data for analytics
      const skill2 = await prisma.skill.create({
        data: {
          skillName: 'Chess Master',
          category: 'games',
          description: 'Learn chess',
          price: 10.0,
          featured: false,
          active: true,
        },
      });

      // Add purchases
      await prisma.userSkill.create({
        data: {
          userId: regularUserId,
          skillId: testSkillId,
          purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      });

      await prisma.userSkill.create({
        data: {
          userId: adminUserId,
          skillId: skill2.id,
          purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      });
    });

    it('should return analytics for all skills', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analytics).toBeDefined();
      expect(Array.isArray(data.analytics)).toBe(true);
      expect(data.summary).toBeDefined();
    });

    it('should calculate total purchases correctly', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.totalPurchases).toBe(2);
    });

    it('should calculate total revenue correctly', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Math Basics (5.99) + Chess Master (10.0)
      expect(data.summary.totalRevenue).toBeCloseTo(15.99, 2);
    });

    it('should track purchases in last 7 days', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.purchasesLast7Days).toBe(2);
    });

    it('should track purchases in last 30 days', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summary.purchasesLast30Days).toBe(2);
    });

    it('should include per-skill analytics', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const skillAnalytics = data.analytics.find(
        (a: any) => a.skillId === testSkillId
      );
      expect(skillAnalytics).toBeDefined();
      expect(skillAnalytics.totalPurchases).toBe(1);
      expect(skillAnalytics.totalRevenue).toBeCloseTo(5.99, 2);
      expect(skillAnalytics.purchasesLast7Days).toBe(1);
    });

    it('should calculate activation rate', async () => {
      // Create a pet with a skill
      const pet = await prisma.pet.create({
        data: {
          name: 'Test Pet',
          userId: regularUserId,
          generation: 1,
        },
      });

      await prisma.petSkill.create({
        data: {
          petId: pet.id,
          skillId: testSkillId,
        },
      });

      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const skillAnalytics = data.analytics.find(
        (a: any) => a.skillId === testSkillId
      );
      // 1 activation / 1 purchase = 100%
      expect(skillAnalytics.activationRate).toBe(100);
    });

    it('should return 403 for non-admin user', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${regularToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Admin access required');
    });

    it('should handle skills with no purchases', async () => {
      // Create skill with no purchases
      await prisma.skill.create({
        data: {
          skillName: 'Unpopular Skill',
          category: 'sports',
          description: 'Nobody wants this',
          price: 1.0,
        },
      });

      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${adminToken}` }
      ) as any;

      const response = await analyticsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const unpopularSkill = data.analytics.find(
        (a: any) => a.skillName === 'Unpopular Skill'
      );
      expect(unpopularSkill.totalPurchases).toBe(0);
      expect(unpopularSkill.totalRevenue).toBe(0);
      expect(unpopularSkill.activationRate).toBe(0);
    });
  });

  describe('Admin authentication edge cases', () => {
    it('should reject malformed authorization header', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: 'InvalidFormat' }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should reject empty bearer token', async () => {
      const mockRequest = new MockNextRequest(
        {},
        { authorization: 'Bearer ' }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should reject request with deleted user token', async () => {
      const deletedUser = await prisma.user.create({
        data: {
          email: 'deleted@example.com',
          password: 'hashedpassword',
          name: 'Deleted User',
          isAdmin: true,
        },
      });

      const deletedToken = generateToken({
        userId: deletedUser.id,
        email: deletedUser.email,
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: deletedUser.id },
      });

      const mockRequest = new MockNextRequest(
        {},
        { authorization: `Bearer ${deletedToken}` }
      ) as any;

      const response = await listSkillsGET(mockRequest);
      const data = await response.json();

      // User not found returns 500 in current implementation
      expect(response.status).toBe(500);
      expect(data.error).toContain('User not found');
    });
  });
});
