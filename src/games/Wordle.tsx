import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Loader2 } from 'lucide-react';

export default function Wordle() {
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const maxGuesses = 6;

  const initGame = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    resetSessionTokens();

    try {
      const response = await getLlmResponse(
        'Generate a single random common 5-letter English word for a game of Wordle. Respond with ONLY the word.',
        apiKeys,
        selectedLlm,
        undefined,
        'wordle'
      );
      if (!isMounted.current) return;
      setWord(response.trim().toUpperCase());
    } catch (err) {
      if (!isMounted.current) return;
      const fallbacks = ['REACT', 'VITE', 'CLOUD', 'BRAIN', 'GAMES'];
      setWord(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleSubmit = () => {
    if (currentGuess.length !== 5 || gameOver || loading) return;

    const newGuesses = [...guesses, currentGuess.toUpperCase()];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess.toUpperCase() === word) {
      handleEnd(true);
    } else if (newGuesses.length >= maxGuesses) {
      handleEnd(false);
    }
  };

  const handleEnd = async (isWin: boolean) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setWinner(isWin);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Wordle');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'wordle',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  const getLetterStatus = (guess: string, index: number) => {
    const letter = guess[index];
    if (word[index] === letter) return 'bg-emerald-500 border-emerald-500 text-white';
    if (word.includes(letter)) return 'bg-amber-500 border-amber-500 text-white';
    return 'bg-slate-700 border-slate-700 text-slate-400';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || loading) return;
      if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Backspace') setCurrentGuess(prev => prev.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => (prev + e.key).toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, loading]);

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-medium">AI is thinking of a word...</p>
        </div>
      ) : (
        <div className="grid grid-rows-6 gap-2 mb-8">
          {[...Array(maxGuesses)].map((_, i) => {
            const guess = guesses[i] || (i === guesses.length ? currentGuess : '');
            const isSubmitted = i < guesses.length;

            return (
              <div key={i} className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-500
                      ${isSubmitted ? getLetterStatus(guess, j) : (guess[j] ? 'border-slate-500 text-white' : 'border-white/10 text-transparent')}
                    `}
                  >
                    {guess[j] || ''}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 w-full">
          <div className={`p-6 rounded-2xl border ${winner ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <h3 className="text-2xl font-bold text-white mb-1">{winner ? 'Genius!' : 'Better luck next time'}</h3>
            {!winner && <p className="text-slate-400">The word was: <span className="text-white font-bold">{word}</span></p>}
          </div>

          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all">
            <RefreshCw className="w-5 h-5" /> New Game
          </button>
        </motion.div>
      )}

      {!gameOver && !loading && (
        <div className="mt-8 text-slate-500 text-sm">
          Type on your keyboard and press Enter
        </div>
      )}
    </div>
  );
}