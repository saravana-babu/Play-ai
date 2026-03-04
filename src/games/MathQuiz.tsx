import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, Timer, CheckCircle2, XCircle } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

interface Problem {
  text: string;
  answer: number;
}

export default function MathQuiz() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const generateProblem = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === '*') {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
    } else {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
    }
    const text = `${a} ${op} ${b}`;
    const answer = eval(text);
    setProblem({ text, answer });
    setInput('');
    setFeedback(null);
  };

  const initGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setFunnyTask(null);
    resetSessionTokens();
    generateProblem();
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
    if (!problem || gameOver) return;

    if (parseInt(input) === problem.answer) {
      setScore(s => s + 1);
      setFeedback('correct');
      setTimeout(generateProblem, 500);
    } else {
      setFeedback('wrong');
      setTimeout(generateProblem, 500);
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (score < 5 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Math Quiz');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'mathquiz',
          winner: score >= 5 ? 'user' : 'ai',
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
          <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`} />
          <span className={`font-bold text-xl ${timeLeft < 10 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}s</span>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Score</p>
          <p className="text-xl font-bold text-white">{score}</p>
        </div>
      </div>

      {!gameOver ? (
        <div className="w-full space-y-8">
          <div className="text-center">
            <motion.h2
              key={problem?.text}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-white tracking-tight"
            >
              {problem?.text}
            </motion.h2>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              autoFocus
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`w-full bg-slate-950 border-2 rounded-2xl px-6 py-4 text-3xl text-center font-bold text-white focus:outline-none transition-all
                ${feedback === 'correct' ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                  feedback === 'wrong' ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' :
                    'border-white/10 focus:border-indigo-500'}
              `}
              placeholder="?"
            />
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                >
                  {feedback === 'correct' ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <XCircle className="w-10 h-10 text-rose-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 w-full">
          <div className={`p-10 rounded-3xl border ${score >= 5 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <h3 className="text-3xl font-bold text-white mb-2">{score >= 5 ? 'Math Whiz!' : 'Time\'s Up!'}</h3>
            <p className="text-slate-400">You solved {score} problems.</p>
          </div>

          {funnyTask && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
              <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <ShareButtons
            gameTitle="Math Quiz"
            result={`solved ${score} equations`}
            score={score}
            penalty={funnyTask}
          />
          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all mt-4">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
        </motion.div>
      )}
    </div>
  );
}