import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Eye, Timer } from 'lucide-react';

export default function ColorblindTest() {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generateLevel = (currentLevel: number) => {
    const size = Math.min(2 + Math.floor(currentLevel / 2), 8);
    const count = size * size;
    
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 40;
    const l = Math.floor(Math.random() * 40) + 30;
    
    const baseColor = `hsl(${h}, ${s}%, ${l}%)`;
    const diff = Math.max(2, 20 - currentLevel);
    const targetColor = `hsl(${h}, ${s}%, ${l + diff}%)`;
    
    const newGrid = Array(count).fill(baseColor);
    const target = Math.floor(Math.random() * count);
    newGrid[target] = targetColor;
    
    setGrid(newGrid);
    setTargetIndex(target);
    setTimeLeft(15);
  };

  const initGame = () => {
    setLevel(1);
    setGameOver(false);
    setFunnyTask(null);
    generateLevel(1);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameOver) {
      handleEnd();
    }
  }, [timeLeft, gameOver]);

  const handleTileClick = (index: number) => {
    if (gameOver) return;
    if (index === targetIndex) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      generateLevel(nextLevel);
    } else {
      setTimeLeft(prev => Math.max(0, prev - 2));
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (level < 15 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Colorblind Test');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'colorblind',
          winner: level >= 15 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  const size = Math.min(2 + Math.floor(level / 2), 8);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-8 items-center">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Timer className={`w-5 h-5 ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`} />
          <span className={`font-bold text-xl ${timeLeft < 5 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}s</span>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Level</p>
          <p className="text-xl font-bold text-white">{level}</p>
        </div>
      </div>

      {!gameOver ? (
        <div 
          className="grid gap-2 bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-2xl w-full aspect-square"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((color, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className="w-full h-full rounded-lg transition-transform active:scale-95"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${level >= 15 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Eye className={`w-12 h-12 mx-auto mb-4 ${level >= 15 ? 'text-emerald-400' : 'text-rose-400'}`} />
            <h3 className="text-3xl font-bold text-white mb-2">{level >= 15 ? 'Eagle Eye!' : 'Time\'s Up!'}</h3>
            <p className="text-slate-400">You reached level {level}.</p>
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
        <p className="mt-8 text-slate-500 text-sm">Find the tile with the slightly different color</p>
      )}
    </div>
  );
}