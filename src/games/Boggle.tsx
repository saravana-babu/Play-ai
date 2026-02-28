import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Send, Timer } from 'lucide-react';

export default function Boggle() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set<string>());
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [aiWords, setAiWords] = useState<string[]>([]);
  const { apiKeys, selectedLlm, user } = useStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateGrid = async () => {
    setLoading(true);
    const dice = [
      "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
      "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
      "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
      "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
    ];
    
    const shuffledDice = [...dice].sort(() => Math.random() - 0.5);
    const newGrid: string[][] = [];
    for (let i = 0; i < 4; i++) {
      const row: string[] = [];
      for (let j = 0; j < 4; j++) {
        const die = shuffledDice[i * 4 + j];
        row.push(die[Math.floor(Math.random() * 6)]);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setFoundWords(new Set<string>());
    setCurrentWord('');
    setTimeLeft(60);
    setGameOver(false);
    setFunnyTask(null);
    setLoading(false);

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    generateGrid();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const word = currentWord.toUpperCase();
    if (word.length < 3) return;
    
    if (!foundWords.has(word)) {
      setFoundWords(prev => new Set<string>(prev).add(word));
    }
    setCurrentWord('');
  };

  const handleEnd = async () => {
    setGameOver(true);
    setLoading(true);
    
    try {
      const systemInstruction = `You are a Boggle Expert. 
      Given this 4x4 grid of letters, find as many valid English words (3+ letters) as possible.
      Grid: ${grid.map(row => row.join('')).join(', ')}
      
      Return ONLY a JSON object: {"words": ["WORD1", "WORD2", ...]}
      Only return words that can be formed by adjacent letters (horizontal, vertical, diagonal).`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'boggle',
        { grid },
        systemInstruction
      );

      const aiFound = response?.words || [];
      setAiWords(aiFound);

      let task = null;
      const userScore = Array.from(foundWords).length;
      const aiScore = aiFound.length;

      if (userScore < aiScore && apiKeys[selectedLlm]) {
        task = await generateFunnyTask(selectedLlm, apiKeys, 'Boggle');
        setFunnyTask(task);
      }

      if (user) {
        await fetchApi('/history', {
          method: 'POST',
          body: JSON.stringify({
            game_id: 'boggle',
            winner: userScore >= aiScore ? 'user' : 'ai',
            funny_task: task
          })
        });
      }
    } catch (error) {
      console.error('Boggle AI Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Words Found</p>
            <p className="text-2xl font-black text-indigo-400">{foundWords.size}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Time Left</p>
            <p className={`text-2xl font-black flex items-center gap-2 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
              <Timer className="w-5 h-5" /> {timeLeft}s
            </p>
          </div>
        </div>
        <button onClick={generateGrid} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-8">
          <div className="grid grid-cols-4 gap-3">
            {grid.map((row, r) => (
              row.map((char, c) => (
                <div key={`${r}-${c}`} className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-black text-slate-900 shadow-[0_8px_0_#cbd5e1]">
                  {char === 'Q' ? 'Qu' : char}
                </div>
              ))
            ))}
          </div>

          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <input
              type="text"
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value.toUpperCase())}
              disabled={gameOver || loading}
              placeholder="Type a word..."
              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={gameOver || loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col">
          <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Found Words
          </h3>
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {Array.from(foundWords).map(word => (
              <span key={word} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg font-bold text-sm">
                {word}
              </span>
            ))}
            {foundWords.size === 0 && (
              <p className="text-slate-500 italic text-sm py-4">Start typing words!</p>
            )}
          </div>

          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-8 border-t border-white/10 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> AI Found ({aiWords.length})
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiWords.map(word => (
                    <span key={word} className={`px-3 py-1 rounded-lg font-bold text-sm ${foundWords.has(word) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {word}
                    </span>
                  ))}
                </div>

                {funnyTask && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">Penalty</p>
                    <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
                  </div>
                )}

                <button
                  onClick={generateGrid}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                >
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
        <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm text-white font-bold">How to Play</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Find as many words as possible in the 4x4 grid. Words must be at least 3 letters long. 
            Letters must be adjacent (horizontal, vertical, or diagonal). You have 60 seconds!
          </p>
        </div>
      </div>
    </div>
  );
}
