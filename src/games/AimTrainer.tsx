import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Target, Timer, Zap } from 'lucide-react';

export default function AimTrainer() {
  const [state, setState] = useState<'idle' | 'playing' | 'result'>('idle');
  const [targetsLeft, setTargetsLeft] = useState(30);
  const [startTime, setStartTime] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState<{ x: number; y: number } | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startTest = () => {
    setState('playing');
    setTargetsLeft(30);
    setTimes([]);
    setStartTime(Date.now());
    setFunnyTask(null);
    resetSessionTokens();
    spawnTarget();
  };

  const spawnTarget = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - 60) + 30;
    const y = Math.random() * (rect.height - 60) + 30;
    setCurrentTarget({ x, y });
    setStartTime(Date.now());
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state !== 'playing') return;

    const time = Date.now() - startTime;
    const newTimes = [...times, time];
    setTimes(newTimes);

    if (targetsLeft > 1) {
      setTargetsLeft(prev => prev - 1);
      spawnTarget();
    } else {
      handleEnd(newTimes);
    }
  };

  const handleEnd = async (finalTimes: number[]) => {
    if (!isMounted.current) return;
    setState('result');
    const avg = finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length;
    
    let task = null;
    if (avg > 500 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Aim Trainer');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'aimtrainer',
          winner: avg <= 500 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
      <div className="flex justify-between w-full mb-8 px-4">
        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Targets Left</p>
            <p className="text-xl font-bold text-white">{targetsLeft}</p>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Time</p>
            <p className="text-xl font-bold text-indigo-400">{avgTime}ms</p>
          </div>
        </div>
        <button onClick={startTest} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div 
        ref={containerRef}
        onClick={() => state === 'playing' && setTimes(t => [...t, 1000])} // Penalty for missing
        className={`w-full h-[500px] rounded-[40px] border-4 border-slate-800 relative overflow-hidden transition-colors duration-300
          ${state === 'playing' ? 'bg-slate-950 cursor-crosshair' : 'bg-slate-900'}
        `}
      >
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <Target className="w-20 h-20 text-indigo-500 mb-6 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-2">Aim Trainer</h2>
            <p className="text-slate-400 text-lg mb-8">Click 30 targets as fast as you can</p>
            <button 
              onClick={startTest}
              className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
            >
              Start Training
            </button>
          </div>
        )}

        {state === 'playing' && currentTarget && (
          <motion.button
            key={`${targetsLeft}-${currentTarget.x}-${currentTarget.y}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleTargetClick}
            className="absolute w-12 h-12 rounded-full bg-indigo-500 border-4 border-white shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center"
            style={{ top: currentTarget.y, left: currentTarget.x, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </motion.button>
        )}

        {state === 'result' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 backdrop-blur-sm">
            <Zap className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-4xl font-bold text-white mb-2">Results</h3>
            <p className="text-slate-400 mb-8 text-xl">Average Reaction: <span className="text-white font-bold">{avgTime}ms</span></p>
            
            {funnyTask && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl mb-8 max-w-md">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
                <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}

            <button onClick={startTest} className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
              Try Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}