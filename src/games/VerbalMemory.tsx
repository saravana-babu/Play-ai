import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Loader2, Heart } from 'lucide-react';

export default function VerbalMemory() {
  const [words, setWords] = useState<string[]>([]);
  const [seenWords, setSeenWords] = useState<Set<string>>(new Set<string>());
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = async () => {
    setLoading(true);
    setScore(0);
    setLives(3);
    setSeenWords(new Set<string>());
    setGameOver(false);
    setFunnyTask(null);

    try {
      const response = await getLlmResponse(
        'Generate a list of 50 common English nouns. Respond with ONLY JSON: {"words": ["...", ...]}',
        apiKeys,
        selectedLlm
      );
      const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
      setWords(data.words);
      pickNextWord(data.words, new Set());
    } catch (err) {
      const fallbacks = ['APPLE', 'DOG', 'HOUSE', 'CAR', 'BOOK', 'PHONE', 'WATER', 'TREE', 'BIRD', 'FISH'];
      setWords(fallbacks);
      pickNextWord(fallbacks, new Set());
    } finally {
      setLoading(false);
    }
  };

  const pickNextWord = (wordList: string[], seen: Set<string>) => {
    // 50% chance to show a seen word if we have any
    if (seen.size > 0 && Math.random() > 0.5) {
      const seenArray = Array.from(seen);
      setCurrentWord(seenArray[Math.floor(Math.random() * seenArray.length)]);
    } else {
      const unseen = wordList.filter(w => !seen.has(w));
      if (unseen.length === 0) {
        // If all words seen, just pick any
        setCurrentWord(wordList[Math.floor(Math.random() * wordList.length)]);
      } else {
        setCurrentWord(unseen[Math.floor(Math.random() * unseen.length)]);
      }
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleChoice = (choice: 'seen' | 'new') => {
    if (gameOver || loading) return;

    const isSeen = seenWords.has(currentWord);
    const correct = (choice === 'seen' && isSeen) || (choice === 'new' && !isSeen);

    if (correct) {
      setScore(s => s + 1);
      const newSeen = new Set<string>(seenWords);
      newSeen.add(currentWord);
      setSeenWords(newSeen);
      pickNextWord(words, newSeen);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        handleEnd();
      } else {
        const newSeen = new Set<string>(seenWords);
        newSeen.add(currentWord);
        setSeenWords(newSeen);
        pickNextWord(words, newSeen);
      }
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (score < 20 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Verbal Memory');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'verbalmemory',
          winner: score >= 20 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-12 items-center px-4">
        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Lives</p>
            <div className="flex gap-1 mt-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
              ))}
            </div>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Score</p>
            <p className="text-xl font-bold text-white">{score}</p>
          </div>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {!gameOver ? (
        <div className="w-full space-y-12">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400">Loading dictionary...</p>
            </div>
          ) : (
            <div className="text-center space-y-12">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={currentWord}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-5xl font-black text-white tracking-tight"
                >
                  {currentWord}
                </motion.h2>
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleChoice('seen')}
                  className="py-6 bg-indigo-500 text-white rounded-3xl font-bold text-xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
                >
                  SEEN
                </button>
                <button
                  onClick={() => handleChoice('new')}
                  className="py-6 bg-slate-800 text-white rounded-3xl font-bold text-xl hover:bg-slate-700 transition-all border border-white/10"
                >
                  NEW
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${score >= 20 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <Skull className="w-12 h-12 mx-auto mb-4 text-rose-400" />
            <h3 className="text-3xl font-bold text-white mb-2">Out of Lives!</h3>
            <p className="text-slate-400">Final Score: <span className="text-white font-bold">{score}</span></p>
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
