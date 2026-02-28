import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Play } from 'lucide-react';

const COLORS = [
  { id: 0, color: 'bg-rose-500', active: 'bg-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.6)]', sound: 261.63 }, // C4
  { id: 1, color: 'bg-indigo-500', active: 'bg-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.6)]', sound: 293.66 }, // D4
  { id: 2, color: 'bg-emerald-500', active: 'bg-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.6)]', sound: 329.63 }, // E4
  { id: 3, color: 'bg-amber-500', active: 'bg-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.6)]', sound: 349.23 }, // F4
];

export default function SimonSays() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const playSound = (freq: number) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  };

  const playSequence = useCallback(async (newSequence: number[]) => {
    if (!isMounted.current) return;
    setIsPlaying(true);
    for (const id of newSequence) {
      if (!isMounted.current) break;
      setActiveColor(id);
      playSound(COLORS[id].sound);
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted.current) break;
      setActiveColor(null);
      await new Promise(r => setTimeout(r, 200));
    }
    if (isMounted.current) {
      setIsPlaying(false);
    }
  }, []);

  const addToSequence = useCallback(() => {
    const next = Math.floor(Math.random() * 4);
    const newSequence = [...sequence, next];
    setSequence(newSequence);
    setTimeout(() => playSequence(newSequence), 500);
  }, [sequence, playSequence]);

  const initGame = () => {
    setSequence([]);
    setUserSequence([]);
    setGameOver(false);
    setScore(0);
    setFunnyTask(null);
    resetSessionTokens();
    const first = Math.floor(Math.random() * 4);
    setSequence([first]);
    setTimeout(() => {
      if (isMounted.current) playSequence([first]);
    }, 500);
  };

  const handleColorClick = (id: number) => {
    if (isPlaying || gameOver || sequence.length === 0) return;

    setActiveColor(id);
    playSound(COLORS[id].sound);
    setTimeout(() => setActiveColor(null), 200);

    const newUserSequence = [...userSequence, id];
    setUserSequence(newUserSequence);

    if (id !== sequence[newUserSequence.length - 1]) {
      handleEnd();
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setScore(sequence.length);
      setUserSequence([]);
      setTimeout(addToSequence, 1000);
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (score < 5 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Simon Says');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'simonsays',
          winner: score >= 5 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="mb-8 text-center">
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Current Score</p>
        <p className="text-4xl font-bold text-white">{score}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-slate-800 p-6 rounded-[40px] border border-white/10 shadow-2xl relative">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleColorClick(c.id)}
            disabled={isPlaying || gameOver}
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-3xl transition-all duration-200 
              ${activeColor === c.id ? c.active : c.color}
              ${isPlaying || gameOver ? 'cursor-default' : 'hover:brightness-110 active:scale-95'}
            `}
          />
        ))}

        <AnimatePresence>
          {sequence.length === 0 && !gameOver && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-[40px] backdrop-blur-sm"
            >
              <button 
                onClick={initGame}
                className="w-20 h-20 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-12 space-y-6 w-full">
          <div className={`p-8 rounded-3xl border ${score >= 5 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              {score >= 5 ? <Trophy className="w-8 h-8 text-yellow-400" /> : <Skull className="w-8 h-8 text-rose-400" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{score >= 5 ? 'Great Memory!' : 'Wrong Sequence!'}</h3>
            <p className="text-slate-400">Final Score: {score}</p>
          </div>

          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </motion.div>
      )}
    </div>
  );
}