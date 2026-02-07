/**
 * US-019: Chess Move API
 * Handles making moves in an active chess game
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  FENToGame,
  parseMove,
  makeMove,
  isValidMove,
  getAIMove,
  gameToFEN,
  boardToASCII,
  getLegalMoves
} from '@/lib/chess';

// POST /api/games/chess/move - Make a chess move
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, moveStr } = body;

    if (!gameId || !moveStr) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, moveStr' },
        { status: 400 }
      );
    }

    // Fetch game state
    const gameState = await prisma.gameState.findUnique({
      where: { id: gameId }
    });

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (gameState.status !== 'active') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      );
    }

    if (gameState.turn !== 'user') {
      return NextResponse.json(
        { error: 'It is not your turn' },
        { status: 400 }
      );
    }

    // Parse and validate move
    let game = FENToGame(gameState.state);
    const move = parseMove(game, moveStr);

    if (!move) {
      return NextResponse.json(
        { error: `Invalid move: ${moveStr}. Use format like "e2-e4" or "Nf3"` },
        { status: 400 }
      );
    }

    if (!isValidMove(game, move)) {
      return NextResponse.json(
        { error: `Illegal move: ${moveStr}` },
        { status: 400 }
      );
    }

    // Make user's move
    game = makeMove(game, move);

    // Check for game over
    const legalMoves = getLegalMoves(game);
    if (legalMoves.length === 0) {
      // Game over (checkmate or stalemate)
      await prisma.gameState.update({
        where: { id: gameId },
        data: {
          state: gameToFEN(game),
          status: 'completed',
          winner: game.isCheckmate ? 'user' : 'draw',
          turn: 'pet'
        }
      });

      return NextResponse.json({
        gameId,
        board: boardToASCII(game),
        userMove: moveStr,
        status: 'completed',
        winner: game.isCheckmate ? 'user' : 'draw',
        message: game.isCheckmate ? 'Checkmate! You won!' : 'Stalemate! It\'s a draw!'
      });
    }

    // Make AI move
    const aiMove = getAIMove(game);
    if (!aiMove) {
      // No legal moves for AI (shouldn't happen after user's move)
      await prisma.gameState.update({
        where: { id: gameId },
        data: {
          state: gameToFEN(game),
          status: 'completed',
          winner: 'user',
          turn: 'pet'
        }
      });

      return NextResponse.json({
        gameId,
        board: boardToASCII(game),
        userMove: moveStr,
        status: 'completed',
        winner: 'user',
        message: 'You won! I have no legal moves left.'
      });
    }

    game = makeMove(game, aiMove);

    // Check for game over after AI move
    const legalMovesAfterAI = getLegalMoves(game);
    if (legalMovesAfterAI.length === 0) {
      await prisma.gameState.update({
        where: { id: gameId },
        data: {
          state: gameToFEN(game),
          status: 'completed',
          winner: game.isCheckmate ? 'pet' : 'draw',
          turn: 'user'
        }
      });

      return NextResponse.json({
        gameId,
        board: boardToASCII(game),
        userMove: moveStr,
        petMove: aiMove.san,
        status: 'completed',
        winner: game.isCheckmate ? 'pet' : 'draw',
        message: game.isCheckmate ? `Checkmate! I won with ${aiMove.san}!` : 'Stalemate! It\'s a draw!'
      });
    }

    // Update game state
    await prisma.gameState.update({
      where: { id: gameId },
      data: {
        state: gameToFEN(game),
        turn: 'user',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      gameId,
      board: boardToASCII(game),
      userMove: moveStr,
      petMove: aiMove.san,
      turn: 'user',
      status: 'active',
      message: `I played ${aiMove.san}. Your turn!`
    });
  } catch (error) {
    console.error('Error making chess move:', error);
    return NextResponse.json(
      { error: 'Failed to make move' },
      { status: 500 }
    );
  }
}
