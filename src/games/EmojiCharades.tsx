import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, HelpCircle, Send, Loader2 } from 'lucide-react';

interface Charade {
  emojis: string;
  answer: string;
  category: string;
}

export default function EmojiCharades() {
  const [charade, setCharade] = useState<Charade | null>(null);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const generateCharade = async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    setFeedback(null);
    setGuess('');
    try {
      const systemInstruction = `You are a creative game master playing Emoji Charades.
      Generate a sequence of emojis representing a well-known movie, book, TV show, or pop culture phrase.
      Return ONLY a JSON object with the following structure:
      {
        "emojis": "👽🚲🌕",
        "answer": "ET",
        "category": "Movie"
      }
      Make sure the answer is relatively short and recognizable.`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'emojicharades',
        { score, previousAnswer: charade?.answer },
        systemInstruction
      );

      if (!isMounted.current) return;

      if (response && response.emojis && response.answer && response.category) {
        setCharade(response);
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('Charade generation error:', error);
      // Fallback
      setCharade({
        emojis: '🕷️👨🕸️',
        answer: 'Spider-Man',
        category: 'Movie'
      });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setTimeout(() => {
          if (isMounted.current) inputRef.current?.focus();
        }, 100);
      }
    }
  };

  const initGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFunnyTask(null);
    setCharade(null);
    resetSessionTokens();
    generateCharade();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isLoading || gameOver || !charade) return;

    const normalizedGuess = guess.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedAnswer = charade.answer.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normalizedGuess === normalizedAnswer || normalizedAnswer.includes(normalizedGuess) && normalizedGuess.length > 3) {
      // Correct guess
      setScore(s => s + 1);
      setFeedback({ type: 'success', message: 'Correct! +1 Point' });
      setTimeout(() => {
        generateCharade();
      }, 1500);
    } else {
      // Incorrect guess
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback({ type: 'error', message: 'Incorrect! Try again.' });
      
      if (newLives <= 0) {
        handleGameOver();
      } else {
        setTimeout(() => setFeedback(null), 1500);
      }
    }
  };

  const handleGameOver = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Emoji Charades');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'emojicharades',
          winner: 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Score</p>
            <p className="text-2xl font-black text-indigo-400">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Lives</p>
            <div className="flex gap-1 mt-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full ${i < lives ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-800'}`} 
                />
              ))}
            </div>
          </div>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">AI is thinking of a charade...</p>
          </div>
        ) : charade && !gameOver ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center gap-8"
          >
            <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-widest">
              {charade.category}
            </div>
            
            <div className="text-6xl sm:text-8xl tracking-widest text-center drop-shadow-2xl">
              {charade.emojis}
            </div>

            <form onSubmit={handleGuess} className="w-full max-w-md relative mt-4">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Guess the answer..."
                className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors pr-16"
                disabled={!!feedback}
              />
              <button 
                type="submit"
                disabled={!guess.trim() || !!feedback}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`px-6 py-3 rounded-xl font-bold ${
                    feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-8"
            >
              <div className="text-center space-y-8 max-w-md w-full">
                <div className="space-y-2">
                  <Skull className="w-20 h-20 text-rose-500 mx-auto" />
                  <h2 className="text-4xl font-black text-white">Game Over</h2>
                  <p className="text-slate-400">You scored {score} points!</p>
                  {charade && (
                    <p className="text-lg text-white mt-4">
                      The last answer was: <strong className="text-indigo-400">{charade.answer}</strong>
                    </p>
                  )}
                </div>

                {funnyTask && (
                  <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                    <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                  </div>
                )}

                <button
                  onClick={initGame}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25"
                >
                  Play Again
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
            The AI will generate a sequence of emojis representing a movie, book, phrase, or pop culture reference. Type your guess in the box. You have 3 lives!
          </p>
        </div>
      </div>
    </div>
  );
}
