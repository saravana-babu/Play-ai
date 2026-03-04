import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Send } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export default function PatternMatch() {
  const [pattern, setPattern] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generatePattern = async () => {
    setLoading(true);
    try {
      const systemInstruction = `You are a Logic Puzzle Generator. 
      Generate a sequence of 4 items (numbers, letters, or simple words) that follow a clear logical pattern.
      Provide the 5th item as the correct answer.
      Also provide 3 incorrect but plausible distractors.
      
      Return ONLY a JSON object:
      {
        "sequence": ["item1", "item2", "item3", "item4"],
        "answer": "item5",
        "options": ["option1", "option2", "option3", "option4"],
        "explanation": "Brief explanation of the pattern"
      }
      The 'options' array must include the 'answer'.`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'patternmatch',
        { score },
        systemInstruction
      );

      if (response && response.sequence && response.answer) {
        setPattern(response.sequence);
        setCorrectAnswer(response.answer);
        // Shuffle options
        setOptions(response.options.sort(() => Math.random() - 0.5));
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('Pattern Generation Error:', error);
      // Fallback pattern
      const fallback = {
        sequence: ['2', '4', '8', '16'],
        answer: '32',
        options: ['24', '30', '32', '64']
      };
      setPattern(fallback.sequence);
      setCorrectAnswer(fallback.answer);
      setOptions(fallback.options.sort(() => Math.random() - 0.5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePattern();
  }, []);

  const handleAnswer = (answer: string) => {
    if (gameOver || loading) return;

    if (answer === correctAnswer) {
      setScore(s => s + 1);
      generatePattern();
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        handleEnd();
      } else {
        generatePattern();
      }
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Pattern Match');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'patternmatch',
          winner: score >= 10 ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFunnyTask(null);
    generatePattern();
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
            <div className="flex gap-1 justify-center">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < lives ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
        <button onClick={resetGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BrainCircuit className="w-32 h-32 text-white" />
        </div>

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
              <p className="text-slate-400 font-medium animate-pulse">AI is crafting a pattern...</p>
            </motion.div>
          ) : gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="space-y-2">
                <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-white">Game Over</h2>
                <p className="text-slate-400">You reached a score of {score}</p>
              </div>

              {funnyTask && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md mx-auto">
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                  <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                </div>
              )}

              <ShareButtons
                gameTitle="Pattern Match"
                result={score >= 10 ? 'unlocked the logic secrets' : 'got confused by patterns'}
                score={score}
                penalty={funnyTask}
              />
              <button
                onClick={resetGame}
                className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 mt-4"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">What comes next?</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {pattern.map((item, i) => (
                    <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-inner">
                      {item}
                    </div>
                  ))}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 rounded-2xl flex items-center justify-center text-3xl font-black text-indigo-400">
                    ?
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(option)}
                    className="p-6 bg-slate-800 hover:bg-indigo-500 border border-white/5 hover:border-indigo-400 rounded-2xl text-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                  >
                    {option}
                  </button>
                ))}
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
            Analyze the sequence of items and identify the underlying logical pattern.
            Select the item that correctly completes the sequence. You have 3 lives.
          </p>
        </div>
      </div>
    </div>
  );
}
