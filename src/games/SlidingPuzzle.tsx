import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull } from 'lucide-react';

export default function SlidingPuzzle() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const size = 3;

  const initGame = () => {
    let newTiles = [...Array(size * size).keys()];
    // Shuffle
    do {
      newTiles.sort(() => Math.random() - 0.5);
    } while (!isSolvable(newTiles) || isSolved(newTiles));
    
    setTiles(newTiles);
    setGameOver(false);
    setMoves(0);
    setFunnyTask(null);
  };

  const isSolvable = (t: number[]) => {
    let inversions = 0;
    for (let i = 0; i < t.length - 1; i++) {
      for (let j = i + 1; j < t.length; j++) {
        if (t[i] !== 0 && t[j] !== 0 && t[i] > t[j]) inversions++;
      }
    }
    return inversions % 2 === 0;
  };

  const isSolved = (t: number[]) => {
    for (let i = 0; i < t.length - 1; i++) {
      if (t[i] !== i + 1) return false;
    }
    return t[t.length - 1] === 0;
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleTileClick = (index: number) => {
    if (gameOver) return;
    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(m => m + 1);
      if (isSolved(newTiles)) handleEnd(true);
    }
  };

  const handleEnd = async (isWin: boolean) => {
    setGameOver(true);
    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'slidingpuzzle',
          winner: 'user',
          funny_task: `Moves: ${moves}`
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Moves</p>
          <p className="text-xl font-bold text-white">{moves}</p>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl">
        {tiles.map((tile, i) => (
          <motion.button
            key={tile}
            layout
            onClick={() => handleTileClick(i)}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex items-center justify-center text-3xl font-bold transition-all
              ${tile === 0 ? 'bg-transparent' : 'bg-slate-800 border-2 border-white/5 hover:border-indigo-500/50 text-white shadow-lg'}
            `}
          >
            {tile !== 0 ? tile : ''}
          </motion.button>
        ))}
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mt-12 space-y-6 w-full">
          <div className="p-8 rounded-3xl border bg-emerald-500/10 border-emerald-500/20">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-1">Puzzle Solved!</h3>
            <p className="text-slate-400">Completed in {moves} moves.</p>
          </div>
          <button onClick={initGame} className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
            Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
}