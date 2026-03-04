import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask, getLlmResponse } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Bomb, Flag, Search, Loader2 } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
};

export default function Minesweeper() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(false);
  const [mineCount, setMineCount] = useState(10);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const rows = 10;
  const cols = 10;

  const initGame = () => {
    const newGrid: Cell[][] = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0
      }))
    );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (r + i >= 0 && r + i < rows && c + j >= 0 && c + j < cols) {
                if (newGrid[r + i][c + j].isMine) count++;
              }
            }
          }
          newGrid[r][c].neighborCount = count;
        }
      }
    }

    setGrid(newGrid);
    setGameOver(false);
    setWinner(false);
    setFunnyTask(null);
    setAiScanResult(null);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
  }, []);

  const revealCell = (r: number, c: number) => {
    if (gameOver || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    const newGrid = [...grid.map(row => [...row])];

    if (newGrid[r][c].isMine) {
      // Reveal all mines
      newGrid.forEach(row => row.forEach(cell => { if (cell.isMine) cell.isRevealed = true; }));
      setGrid(newGrid);
      handleEnd(false);
      return;
    }

    const floodFill = (row: number, col: number) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols || newGrid[row][col].isRevealed || newGrid[row][col].isMine) return;
      newGrid[row][col].isRevealed = true;
      if (newGrid[row][col].neighborCount === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            floodFill(row + i, col + j);
          }
        }
      }
    };

    floodFill(r, c);
    setGrid(newGrid);

    // Check win
    const unrevealedSafeCells = newGrid.flat().filter(cell => !cell.isMine && !cell.isRevealed).length;
    if (unrevealedSafeCells === 0) handleEnd(true);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || grid[r][c].isRevealed) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  const runAiScan = async () => {
    if (gameOver || isAiThinking || !isMounted.current) return;
    setIsAiThinking(true);
    setAiScanResult(null);

    try {
      // Create a simplified view of the board for the AI
      const boardView = grid.map(row => row.map(cell => {
        if (!cell.isRevealed) return '?';
        if (cell.isMine) return 'M';
        return cell.neighborCount;
      }));

      const prompt = `I am playing Minesweeper on a 10x10 grid. Here is the current visible board: ${JSON.stringify(boardView)}. 
      '?' are hidden cells, numbers are neighbor counts. 
      Give me a strategic scan report. Which area looks safest or most dangerous? 
      Keep it very short (max 1 sentence).`;

      const response = await getLlmResponse(prompt, apiKeys, selectedLlm, "You are a Minesweeper tactical advisor.", 'minesweeper');
      if (!isMounted.current) return;
      setAiScanResult(response);
    } catch (error) {
      if (!isMounted.current) return;
      console.error('AI Scan failed:', error);
      setAiScanResult("The corners are often a good place to start!");
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const handleEnd = async (isWin: boolean) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setWinner(isWin);
    let task = null;
    if (!isWin && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Minesweeper');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'minesweeper',
          winner: isWin ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto">
      <div className="flex justify-between w-full mb-6 px-4 items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Bomb className="w-5 h-5" />
            <span className="font-semibold">{mineCount} Mines</span>
          </div>
          <button
            onClick={runAiScan}
            disabled={isAiThinking || gameOver}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all text-xs font-bold uppercase tracking-wider"
          >
            {isAiThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            AI Scan
          </button>
        </div>
        <button onClick={initGame} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
      </div>

      <AnimatePresence>
        {aiScanResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 items-start"
          >
            <Search className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-100 italic">"{aiScanResult}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-800 p-2 rounded-xl border border-white/10 shadow-2xl mb-8">
        <div className="grid grid-cols-10 gap-1">
          {grid.map((row, r) => row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => revealCell(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center text-sm font-bold transition-all
                ${cell.isRevealed
                  ? (cell.isMine ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-400')
                  : 'bg-slate-700 hover:bg-slate-600 text-transparent'}
                ${!cell.isRevealed && cell.isFlagged ? 'text-indigo-400' : ''}
              `}
            >
              {cell.isRevealed
                ? (cell.isMine ? <Bomb className="w-4 h-4" /> : (cell.neighborCount > 0 ? cell.neighborCount : ''))
                : (cell.isFlagged ? <Flag className="w-4 h-4 fill-current" /> : '')}
            </button>
          )))}
        </div>
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xl ${winner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {winner ? <><Trophy /> Field Cleared!</> : <><Skull /> BOOM!</>}
          </div>
          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-xs mx-auto">
              <p className="text-xs text-rose-400 font-semibold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200">{funnyTask}</p>
            </div>
          )}
          <ShareButtons
            gameTitle="Minesweeper"
            result={winner ? 'cleared the minefield with precision' : 'stepped on a hidden mine'}
            penalty={funnyTask}
            onPlayAgain={initGame}
          />
        </motion.div>
      )}
    </div>
  );
}
