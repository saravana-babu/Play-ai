import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask, getLlmResponse } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, Loader2 } from 'lucide-react';
import ShareButton from '../components/ShareButton';

export default function Hangman() {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<boolean>(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const maxMistakes = 6;

  const initGame = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setGuessed([]);
    setMistakes(0);
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    resetSessionTokens();

    try {
      const response = await getLlmResponse(
        'Generate a single random English word for a game of hangman. The word should be common but challenging (6-10 letters). Respond with ONLY the word.',
        apiKeys,
        selectedLlm,
        undefined,
        'hangman'
      );
      if (!isMounted.current) return;
      setWord(response.trim().toUpperCase());
    } catch (err) {
      if (!isMounted.current) return;
      const fallbacks = ['REACT', 'VITE', 'JAVASCRIPT', 'PROGRAMMING', 'NEUROPLAY'];
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

  const handleGuess = (letter: string) => {
    if (guessed.includes(letter) || gameOver || loading) return;

    const newGuessed = [...guessed, letter];
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= maxMistakes) handleEnd(false);
    } else {
      const isWon = word.split('').every(l => newGuessed.includes(l));
      if (isWon) handleEnd(true);
    }
  };

  const handleEnd = async (isWin: boolean) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setWinner(isWin);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Hangman');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'hangman',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto">
      <div className="mb-12 relative w-48 h-64 border-b-4 border-slate-700">
        {/* Gallow */}
        <div className="absolute bottom-0 left-4 w-2 h-full bg-slate-700" />
        <div className="absolute top-0 left-4 w-32 h-2 bg-slate-700" />
        <div className="absolute top-0 right-12 w-1 h-8 bg-slate-700" />
        
        {/* Man */}
        {mistakes > 0 && <div className="absolute top-8 right-9 w-8 h-8 rounded-full border-4 border-slate-300" />}
        {mistakes > 1 && <div className="absolute top-16 right-12 w-1 h-16 bg-slate-300" />}
        {mistakes > 2 && <div className="absolute top-20 right-12 w-10 h-1 bg-slate-300 origin-left -rotate-45" />}
        {mistakes > 3 && <div className="absolute top-20 right-2 w-10 h-1 bg-slate-300 origin-right rotate-45" />}
        {mistakes > 4 && <div className="absolute top-32 right-12 w-10 h-1 bg-slate-300 origin-left rotate-45" />}
        {mistakes > 5 && <div className="absolute top-32 right-2 w-10 h-1 bg-slate-300 origin-right -rotate-45" />}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-indigo-400 mb-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-semibold">AI is choosing a word...</span>
        </div>
      ) : (
        <div className="flex gap-2 mb-12">
          {word.split('').map((letter, i) => (
            <div key={i} className="w-8 h-10 sm:w-10 sm:h-12 border-b-4 border-white/20 flex items-center justify-center text-2xl font-bold text-white">
              {guessed.includes(letter) || gameOver ? letter : ''}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 mb-8">
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={guessed.includes(letter) || gameOver || loading}
            className={`w-10 h-10 rounded-lg font-bold transition-all
              ${guessed.includes(letter) 
                ? (word.includes(letter) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 opacity-50')
                : 'bg-slate-800 text-white hover:bg-slate-700 border-white/5'}
              border
            `}
          >
            {letter}
          </button>
        ))}
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xl ${winner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {winner ? <><Trophy /> You Saved Him!</> : <><Skull /> He's Gone!</>}
          </div>
          {!winner && <p className="text-slate-400">The word was: <span className="text-white font-bold">{word}</span></p>}
          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-xs mx-auto">
              <p className="text-xs text-rose-400 font-semibold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200">{funnyTask}</p>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <button onClick={initGame} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold">
              <RefreshCw className="w-5 h-5" /> New Word
            </button>
            <ShareButton 
              gameTitle="Hangman" 
              winner={winner ? 'user' : 'ai'} 
              funnyTask={funnyTask} 
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}