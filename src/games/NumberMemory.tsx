import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Hash } from 'lucide-react';

export default function NumberMemory() {
  const [level, setLevel] = useState(1);
  const [number, setNumber] = useState('');
  const [input, setInput] = useState('');
  const [state, setState] = useState<'showing' | 'typing' | 'result' | 'gameOver'>('showing');
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generateNumber = (l: number) => {
    let num = '';
    for (let i = 0; i < l; i++) {
      num += Math.floor(Math.random() * 10).toString();
    }
    setNumber(num);
    setInput('');
    setState('showing');
    
    // Show time increases with length
    const showTime = Math.max(2000, l * 1000);
    setTimeout(() => {
      setState('typing');
    }, showTime);
  };

  const initGame = () => {
    setLevel(1);
    setFunnyTask(null);
    generateNumber(1);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== 'typing') return;

    if (input === number) {
      setState('result');
      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        generateNumber(nextLevel);
      }, 1000);
    } else {
      handleEnd();
    }
  };

  const handleEnd = async () => {
    setState('gameOver');
    let task = null;
    if (level < 10 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Number Memory');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'numbermemory',
          winner: level >= 10 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-12 items-center px-4">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <Hash className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-xl text-white">Level: {level}</span>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {state === 'showing' && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-4">Remember this number</p>
          <h2 className="text-6xl font-black text-white tracking-tighter">{number}</h2>
          <div className="mt-12 h-1 bg-slate-800 rounded-full overflow-hidden w-64 mx-auto">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: Math.max(2, level), ease: 'linear' }}
              className="h-full bg-indigo-500"
            />
          </div>
        </motion.div>
      )}

      {state === 'typing' && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full space-y-8"
        >
          <p className="text-center text-slate-400">What was the number?</p>
          <form onSubmit={handleSubmit}>
            <input
              autoFocus
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-slate-950 border-2 border-white/10 rounded-2xl px-6 py-4 text-4xl text-center font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button 
              type="submit"
              className="w-full mt-6 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all"
            >
              Submit
            </button>
          </form>
        </motion.div>
      )}

      {state === 'result' && (
        <motion.div initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <Trophy className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-white">Correct!</h3>
        </motion.div>
      )}

      {state === 'gameOver' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className="p-10 rounded-3xl border bg-rose-500/10 border-rose-500/20">
            <Skull className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <h3 className="text-3xl font-bold text-white mb-2">Wrong Number!</h3>
            <p className="text-slate-400 mb-4">The number was: <span className="text-white font-bold">{number}</span></p>
            <p className="text-slate-400">Your answer: <span className="text-rose-400 font-bold">{input}</span></p>
            <p className="text-slate-400 mt-4">You reached level {level}.</p>
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
    </div>
  );
}
