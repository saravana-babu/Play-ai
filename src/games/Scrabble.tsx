import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Send } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Tile = { char: string; score: number };
const TILE_SCORES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

export default function Scrabble() {
  const [board, setBoard] = useState<string[][]>(Array(11).fill(0).map(() => Array(11).fill('')));
  const [rack, setRack] = useState<Tile[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [message, setMessage] = useState('Your turn! Place a word.');
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    setBoard(Array(11).fill(0).map(() => Array(11).fill('')));
    setPlayerScore(0);
    setAiScore(0);
    setTurn('player');
    setGameOver(false);
    setFunnyTask(null);
    setMessage('Your turn! Place a word.');
    refillRack([]);
    setLoading(false);
  };

  const refillRack = (currentRack: Tile[]) => {
    const chars = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';
    const newTiles = [...currentRack];
    while (newTiles.length < 7) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      newTiles.push({ char, score: TILE_SCORES[char] });
    }
    setRack(newTiles);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleAiMove = async () => {
    if (gameOver) return;
    setLoading(true);
    setMessage('AI is thinking of a word...');

    try {
      const systemInstruction = `You are a Scrabble Expert. 
      Given this 11x11 board (empty strings are empty cells), find the best word to play.
      Board: ${JSON.stringify(board)}
      AI Rack: [Randomly generated for you]
      
      Return ONLY a JSON object:
      {
        "word": "HELLO",
        "row": 5,
        "col": 5,
        "direction": "horizontal"
      }`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'scrabble',
        { board },
        systemInstruction
      );

      if (response && response.word) {
        const { word, row, col, direction } = response;
        const newBoard = [...board];
        for (let i = 0; i < word.length; i++) {
          const r = direction === 'horizontal' ? row : row + i;
          const c = direction === 'horizontal' ? col + i : col;
          if (r < 11 && c < 11) newBoard[r][c] = word[i].toUpperCase();
        }
        setBoard(newBoard);
        const wordScore = word.split('').reduce((acc: number, char: string) => acc + (TILE_SCORES[char.toUpperCase()] || 1), 0);
        setAiScore(s => s + wordScore);
        setMessage(`AI played ${word} for ${wordScore} points!`);
        setTurn('player');
      } else {
        throw new Error('AI could not find a word');
      }
    } catch (error) {
      console.error('AI Scrabble Error:', error);
      setMessage('AI passed its turn.');
      setTurn('player');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceWord = async (word: string, r: number, c: number, dir: 'h' | 'v') => {
    if (turn !== 'player' || gameOver || loading) return;

    // Simplified validation: just check if it fits
    const newBoard = [...board];
    let canPlace = true;
    for (let i = 0; i < word.length; i++) {
      const row = dir === 'h' ? r : r + i;
      const col = dir === 'h' ? c + i : c;
      if (row >= 11 || col >= 11 || (newBoard[row][col] !== '' && newBoard[row][col] !== word[i])) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      for (let i = 0; i < word.length; i++) {
        const row = dir === 'h' ? r : r + i;
        const col = dir === 'h' ? c + i : c;
        newBoard[row][col] = word[i].toUpperCase();
      }
      setBoard(newBoard);
      const wordScore = word.split('').reduce((acc, char) => acc + (TILE_SCORES[char.toUpperCase()] || 1), 0);
      setPlayerScore(s => s + wordScore);
      refillRack([]); // In a real game, we'd only replace used tiles
      setTurn('ai');
      setTimeout(handleAiMove, 1000);
    } else {
      alert('Invalid placement!');
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let task = null;
    if (aiScore > playerScore && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Scrabble');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'scrabble',
          winner: playerScore >= aiScore ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Your Score</p>
            <p className="text-2xl font-black text-indigo-400">{playerScore}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">AI Score</p>
            <p className="text-2xl font-black text-emerald-400">{aiScore}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleEnd} className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-bold text-sm">End Game</button>
          <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-[40px] p-4 sm:p-8 shadow-2xl flex flex-col items-center gap-8">
          <div className="grid grid-cols-11 gap-1 bg-slate-800 p-2 rounded-xl border border-white/5">
            {board.map((row, r) => (
              row.map((char, c) => (
                <div key={`${r}-${c}`} className={`w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center text-sm sm:text-lg font-bold transition-all ${char ? 'bg-amber-100 text-slate-900 shadow-sm' : 'bg-slate-900/50 text-slate-700'}`}>
                  {char}
                </div>
              ))
            ))}
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-center gap-2">
              {rack.map((tile, i) => (
                <div key={i} className="w-10 h-12 sm:w-12 sm:h-14 bg-amber-100 rounded-lg flex flex-col items-center justify-center text-slate-900 shadow-md border-b-4 border-amber-200">
                  <span className="text-lg sm:text-xl font-black">{tile.char}</span>
                  <span className="text-[8px] font-bold self-end mr-1">{tile.score}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <input
                id="wordInput"
                type="text"
                placeholder="Enter word..."
                className="bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <input id="rowInput" type="number" placeholder="Row" className="w-16 bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-white text-center" />
                <input id="colInput" type="number" placeholder="Col" className="w-16 bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-white text-center" />
                <select id="dirInput" className="bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                  <option value="h" className="bg-slate-800">Horizontal</option>
                  <option value="v" className="bg-slate-800">Vertical</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const word = (document.getElementById('wordInput') as HTMLInputElement).value;
                  const r = parseInt((document.getElementById('rowInput') as HTMLInputElement).value);
                  const c = parseInt((document.getElementById('colInput') as HTMLInputElement).value);
                  const dir = (document.getElementById('dirInput') as HTMLSelectElement).value as 'h' | 'v';
                  handlePlaceWord(word, r, c, dir);
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
              >
                Place
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border ${turn === 'player' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            <p className="text-sm font-bold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> {message}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs">Rules</h4>
            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
              <li>Form words using tiles from your rack.</li>
              <li>Words must connect to existing letters on the board.</li>
              <li>Each letter has a point value.</li>
              <li>Try to outscore the AI!</li>
            </ul>
          </div>

          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-auto p-6 bg-slate-800 rounded-3xl text-center space-y-4"
              >
                <h3 className="text-2xl font-black text-white">{playerScore >= aiScore ? 'You Won!' : 'AI Won!'}</h3>
                {funnyTask && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">Penalty</p>
                    <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
                  </div>
                )}
                <ShareButtons
                  gameTitle="Scrabble"
                  result={playerScore >= aiScore ? `defeated the AI with ${playerScore} points` : `scored ${playerScore} points against the AI`}
                  score={playerScore}
                  penalty={funnyTask}
                />
                <button onClick={initGame} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold mt-4">Play Again</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
