/**
 * US-019: Chess Game Implementation
 * Simple chess engine with algebraic notation support
 */

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';
export type Square = string; // e.g., 'e4', 'a1'

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  san: string; // Standard Algebraic Notation
}

export interface ChessGame {
  board: (Piece | null)[][];
  turn: PieceColor;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
}

// Initialize a new chess game with standard starting position
export function createNewGame(): ChessGame {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

  // Setup white pieces (bottom)
  board[0] = [
    { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' },
    { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }
  ];
  board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'w' }));

  // Setup black pieces (top)
  board[7] = [
    { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' },
    { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }
  ];
  board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'b' }));

  return {
    board,
    turn: 'w',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  };
}

// Convert square notation to board coordinates
export function squareToCoords(square: Square): [number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return [rank, file];
}

// Convert board coordinates to square notation
export function coordsToSquare(rank: number, file: number): Square {
  return String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1);
}

// Get piece at square
export function getPieceAt(game: ChessGame, square: Square): Piece | null {
  const [rank, file] = squareToCoords(square);
  if (rank < 0 || rank > 7 || file < 0 || file > 7) return null;
  return game.board[rank][file];
}

// Parse simple algebraic notation (e.g., "e2-e4", "Nf3", "O-O")
export function parseMove(game: ChessGame, moveStr: string): Move | null {
  moveStr = moveStr.trim().replace(/[+#]/, ''); // Remove check/checkmate indicators

  // Handle long algebraic notation (e2-e4)
  if (moveStr.includes('-')) {
    const [from, to] = moveStr.split('-');
    const piece = getPieceAt(game, from);
    if (!piece) return null;

    return {
      from,
      to,
      piece: piece.type,
      san: moveStr
    };
  }

  // Handle castling
  if (moveStr === 'O-O' || moveStr === '0-0') {
    const rank = game.turn === 'w' ? 0 : 7;
    return {
      from: coordsToSquare(rank, 4),
      to: coordsToSquare(rank, 6),
      piece: 'k',
      san: 'O-O'
    };
  }
  if (moveStr === 'O-O-O' || moveStr === '0-0-0') {
    const rank = game.turn === 'w' ? 0 : 7;
    return {
      from: coordsToSquare(rank, 4),
      to: coordsToSquare(rank, 2),
      piece: 'k',
      san: 'O-O-O'
    };
  }

  // Handle standard algebraic notation (e.g., "Nf3", "e4", "Bxe5")
  const pieceMatch = moveStr.match(/^([NBRQK])?([a-h])?([1-8])?(x)?([a-h][1-8])(=[NBRQ])?$/);
  if (pieceMatch) {
    const [, pieceChar, fromFile, fromRank, capture, toSquare, promotion] = pieceMatch;
    const pieceType: PieceType = pieceChar ? pieceChar.toLowerCase() as PieceType : 'p';

    // Find the piece that can move to this square
    const possibleMoves = findPieceMoves(game, pieceType, toSquare, fromFile, fromRank);
    if (possibleMoves.length === 1) {
      return {
        from: possibleMoves[0],
        to: toSquare,
        piece: pieceType,
        captured: capture ? getPieceAt(game, toSquare)?.type : undefined,
        promotion: promotion ? promotion[1].toLowerCase() as PieceType : undefined,
        san: moveStr
      };
    }
  }

  return null;
}

// Find all pieces of a type that can move to a square
function findPieceMoves(
  game: ChessGame,
  pieceType: PieceType,
  toSquare: Square,
  fromFile?: string,
  fromRank?: string
): Square[] {
  const possibleSquares: Square[] = [];
  const [toRank, toFile] = squareToCoords(toSquare);

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      // Filter by file/rank if specified
      if (fromFile && String.fromCharCode('a'.charCodeAt(0) + file) !== fromFile) continue;
      if (fromRank && (rank + 1).toString() !== fromRank) continue;

      const piece = game.board[rank][file];
      if (piece && piece.type === pieceType && piece.color === game.turn) {
        if (canPieceMoveTo(game, rank, file, toRank, toFile)) {
          possibleSquares.push(coordsToSquare(rank, file));
        }
      }
    }
  }

  return possibleSquares;
}

// Check if a piece can move to a square (simplified rules)
function canPieceMoveTo(
  game: ChessGame,
  fromRank: number,
  fromFile: number,
  toRank: number,
  toFile: number
): boolean {
  const piece = game.board[fromRank][fromFile];
  if (!piece) return false;

  const target = game.board[toRank][toFile];
  if (target && target.color === piece.color) return false; // Can't capture own piece

  const rankDiff = toRank - fromRank;
  const fileDiff = toFile - fromFile;
  const direction = piece.color === 'w' ? 1 : -1;

  switch (piece.type) {
    case 'p': // Pawn
      if (fileDiff === 0) {
        if (rankDiff === direction && !target) return true;
        if (rankDiff === 2 * direction && fromRank === (piece.color === 'w' ? 1 : 6) && !target) return true;
      }
      if (Math.abs(fileDiff) === 1 && rankDiff === direction && target) return true;
      return false;

    case 'n': // Knight
      return (Math.abs(rankDiff) === 2 && Math.abs(fileDiff) === 1) ||
             (Math.abs(rankDiff) === 1 && Math.abs(fileDiff) === 2);

    case 'b': // Bishop
      if (Math.abs(rankDiff) !== Math.abs(fileDiff)) return false;
      return isPathClear(game, fromRank, fromFile, toRank, toFile);

    case 'r': // Rook
      if (rankDiff !== 0 && fileDiff !== 0) return false;
      return isPathClear(game, fromRank, fromFile, toRank, toFile);

    case 'q': // Queen
      if (rankDiff !== 0 && fileDiff !== 0 && Math.abs(rankDiff) !== Math.abs(fileDiff)) return false;
      return isPathClear(game, fromRank, fromFile, toRank, toFile);

    case 'k': // King
      return Math.abs(rankDiff) <= 1 && Math.abs(fileDiff) <= 1;

    default:
      return false;
  }
}

// Check if path is clear between two squares
function isPathClear(
  game: ChessGame,
  fromRank: number,
  fromFile: number,
  toRank: number,
  toFile: number
): boolean {
  const rankStep = toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0;
  const fileStep = toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0;

  let rank = fromRank + rankStep;
  let file = fromFile + fileStep;

  while (rank !== toRank || file !== toFile) {
    if (game.board[rank][file]) return false;
    rank += rankStep;
    file += fileStep;
  }

  return true;
}

// Make a move on the board
export function makeMove(game: ChessGame, move: Move): ChessGame {
  const [fromRank, fromFile] = squareToCoords(move.from);
  const [toRank, toFile] = squareToCoords(move.to);

  const newBoard = game.board.map(row => [...row]);
  const piece = newBoard[fromRank][fromFile];

  if (!piece) return game; // Invalid move

  // Move the piece
  newBoard[toRank][toFile] = piece;
  newBoard[fromRank][fromFile] = null;

  // Handle pawn promotion
  if (move.promotion && piece.type === 'p') {
    newBoard[toRank][toFile] = { type: move.promotion, color: piece.color };
  }

  // Handle castling (move the rook)
  if (piece.type === 'k' && Math.abs(toFile - fromFile) === 2) {
    if (toFile > fromFile) { // Kingside
      newBoard[toRank][5] = newBoard[toRank][7];
      newBoard[toRank][7] = null;
    } else { // Queenside
      newBoard[toRank][3] = newBoard[toRank][0];
      newBoard[toRank][0] = null;
    }
  }

  return {
    ...game,
    board: newBoard,
    turn: game.turn === 'w' ? 'b' : 'w',
    moveHistory: [...game.moveHistory, move],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false
  };
}

// Validate if a move is legal
export function isValidMove(game: ChessGame, move: Move): boolean {
  const [fromRank, fromFile] = squareToCoords(move.from);
  const [toRank, toFile] = squareToCoords(move.to);

  const piece = game.board[fromRank][fromFile];
  if (!piece) return false;
  if (piece.color !== game.turn) return false;

  return canPieceMoveTo(game, fromRank, fromFile, toRank, toFile);
}

// Convert game to FEN notation for storage
export function gameToFEN(game: ChessGame): string {
  let fen = '';

  // Board position
  for (let rank = 7; rank >= 0; rank--) {
    let emptyCount = 0;
    for (let file = 0; file < 8; file++) {
      const piece = game.board[rank][file];
      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        const char = piece.type === piece.type.toUpperCase() ? piece.type : piece.type.toLowerCase();
        fen += piece.color === 'w' ? char.toUpperCase() : char;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) fen += emptyCount;
    if (rank > 0) fen += '/';
  }

  // Turn
  fen += ` ${game.turn}`;

  // Castling rights (simplified - assume available if king hasn't moved)
  fen += ' KQkq';

  // En passant and halfmove clock (simplified)
  fen += ' - 0 1';

  return fen;
}

// Convert FEN notation to game state
export function FENToGame(fen: string): ChessGame {
  const [boardStr, turn] = fen.split(' ');
  const ranks = boardStr.split('/');

  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let i = 0; i < ranks.length; i++) {
    const rank = 7 - i;
    let file = 0;

    for (const char of ranks[i]) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else {
        const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as PieceType;
        board[rank][file] = { type, color };
        file++;
      }
    }
  }

  return {
    board,
    turn: (turn || 'w') as PieceColor,
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  };
}

// Generate ASCII board representation
export function boardToASCII(game: ChessGame): string {
  const pieceSymbols: { [key: string]: string } = {
    'wp': '♙', 'wn': '♘', 'wb': '♗', 'wr': '♖', 'wq': '♕', 'wk': '♔',
    'bp': '♟', 'bn': '♞', 'bb': '♝', 'br': '♜', 'bq': '♛', 'bk': '♚'
  };

  let ascii = '\n  a b c d e f g h\n';
  for (let rank = 7; rank >= 0; rank--) {
    ascii += `${rank + 1} `;
    for (let file = 0; file < 8; file++) {
      const piece = game.board[rank][file];
      if (piece) {
        ascii += pieceSymbols[piece.color + piece.type] + ' ';
      } else {
        ascii += '. ';
      }
    }
    ascii += `${rank + 1}\n`;
  }
  ascii += '  a b c d e f g h\n';

  return ascii;
}

// Get all legal moves for current player (simplified)
export function getLegalMoves(game: ChessGame): Move[] {
  const moves: Move[] = [];

  for (let fromRank = 0; fromRank < 8; fromRank++) {
    for (let fromFile = 0; fromFile < 8; fromFile++) {
      const piece = game.board[fromRank][fromFile];
      if (piece && piece.color === game.turn) {
        for (let toRank = 0; toRank < 8; toRank++) {
          for (let toFile = 0; toFile < 8; toFile++) {
            if (canPieceMoveTo(game, fromRank, fromFile, toRank, toFile)) {
              const from = coordsToSquare(fromRank, fromFile);
              const to = coordsToSquare(toRank, toFile);
              const target = game.board[toRank][toFile];

              moves.push({
                from,
                to,
                piece: piece.type,
                captured: target?.type,
                san: `${from}-${to}`
              });
            }
          }
        }
      }
    }
  }

  return moves;
}

// Simple AI move selection (random legal move)
export function getAIMove(game: ChessGame): Move | null {
  const legalMoves = getLegalMoves(game);
  if (legalMoves.length === 0) return null;

  // Prioritize captures
  const captures = legalMoves.filter(m => m.captured);
  if (captures.length > 0) {
    return captures[Math.floor(Math.random() * captures.length)];
  }

  // Otherwise random move
  return legalMoves[Math.floor(Math.random() * legalMoves.length)];
}
