import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, User, Bot } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export default function Nim() {
  const [piles, setPiles] = useState<number[]>([3, 4, 5]);
  const [turn, setTurn] = useState<'user' | 'ai'>('user');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'user' | 'ai' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    setPiles([3, 4, 5]);
    setTurn('user');
    setGameOver(false);
    setWinner(null);
    setFunnyTask(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleTake = (pileIndex: number, count: number) => {
    if (turn !== 'user' || gameOver) return;

    const newPiles = [...piles];
    newPiles[pileIndex] -= count;
    setPiles(newPiles);

    if (newPiles.every(p => p === 0)) {
      handleEnd('ai'); // Last one to take loses, so AI wins
    } else {
      setTurn('ai');
      setTimeout(() => aiMove(newPiles), 1000);
    }
  };

  const aiMove = (currentPiles: number[]) => {
    // Nim-sum strategy
    const nimSum = currentPiles.reduce((acc, p) => acc ^ p, 0);
    let movePile = -1;
    let moveCount = 0;

    if (nimSum !== 0) {
      for (let i = 0; i < currentPiles.length; i++) {
        const target = currentPiles[i] ^ nimSum;
        if (target < currentPiles[i]) {
          movePile = i;
          moveCount = currentPiles[i] - target;
          break;
        }
      }
    }

    if (movePile === -1) {
      // Random move if in losing position
      const availablePiles = currentPiles.map((p, i) => p > 0 ? i : -1).filter(i => i !== -1);
      movePile = availablePiles[Math.floor(Math.random() * availablePiles.length)];
      moveCount = Math.floor(Math.random() * currentPiles[movePile]) + 1;
    }

    const newPiles = [...currentPiles];
    newPiles[movePile] -= moveCount;
    setPiles(newPiles);

    if (newPiles.every(p => p === 0)) {
      handleEnd('user');
    } else {
      setTurn('user');
    }
  };

  const handleEnd = async (gameWinner: 'user' | 'ai') => {
    setGameOver(true);
    setWinner(gameWinner);
    let task = null;
    if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Nim');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'nim',
          winner: gameWinner,
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-12 items-center">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${turn === 'user' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <User className="w-5 h-5" />
          <span className="font-bold">Your Turn</span>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${turn === 'ai' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <Bot className="w-5 h-5" />
          <span className="font-bold">AI Thinking</span>
        </div>
      </div>

      <div className="flex gap-12 mb-12 items-end h-64">
        {piles.map((count, pileIdx) => (
          <div key={pileIdx} className="flex flex-col-reverse gap-2 items-center">
            {[...Array(count)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleTake(pileIdx, count - i)}
                disabled={turn !== 'user' || gameOver}
                className={`w-12 h-6 rounded-full transition-all
                  ${turn === 'user' ? 'bg-indigo-500 hover:bg-indigo-400 cursor-pointer' : 'bg-slate-700'}
                  shadow-[0_4px_0_rgba(0,0,0,0.3)]
                `}
              />
            ))}
            <span className="text-slate-500 font-bold mb-2">Pile {pileIdx + 1}</span>
          </div>
        ))}
      </div>

      <div className="text-center text-slate-400 text-sm mb-8">
        Take any number of objects from a single pile. <br />
        The player who takes the last object <span className="text-rose-400 font-bold">loses</span>.
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 w-full">
          <div className={`p-8 rounded-3xl border ${winner === 'user' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              {winner === 'user' ? <Trophy className="w-8 h-8 text-yellow-400" /> : <Skull className="w-8 h-8 text-rose-400" />}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{winner === 'user' ? 'You Won!' : 'AI Wins!'}</h3>
          </div>

          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <ShareButtons
            gameTitle="Nim"
            result={winner === 'user' ? 'outsmarted the AI in a game of Nim' : 'lost the battle of items'}
            penalty={funnyTask}
          />
          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all mt-4">
            <RefreshCw className="w-5 h-5" /> New Game
          </button>
        </motion.div>
      )}
    </div>
  );
}