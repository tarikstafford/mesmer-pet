'use client';

/**
 * US-019: Chess Board Visualization Component
 * Simple chess board display with ASCII representation and controls
 */

import { useState, useEffect } from 'react';

interface ChessBoardProps {
  petId: string;
  userId: string;
  onClose: () => void;
}

interface ChessGameState {
  gameId: string;
  board: string;
  turn: 'user' | 'pet';
  status: 'active' | 'completed' | 'abandoned';
  winner?: string;
  message?: string;
}

export default function ChessBoard({ petId, userId, onClose }: ChessBoardProps) {
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [moveInput, setMoveInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ user?: string; pet?: string }[]>([]);

  // Initialize or fetch existing game
  useEffect(() => {
    fetchOrCreateGame();
  }, [petId]);

  const fetchOrCreateGame = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch existing game
      const fetchRes = await fetch(`/api/games/chess?petId=${petId}`);

      if (fetchRes.ok) {
        const data = await fetchRes.json();
        setGameState(data);
      } else {
        // No active game, create new one
        const createRes = await fetch('/api/games/chess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId, userId })
        });

        if (!createRes.ok) {
          const errorData = await createRes.json();
          throw new Error(errorData.error || 'Failed to create game');
        }

        const data = await createRes.json();
        setGameState(data);
        setMoveHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chess game');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async () => {
    if (!gameState || !moveInput.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/games/chess/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameState.gameId,
          moveStr: moveInput.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid move');
      }

      setGameState(data);
      setMoveHistory([...moveHistory, { user: data.userMove, pet: data.petMove }]);
      setMoveInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      makeMove();
    }
  };

  if (loading && !gameState) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-lg">♟️ Loading chess game...</div>
        </div>
      </div>
    );
  }

  if (error && !gameState) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">♟️ Chess Game</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Game Status */}
      {gameState && (
        <div className="mb-4">
          {gameState.status === 'active' ? (
            <div className="text-lg">
              <span className={gameState.turn === 'user' ? 'text-green-600 font-bold' : ''}>
                {gameState.turn === 'user' ? '🟢 Your turn' : '⏳ Waiting for pet...'}
              </span>
            </div>
          ) : (
            <div className="text-lg font-bold">
              {gameState.winner === 'user' && '🎉 You won!'}
              {gameState.winner === 'pet' && '😿 Your pet won!'}
              {gameState.winner === 'draw' && '🤝 Draw!'}
            </div>
          )}
          {gameState.message && (
            <div className="text-sm text-gray-600 mt-1">{gameState.message}</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chess Board */}
        <div className="md:col-span-2">
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
            <pre className="font-mono text-sm overflow-x-auto">
              {gameState?.board || 'Loading board...'}
            </pre>
          </div>

          {/* Move Input */}
          {gameState?.status === 'active' && gameState.turn === 'user' && (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={moveInput}
                  onChange={(e) => setMoveInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter move (e.g., e2-e4 or Nf3)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                />
                <button
                  onClick={makeMove}
                  disabled={loading || !moveInput.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳' : '▶'}
                </button>
              </div>
              {error && (
                <div className="mt-2 text-sm text-red-600">❌ {error}</div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Examples: e2-e4, Nf3, d4, Bb5, O-O (castling)
              </div>
            </div>
          )}

          {/* New Game Button */}
          {gameState?.status === 'completed' && (
            <div className="mt-4">
              <button
                onClick={fetchOrCreateGame}
                className="w-full px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
              >
                🔄 Start New Game
              </button>
            </div>
          )}
        </div>

        {/* Move History */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
            <h3 className="font-bold mb-2">📜 Move History</h3>
            <div className="max-h-96 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <div className="text-sm text-gray-500">No moves yet</div>
              ) : (
                <div className="space-y-2">
                  {moveHistory.map((move, idx) => (
                    <div key={idx} className="text-sm border-b border-gray-200 pb-2">
                      <div className="font-semibold">{idx + 1}.</div>
                      {move.user && (
                        <div className="text-blue-600">You: {move.user}</div>
                      )}
                      {move.pet && (
                        <div className="text-purple-600">Pet: {move.pet}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Help */}
          <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs">
            <h4 className="font-bold mb-1">ℹ️ How to Play</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Enter moves in algebraic notation</li>
              <li>• Format: e2-e4 or Nf3</li>
              <li>• O-O for kingside castling</li>
              <li>• O-O-O for queenside castling</li>
              <li>• Chat with your pet about strategy!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
