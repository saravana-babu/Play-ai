import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export default function Trivia() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
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
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    setSelectedOption(null);
    setShowResult(false);
    setFunnyTask(null);
    resetSessionTokens();

    try {
      const response = await getLlmResponse(
        'Generate 5 trivia questions about general knowledge. Each question should have 4 options and 1 correct answer. Respond with ONLY a JSON array of objects with keys: "question", "options" (array of 4 strings), "answer" (the exact string from options), and "explanation" (short sentence).',
        apiKeys,
        selectedLlm,
        undefined,
        'trivia'
      );
      if (!isMounted.current) return;
      const data = JSON.parse(response.match(/\[[\s\S]*\]/)?.[0] || '[]');
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load trivia:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleAnswer = (option: string) => {
    if (showResult || gameOver) return;
    setSelectedOption(option);
    setShowResult(true);
    if (option === questions[currentIndex].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      handleEnd();
    }
  };

  const handleEnd = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    const isWin = score >= 3;
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Trivia');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'trivia',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">AI is preparing your questions...</p>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const current = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {!gameOver ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
            <span className="text-sm font-bold text-indigo-400">Score: {score}</span>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5">
            <h3 className="text-2xl font-bold text-white leading-tight">{current.question}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {current.options.map((option) => {
              const isCorrect = option === current.answer;
              const isSelected = option === selectedOption;
              
              let buttonClass = 'bg-slate-800 border-white/10 text-slate-300 hover:border-white/20';
              if (showResult) {
                if (isCorrect) buttonClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
                else if (isSelected) buttonClass = 'bg-rose-500/20 border-rose-500/50 text-rose-400';
                else buttonClass = 'bg-slate-900 border-white/5 text-slate-600 opacity-50';
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={`w-full p-5 rounded-2xl border text-left font-medium transition-all flex items-center justify-between ${buttonClass}`}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          {showResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <p className="text-sm text-indigo-300"><span className="font-bold">Did you know?</span> {current.explanation}</p>
              </div>
              <button
                onClick={nextQuestion}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-colors"
              >
                {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8">
          <div className={`p-12 rounded-3xl border ${score >= 3 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
              {score >= 3 ? <Trophy className="w-10 h-10 text-yellow-400" /> : <Frown className="w-10 h-10 text-rose-400" />}
            </div>
            <h3 className="text-4xl font-bold text-white mb-2">{score >= 3 ? 'Brilliant!' : 'Better luck next time'}</h3>
            <p className="text-slate-400">You got {score} out of {questions.length} correct.</p>
          </div>

          {funnyTask && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md mx-auto">
              <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">The Penalty</p>
              <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={initGame} className="flex items-center gap-2 px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20">
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
            <ShareButton 
              gameTitle="Trivia" 
              score={score}
              winner={score >= 3 ? 'user' : 'ai'} 
              funnyTask={funnyTask} 
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}