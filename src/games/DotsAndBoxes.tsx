import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion } from 'motion/react';
import { RefreshCw, Trophy, Skull, User, Bot } from 'lucide-react';

type Line = { r: number; c: number; type: 'h' | 'v' };
type Box = { r: number; c: number; owner: 'user' | 'ai' | null };

export default function DotsAndBoxes() {
  const [lines, setLines] = useState<Set<string>>(new Set<string>());
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [turn, setTurn] = useState<'user' | 'ai'>('user');
  const [scores, setScores] = useState({ user: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user } = useStore();

  const size = 4; // 4x4 dots = 3x3 boxes

  const initGame = () => {
    setLines(new Set<string>());
    const initialBoxes: Box[] = [];
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        initialBoxes.push({ r, c, owner: null });
      }
    }
    setBoxes(initialBoxes);
    setTurn('user');
    setScores({ user: 0, ai: 0 });
    setGameOver(false);
    setFunnyTask(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const getLineKey = (r: number, c: number, type: 'h' | 'v') => `${type}-${r}-${c}`;

  const handleLineClick = (r: number, c: number, type: 'h' | 'v') => {
    if (turn !== 'user' || gameOver || lines.has(getLineKey(r, c, type))) return;
    makeMove(r, c, type, 'user');
  };

  const makeMove = (r: number, c: number, type: 'h' | 'v', player: 'user' | 'ai') => {
    const key = getLineKey(r, c, type);
    const newLines = new Set<string>(lines);
    newLines.add(key);
    setLines(newLines);

    const newlyFilledBoxes: number[] = [];
    const newBoxes = boxes.map((box, idx) => {
      if (box.owner) return box;
      
      const hasTop = newLines.has(getLineKey(box.r, box.c, 'h'));
      const hasBottom = newLines.has(getLineKey(box.r + 1, box.c, 'h'));
      const hasLeft = newLines.has(getLineKey(box.r, box.c, 'v'));
      const hasRight = newLines.has(getLineKey(box.r, box.c + 1, 'v'));

      if (hasTop && hasBottom && hasLeft && hasRight) {
        newlyFilledBoxes.push(idx);
        return { ...box, owner: player };
      }
      return box;
    });

    setBoxes(newBoxes);

    if (newlyFilledBoxes.length > 0) {
      const newScores = { ...scores, [player]: scores[player] + newlyFilledBoxes.length };
      setScores(newScores);
      
      if (newLines.size === (size * (size - 1) * 2)) {
        handleEnd(newScores.user > newScores.ai ? 'user' : 'ai');
      } else if (player === 'ai') {
        setTimeout(() => aiMove(newLines, newBoxes, newScores), 600);
      }
    } else {
      const nextTurn = player === 'user' ? 'ai' : 'user';
      setTurn(nextTurn);
      if (nextTurn === 'ai') {
        setTimeout(() => aiMove(newLines, newBoxes, scores), 600);
      }
    }
  };

  const aiMove = (currentLines: Set<string>, currentBoxes: Box[], currentScores: { user: number; ai: number }) => {
    const availableLines: Line[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 1; c++) {
        if (!currentLines.has(getLineKey(r, c, 'h'))) availableLines.push({ r, c, type: 'h' });
      }
    }
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size; c++) {
        if (!currentLines.has(getLineKey(r, c, 'v'))) availableLines.push({ r, c, type: 'v' });
      }
    }

    if (availableLines.length === 0) return;

    // Simple AI: prioritize completing a box
    let bestMove = availableLines[Math.floor(Math.random() * availableLines.length)];
    
    for (const line of availableLines) {
      const tempLines = new Set<string>(currentLines);
      tempLines.add(getLineKey(line.r, line.c, line.type));
      
      const completed = currentBoxes.some(box => {
        if (box.owner) return false;
        return tempLines.has(getLineKey(box.r, box.c, 'h')) &&
               tempLines.has(getLineKey(box.r + 1, box.c, 'h')) &&
               tempLines.has(getLineKey(box.r, box.c, 'v')) &&
               tempLines.has(getLineKey(box.r, box.c + 1, 'v'));
      });

      if (completed) {
        bestMove = line;
        break;
      }
    }

    makeMove(bestMove.r, bestMove.c, bestMove.type, 'ai');
  };

  const handleEnd = async (winner: 'user' | 'ai') => {
    setGameOver(true);
    let task = null;
    if (winner === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Dots and Boxes');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'dots',
          winner: winner,
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md mx-auto">
      <div className="flex justify-between w-full mb-12 items-center px-4">
        <div className="flex items-center gap-4">
          <div className={`text-center p-2 rounded-xl border transition-all ${turn === 'user' ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800 border-white/10'}`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase">You</p>
            <p className="text-xl font-bold text-indigo-400">{scores.user}</p>
          </div>
          <div className={`text-center p-2 rounded-xl border transition-all ${turn === 'ai' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800 border-white/10'}`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase">AI</p>
            <p className="text-xl font-bold text-emerald-400">{scores.ai}</p>
          </div>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="relative p-8 bg-slate-900 rounded-[40px] border border-white/10 shadow-2xl">
        {/* Boxes */}
        <div className="grid grid-cols-3 grid-rows-3 absolute inset-8 pointer-events-none">
          {boxes.map((box, i) => (
            <div key={i} className={`flex items-center justify-center transition-all duration-500 ${box.owner === 'user' ? 'bg-indigo-500/20' : box.owner === 'ai' ? 'bg-emerald-500/20' : ''}`}>
              {box.owner && (
                <span className={`text-2xl font-black ${box.owner === 'user' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  {box.owner === 'user' ? 'U' : 'A'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Dots and Lines */}
        <div className="relative z-10" style={{ width: '240px', height: '240px' }}>
          {/* Horizontal Lines */}
          {Array(size).fill(0).map((_, r) => (
            Array(size - 1).fill(0).map((_, c) => (
              <button
                key={`h-${r}-${c}`}
                onClick={() => handleLineClick(r, c, 'h')}
                className={`absolute h-2 rounded-full transition-all
                  ${lines.has(getLineKey(r, c, 'h')) ? 'bg-slate-400' : 'bg-slate-800 hover:bg-indigo-500/50'}
                `}
                style={{ top: `${r * 80}px`, left: `${c * 80 + 10}px`, width: '60px' }}
              />
            ))
          ))}
          {/* Vertical Lines */}
          {Array(size - 1).fill(0).map((_, r) => (
            Array(size).fill(0).map((_, c) => (
              <button
                key={`v-${r}-${c}`}
                onClick={() => handleLineClick(r, c, 'v')}
                className={`absolute w-2 rounded-full transition-all
                  ${lines.has(getLineKey(r, c, 'v')) ? 'bg-slate-400' : 'bg-slate-800 hover:bg-indigo-500/50'}
                `}
                style={{ top: `${r * 80 + 10}px`, left: `${c * 80}px`, height: '60px' }}
              />
            ))
          ))}
          {/* Dots */}
          {Array(size).fill(0).map((_, r) => (
            Array(size).fill(0).map((_, c) => (
              <div
                key={`d-${r}-${c}`}
                className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                style={{ top: `${r * 80 - 4}px`, left: `${c * 80 - 4}px` }}
              />
            ))
          ))}
        </div>
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-12 space-y-6 w-full">
          <div className={`p-8 rounded-3xl border ${scores.user > scores.ai ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <h3 className="text-2xl font-bold text-white mb-1">{scores.user > scores.ai ? 'Victory!' : 'Defeat!'}</h3>
            <p className="text-slate-400">Final Score: {scores.user} - {scores.ai}</p>
          </div>

          {funnyTask && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-xs text-rose-400 font-bold uppercase mb-1">Penalty</p>
              <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
            </div>
          )}

          <button onClick={initGame} className="flex items-center gap-2 mx-auto px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all">
            <RefreshCw className="w-5 h-5" /> New Game
          </button>
        </motion.div>
      )}
    </div>
  );
}