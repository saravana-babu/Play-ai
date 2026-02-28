import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Brain } from 'lucide-react';

export default function ChimpTest() {
  const [level, setLevel] = useState(4);
  const [grid, setGrid] = useState<(number | null)[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const gridSize = 40; // 5x8 grid

  const generateLevel = (count: number) => {
    const newGrid = Array(gridSize).fill(null);
    const positions = [...Array(gridSize).keys()].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      newGrid[positions[i]] = i + 1;
    }
    setGrid(newGrid);
    setNextNumber(1);
    setHidden(false);
  };

  const initGame = () => {
    setLevel(4);
    setGameOver(false);
    setFunnyTask(null);
    generateLevel(4);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCellClick = (val: number | null) => {
    if (gameOver || val === null) return;

    if (val === nextNumber) {
      if (val === 1) setHidden(true);
      
      if (val === level) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        generateLevel(nextLevel);
      } else {
        setNextNumber(val + 1);
        const newGrid = [...grid];
        const idx = grid.indexOf(val);
        newGrid[idx] = null;
        setGrid(newGrid);
      }
    } else {
      handleEnd();
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (level < 10 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Chimp Test');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'chimptest',
          winner: level >= 10 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-xl text-white">Level: {level}</span>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {!gameOver ? (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl w-full">
          {grid.map((val, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(val)}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all
                ${val === null ? 'bg-transparent cursor-default' : 'bg-white text-slate-950 hover:bg-slate-200'}
              `}
            >
              {val !== null ? (hidden && val > 1 ? '' : val) : ''}
            </button>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${level >= 10 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Skull className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <h3 className="text-3xl font-bold text-white mb-2">Test Failed!</h3>
            <p className="text-slate-400">You reached level {level}. The average human can reach level 9.</p>
          </div>

          {funnyTask && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
              <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </motion.div>
      )}

      {!gameOver && (
        <p className="mt-8 text-slate-500 text-sm text-center">
          Click the numbers in order. <br />
          After the first click, the remaining numbers will be hidden!
        </p>
      )}
    </div>
  );
}