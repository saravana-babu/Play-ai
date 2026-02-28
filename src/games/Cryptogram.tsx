import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Key } from 'lucide-react';

export default function Cryptogram() {
  const [originalText, setOriginalText] = useState('');
  const [cipherMap, setCipherMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generatePuzzle = async () => {
    setLoading(true);
    try {
      const systemInstruction = `You are a Cryptogram Generator. 
      Provide a famous short quote (max 60 characters).
      
      Return ONLY a JSON object:
      {
        "quote": "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
        "author": "Anonymous"
      }`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'cryptogram',
        { score },
        systemInstruction
      );

      if (response && response.quote) {
        const quote = response.quote.toUpperCase();
        setOriginalText(quote);
        
        // Generate cipher map
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
        const map: Record<string, string> = {};
        alphabet.forEach((char, i) => {
          map[char] = shuffled[i];
        });
        setCipherMap(map);
        setUserMap({});
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('Cryptogram Generation Error:', error);
      const fallback = "TO BE OR NOT TO BE THAT IS THE QUESTION";
      setOriginalText(fallback);
      // Simple shift cipher for fallback
      const map: Record<string, string> = {};
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((char, i) => {
        map[char] = 'BCDEFGHIJKLMNOPQRSTUVWXYZA'[i];
      });
      setCipherMap(map);
      setUserMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePuzzle();
  }, []);

  const handleCharChange = (cipherChar: string, value: string) => {
    const upperValue = value.toUpperCase();
    if (upperValue.length > 1) return;
    
    setUserMap(prev => ({
      ...prev,
      [cipherChar]: upperValue
    }));
  };

  const checkSolution = () => {
    const isCorrect = originalText.split('').every(char => {
      if (!/[A-Z]/.test(char)) return true;
      const cipherChar = cipherMap[char];
      return userMap[cipherChar] === char;
    });

    if (isCorrect) {
      setScore(s => s + 1);
      if (score + 1 >= 3) {
        handleEnd(true);
      } else {
        generatePuzzle();
      }
    }
  };

  const handleEnd = async (isWin: boolean) => {
    setGameOver(true);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Cryptogram');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'cryptogram',
          winner: isWin ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setFunnyTask(null);
    generatePuzzle();
  };

  const cipherText = originalText.split('').map(char => {
    if (/[A-Z]/.test(char)) return cipherMap[char];
    return char;
  }).join('');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Puzzles Solved</p>
            <p className="text-2xl font-black text-indigo-400">{score}/3</p>
          </div>
        </div>
        <button onClick={resetGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">AI is encrypting a message...</p>
            </motion.div>
          ) : gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="space-y-2">
                <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-white">Victory!</h2>
                <p className="text-slate-400">You decoded all messages!</p>
              </div>
              <button
                onClick={resetGame}
                className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                Play Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-8">
                {cipherText.split(' ').map((word, wordIdx) => (
                  <div key={wordIdx} className="flex gap-2">
                    {word.split('').map((char, charIdx) => (
                      <div key={charIdx} className="flex flex-col items-center gap-2">
                        {/[A-Z]/.test(char) ? (
                          <>
                            <input
                              type="text"
                              maxLength={1}
                              value={userMap[char] || ''}
                              onChange={(e) => handleCharChange(char, e.target.value)}
                              className="w-10 h-12 bg-slate-800 border-b-2 border-indigo-500 text-center text-xl font-bold text-white focus:outline-none focus:bg-indigo-500/20 transition-colors uppercase"
                            />
                            <span className="text-xs font-mono text-slate-500">{char}</span>
                          </>
                        ) : (
                          <div className="w-10 h-12 flex items-center justify-center text-2xl font-bold text-slate-400">
                            {char}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={checkSolution}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Key className="w-5 h-5" /> Check Solution
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
        <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm text-white font-bold">How to Play</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each letter in the message has been replaced with a different letter. 
            Your goal is to figure out the substitution and decode the original message. 
            Type your guesses into the boxes above the cipher letters.
          </p>
        </div>
      </div>
    </div>
  );
}
