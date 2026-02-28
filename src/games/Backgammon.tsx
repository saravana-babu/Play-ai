import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, Dices } from 'lucide-react';

type BoardState = number[]; // 24 points, positive for player, negative for AI

export default function Backgammon() {
  const [board, setBoard] = useState<BoardState>(Array(24).fill(0));
  const [dice, setDice] = useState<number[]>([0, 0]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [message, setMessage] = useState('Roll the dice to start!');
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    const initialBoard = Array(24).fill(0);
    initialBoard[0] = 2;
    initialBoard[5] = -5;
    initialBoard[7] = -3;
    initialBoard[11] = 5;
    initialBoard[12] = -5;
    initialBoard[16] = 3;
    initialBoard[18] = 5;
    initialBoard[23] = -2;
    setBoard(initialBoard);
    setDice([0, 0]);
    setTurn('player');
    setGameOver(false);
    setFunnyTask(null);
    setMessage('Roll the dice to start!');
  };

  useEffect(() => {
    initGame();
  }, []);

  const rollDice = () => {
    if (dice[0] !== 0 || gameOver || loading) return;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]);
    setMessage(`You rolled ${d1} and ${d2}! Move your pieces.`);
  };

  const handleMove = (from: number, to: number) => {
    if (turn !== 'player' || dice[0] === 0 || gameOver || loading) return;
    
    const dist = to - from;
    if (dice.includes(dist)) {
      const newBoard = [...board];
      if (newBoard[from] > 0 && newBoard[to] >= -1) {
        newBoard[from]--;
        newBoard[to]++;
        setBoard(newBoard);
        
        const newDice = [...dice];
        newDice.splice(newDice.indexOf(dist), 1);
        setDice(newDice);
        
        if (newDice.length === 0) {
          setTurn('ai');
          setTimeout(handleAiMove, 1000);
        }
      }
    }
  };

  const handleAiMove = async () => {
    if (gameOver) return;
    setLoading(true);
    setMessage('AI is rolling and moving...');

    try {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      
      const systemInstruction = `You are a Backgammon Expert. 
      Board State: ${JSON.stringify(board)}
      AI rolled: ${d1}, ${d2}
      AI pieces are negative numbers. AI moves from index 23 down to 0.
      
      Return ONLY a JSON object:
      {
        "moves": [
          {"from": 23, "to": 17},
          {"from": 12, "to": 6}
        ]
      }`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'backgammon',
        { board, dice: [d1, d2] },
        systemInstruction
      );

      if (response && response.moves) {
        const newBoard = [...board];
        response.moves.forEach((m: { from: number; to: number }) => {
          if (newBoard[m.from] < 0 && newBoard[m.to] <= 1) {
            newBoard[m.from]++;
            newBoard[m.to]--;
          }
        });
        setBoard(newBoard);
        setMessage(`AI rolled ${d1}, ${d2} and moved! Your turn.`);
      } else {
        throw new Error('AI could not move');
      }
    } catch (error) {
      console.error('AI Backgammon Error:', error);
      setMessage('AI passed its turn.');
    } finally {
      setDice([0, 0]);
      setTurn('player');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Turn</p>
            <p className={`text-2xl font-black ${turn === 'player' ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {turn === 'player' ? 'You' : 'AI'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Dice</p>
            <div className="flex gap-2 justify-center">
              {dice.map((d, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${d === 0 ? 'bg-slate-800 text-slate-600' : 'bg-white text-slate-900 shadow-lg'}`}>
                  {d || '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={rollDice} 
            disabled={dice[0] !== 0 || turn !== 'player' || gameOver || loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Dices className="w-5 h-5" /> Roll Dice
          </button>
          <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
        <div className="grid grid-cols-12 gap-1 w-full max-w-4xl h-64 bg-slate-800 rounded-2xl p-4 border border-white/5 relative">
          {/* Simplified Board Visualization */}
          {board.map((count, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1">
              <div className="text-[8px] text-slate-600 font-bold">{i}</div>
              <div className="flex flex-col-reverse gap-1">
                {Array(Math.abs(count)).fill(0).map((_, j) => (
                  <div key={j} className={`w-4 h-4 rounded-full ${count > 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                ))}
              </div>
            </div>
          ))}
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 font-medium italic">"{message}"</p>
          <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest font-bold">Simplified Backgammon - Click points to move (logic coming soon)</p>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            >
              <div className="text-center space-y-8 max-w-md">
                <h2 className="text-4xl font-black text-white">Game Over</h2>
                <button onClick={initGame} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold">Play Again</button>
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
            Roll the dice and move your pieces (indigo) towards the end of the board. 
            AI moves the emerald pieces. This is a simplified version where you click points to move.
          </p>
        </div>
      </div>
    </div>
  );
}
