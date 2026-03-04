import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { fetchApi } from '../lib/api';
import { generateFunnyTask } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Grid = number[][];

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { user, apiKeys, selectedLlm, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initGame = useCallback(() => {
    let newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setFunnyTask(null);
    resetSessionTokens();
  }, [resetSessionTokens]);

  const addRandomTile = (currentGrid: Grid): Grid => {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentGrid;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const rotateGrid = (g: Grid) => {
      const rotated = Array(4).fill(0).map(() => Array(4).fill(0));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          rotated[c][3 - r] = g[r][c];
        }
      }
      return rotated;
    };

    // Standardize to move left
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) newGrid = rotateGrid(newGrid);

    // Move left logic
    for (let r = 0; r < 4; r++) {
      let row = newGrid[r].filter(val => val !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          newScore += row[i];
          row.splice(i + 1, 1);
          moved = true;
        }
      }
      while (row.length < 4) row.push(0);
      if (JSON.stringify(newGrid[r]) !== JSON.stringify(row)) moved = true;
      newGrid[r] = row;
    }

    // Rotate back
    for (let i = 0; i < (4 - rotations) % 4; i++) newGrid = rotateGrid(newGrid);

    if (moved) {
      const gridWithNewTile = addRandomTile(newGrid);
      setGrid(gridWithNewTile);
      setScore(newScore);

      // Check game over
      if (isGameOver(gridWithNewTile)) {
        setGameOver(true);
        handleEnd(newScore);
      }
    }
  }, [grid, score, gameOver]);

  const isGameOver = (g: Grid) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return false;
        if (r < 3 && g[r][c] === g[r + 1][c]) return false;
        if (c < 3 && g[r][c] === g[r][c + 1]) return false;
      }
    }
    return true;
  };

  const handleEnd = async (finalScore: number) => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (finalScore < 2048 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, '2048');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: '2048',
          winner: finalScore >= 2048 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
      else if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileColor = (val: number) => {
    const colors: Record<number, string> = {
      2: 'bg-slate-200 text-slate-800',
      4: 'bg-slate-300 text-slate-800',
      8: 'bg-orange-200 text-slate-800',
      16: 'bg-orange-300 text-white',
      32: 'bg-orange-400 text-white',
      64: 'bg-orange-500 text-white',
      128: 'bg-yellow-200 text-slate-800',
      256: 'bg-yellow-300 text-slate-800',
      512: 'bg-yellow-400 text-white',
      1024: 'bg-yellow-500 text-white',
      2048: 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50',
    };
    return colors[val] || 'bg-slate-700 text-white';
  };

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <div className="flex justify-between w-full mb-8 items-center">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</p>
          <p className="text-2xl font-bold text-white">{score}</p>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-slate-800 p-3 rounded-2xl border border-white/10 shadow-2xl relative">
        <div className="grid grid-cols-4 gap-3">
          {grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/50 rounded-lg" />
          )))}
        </div>

        <div className="absolute inset-3 grid grid-cols-4 gap-3">
          <AnimatePresence>
            {grid.map((row, r) => row.map((cell, c) => cell !== 0 && (
              <motion.div
                key={`${r}-${c}-${cell}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold ${getTileColor(cell)}`}
              >
                {cell}
              </motion.div>
            )))}
          </AnimatePresence>
        </div>

        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
            <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-3xl font-bold text-white mb-2">Game Over!</h3>
            <p className="text-slate-400 mb-6">Final Score: {score}</p>
            <ShareButtons
              gameTitle="2048"
              result={score >= 2048 ? 'reached the legendary 2048 tile' : `reached a score of ${score}`}
              score={score}
              penalty={funnyTask}
            />
            <button onClick={initGame} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors mt-4">
              Try Again
            </button>
          </motion.div>
        )}
      </div>

      <div className="mt-8 text-slate-500 text-sm flex items-center gap-2">
        <div className="flex gap-1">
          <span className="px-2 py-1 bg-slate-800 rounded border border-white/10">↑</span>
          <span className="px-2 py-1 bg-slate-800 rounded border border-white/10">↓</span>
          <span className="px-2 py-1 bg-slate-800 rounded border border-white/10">←</span>
          <span className="px-2 py-1 bg-slate-800 rounded border border-white/10">→</span>
        </div>
        <span>Use arrow keys to move</span>
      </div>
    </div>
  );
}