// US-021: Background Job System for Stat Degradation
// Runs every 15 minutes to update all pet stats
// US-010: Daily memory summarization job

let jobInterval: NodeJS.Timeout | null = null;
let memorySummarizationInterval: NodeJS.Timeout | null = null;
let lastSummarizationDate: string | null = null;

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

  // US-010: Start daily memory summarization job
  startMemorySummarizationJob();
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

  if (memorySummarizationInterval) {
    clearInterval(memorySummarizationInterval);
    memorySummarizationInterval = null;
    console.log('🛑 Memory summarization job stopped');
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
      // Calculate updated stats (US-008: includes Critical state and grace period)
      const updatedStats = calculateStatDegradation(
        {
          health: pet.health,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
        },
        pet.lastStatUpdate,
        pet.lastInteractionAt,
        pet.neglectStartedAt,
        pet.isCritical,
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
          isCritical: updatedStats.isCritical || false,
          neglectStartedAt: updatedStats.neglectStartedAt,
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

/**
 * US-010: Start the daily memory summarization job
 * Runs once per day at 2 AM local server time
 */
function startMemorySummarizationJob() {
  if (memorySummarizationInterval) {
    console.log('⚠️  Memory summarization job already running');
    return;
  }

  console.log('🧠 Starting memory summarization job...');

  // Check every hour if we need to run summarization
  const checkInterval = 60 * 60 * 1000; // 1 hour

  memorySummarizationInterval = setInterval(async () => {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    // Check if it's 2 AM and we haven't run today
    const hour = now.getHours();
    if (hour === 2 && lastSummarizationDate !== todayDate) {
      await runMemorySummarizationJob();
      lastSummarizationDate = todayDate;
    }
  }, checkInterval);

  console.log('✅ Memory summarization job started (daily at 2 AM)');
}

/**
 * US-010: Run memory summarization for all pets
 */
async function runMemorySummarizationJob() {
  try {
    console.log(`[${new Date().toISOString()}] Running memory summarization job...`);

    const { summarizeAllPetMemories } = await import('@/lib/memorySummarization');
    await summarizeAllPetMemories();

    console.log('✅ Memory summarization job completed');
  } catch (error) {
    console.error('❌ Memory summarization job failed:', error);
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
