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
 * US-007: Also checks for warnings and creates/clears them
 */
async function runStatUpdateJob() {
  try {
    console.log(`[${new Date().toISOString()}] Running stat update job...`);

    // Import modules dynamically
    const { prisma } = await import('@/lib/prisma');
    const { calculateStatDegradation } = await import('@/lib/statDegradation');
    const { checkPetWarnings } = await import('@/lib/warnings');

    const allPets = await prisma.pet.findMany();

    const updatePromises = allPets.map(async (pet) => {
      // Calculate updated stats
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

      // Update pet stats
      await prisma.pet.update({
        where: { id: pet.id },
        data: {
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          energy: updatedStats.energy,
          lastStatUpdate: updatedStats.lastStatUpdate,
        },
      });

      // US-007: Check for warnings based on new stats
      const activeWarnings = checkPetWarnings({
        health: updatedStats.health,
        hunger: updatedStats.hunger,
        happiness: updatedStats.happiness,
        energy: updatedStats.energy,
      });

      // Get existing uncleared warnings
      const existingWarnings = await prisma.warning.findMany({
        where: {
          petId: pet.id,
          cleared: false,
        },
      });

      const activeWarningTypes = new Set(activeWarnings.map(w => w.type));
      const existingWarningTypes = new Set(existingWarnings.map(w => w.type));

      // Clear warnings that are no longer active
      for (const existing of existingWarnings) {
        if (!activeWarningTypes.has(existing.type as any)) {
          await prisma.warning.update({
            where: { id: existing.id },
            data: {
              cleared: true,
              clearedAt: new Date(),
            },
          });
        }
      }

      // Create new warnings
      for (const active of activeWarnings) {
        if (!existingWarningTypes.has(active.type)) {
          await prisma.warning.create({
            data: {
              petId: pet.id,
              type: active.type,
              severity: active.severity,
              message: active.message,
            },
          });
        }
      }
    });

    await Promise.all(updatePromises);

    console.log(`✅ Updated stats and warnings for ${allPets.length} pets`);
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
