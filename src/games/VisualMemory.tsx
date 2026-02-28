import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Eye } from 'lucide-react';

export default function VisualMemory() {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<number[]>([]);
  const [targetIndices, setTargetIndices] = useState<number[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [state, setState] = useState<'showing' | 'playing' | 'result' | 'gameOver'>('showing');
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const getGridSize = (l: number) => {
    if (l <= 2) return 3;
    if (l <= 5) return 4;
    if (l <= 10) return 5;
    return 6;
  };

  const getTargetCount = (l: number) => l + 2;

  const generateLevel = useCallback((l: number) => {
    const size = getGridSize(l);
    const count = size * size;
    const targetCount = getTargetCount(l);
    
    const targets: number[] = [];
    while (targets.length < targetCount) {
      const idx = Math.floor(Math.random() * count);
      if (!targets.includes(idx)) targets.push(idx);
    }
    
    setTargetIndices(targets);
    setSelectedIndices([]);
    setState('showing');
    
    setTimeout(() => {
      setState('playing');
    }, 2000);
  }, []);

  const initGame = () => {
    setLevel(1);
    setFunnyTask(null);
    generateLevel(1);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleTileClick = (idx: number) => {
    if (state !== 'playing') return;
    
    if (targetIndices.includes(idx)) {
      if (!selectedIndices.includes(idx)) {
        const newSelected = [...selectedIndices, idx];
        setSelectedIndices(newSelected);
        if (newSelected.length === targetIndices.length) {
          setState('result');
          setTimeout(() => {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            generateLevel(nextLevel);
          }, 1000);
        }
      }
    } else {
      handleEnd();
    }
  };

  const handleEnd = async () => {
    setState('gameOver');
    let task = null;
    if (level < 10 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Visual Memory');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'visualmemory',
          winner: level >= 10 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  const size = getGridSize(level);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-xl text-white">Level: {level}</span>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {state !== 'gameOver' ? (
        <div 
          className="grid gap-2 bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl w-full aspect-square"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {[...Array(size * size)].map((_, i) => {
            const isTarget = targetIndices.includes(i);
            const isSelected = selectedIndices.includes(i);
            const isShowing = state === 'showing' || state === 'result';
            
            return (
              <button
                key={i}
                onClick={() => handleTileClick(i)}
                className={`w-full h-full rounded-lg transition-all duration-300
                  ${isShowing && isTarget ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 
                    isSelected ? 'bg-white' : 'bg-slate-800 hover:bg-slate-700'}
                `}
              />
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${level >= 10 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Skull className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <h3 className="text-3xl font-bold text-white mb-2">Memory Failed!</h3>
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

      {state === 'playing' && (
        <p className="mt-8 text-slate-500 text-sm">Select the squares that were white</p>
      )}
    </div>
  );
}
