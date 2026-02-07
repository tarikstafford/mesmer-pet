import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { feedPet } from '@/lib/feeding'

/**
 * US-023: Bulk feed all pets owned by a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch all pets owned by the user
    const pets = await prisma.pet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        isCritical: true,
        lastFedAt: true,
      },
    })

    if (pets.length === 0) {
      return NextResponse.json({ error: 'No pets found' }, { status: 404 })
    }

    const results = {
      successful: [] as { petId: string; petName: string }[],
      failed: [] as { petId: string; petName: string; reason: string }[],
      skipped: [] as { petId: string; petName: string; reason: string }[],
    }

    // Attempt to feed each pet
    for (const pet of pets) {
      try {
        // Skip Critical pets
        if (pet.isCritical) {
          results.skipped.push({
            petId: pet.id,
            petName: pet.name,
            reason: 'Pet is in Critical state',
          })
          continue
        }

        // Try to feed the pet
        const result = await feedPet(pet.id, userId)

        if (result.success) {
          results.successful.push({
            petId: pet.id,
            petName: pet.name,
          })
        } else {
          results.failed.push({
            petId: pet.id,
            petName: pet.name,
            reason: result.message || 'Unknown error',
          })
        }
      } catch (error) {
        results.failed.push({
          petId: pet.id,
          petName: pet.name,
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: `Fed ${results.successful.length} pet(s) successfully`,
      results,
      totalPets: pets.length,
    })
  } catch (error) {
    console.error('Bulk feed error:', error)
    return NextResponse.json(
      { error: 'Failed to feed pets' },
      { status: 500 }
    )
  }
}
