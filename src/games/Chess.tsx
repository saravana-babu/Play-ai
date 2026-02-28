import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, BrainCircuit } from 'lucide-react';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const { apiKeys, selectedLlm, user } = useStore();

  const makeAMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, result.san]);
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  }, [game]);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (gameOver) return false;
    
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });

    if (move === null) return false;

    // AI move after a short delay
    if (!game.isGameOver()) {
      setTimeout(makeAiMove, 500);
    } else {
      handleEnd();
    }

    return true;
  };

  const makeAiMove = async () => {
    if (game.isGameOver()) {
      handleEnd();
      return;
    }

    setIsAiThinking(true);

    try {
      const possibleMoves = game.moves();
      const systemInstruction = `You are a Grandmaster Chess AI playing as Black. 
      The current board state in FEN is: ${game.fen()}.
      The move history is: ${moveHistory.join(', ')}.
      The legal moves are: ${possibleMoves.join(', ')}.
      
      Analyze the position and choose the best move.
      Return ONLY a JSON object with a single key 'move' containing the SAN (Standard Algebraic Notation) of your chosen move.
      Example: {"move": "Nf3"}`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'chess',
        { fen: game.fen(), history: moveHistory },
        systemInstruction
      );

      if (response && response.move && possibleMoves.includes(response.move)) {
        makeAMove(response.move);
      } else {
        // Fallback to random if AI returns invalid move
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        makeAMove(possibleMoves[randomIndex]);
      }
    } catch (error) {
      console.error('AI Move Error:', error);
      const possibleMoves = game.moves();
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      makeAMove(possibleMoves[randomIndex]);
    } finally {
      setIsAiThinking(false);
      if (game.isGameOver()) {
        handleEnd();
      }
    }
  };

  const handleEnd = async () => {
    setGameOver(true);
    let result: 'white' | 'black' | 'draw' | null = null;
    
    if (game.isCheckmate()) {
      result = game.turn() === 'w' ? 'black' : 'white';
    } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
      result = 'draw';
    }
    
    setWinner(result);

    let task = null;
    if (result === 'black' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Chess');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'chess',
          winner: result === 'white' ? 'user' : result === 'black' ? 'ai' : 'draw',
          funny_task: task
        })
      });
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
    setWinner(null);
    setFunnyTask(null);
    setMoveHistory([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-6xl mx-auto">
      <div className="flex-1 w-full max-w-[600px] mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-700'}`} />
            <span className="text-white font-bold">
              {game.turn() === 'w' ? "Your Turn (White)" : isAiThinking ? "AI is thinking..." : "AI Turn (Black)"}
            </span>
          </div>
          <button onClick={resetGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <Chessboard 
            options={{
              position: game.fen(),
              onPieceDrop: (args) => onDrop(args.sourceSquare, args.targetSquare),
              boardOrientation: "white",
              darkSquareStyle: { backgroundColor: '#1e293b' },
              lightSquareStyle: { backgroundColor: '#334155' }
            }}
          />
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
          <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Move History
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {moveHistory.map((move, i) => (
              <div key={i} className="bg-slate-800/50 px-3 py-1 rounded-lg text-sm text-slate-300 flex justify-between">
                <span className="text-slate-500 font-mono text-xs">{Math.floor(i/2) + 1}{i%2 === 0 ? '.' : '...'}</span>
                <span className="font-bold">{move}</span>
              </div>
            ))}
            {moveHistory.length === 0 && (
              <p className="text-slate-500 text-sm italic col-span-2 text-center py-4">No moves yet</p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-3xl border text-center ${winner === 'white' ? 'bg-emerald-500/10 border-emerald-500/20' : winner === 'black' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                {winner === 'white' ? (
                  <>
                    <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-white mb-1">Checkmate!</h3>
                    <p className="text-slate-400 text-sm">You won against the AI.</p>
                  </>
                ) : winner === 'black' ? (
                  <>
                    <Skull className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-white mb-1">Checkmate!</h3>
                    <p className="text-slate-400 text-sm">The AI got you this time.</p>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold text-white mb-1">Draw!</h3>
                    <p className="text-slate-400 text-sm">The game ended in a draw.</p>
                  </>
                )}
              </div>

              {funnyTask && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-1">Penalty</p>
                  <p className="text-sm text-rose-200 italic">"{funnyTask}"</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex gap-3 items-start">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />
          <div className="text-xs text-slate-400 space-y-1">
            <p><strong className="text-white">Goal:</strong> Trap the opponent's king (Checkmate).</p>
            <p><strong className="text-white">Moves:</strong> Drag and drop pieces to move them.</p>
            <p><strong className="text-white">AI:</strong> Powered by {selectedLlm.charAt(0).toUpperCase() + selectedLlm.slice(1)} brain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
