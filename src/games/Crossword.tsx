import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Key } from 'lucide-react';

type Clue = { number: number; direction: 'across' | 'down'; clue: string; answer: string; row: number; col: number };

export default function Crossword() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [clues, setClues] = useState<Clue[]>([]);
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const generateCrossword = async () => {
    setLoading(true);
    try {
      const systemInstruction = `You are a Crossword Puzzle Generator. 
      Generate a small 5x5 crossword puzzle.
      
      Return ONLY a JSON object:
      {
        "grid": [
          ["A", "P", "P", "L", "E"],
          ["B", ".", ".", ".", "."],
          ["C", ".", ".", ".", "."],
          ["D", ".", ".", ".", "."],
          ["E", ".", ".", ".", "."]
        ],
        "clues": [
          { "number": 1, "direction": "across", "clue": "A common fruit", "answer": "APPLE", "row": 0, "col": 0 },
          { "number": 1, "direction": "down", "clue": "First 5 letters of alphabet", "answer": "ABCDE", "row": 0, "col": 0 }
        ]
      }`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'crossword',
        { score },
        systemInstruction
      );

      if (response && response.grid && response.clues) {
        setGrid(response.grid);
        setClues(response.clues);
        const emptyGrid = response.grid.map((row: string[]) => row.map((char: string) => char === '.' ? '.' : ''));
        setUserGrid(emptyGrid);
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('Crossword Generation Error:', error);
      // Fallback
      const fallbackGrid = [
        ['C', 'A', 'T', '.', '.'],
        ['O', '.', '.', '.', '.'],
        ['W', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.']
      ];
      setGrid(fallbackGrid);
      setClues([
        { number: 1, direction: 'across', clue: 'Meows', answer: 'CAT', row: 0, col: 0 },
        { number: 1, direction: 'down', clue: 'Moos', answer: 'COW', row: 0, col: 0 }
      ]);
      setUserGrid(fallbackGrid.map(row => row.map(char => char === '.' ? '.' : '')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateCrossword();
  }, []);

  const handleCharChange = (r: number, c: number, value: string) => {
    const upperValue = value.toUpperCase();
    if (upperValue.length > 1) return;
    
    const newUserGrid = [...userGrid];
    newUserGrid[r][c] = upperValue;
    setUserGrid(newUserGrid);
  };

  const checkSolution = () => {
    const isCorrect = grid.every((row, r) => row.every((char, c) => {
      if (char === '.') return true;
      return userGrid[r][c] === char;
    }));

    if (isCorrect) {
      setScore(s => s + 1);
      handleEnd(true);
    }
  };

  const handleEnd = async (isWin: boolean) => {
    setGameOver(true);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Crossword');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'crossword',
          winner: isWin ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Puzzles Solved</p>
            <p className="text-2xl font-black text-indigo-400">{score}</p>
          </div>
        </div>
        <button onClick={generateCrossword} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-8">
          <div className="grid grid-cols-5 gap-1">
            {userGrid.map((row, r) => (
              row.map((char, c) => (
                <div key={`${r}-${c}`} className="relative">
                  {char === '.' ? (
                    <div className="w-12 h-12 bg-slate-950 rounded-lg" />
                  ) : (
                    <>
                      <input
                        type="text"
                        maxLength={1}
                        value={userGrid[r][c]}
                        onChange={(e) => handleCharChange(r, c, e.target.value)}
                        className="w-12 h-12 bg-white text-slate-900 text-center text-xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                      />
                      {clues.find(clue => clue.row === r && clue.col === c) && (
                        <span className="absolute top-0.5 left-1 text-[10px] font-bold text-slate-400">
                          {clues.find(clue => clue.row === r && clue.col === c)?.number}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))
            ))}
          </div>

          <button
            onClick={checkSolution}
            className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Key className="w-5 h-5" /> Check Solution
          </button>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col gap-6">
          <div>
            <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
              Across
            </h3>
            <div className="space-y-2">
              {clues.filter(c => c.direction === 'across').map(clue => (
                <p key={`${clue.number}-across`} className="text-sm text-slate-300">
                  <span className="font-bold text-indigo-400 mr-2">{clue.number}.</span> {clue.clue}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
              Down
            </h3>
            <div className="space-y-2">
              {clues.filter(c => c.direction === 'down').map(clue => (
                <p key={`${clue.number}-down`} className="text-sm text-slate-300">
                  <span className="font-bold text-emerald-400 mr-2">{clue.number}.</span> {clue.clue}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          >
            <div className="text-center space-y-8 max-w-md">
              <div className="space-y-2">
                <Trophy className="w-20 h-20 text-emerald-400 mx-auto" />
                <h2 className="text-4xl font-black text-white">Puzzle Solved!</h2>
                <p className="text-slate-400">Great job decoding the crossword.</p>
              </div>

              <button
                onClick={generateCrossword}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
        <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm text-white font-bold">How to Play</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fill in the white squares with letters to form words based on the clues provided. 
            Numbers in the squares correspond to the clue numbers. Click "Check Solution" when you're done!
          </p>
        </div>
      </div>
    </div>
  );
}
