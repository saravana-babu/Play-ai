import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Loader2, CheckCircle2 } from 'lucide-react';

export default function Anagrams() {
  const [word, setWord] = useState('');
  const [anagram, setAnagram] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
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
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    setScore(0);
    setTimeLeft(60);
    resetSessionTokens();
    await nextWord();
  };

  const nextWord = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setInput('');
    try {
      const response = await getLlmResponse(
        'Generate a single common English word (5-8 letters) and its anagram (scrambled version). Respond with ONLY JSON: {"word": "...", "anagram": "..."}',
        apiKeys,
        selectedLlm,
        undefined,
        'anagrams'
      );
      if (!isMounted.current) return;
      const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
      setWord(data.word.toUpperCase());
      setAnagram(data.anagram.toUpperCase());
    } catch (err) {
      if (!isMounted.current) return;
      const fallbacks = [
        { word: 'REACT', anagram: 'ACTER' },
        { word: 'LISTEN', anagram: 'SILENT' },
        { word: 'PLANET', anagram: 'PLATEN' }
      ];
      const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setWord(pick.word);
      setAnagram(pick.anagram);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toUpperCase() === word) {
      setScore(s => s + 1);
      nextWord();
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (score < 3 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Anagrams');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'anagrams',
          winner: score >= 3 ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-12">
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
          <span className="text-sm font-bold text-indigo-400">{timeLeft}s</span>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Solved</p>
          <p className="text-xl font-bold text-white">{score}</p>
        </div>
      </div>

      {!gameOver ? (
        <div className="w-full space-y-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400">Scrambling letters...</p>
            </div>
          ) : (
            <div className="text-center space-y-8">
              <motion.div 
                key={anagram}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex justify-center gap-2"
              >
                {anagram.split('').map((char, i) => (
                  <div key={i} className="w-12 h-14 bg-slate-800 rounded-xl border border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                    {char}
                  </div>
                ))}
              </motion.div>

              <form onSubmit={handleSubmit}>
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-white/10 rounded-2xl px-6 py-4 text-3xl text-center font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="Unscramble..."
                />
              </form>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${score >= 3 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <h3 className="text-3xl font-bold text-white mb-2">{score >= 3 ? 'Word Wizard!' : 'Time\'s Up!'}</h3>
            <p className="text-slate-400">You unscrambled {score} words.</p>
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