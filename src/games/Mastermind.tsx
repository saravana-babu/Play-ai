import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, CheckCircle2, Circle } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const COLORS = ['bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'];

export default function Mastermind() {
  const [code, setCode] = useState<number[]>([]);
  const [guesses, setGuesses] = useState<{ guess: number[]; feedback: { black: number; white: number } }[]>([]);
  const [currentGuess, setCurrentGuess] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();

  const maxGuesses = 10;

  const initGame = () => {
    const newCode = Array(4).fill(0).map(() => Math.floor(Math.random() * COLORS.length));
    setCode(newCode);
    setGuesses([]);
    setCurrentGuess([]);
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleColorClick = (colorIndex: number) => {
    if (currentGuess.length < 4 && !gameOver) {
      setCurrentGuess([...currentGuess, colorIndex]);
    }
  };

  const removeLastColor = () => {
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const submitGuess = () => {
    if (currentGuess.length !== 4 || gameOver) return;

    const feedback = getFeedback(currentGuess, code);
    const newGuesses = [...guesses, { guess: currentGuess, feedback }];
    setGuesses(newGuesses);
    setCurrentGuess([]);

    if (feedback.black === 4) {
      handleEnd(true);
    } else if (newGuesses.length >= maxGuesses) {
      handleEnd(false);
    }
  };

  const getFeedback = (guess: number[], target: number[]) => {
    let black = 0;
    let white = 0;
    const guessUsed = Array(4).fill(false);
    const targetUsed = Array(4).fill(false);

    // Black pegs
    for (let i = 0; i < 4; i++) {
      if (guess[i] === target[i]) {
        black++;
        guessUsed[i] = true;
        targetUsed[i] = true;
      }
    }

    // White pegs
    for (let i = 0; i < 4; i++) {
      if (!guessUsed[i]) {
        for (let j = 0; j < 4; j++) {
          if (!targetUsed[j] && guess[i] === target[j]) {
            white++;
            targetUsed[j] = true;
            break;
          }
        }
      }
    }

    return { black, white };
  };

  const handleEnd = async (isWin: boolean) => {
    setGameOver(true);
    setWinner(isWin);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Mastermind');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'mastermind',
          winner: isWin ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="w-full space-y-2 mb-8">
        {[...Array(maxGuesses)].map((_, i) => {
          const guessData = guesses[i];
          return (
            <div key={i} className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-2xl border border-white/5">
              <div className="w-6 text-xs font-bold text-slate-500">{i + 1}</div>
              <div className="flex gap-2 flex-1">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className={`w-8 h-8 rounded-full border border-white/10 ${guessData ? COLORS[guessData.guess[j]] : 'bg-slate-900'}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 w-10">
                {guessData && [...Array(guessData.feedback.black)].map((_, j) => (
                  <div key={`b-${j}`} className="w-2 h-2 rounded-full bg-white" />
                ))}
                {guessData && [...Array(guessData.feedback.white)].map((_, j) => (
                  <div key={`w-${j}`} className="w-2 h-2 rounded-full border border-white" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!gameOver ? (
        <div className="w-full bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex justify-center gap-3">
            {[...Array(4)].map((_, i) => (
              <button
                key={i}
                onClick={removeLastColor}
                className={`w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center transition-all
                  ${currentGuess[i] !== undefined ? COLORS[currentGuess[i]] + ' border-solid border-white/40' : 'bg-transparent'}
                `}
              >
                {currentGuess[i] === undefined && <Circle className="w-4 h-4 text-white/10" />}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {COLORS.map((color, i) => (
              <button
                key={i}
                onClick={() => handleColorClick(i)}
                className={`h-12 rounded-2xl ${color} transition-transform active:scale-95 shadow-lg`}
              />
            ))}
          </div>

          <button
            onClick={submitGuess}
            disabled={currentGuess.length !== 4}
            className="w-full py-4 bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Submit Guess
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 w-full">
          <div className={`p-8 rounded-3xl border ${winner ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <h3 className="text-2xl font-bold text-white mb-2">{winner ? 'Code Cracked!' : 'Mission Failed!'}</h3>
            <div className="flex justify-center gap-2 mt-4">
              <p className="text-sm text-slate-400 mr-2">The code was:</p>
              {code.map((c, i) => <div key={i} className={`w-5 h-5 rounded-full ${COLORS[c]}`} />)}
            </div>
          </div>

          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <ShareButtons
            gameTitle="Mastermind"
            result={winner ? 'cracked the secret code' : 'failed the mission'}
            penalty={funnyTask}
          />
          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all mt-4">
            <RefreshCw className="w-5 h-5" /> New Game
          </button>
        </motion.div>
      )}
    </div>
  );
}