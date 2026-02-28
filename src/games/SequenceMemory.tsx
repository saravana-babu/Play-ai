import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Zap } from 'lucide-react';

export default function SequenceMemory() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [state, setState] = useState<'showing' | 'playing' | 'gameOver'>('showing');
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const size = 3;

  const playSequence = useCallback(async (seq: number[]) => {
    setState('showing');
    for (const idx of seq) {
      setActiveTile(idx);
      await new Promise(r => setTimeout(r, 600));
      setActiveTile(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setState('playing');
    setUserSequence([]);
  }, []);

  const addToSequence = useCallback(() => {
    const next = Math.floor(Math.random() * (size * size));
    const newSequence = [...sequence, next];
    setSequence(newSequence);
    playSequence(newSequence);
  }, [sequence, playSequence]);

  const initGame = () => {
    setSequence([]);
    setUserSequence([]);
    setFunnyTask(null);
    const first = Math.floor(Math.random() * (size * size));
    setSequence([first]);
    playSequence([first]);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleTileClick = (idx: number) => {
    if (state !== 'playing') return;

    setActiveTile(idx);
    setTimeout(() => setActiveTile(null), 200);

    const newUserSequence = [...userSequence, idx];
    setUserSequence(newUserSequence);

    if (idx !== sequence[newUserSequence.length - 1]) {
      handleEnd();
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setTimeout(addToSequence, 1000);
    }
  };

  const handleEnd = async () => {
    setState('gameOver');
    let task = null;
    if (sequence.length < 10 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Sequence Memory');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'sequence',
          winner: sequence.length >= 10 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-xl text-white">Level: {sequence.length}</span>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {state !== 'gameOver' ? (
        <div className="grid grid-cols-3 gap-3 bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl w-full aspect-square">
          {[...Array(size * size)].map((_, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className={`w-full h-full rounded-2xl transition-all duration-200
                ${activeTile === i ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)]' : 'bg-slate-800 hover:bg-slate-700'}
              `}
            />
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${sequence.length >= 10 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Skull className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <h3 className="text-3xl font-bold text-white mb-2">Sequence Broken!</h3>
            <p className="text-slate-400">You reached level {sequence.length}.</p>
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
        <p className="mt-8 text-slate-500 text-sm">Repeat the sequence</p>
      )}
    </div>
  );
}
