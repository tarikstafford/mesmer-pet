/**
 * US-TEST-016: Test background jobs
 * Tests the background job system including stat updates and memory summarization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
const mockPrisma = {
  pet: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  warning: {
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

const mockCalculateStatDegradation = vi.fn();
const mockCheckPetWarnings = vi.fn();
const mockSummarizeAllPetMemories = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/statDegradation', () => ({
  calculateStatDegradation: mockCalculateStatDegradation,
}));

vi.mock('@/lib/warnings', () => ({
  checkPetWarnings: mockCheckPetWarnings,
}));

vi.mock('@/lib/memorySummarization', () => ({
  summarizeAllPetMemories: mockSummarizeAllPetMemories,
}));

describe('Background Jobs', () => {
  let module: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset module state
    vi.resetModules();
    module = await import('@/lib/backgroundJobs');
  });

  afterEach(() => {
    if (module && module.stopBackgroundJobs) {
      module.stopBackgroundJobs();
    }
  });

  describe('startBackgroundJobs', () => {
    it('should start the background job system', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.pet.findMany.mockResolvedValue([]);

      module.startBackgroundJobs();

      expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting background jobs...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Background jobs started (15-minute interval)');
      expect(consoleSpy).toHaveBeenCalledWith('🧠 Starting memory summarization job...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Memory summarization job started (daily at 2 AM)');
    });

    it('should not start jobs if already running', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.pet.findMany.mockResolvedValue([]);

      module.startBackgroundJobs();

      consoleSpy.mockClear();
      module.startBackgroundJobs();

      expect(consoleSpy).toHaveBeenCalledWith('⚠️  Background jobs already running');
    });
  });

  describe('stopBackgroundJobs', () => {
    it('should stop the background job system', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.pet.findMany.mockResolvedValue([]);

      module.startBackgroundJobs();

      // Wait for async job to start
      await new Promise(resolve => setTimeout(resolve, 10));

      consoleSpy.mockClear();
      module.stopBackgroundJobs();

      expect(consoleSpy).toHaveBeenCalledWith('🛑 Background jobs stopped');
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Memory summarization job stopped');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM signal', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.pet.findMany.mockResolvedValue([]);

      module.startBackgroundJobs();

      // Wait for async job to start
      await new Promise(resolve => setTimeout(resolve, 10));

      consoleSpy.mockClear();
      process.emit('SIGTERM');

      expect(consoleSpy).toHaveBeenCalledWith('🛑 Background jobs stopped');
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Memory summarization job stopped');
    });

    it('should handle SIGINT signal', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockPrisma.pet.findMany.mockResolvedValue([]);

      module.startBackgroundJobs();

      // Wait for async job to start
      await new Promise(resolve => setTimeout(resolve, 10));

      consoleSpy.mockClear();
      process.emit('SIGINT');

      expect(consoleSpy).toHaveBeenCalledWith('🛑 Background jobs stopped');
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Memory summarization job stopped');
    });
  });
});

/**
 * Test the stat update job logic by testing the API endpoint directly
 * This ensures the business logic works correctly without dealing with timing/scheduling
 */
describe('Stat Update API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update stats for all pets when called', async () => {
    const mockPets = [
      {
        id: 'pet1',
        health: 80,
        hunger: 30,
        happiness: 70,
        energy: 60,
        lastStatUpdate: new Date('2024-01-01T10:00:00Z'),
        lastInteractionAt: new Date('2024-01-01T09:00:00Z'),
        neglectStartedAt: null,
        isCritical: false,
      },
      {
        id: 'pet2',
        health: 50,
        hunger: 60,
        happiness: 40,
        energy: 30,
        lastStatUpdate: new Date('2024-01-01T08:00:00Z'),
        lastInteractionAt: new Date('2024-01-01T07:00:00Z'),
        neglectStartedAt: null,
        isCritical: false,
      },
    ];

    mockPrisma.pet.findMany.mockResolvedValue(mockPets);
    mockCalculateStatDegradation.mockReturnValue({
      health: 78,
      hunger: 32,
      happiness: 69,
      energy: 58,
      lastStatUpdate: new Date(),
      isCritical: false,
      neglectStartedAt: null,
    });

    const { POST } = await import('@/app/api/pets/update-stats/route');
    const request = {
      json: async () => ({}),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(data.message).toContain('Updated stats for 2 pets');
    expect(mockPrisma.pet.findMany).toHaveBeenCalled();
    expect(mockCalculateStatDegradation).toHaveBeenCalledTimes(2);
    expect(mockPrisma.pet.update).toHaveBeenCalledTimes(2);
  });

  it('should update single pet when petId provided', async () => {
    const mockPet = {
      id: 'pet1',
      health: 80,
      hunger: 30,
      happiness: 70,
      energy: 60,
      lastStatUpdate: new Date('2024-01-01T10:00:00Z'),
      lastInteractionAt: new Date('2024-01-01T09:00:00Z'),
      neglectStartedAt: null,
      isCritical: false,
    };

    mockPrisma.pet.findUnique.mockResolvedValue(mockPet);
    mockCalculateStatDegradation.mockReturnValue({
      health: 78,
      hunger: 32,
      happiness: 69,
      energy: 58,
      lastStatUpdate: new Date(),
      isCritical: false,
      neglectStartedAt: null,
    });
    mockPrisma.pet.update.mockResolvedValue(mockPet);

    const { POST } = await import('@/app/api/pets/update-stats/route');
    const request = {
      json: async () => ({ petId: 'pet1' }),
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(data.message).toBe('Pet stats updated');
    expect(mockPrisma.pet.findUnique).toHaveBeenCalledWith({ where: { id: 'pet1' } });
    expect(mockCalculateStatDegradation).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when pet not found', async () => {
    mockPrisma.pet.findUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/pets/update-stats/route');
    const request = {
      json: async () => ({ petId: 'nonexistent' }),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it('should handle errors gracefully', async () => {
    mockPrisma.pet.findMany.mockRejectedValue(new Error('Database error'));

    const { POST } = await import('@/app/api/pets/update-stats/route');
    const request = {
      json: async () => ({}),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('should support GET method for cron jobs', async () => {
    mockPrisma.pet.findMany.mockResolvedValue([]);

    const { GET } = await import('@/app/api/pets/update-stats/route');
    const request = {} as any;

    const response = await GET(request);
    const data = await response.json();

    expect(data.message).toContain('Updated stats for 0 pets');
    expect(data.timestamp).toBeDefined();
  });
});

/**
 * Test the memory summarization logic
 */
describe('Memory Summarization API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger memory summarization', async () => {
    mockSummarizeAllPetMemories.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/memory/summarize/route');
    const request = {} as any;

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe('Memory summarization completed');
    expect(mockSummarizeAllPetMemories).toHaveBeenCalled();
  });

  it('should handle summarization errors', async () => {
    mockSummarizeAllPetMemories.mockRejectedValue(new Error('Summarization failed'));

    const { POST } = await import('@/app/api/memory/summarize/route');
    const request = {} as any;

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('should support GET method for cron jobs', async () => {
    mockSummarizeAllPetMemories.mockResolvedValue(undefined);

    const { GET } = await import('@/app/api/memory/summarize/route');
    const request = {} as any;

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockSummarizeAllPetMemories).toHaveBeenCalled();
  });
});
