import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask, getLlmResponse } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// Simple Sudoku Generator/Validator
const isValid = (board: number[][], row: number, col: number, num: number) => {
  for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
  for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
  let startRow = row - (row % 3), startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[i + startRow][j + startCol] === num) return false;
  return true;
};

const solveSudoku = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
  const board = Array(9).fill(0).map(() => Array(9).fill(0));
  // Fill diagonal 3x3 boxes
  for (let i = 0; i < 9; i += 3) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        let num;
        do { num = Math.floor(Math.random() * 9) + 1; }
        while (!isValid(board, i + j, i + k, num));
        board[i + j][i + k] = num;
      }
    }
  }
  solveSudoku(board);
  const solution = board.map(row => [...row]);

  let attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60;
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      attempts--;
    }
  }
  return { puzzle: board, solution };
};

export default function Sudoku() {
  const [grid, setGrid] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<boolean>(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initGame = () => {
    const { puzzle, solution: sol } = generateSudoku('easy');
    setGrid(puzzle);
    setSolution(sol);
    setInitial(puzzle.map(row => row.map(cell => cell !== 0)));
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    setHint(null);
    setSelected(null);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleNumberInput = (num: number) => {
    if (!selected || gameOver) return;
    const [r, c] = selected;
    if (initial[r][c]) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    // Check if complete
    if (newGrid.every((row, ri) => row.every((cell, ci) => cell === solution[ri][ci]))) {
      handleWin(true);
    }
  };

  const getHint = async () => {
    if (gameOver || isHintLoading || !isMounted.current) return;
    setIsHintLoading(true);
    setHint(null);

    try {
      const prompt = `I am playing Sudoku. Here is the current board state: ${JSON.stringify(grid)}. 
      The 0s are empty cells. 
      Give me a helpful hint about which cell to fill next and why. 
      Keep it short (max 2 sentences).`;

      const response = await getLlmResponse(prompt, apiKeys, selectedLlm, "You are a Sudoku expert.", 'sudoku');
      if (!isMounted.current) return;
      setHint(response);
    } catch (error) {
      if (!isMounted.current) return;
      console.error('Failed to get hint:', error);
      setHint("Look for rows or columns that are almost full!");
    } finally {
      if (isMounted.current) {
        setIsHintLoading(false);
      }
    }
  };

  const handleWin = async (isWin: boolean) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setWinner(isWin);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Sudoku');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'sudoku',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-6 items-center">
        <h2 className="text-xl font-bold text-white">Sudoku</h2>
        <div className="flex gap-2">
          <button
            onClick={getHint}
            disabled={isHintLoading || gameOver}
            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/20 transition-all flex items-center gap-2"
          >
            {isHintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">Hint</span>
          </button>
          <button onClick={initGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 items-start"
          >
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-100 italic">"{hint}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-9 border-2 border-white/20 mb-6 bg-slate-950 shadow-2xl">
        {grid.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => setSelected([r, c])}
            className={`w-10 h-10 sm:w-12 sm:h-12 border border-white/5 flex items-center justify-center text-lg font-bold transition-all
              ${(r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-white/20' : ''}
              ${(c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-white/20' : ''}
              ${selected?.[0] === r && selected?.[1] === c ? 'bg-indigo-500/40' : ''}
              ${initial[r][c] ? 'text-slate-400' : 'text-indigo-400'}
              ${!initial[r][c] && cell !== 0 && cell !== solution[r][c] ? 'text-rose-400' : ''}
            `}
          >
            {cell !== 0 ? cell : ''}
          </button>
        )))}
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleNumberInput(0)}
          className="col-span-2 sm:col-span-3 bg-slate-800 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors"
        >
          Clear
        </button>
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xl ${winner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {winner ? <><Trophy /> Puzzle Solved!</> : <><Frown /> Game Over!</>}
          </div>
          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-xs mx-auto">
              <p className="text-xs text-rose-400 font-semibold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200">{funnyTask}</p>
            </div>
          )}
          <ShareButtons
            gameTitle="Sudoku"
            result={winner ? 'mastered the numbers' : 'got blocked by a logic trap'}
            penalty={funnyTask}
            onPlayAgain={initGame}
          />
        </motion.div>
      )}
    </div>
  );
}
