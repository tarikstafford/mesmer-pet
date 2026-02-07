// US-021: Background Job System for Stat Degradation
// Runs every 15 minutes to update all pet stats

let jobInterval: NodeJS.Timeout | null = null;

/**
 * Start the background job system
 * Runs stat updates every 15 minutes
 */
export function startBackgroundJobs() {
  if (jobInterval) {
    console.log('⚠️  Background jobs already running');
    return;
  }

  console.log('🚀 Starting background jobs...');

  // Run immediately on startup
  runStatUpdateJob();

  // Then run every 15 minutes (900000ms)
  jobInterval = setInterval(() => {
    runStatUpdateJob();
  }, 15 * 60 * 1000);

  console.log('✅ Background jobs started (15-minute interval)');
}

/**
 * Stop the background job system
 */
export function stopBackgroundJobs() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('🛑 Background jobs stopped');
  }
}

/**
 * Run the stat update job by calling the update-stats API
 */
async function runStatUpdateJob() {
  try {
    console.log(`[${new Date().toISOString()}] Running stat update job...`);

    // In a server environment, we would call the API route
    // For now, we'll import and call the logic directly
    const { prisma } = await import('@/lib/prisma');
    const { calculateStatDegradation } = await import('@/lib/statDegradation');

    const allPets = await prisma.pet.findMany();

    const updatePromises = allPets.map(async (pet) => {
      const updatedStats = calculateStatDegradation(
        {
          health: pet.health,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
        },
        pet.lastStatUpdate,
        pet.lastInteractionAt,
        0 // Default timezone offset
      );

      return prisma.pet.update({
        where: { id: pet.id },
        data: {
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          energy: updatedStats.energy,
          lastStatUpdate: updatedStats.lastStatUpdate,
        },
      });
    });

    await Promise.all(updatePromises);

    console.log(`✅ Updated stats for ${allPets.length} pets`);
  } catch (error) {
    console.error('❌ Stat update job failed:', error);
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    stopBackgroundJobs();
  });

  process.on('SIGINT', () => {
    stopBackgroundJobs();
  });
}
