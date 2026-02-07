/**
 * US-019: Chess Game API
 * Endpoints for creating, retrieving, and updating chess games
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createNewGame,
  gameToFEN,
  FENToGame,
  parseMove,
  makeMove,
  isValidMove,
  getAIMove,
  boardToASCII,
  type ChessGame,
  type Move
} from '@/lib/chess';
import { hasChessSkill } from '@/lib/skillPrompts';

// POST /api/games/chess - Create a new chess game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { petId, userId } = body;

    if (!petId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: petId, userId' },
        { status: 400 }
      );
    }

    // Verify pet exists and belongs to user
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        petSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    if (pet.userId !== userId) {
      return NextResponse.json(
        { error: 'Pet does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if pet has Chess Master skill
    if (!hasChessSkill(pet.petSkills)) {
      return NextResponse.json(
        { error: 'Pet does not have Chess Master skill' },
        { status: 400 }
      );
    }

    // Create new chess game
    const newGame = createNewGame();
    const fen = gameToFEN(newGame);

    // Save to database
    const gameState = await prisma.gameState.create({
      data: {
        petId,
        gameType: 'chess',
        state: fen,
        turn: 'user',
        status: 'active'
      }
    });

    return NextResponse.json({
      gameId: gameState.id,
      fen,
      board: boardToASCII(newGame),
      turn: 'user',
      message: 'New chess game started! You play as white. Make your move!'
    });
  } catch (error) {
    console.error('Error creating chess game:', error);
    return NextResponse.json(
      { error: 'Failed to create chess game' },
      { status: 500 }
    );
  }
}

// GET /api/games/chess?petId=xxx - Get active chess game for a pet
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const petId = searchParams.get('petId');

    if (!petId) {
      return NextResponse.json(
        { error: 'Missing petId parameter' },
        { status: 400 }
      );
    }

    // Find active chess game
    const gameState = await prisma.gameState.findFirst({
      where: {
        petId,
        gameType: 'chess',
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!gameState) {
      return NextResponse.json(
        { error: 'No active chess game found' },
        { status: 404 }
      );
    }

    const game = FENToGame(gameState.state);

    return NextResponse.json({
      gameId: gameState.id,
      fen: gameState.state,
      board: boardToASCII(game),
      turn: gameState.turn,
      status: gameState.status,
      winner: gameState.winner
    });
  } catch (error) {
    console.error('Error fetching chess game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chess game' },
      { status: 500 }
    );
  }
}
