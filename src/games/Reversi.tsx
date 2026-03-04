import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Piece = 'w' | 'b' | null;
type Board = Piece[][];
type Player = 'w' | 'b';

export default function Reversi() {
  const [board, setBoard] = useState<Board>([]);
  const [turn, setTurn] = useState<Player>('b'); // Black usually goes first
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    const newBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    newBoard[3][3] = 'w';
    newBoard[3][4] = 'b';
    newBoard[4][3] = 'b';
    newBoard[4][4] = 'w';
    setBoard(newBoard);
    setTurn('b');
    setGameOver(false);
    setWinner(null);
    setFunnyTask(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const getValidMoves = (b: Board, player: Player) => {
    const moves: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (canMove(r, c, b, player).length > 0) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  };

  const canMove = (r: number, c: number, b: Board, player: Player) => {
    if (b[r][c] !== null) return [];

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    const opponent = player === 'w' ? 'b' : 'w';
    const toFlip: [number, number][] = [];

    directions.forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;
      const path: [number, number][] = [];

      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === opponent) {
        path.push([nr, nc]);
        nr += dr;
        nc += dc;
      }

      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === player && path.length > 0) {
        toFlip.push(...path);
      }
    });

    return toFlip;
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || turn !== 'b') return; // User is black
    const flip = canMove(r, c, board, 'b');
    if (flip.length === 0) return;
    makeMove(r, c, flip, 'b');
  };

  const makeMove = (r: number, c: number, flip: [number, number][], player: Player) => {
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = player;
    flip.forEach(([fr, fc]) => {
      newBoard[fr][fc] = player;
    });
    setBoard(newBoard);

    const opponent = player === 'w' ? 'b' : 'w';
    const nextMoves = getValidMoves(newBoard, opponent);

    if (nextMoves.length > 0) {
      setTurn(opponent);
      if (opponent === 'w') {
        setTimeout(() => aiMove(newBoard), 1000);
      }
    } else {
      const playerMoves = getValidMoves(newBoard, player);
      if (playerMoves.length > 0) {
        // Opponent skips turn
        if (player === 'w') {
          setTimeout(() => aiMove(newBoard), 1000);
        }
      } else {
        handleEnd(newBoard);
      }
    }
  };

  const aiMove = (currentBoard: Board) => {
    if (gameOver) return;
    const moves = getValidMoves(currentBoard, 'w');
    if (moves.length === 0) {
      const playerMoves = getValidMoves(currentBoard, 'b');
      if (playerMoves.length > 0) {
        setTurn('b');
      } else {
        handleEnd(currentBoard);
      }
      return;
    }

    // AI strategy: pick move that flips most pieces
    let bestMove = moves[0];
    let maxFlip = 0;
    moves.forEach(([r, c]) => {
      const flipCount = canMove(r, c, currentBoard, 'w').length;
      if (flipCount > maxFlip) {
        maxFlip = flipCount;
        bestMove = [r, c];
      }
    });

    const flip = canMove(bestMove[0], bestMove[1], currentBoard, 'w');
    makeMove(bestMove[0], bestMove[1], flip, 'w');
  };

  const handleEnd = async (b: Board) => {
    setGameOver(true);
    const bCount = b.flat().filter(c => c === 'b').length;
    const wCount = b.flat().filter(c => c === 'w').length;

    let result: Player | 'draw';
    if (bCount > wCount) result = 'b';
    else if (wCount > bCount) result = 'w';
    else result = 'draw';

    setWinner(result);

    let task = null;
    if (result === 'w' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Reversi');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'reversi',
          winner: result === 'b' ? 'user' : result === 'w' ? 'ai' : 'draw',
          funny_task: task
        })
      });
    }
  };

  const bCount = board.flat().filter(c => c === 'b').length;
  const wCount = board.flat().filter(c => c === 'w').length;

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${turn === 'b' ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800 border-white/10'}`}>
            <div className="w-3 h-3 rounded-full bg-slate-950 border border-white/20" />
            <span className="font-bold text-white">{bCount}</span>
          </div>
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${turn === 'w' ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-800 border-white/10'}`}>
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
            <span className="font-bold text-white">{wCount}</span>
          </div>
        </div>
        <button onClick={initGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-emerald-900 p-4 rounded-3xl border-8 border-emerald-950 shadow-2xl w-full aspect-square grid grid-cols-8 gap-1">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isValid = turn === 'b' && canMove(r, c, board, 'b').length > 0;
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative flex items-center justify-center bg-emerald-800/50 rounded-sm transition-all
                  ${isValid ? 'cursor-pointer hover:bg-emerald-700/50' : ''}
                `}
              >
                {cell && (
                  <motion.div
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    className={`w-4/5 h-4/5 rounded-full shadow-lg
                      ${cell === 'b' ? 'bg-slate-950 border border-white/10' : 'bg-white shadow-[0_0_10px_white]'}
                    `}
                  />
                )}
                {isValid && !cell && (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center space-y-6 w-full"
          >
            <div className={`p-8 rounded-3xl border ${winner === 'b' ? 'bg-emerald-500/10 border-emerald-500/20' : winner === 'w' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
              {winner === 'b' ? (
                <>
                  <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Victory!</h3>
                  <p className="text-slate-400">You dominated the board with {bCount} pieces.</p>
                </>
              ) : winner === 'w' ? (
                <>
                  <Skull className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Defeat!</h3>
                  <p className="text-slate-400">The AI took over with {wCount} pieces.</p>
                </>
              ) : (
                <>
                  <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">It's a Draw!</h3>
                  <p className="text-slate-400">A perfect balance of {bCount} pieces each.</p>
                </>
              )}
            </div>

            {funnyTask && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
                <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}

            <ShareButtons
              gameTitle="Reversi"
              result={winner === 'b' ? 'captured the board' : winner === 'w' ? 'got flipped by the AI' : 'reached a strategic tie'}
              score={`${bCount}-${wCount}`}
              penalty={funnyTask}
            />

            <button onClick={initGame} className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all mt-4">
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex gap-4 items-start w-full">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
        <div className="text-sm text-slate-400 space-y-2">
          <p><strong className="text-white">Goal:</strong> Have more pieces of your color on the board when it's full.</p>
          <p><strong className="text-white">Movement:</strong> Place a piece so that you trap opponent pieces between your new piece and an existing one.</p>
          <p><strong className="text-white">Capture:</strong> All trapped opponent pieces will flip to your color.</p>
        </div>
      </div>
    </div>
  );
}
