import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Keyboard, Timer, Target } from 'lucide-react';

export default function TypingTest() {
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initGame = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setInput('');
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setGameOver(false);
    setFunnyTask(null);
    resetSessionTokens();

    try {
      const response = await getLlmResponse(
        'Generate a single paragraph of about 30-40 words for a typing test. It should be interesting and use common words. Respond with ONLY the paragraph.',
        apiKeys,
        selectedLlm,
        undefined,
        'typing'
      );
      if (!isMounted.current) return;
      setText(response.trim());
    } catch (err) {
      if (!isMounted.current) return;
      setText('The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Success is not final, failure is not fatal: it is the courage to continue that counts.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (gameOver) return;
    const val = e.target.value;
    
    if (!startTime) setStartTime(Date.now());
    
    setInput(val);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === text[i]) correct++;
    }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100);

    // Calculate WPM
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 60000; // in minutes
      const words = val.length / 5;
      setWpm(Math.round(words / timeElapsed));
    }

    if (val.length >= text.length) {
      handleEnd();
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (wpm < 40 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Typing Test');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'typing',
          winner: wpm >= 40 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-2xl border border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
            <Keyboard className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">WPM</span>
          </div>
          <p className="text-3xl font-bold text-white">{wpm}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-white">{accuracy}%</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Time</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
          </p>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 mb-8 relative">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            <span className="text-slate-400">Loading text...</span>
          </div>
        ) : (
          <div className="text-xl leading-relaxed font-mono select-none">
            {text.split('').map((char, i) => {
              let color = 'text-slate-600';
              if (i < input.length) {
                color = input[i] === char ? 'text-emerald-400' : 'bg-rose-500/30 text-rose-400';
              } else if (i === input.length) {
                color = 'text-white border-b-2 border-indigo-500 animate-pulse';
              }
              return <span key={i} className={color}>{char}</span>;
            })}
          </div>
        )}
      </div>

      {!gameOver && !loading && (
        <textarea
          autoFocus
          value={input}
          onChange={handleInput}
          className="w-full h-0 opacity-0 absolute"
        />
      )}

      {gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
          <div className={`p-8 rounded-3xl border ${wpm >= 40 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Trophy className={`w-12 h-12 mx-auto mb-4 ${wpm >= 40 ? 'text-yellow-400' : 'text-slate-500'}`} />
            <h3 className="text-3xl font-bold text-white mb-2">{wpm >= 40 ? 'Speed Demon!' : 'Keep Practicing!'}</h3>
            <p className="text-slate-400">You typed at {wpm} WPM with {accuracy}% accuracy.</p>
          </div>

          {funnyTask && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md mx-auto">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
              <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </motion.div>
      )}

      {!gameOver && !loading && (
        <div className="text-center text-slate-500 text-sm">
          Start typing to begin the test
        </div>
      )}
    </div>
  );
}