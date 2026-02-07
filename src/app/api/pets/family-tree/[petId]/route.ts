import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/pets/family-tree/[petId]
 *
 * Fetch family tree data for a pet (parents and grandparents)
 * Returns detailed lineage information including traits and their inheritance sources
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await context.params;

    // Fetch the target pet with traits
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        petTraits: {
          include: {
            trait: true,
          },
        },
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Helper function to fetch ancestor data
    const fetchAncestor = async (ancestorId: string | null) => {
      if (!ancestorId) return null;

      const ancestor = await prisma.pet.findUnique({
        where: { id: ancestorId },
        include: {
          petTraits: {
            include: {
              trait: true,
            },
          },
        },
      });

      if (!ancestor) return null;

      return {
        id: ancestor.id,
        name: ancestor.name,
        generation: ancestor.generation,
        createdAt: ancestor.createdAt,
        traits: ancestor.petTraits.map(pt => ({
          id: pt.trait.id,
          traitName: pt.trait.traitName,
          traitType: pt.trait.traitType,
          rarity: pt.trait.rarity,
          description: pt.trait.description,
          inheritanceSource: pt.inheritanceSource,
        })),
        // Personality traits for display
        personality: {
          friendliness: ancestor.friendliness,
          energyTrait: ancestor.energyTrait,
          curiosity: ancestor.curiosity,
          patience: ancestor.patience,
          playfulness: ancestor.playfulness,
        },
      };
    };

    // Fetch parents
    const parent1 = await fetchAncestor(pet.parent1Id);
    const parent2 = await fetchAncestor(pet.parent2Id);

    // Fetch grandparents
    let grandparents = null;
    if (parent1 || parent2) {
      grandparents = {
        parent1Parents: {
          parent1: parent1 ? await fetchAncestor((await prisma.pet.findUnique({ where: { id: parent1.id } }))?.parent1Id || null) : null,
          parent2: parent1 ? await fetchAncestor((await prisma.pet.findUnique({ where: { id: parent1.id } }))?.parent2Id || null) : null,
        },
        parent2Parents: {
          parent1: parent2 ? await fetchAncestor((await prisma.pet.findUnique({ where: { id: parent2.id } }))?.parent1Id || null) : null,
          parent2: parent2 ? await fetchAncestor((await prisma.pet.findUnique({ where: { id: parent2.id } }))?.parent2Id || null) : null,
        },
      };
    }

    // Build family tree response
    const familyTree = {
      pet: {
        id: pet.id,
        name: pet.name,
        generation: pet.generation,
        createdAt: pet.createdAt,
        traits: pet.petTraits.map(pt => ({
          id: pt.trait.id,
          traitName: pt.trait.traitName,
          traitType: pt.trait.traitType,
          rarity: pt.trait.rarity,
          description: pt.trait.description,
          inheritanceSource: pt.inheritanceSource,
        })),
        personality: {
          friendliness: pet.friendliness,
          energyTrait: pet.energyTrait,
          curiosity: pet.curiosity,
          patience: pet.patience,
          playfulness: pet.playfulness,
        },
      },
      parents: {
        parent1,
        parent2,
      },
      grandparents,
    };

    return NextResponse.json(familyTree);
  } catch (error) {
    console.error('Error fetching family tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family tree' },
      { status: 500 }
    );
  }
}
