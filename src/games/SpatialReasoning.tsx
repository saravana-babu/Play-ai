import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, RotateCw } from 'lucide-react';

export default function SpatialReasoning() {
  const [targetShape, setTargetShape] = useState<number[][]>([]);
  const [options, setOptions] = useState<number[][][]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generatePuzzle = async () => {
    setLoading(true);
    try {
      // Generate a random 3x3 shape
      const shape = Array(3).fill(0).map(() => Array(3).fill(0).map(() => Math.random() > 0.6 ? 1 : 0));
      if (shape.flat().every(v => v === 0)) shape[1][1] = 1; // Ensure not empty
      
      setTargetShape(shape);

      // Rotations: 0, 90, 180, 270
      const rotate = (s: number[][]) => {
        const n = s.length;
        const res = Array(n).fill(0).map(() => Array(n).fill(0));
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            res[c][n - 1 - r] = s[r][c];
          }
        }
        return res;
      };

      const r90 = rotate(shape);
      const r180 = rotate(r90);
      const r270 = rotate(r180);
      const rotations = [r90, r180, r270];
      
      const correct = rotations[Math.floor(Math.random() * rotations.length)];
      
      // Distractors: random shapes
      const distractors = Array(3).fill(0).map(() => 
        Array(3).fill(0).map(() => Math.random() > 0.6 ? 1 : 0)
      );

      const allOptions = [correct, ...distractors].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
      setCorrectIndex(allOptions.indexOf(correct));
    } catch (error) {
      console.error('Spatial Puzzle Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePuzzle();
  }, []);

  const handleAnswer = (index: number) => {
    if (gameOver || loading) return;

    if (index === correctIndex) {
      setScore(s => s + 1);
      generatePuzzle();
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) {
        handleEnd();
      } else {
        generatePuzzle();
      }
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Spatial Reasoning');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'spatial',
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
    generatePuzzle();
  };

  const renderShape = (shape: number[][], size: 'sm' | 'lg' = 'sm') => (
    <div className={`grid grid-cols-3 gap-1 ${size === 'lg' ? 'w-32 h-32' : 'w-20 h-20'}`}>
      {shape.flat().map((cell, i) => (
        <div 
          key={i} 
          className={`rounded-sm transition-all duration-500 ${cell ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`} 
        />
      ))}
    </div>
  );

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
                <div key={i} className={`w-2 h-2 rounded-full ${i < lives ? 'bg-rose-500' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
        <button onClick={resetGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {gameOver ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-8"
            >
              <div className="space-y-2">
                <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-white">Game Over</h2>
                <p className="text-slate-400">Final Score: {score}</p>
              </div>

              {funnyTask && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md mx-auto">
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                  <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                </div>
              )}

              <button
                onClick={resetGame}
                className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25"
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
              <div className="flex flex-col items-center gap-6">
                <h3 className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Target Shape</h3>
                <div className="p-8 bg-slate-800/50 rounded-3xl border border-white/5">
                  {renderShape(targetShape, 'lg')}
                </div>
                <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
                  <RotateCw className="w-4 h-4" /> Which one is a rotation?
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="p-8 bg-slate-800 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/50 rounded-3xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {renderShape(option)}
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
            Examine the target shape and identify which of the four options is a 90, 180, or 270-degree rotation of it. 
            The other options are different shapes entirely. You have 3 lives.
          </p>
        </div>
      </div>
    </div>
  );
}
