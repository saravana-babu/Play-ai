import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Zap, AlertCircle } from 'lucide-react';

export default function ReactionTime() {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startTest = () => {
    setState('waiting');
    setReactionTime(null);
    setFunnyTask(null);
    resetSessionTokens();
    
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    timeoutRef.current = setTimeout(() => {
      setState('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setState('early');
    } else if (state === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setState('result');
      handleEnd(time);
    } else if (state === 'idle' || state === 'result' || state === 'early') {
      startTest();
    }
  };

  const handleEnd = async (time: number) => {
    if (!isMounted.current) return;
    let task = null;
    if (time > 400 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Reaction Time');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'reaction',
          winner: time <= 400 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
      <button
        onClick={handleClick}
        className={`w-full h-[400px] rounded-[40px] flex flex-col items-center justify-center p-8 transition-all duration-75 select-none
          ${state === 'idle' ? 'bg-indigo-500 hover:bg-indigo-600' : 
            state === 'waiting' ? 'bg-rose-500' : 
            state === 'ready' ? 'bg-emerald-500' : 
            state === 'result' ? 'bg-slate-800' : 
            'bg-amber-500'}
        `}
      >
        {state === 'idle' && (
          <>
            <Zap className="w-20 h-20 text-white mb-6 animate-pulse" />
            <h2 className="text-4xl font-bold text-white mb-2">Reaction Time</h2>
            <p className="text-indigo-100 text-lg">Click anywhere to start</p>
          </>
        )}

        {state === 'waiting' && (
          <>
            <div className="flex gap-2 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-4 h-4 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Wait for Green...</h2>
          </>
        )}

        {state === 'ready' && (
          <>
            <h2 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter">Click Now!</h2>
          </>
        )}

        {state === 'early' && (
          <>
            <AlertCircle className="w-20 h-20 text-white mb-6" />
            <h2 className="text-4xl font-bold text-white mb-2">Too Early!</h2>
            <p className="text-amber-100 text-lg">Click to try again</p>
          </>
        )}

        {state === 'result' && (
          <div className="text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest mb-2">Your Time</p>
            <h2 className="text-7xl font-black text-white mb-6">{reactionTime}ms</h2>
            <div className="flex flex-col items-center gap-4">
              <div className={`px-6 py-2 rounded-full font-bold ${reactionTime! < 250 ? 'bg-emerald-500/20 text-emerald-400' : reactionTime! < 400 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {reactionTime! < 250 ? 'Godlike!' : reactionTime! < 400 ? 'Great!' : 'A bit slow...'}
              </div>
              <p className="text-slate-400">Click to try again</p>
            </div>
          </div>
        )}
      </button>

      {funnyTask && state === 'result' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md w-full text-center">
          <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
          <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
        </motion.div>
      )}
    </div>
  );
}