/**
 * US-011: Pet Personality System API
 *
 * Provides personality-based LLM system prompts for a specific pet
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePersonalityPrompt, getPersonalitySummary } from '@/lib/personality';

/**
 * GET /api/personality/[petId]
 *
 * Returns the LLM system prompt generated from a pet's personality traits
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ petId: string }> }
) {
  try {
    const { petId } = await context.params;

    // Fetch pet with personality traits
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: {
        id: true,
        name: true,
        friendliness: true,
        energyTrait: true,
        curiosity: true,
        patience: true,
        playfulness: true,
      }
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Generate personality prompt for LLM
    const personalityPrompt = generatePersonalityPrompt({
      friendliness: pet.friendliness,
      energyTrait: pet.energyTrait,
      curiosity: pet.curiosity,
      patience: pet.patience,
      playfulness: pet.playfulness,
    });

    // Generate short summary for UI display
    const personalitySummary = getPersonalitySummary({
      friendliness: pet.friendliness,
      energyTrait: pet.energyTrait,
      curiosity: pet.curiosity,
      patience: pet.patience,
      playfulness: pet.playfulness,
    });

    return NextResponse.json({
      petId: pet.id,
      petName: pet.name,
      personalityPrompt,
      personalitySummary,
      traits: {
        friendliness: pet.friendliness,
        energy: pet.energyTrait,
        curiosity: pet.curiosity,
        patience: pet.patience,
        playfulness: pet.playfulness,
      }
    });
  } catch (error) {
    console.error('Error fetching pet personality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pet personality' },
      { status: 500 }
    );
  }
}
