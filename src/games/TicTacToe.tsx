import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, Minus } from 'lucide-react';
import ShareButton from '../components/ShareButton';

type Player = 'X' | 'O' | null;

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // User is X, AI is O
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isXNext && !winner) {
      makeAiMove();
    }
  }, [isXNext, winner]);

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (!squares.includes(null)) return 'Draw';
    return null;
  };

  const handleWin = async (result: 'X' | 'O' | 'Draw') => {
    if (!isMounted.current) return;
    setWinner(result);
    let task = null;
    
    if (result === 'O' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Tic-Tac-Toe');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      try {
        await fetchApi('/history', {
          method: 'POST',
          body: JSON.stringify({
            game_id: 'tictactoe',
            winner: result === 'X' ? 'user' : result === 'O' ? 'ai' : 'draw',
            funny_task: task,
            total_tokens: gameSessionTokens
          })
        });
      } catch (err) {
        console.error('Failed to save game result:', err);
      }
    }
  };

  const handleClick = (i: number) => {
    if (board[i] || winner || !isXNext || isAiThinking) return;

    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result) {
      handleWin(result);
    } else {
      setIsXNext(false);
    }
  };

  const makeAiMove = async () => {
    if (!apiKeys[selectedLlm] || !isMounted.current) return;
    setIsAiThinking(true);

    try {
      const systemInstruction = `You are playing Tic-Tac-Toe as 'O'. The user is 'X'. The board is an array of 9 elements (0-8) representing rows from top to bottom. Null means empty. Current board: ${JSON.stringify(board)}. Return ONLY a JSON object with a single key 'move' containing the index (0-8) of your next move. Choose a winning move if possible, block the user if they are about to win, otherwise pick a strategic empty spot.`;
      
      const response = await generateNextMove(selectedLlm, apiKeys, 'tictactoe', { board }, systemInstruction);
      
      if (!isMounted.current) return;

      if (response && typeof response.move === 'number' && !board[response.move]) {
        const newBoard = [...board];
        newBoard[response.move] = 'O';
        setBoard(newBoard);
        
        const result = checkWinner(newBoard);
        if (result) {
          handleWin(result);
        } else {
          setIsXNext(true);
        }
      } else {
        // Fallback random move if AI fails
        const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
        if (emptyIndices.length > 0) {
          const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const newBoard = [...board];
          newBoard[randomMove] = 'O';
          setBoard(newBoard);
          const result = checkWinner(newBoard);
          if (result) handleWin(result);
          else setIsXNext(true);
        }
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('AI move failed:', error);
      // Fallback random move
      const emptyIndices = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
      if (emptyIndices.length > 0) {
        const randomMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const newBoard = [...board];
        newBoard[randomMove] = 'O';
        setBoard(newBoard);
        const result = checkWinner(newBoard);
        if (result) handleWin(result);
        else setIsXNext(true);
      }
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setFunnyTask(null);
    resetSessionTokens();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 flex items-center gap-8 text-center">
        <div className={`p-4 rounded-2xl border transition-colors ${isXNext && !winner ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">You</p>
          <p className="text-3xl font-bold text-indigo-400">X</p>
        </div>
        <div className="text-2xl font-bold text-slate-500">VS</div>
        <div className={`p-4 rounded-2xl border transition-colors ${!isXNext && !winner ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">AI</p>
          <p className="text-3xl font-bold text-emerald-400">O</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 bg-slate-800 p-4 rounded-3xl border border-white/10 shadow-2xl">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!cell || !!winner || !isXNext || isAiThinking}
            className={`w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-center text-5xl sm:text-6xl font-bold transition-all
              ${!cell && !winner && isXNext && !isAiThinking ? 'hover:bg-slate-800 hover:border-indigo-500/30 cursor-pointer' : 'cursor-default'}
            `}
          >
            <AnimatePresence mode="popLayout">
              {cell && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cell === 'X' ? 'text-indigo-400' : 'text-emerald-400'}
                >
                  {cell}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      <div className="h-24 flex flex-col items-center justify-center w-full max-w-md">
        {isAiThinking && !winner && (
          <div className="flex items-center gap-3 text-emerald-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium animate-pulse">AI is thinking...</span>
          </div>
        )}

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center space-y-4"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
              winner === 'X' ? 'bg-indigo-500/20 text-indigo-400' :
              winner === 'O' ? 'bg-rose-500/20 text-rose-400' :
              'bg-slate-700 text-slate-300'
            }`}>
              {winner === 'X' ? <><Trophy className="w-5 h-5" /> You Win!</> :
               winner === 'O' ? <><Frown className="w-5 h-5" /> AI Wins!</> :
               <><Minus className="w-5 h-5" /> It's a Draw!</>}
            </div>

            {funnyTask && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">Penalty Task</p>
                <p className="text-sm font-medium text-rose-200">{funnyTask}</p>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-4">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Play Again
              </button>
              <ShareButton 
                gameTitle="Tic-Tac-Toe" 
                winner={winner === 'X' ? 'user' : winner === 'O' ? 'ai' : 'draw'} 
                funnyTask={funnyTask} 
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
