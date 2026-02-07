import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateChallengeProgress } from '@/lib/engagement'

/**
 * US-023: Check health status of all pets owned by a user
 * Returns summary of pet health conditions and warnings
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch all pets with their warnings
    const pets = await prisma.pet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        health: true,
        hunger: true,
        happiness: true,
        energy: true,
        isCritical: true,
        warnings: {
          where: { cleared: false },
          select: {
            type: true,
            severity: true,
            message: true,
          },
        },
      },
    })

    if (pets.length === 0) {
      return NextResponse.json({ error: 'No pets found' }, { status: 404 })
    }

    // Categorize pets by health status
    const healthSummary = {
      totalPets: pets.length,
      critical: [] as { id: string; name: string; health: number }[],
      warning: [] as { id: string; name: string; issues: string[] }[],
      healthy: [] as { id: string; name: string }[],
      needsAttention: 0,
      healthyCount: 0,
    }

    for (const pet of pets) {
      // Critical state pets
      if (pet.isCritical) {
        healthSummary.critical.push({
          id: pet.id,
          name: pet.name,
          health: pet.health,
        })
        healthSummary.needsAttention++
        continue
      }

      // Pets with active warnings
      if (pet.warnings.length > 0) {
        healthSummary.warning.push({
          id: pet.id,
          name: pet.name,
          issues: pet.warnings.map((w) => w.message),
        })
        healthSummary.needsAttention++
        continue
      }

      // Check for potential issues even without formal warnings
      const issues: string[] = []
      if (pet.hunger > 80) issues.push('Very hungry')
      if (pet.health < 40) issues.push('Low health')
      if (pet.happiness < 30) issues.push('Unhappy')
      if (pet.energy < 20) issues.push('Low energy')

      if (issues.length > 0) {
        healthSummary.warning.push({
          id: pet.id,
          name: pet.name,
          issues,
        })
        healthSummary.needsAttention++
      } else {
        healthSummary.healthy.push({
          id: pet.id,
          name: pet.name,
        })
        healthSummary.healthyCount++
      }
    }

    // US-022: Track challenge progress for health check
    await updateChallengeProgress(userId, 'health_check', 1).catch((err) => {
      console.warn('Failed to update health check challenge:', err);
    });

    return NextResponse.json({
      summary: healthSummary,
      detailedPets: pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        stats: {
          health: pet.health,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
        },
        status: pet.isCritical
          ? 'critical'
          : pet.warnings.length > 0
          ? 'warning'
          : 'healthy',
        activeWarnings: pet.warnings.length,
      })),
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: 'Failed to check pet health' },
      { status: 500 }
    )
  }
}
