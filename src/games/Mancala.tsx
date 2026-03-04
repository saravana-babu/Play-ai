import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Player = 1 | 2;

export default function Mancala() {
  const [board, setBoard] = useState<number[]>([]);
  const [turn, setTurn] = useState<Player>(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    // 6 pits per player + 1 store each = 14 pits
    // Indices 0-5: Player 1 pits
    // Index 6: Player 1 store
    // Indices 7-12: Player 2 pits
    // Index 13: Player 2 store
    const newBoard = Array(14).fill(4);
    newBoard[6] = 0;
    newBoard[13] = 0;
    setBoard(newBoard);
    setTurn(1);
    setGameOver(false);
    setWinner(null);
    setFunnyTask(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handlePitClick = (index: number) => {
    if (gameOver || turn !== 1) return;
    if (index < 0 || index > 5 || board[index] === 0) return;
    move(index);
  };

  const move = (index: number) => {
    const newBoard = [...board];
    let stones = newBoard[index];
    newBoard[index] = 0;

    let current = index;
    const player = turn;

    while (stones > 0) {
      current = (current + 1) % 14;

      // Skip opponent's store
      if (player === 1 && current === 13) continue;
      if (player === 2 && current === 6) continue;

      newBoard[current]++;
      stones--;
    }

    // Capture rule
    if (newBoard[current] === 1) {
      if (player === 1 && current >= 0 && current <= 5) {
        const opposite = 12 - current;
        if (newBoard[opposite] > 0) {
          newBoard[6] += newBoard[opposite] + 1;
          newBoard[opposite] = 0;
          newBoard[current] = 0;
        }
      } else if (player === 2 && current >= 7 && current <= 12) {
        const opposite = 12 - current;
        if (newBoard[opposite] > 0) {
          newBoard[13] += newBoard[opposite] + 1;
          newBoard[opposite] = 0;
          newBoard[current] = 0;
        }
      }
    }

    setBoard(newBoard);

    // Extra turn rule
    const extraTurn = (player === 1 && current === 6) || (player === 2 && current === 13);

    if (checkGameOver(newBoard)) {
      handleEnd(newBoard);
    } else if (!extraTurn) {
      setTurn(player === 1 ? 2 : 1);
      if (player === 1) {
        setTimeout(() => aiMove(newBoard), 1000);
      }
    } else if (player === 2) {
      setTimeout(() => aiMove(newBoard), 1000);
    }
  };

  const aiMove = (currentBoard: number[]) => {
    if (gameOver) return;

    // Simple AI: pick the pit with most stones or one that gives extra turn
    const validPits = [7, 8, 9, 10, 11, 12].filter(i => currentBoard[i] > 0);
    if (validPits.length === 0) return;

    // Check for extra turn
    const extraTurnPit = validPits.find(i => (currentBoard[i] + i) % 14 === 13);
    const chosenPit = extraTurnPit || validPits[Math.floor(Math.random() * validPits.length)];

    const newBoard = [...currentBoard];
    let stones = newBoard[chosenPit];
    newBoard[chosenPit] = 0;

    let current = chosenPit;
    while (stones > 0) {
      current = (current + 1) % 14;
      if (current === 6) continue; // Skip player store
      newBoard[current]++;
      stones--;
    }

    // Capture rule for AI
    if (newBoard[current] === 1 && current >= 7 && current <= 12) {
      const opposite = 12 - current;
      if (newBoard[opposite] > 0) {
        newBoard[13] += newBoard[opposite] + 1;
        newBoard[opposite] = 0;
        newBoard[current] = 0;
      }
    }

    setBoard(newBoard);

    if (checkGameOver(newBoard)) {
      handleEnd(newBoard);
    } else if (current === 13) {
      setTimeout(() => aiMove(newBoard), 1000);
    } else {
      setTurn(1);
    }
  };

  const checkGameOver = (b: number[]) => {
    const p1Empty = b.slice(0, 6).every(s => s === 0);
    const p2Empty = b.slice(7, 13).every(s => s === 0);
    return p1Empty || p2Empty;
  };

  const handleEnd = async (b: number[]) => {
    const finalBoard = [...b];
    // Move remaining stones to stores
    const p1Remaining = finalBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const p2Remaining = finalBoard.slice(7, 13).reduce((a, b) => a + b, 0);

    finalBoard[6] += p1Remaining;
    finalBoard[13] += p2Remaining;
    for (let i = 0; i < 6; i++) finalBoard[i] = 0;
    for (let i = 7; i < 13; i++) finalBoard[i] = 0;

    setBoard(finalBoard);
    setGameOver(true);

    const p1Score = finalBoard[6];
    const p2Score = finalBoard[13];

    let result: Player | 'draw';
    if (p1Score > p2Score) result = 1;
    else if (p2Score > p1Score) result = 2;
    else result = 'draw';

    setWinner(result);

    let task = null;
    if (result === 2 && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Mancala');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'mancala',
          winner: result === 1 ? 'user' : result === 2 ? 'ai' : 'draw',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className={`px-4 py-2 rounded-xl border transition-all ${turn === 1 ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <span className="font-bold">Your Turn</span>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-slate-400 text-xs block uppercase font-bold">Score</span>
            <span className="text-white font-bold">{board[6]} - {board[13]}</span>
          </div>
          <button onClick={initGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className={`px-4 py-2 rounded-xl border transition-all ${turn === 2 ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <span className="font-bold">AI Turn</span>
        </div>
      </div>

      <div className="relative bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl w-full">
        <div className="flex items-center justify-between gap-4">
          {/* AI Store */}
          <div className="w-20 h-64 bg-slate-800 rounded-full border border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute top-4 text-[10px] font-bold text-slate-500 uppercase">AI</div>
            <div className="text-2xl font-black text-rose-400">{board[13]}</div>
            <div className="flex flex-wrap justify-center gap-1 p-2">
              {[...Array(Math.min(board[13], 12))].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-rose-500/40" />
              ))}
            </div>
          </div>

          {/* Pits */}
          <div className="flex-1 flex flex-col gap-8">
            {/* AI Pits (Top row, right to left) */}
            <div className="flex justify-between gap-4">
              {[12, 11, 10, 9, 8, 7].map((idx) => (
                <div key={idx} className="flex-1 aspect-square bg-slate-800/50 rounded-full border border-white/5 flex items-center justify-center relative">
                  <span className="text-rose-400/50 font-bold">{board[idx]}</span>
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-1 p-2">
                    {[...Array(Math.min(board[idx], 6))].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-rose-500/30" />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Player Pits (Bottom row, left to right) */}
            <div className="flex justify-between gap-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <button
                  key={idx}
                  onClick={() => handlePitClick(idx)}
                  disabled={turn !== 1 || board[idx] === 0 || gameOver}
                  className={`flex-1 aspect-square rounded-full border transition-all relative flex items-center justify-center
                    ${turn === 1 && board[idx] > 0 ? 'bg-slate-800 border-indigo-500/30 hover:border-indigo-500 hover:scale-105' : 'bg-slate-800/50 border-white/5'}
                  `}
                >
                  <span className={`font-bold ${board[idx] > 0 ? 'text-white' : 'text-slate-600'}`}>{board[idx]}</span>
                  <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-1 p-2">
                    {[...Array(Math.min(board[idx], 6))].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Store */}
          <div className="w-20 h-64 bg-slate-800 rounded-full border border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute top-4 text-[10px] font-bold text-slate-500 uppercase">You</div>
            <div className="text-2xl font-black text-indigo-400">{board[6]}</div>
            <div className="flex flex-wrap justify-center gap-1 p-2">
              {[...Array(Math.min(board[6], 12))].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500/40" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center space-y-6 w-full"
          >
            <div className={`p-8 rounded-3xl border ${winner === 1 ? 'bg-emerald-500/10 border-emerald-500/20' : winner === 2 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
              {winner === 1 ? (
                <>
                  <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">You Won!</h3>
                  <p className="text-slate-400">Great strategy! You collected {board[6]} stones.</p>
                </>
              ) : winner === 2 ? (
                <>
                  <Skull className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">AI Won!</h3>
                  <p className="text-slate-400">The AI outsmarted you this time.</p>
                </>
              ) : (
                <>
                  <RefreshCw className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">It's a Draw!</h3>
                  <p className="text-slate-400">Both players collected {board[6]} stones.</p>
                </>
              )}
            </div>

            {funnyTask && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
                <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}

            <ShareButtons
              gameTitle="Mancala"
              result={winner === 1 ? 'harvested more stones than the AI' : winner === 2 ? 'got outplayed in the pits' : 'reached a perfect balance'}
              score={`${board[6]}-${board[13]}`}
              penalty={funnyTask}
            />

            <button onClick={initGame} className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all mt-4">
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex gap-4 items-start">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
        <div className="text-sm text-slate-400 space-y-2">
          <p><strong className="text-white">Goal:</strong> Collect more stones in your store (right side) than the AI.</p>
          <p><strong className="text-white">Extra Turn:</strong> If your last stone lands in your store, you get another turn.</p>
          <p><strong className="text-white">Capture:</strong> If your last stone lands in an empty pit on your side, you capture it and any stones in the opposite pit.</p>
        </div>
      </div>
    </div>
  );
}
