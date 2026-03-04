import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Search } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export default function WordSearch() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set<string>());
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const generateWordSearch = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setGameOver(false);
    setFunnyTask(null);
    resetSessionTokens();
    try {
      const systemInstruction = `You are a Word Search Generator. 
      Generate a 10x10 grid of letters containing 8 hidden words related to a theme (e.g., Space, Animals, Food).
      
      Return ONLY a JSON object:
      {
        "grid": [["A", "B", ...], ...],
        "words": ["WORD1", "WORD2", ...],
        "theme": "Space"
      }`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'wordsearch',
        { score },
        systemInstruction
      );

      if (!isMounted.current) return;

      if (response && response.grid && response.words) {
        setGrid(response.grid);
        setWords(response.words.map((w: string) => w.toUpperCase()));
        setFoundWords(new Set<string>());
        setSelectedCells([]);
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('Word Search Generation Error:', error);
      // Fallback
      const fallbackGrid = Array(10).fill(0).map(() => Array(10).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]));
      setGrid(fallbackGrid);
      setWords(['REACT', 'VITE', 'TAILWIND']);
      setFoundWords(new Set<string>());
      setSelectedCells([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    generateWordSearch();
  }, []);

  const handleMouseDown = (r: number, c: number) => {
    setIsDragging(true);
    setSelectedCells([{ r, c }]);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (!isDragging) return;

    const start = selectedCells[0];
    const dr = r - start.r;
    const dc = c - start.c;

    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      const newCells = [];
      for (let i = 0; i <= steps; i++) {
        newCells.push({
          r: start.r + (dr === 0 ? 0 : (dr > 0 ? i : -i)),
          c: start.c + (dc === 0 ? 0 : (dc > 0 ? i : -i))
        });
      }
      setSelectedCells(newCells);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const selectedWord = selectedCells.map(cell => grid[cell.r][cell.c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
      setFoundWords(prev => new Set<string>(prev).add(selectedWord));
      setScore(s => s + 10);
    } else if (words.includes(reversedWord) && !foundWords.has(reversedWord)) {
      setFoundWords(prev => new Set<string>(prev).add(reversedWord));
      setScore(s => s + 10);
    }

    setSelectedCells([]);

    if (foundWords.size + 1 === words.length) {
      handleEnd(true);
    }
  };

  const handleEnd = async (isWin: boolean) => {
    if (!isMounted.current) return;
    setGameOver(true);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Word Search');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'wordsearch',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Words Found</p>
            <p className="text-2xl font-black text-indigo-400">{foundWords.size}/{words.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Score</p>
            <p className="text-2xl font-black text-emerald-400">{score}</p>
          </div>
        </div>
        <button onClick={generateWordSearch} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col items-center">
          <div
            className="grid grid-cols-10 gap-1 select-none"
            onMouseLeave={handleMouseUp}
          >
            {grid.map((row, r) => (
              row.map((char, c) => {
                const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
                const isFound = Array.from(foundWords).some(word => {
                  // This is a simplified check for highlighting found words
                  // In a real implementation, we'd store the coordinates of found words
                  return false;
                });

                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    onMouseUp={handleMouseUp}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-indigo-500 text-white scale-110 z-10' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                  >
                    {char}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col gap-6">
          <h3 className="text-indigo-400 font-bold flex items-center gap-2 uppercase tracking-widest text-sm">
            <Search className="w-4 h-4" /> Word List
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {words.map(word => (
              <div
                key={word}
                className={`px-4 py-2 rounded-xl border transition-all ${foundWords.has(word)
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 line-through'
                    : 'bg-slate-800 border-white/5 text-slate-400'
                  }`}
              >
                {word}
              </div>
            ))}
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
                <h2 className="text-4xl font-black text-white">Victory!</h2>
                <p className="text-slate-400">You found all the words!</p>
              </div>

              <ShareButtons
                gameTitle="Word Search"
                result="found all the hidden words"
                score={score}
                penalty={funnyTask}
              />
              <button
                onClick={generateWordSearch}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all mt-4"
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
            Find all the words listed on the right within the grid of letters.
            Click and drag to select a word. Words can be horizontal, vertical, or diagonal, and can even be backwards!
          </p>
        </div>
      </div>
    </div>
  );
}
