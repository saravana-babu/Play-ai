import React, { useState, useEffect, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Frown, Minus } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Player = 'Red' | 'Yellow' | null;

export default function Connect4() {
  const ROWS = 6;
  const COLS = 7;

  const [board, setBoard] = useState<Player[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [isUserNext, setIsUserNext] = useState<boolean>(true); // User is Red, AI is Yellow
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!winner) {
      if (!isUserNext) {
        makeAiMove('Yellow', selectedLlm);
      } else if (gameMode === 'llm-vs-llm') {
        makeAiMove('Red', player1Llm);
      }
    }
  }, [isUserNext, winner, gameMode]);

  const checkWinner = (currentBoard: Player[][]): Player | 'Draw' | null => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r][c + 1] &&
          currentBoard[r][c] === currentBoard[r][c + 2] &&
          currentBoard[r][c] === currentBoard[r][c + 3]) {
          return currentBoard[r][c];
        }
      }
    }
    // Check vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r + 1][c] &&
          currentBoard[r][c] === currentBoard[r + 2][c] &&
          currentBoard[r][c] === currentBoard[r + 3][c]) {
          return currentBoard[r][c];
        }
      }
    }
    // Check diagonal (down-right)
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r + 1][c + 1] &&
          currentBoard[r][c] === currentBoard[r + 2][c + 2] &&
          currentBoard[r][c] === currentBoard[r + 3][c + 3]) {
          return currentBoard[r][c];
        }
      }
    }
    // Check diagonal (up-right)
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (currentBoard[r][c] &&
          currentBoard[r][c] === currentBoard[r - 1][c + 1] &&
          currentBoard[r][c] === currentBoard[r - 2][c + 2] &&
          currentBoard[r][c] === currentBoard[r - 3][c + 3]) {
          return currentBoard[r][c];
        }
      }
    }

    // Check draw
    if (currentBoard[0].every(cell => cell !== null)) {
      return 'Draw';
    }

    return null;
  };

  const handleWin = async (result: Player | 'Draw') => {
    if (!isMounted.current) return;
    setWinner(result);
    let task = null;

    if (result === 'Yellow' && apiKeys[selectedLlm] && gameMode !== 'llm-vs-llm') {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Connect 4');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      try {
        let winnerLabel = result === 'Red' ? 'user' : result === 'Yellow' ? 'ai' : 'draw';
        if (gameMode === 'llm-vs-llm') {
          winnerLabel = result === 'Red' ? 'ai-1' : result === 'Yellow' ? 'ai-2' : 'draw';
        }

        await fetchApi('/history', {
          method: 'POST',
          body: JSON.stringify({
            game_id: 'connect4',
            winner: winnerLabel,
            funny_task: task,
            total_tokens: gameSessionTokens
          })
        });
      } catch (err) {
        console.error('Failed to save game result:', err);
      }
    }
  };

  const dropPiece = (col: number, player: Player, currentBoard: Player[][]): Player[][] | null => {
    const newBoard = currentBoard.map(row => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!newBoard[r][col]) {
        newBoard[r][col] = player;
        return newBoard;
      }
    }
    return null; // Column is full
  };

  const handleColumnClick = (col: number) => {
    if (winner || !isUserNext || isAiThinking || gameMode === 'llm-vs-llm') return;

    const newBoard = dropPiece(col, 'Red', board);
    if (newBoard) {
      setBoard(newBoard);
      const result = checkWinner(newBoard);
      if (result) {
        handleWin(result);
      } else {
        setIsUserNext(false);
      }
    }
  };

  const makeAiMove = async (player: 'Red' | 'Yellow', llm: LlmProvider) => {
    if (!apiKeys[llm] || !isMounted.current) return;
    setIsAiThinking(true);

    try {
      const systemInstruction = `You are playing Connect 4 as '${player}'. The other player is '${player === 'Red' ? 'Yellow' : 'Red'}'. The board is a 6x7 grid (rows x cols). Null means empty. Current board: ${JSON.stringify(board)}. Return ONLY a JSON object with a single key 'column' containing the index (0-6) of your next move. Choose a winning move if possible, block the opponent if they are about to win, otherwise pick a strategic column that is not full.`;

      const response = await generateNextMove(llm, apiKeys, 'connect4', { board }, systemInstruction);

      if (!isMounted.current) return;

      if (response && typeof response.column === 'number' && response.column >= 0 && response.column < COLS) {
        const newBoard = dropPiece(response.column, player, board);
        if (newBoard) {
          setBoard(newBoard);
          const result = checkWinner(newBoard);
          if (result) {
            handleWin(result);
          } else {
            setIsUserNext(player === 'Yellow');
          }
          if (isMounted.current) setIsAiThinking(false);
          return;
        }
      }

      // Fallback
      throw new Error("Invalid AI move");
    } catch (error) {
      if (!isMounted.current) return;
      console.error('AI move failed:', error);
      // Fallback random move
      const availableCols = [];
      for (let c = 0; c < COLS; c++) {
        if (!board[0][c]) availableCols.push(c);
      }

      if (availableCols.length > 0) {
        const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
        const newBoard = dropPiece(randomCol, player, board);
        if (newBoard) {
          setBoard(newBoard);
          const result = checkWinner(newBoard);
          if (result) handleWin(result);
          else setIsUserNext(player === 'Yellow');
        }
      }
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setIsUserNext(true);
    setWinner(null);
    setFunnyTask(null);
    resetSessionTokens();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 flex items-center gap-8 text-center">
        <div className={`p-4 rounded-2xl border transition-colors ${isUserNext && !winner ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">{gameMode === 'llm-vs-llm' ? `AI 1 (${player1Llm})` : 'You'}</p>
          <div className="w-8 h-8 rounded-full bg-rose-500 mx-auto shadow-inner shadow-black/50"></div>
        </div>
        <div className="text-2xl font-bold text-slate-500">VS</div>
        <div className={`p-4 rounded-2xl border transition-colors ${!isUserNext && !winner ? 'bg-amber-500/20 border-amber-500/50' : 'bg-slate-800 border-white/10'}`}>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">{gameMode === 'llm-vs-llm' ? `AI 2 (${selectedLlm})` : 'AI'}</p>
          <div className="w-8 h-8 rounded-full bg-amber-400 mx-auto shadow-inner shadow-black/50"></div>
        </div>
      </div>

      <div className="bg-indigo-600 p-4 rounded-3xl border-4 border-indigo-800 shadow-2xl mb-8">
        <div className="flex gap-2 mb-2">
          {Array(COLS).fill(null).map((_, colIndex) => (
            <button
              key={`btn-${colIndex}`}
              onClick={() => handleColumnClick(colIndex)}
              disabled={!!winner || !isUserNext || isAiThinking || !!board[0][colIndex] || gameMode === 'llm-vs-llm'}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <div className="w-4 h-4 rounded-full bg-white/20"></div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 bg-indigo-700 p-2 rounded-2xl">
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-indigo-900 shadow-inner overflow-hidden relative"
              >
                <AnimatePresence>
                  {cell && (
                    <motion.div
                      initial={{ y: -300, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                      className={`absolute inset-0 rounded-full shadow-inner shadow-black/50 ${cell === 'Red' ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))
          ))}
        </div>
      </div>

      <div className="h-24 flex flex-col items-center justify-center w-full max-w-md">
        {isAiThinking && !winner && (
          <div className="flex items-center gap-3 text-amber-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="font-medium animate-pulse">
              {gameMode === 'llm-vs-llm' ? (isUserNext ? 'AI 1 is thinking...' : 'AI 2 is thinking...') : 'AI is thinking...'}
            </span>
          </div>
        )}

        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-center space-y-4"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${winner === 'Red' ? 'bg-rose-500/20 text-rose-400' :
              winner === 'Yellow' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-700 text-slate-300'
              }`}>
              {winner === 'Red' ? <><Trophy className="w-5 h-5" /> {gameMode === 'llm-vs-llm' ? 'AI 1 Wins!' : 'You Win!'}</> :
                winner === 'Yellow' ? <><Frown className="w-5 h-5" /> {gameMode === 'llm-vs-llm' ? 'AI 2 Wins!' : 'AI Wins!'}</> :
                  <><Minus className="w-5 h-5" /> It's a Draw!</>}
            </div>

            {funnyTask && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">Penalty Task</p>
                <p className="text-sm font-medium text-rose-200">{funnyTask}</p>
              </div>
            )}

            <ShareButtons
              gameTitle="Connect 4"
              result={winner === 'Red' ? 'aligned 4 in a row' : winner === 'Yellow' ? 'got blocked by the AI' : 'reached a draw'}
              penalty={funnyTask}
              onPlayAgain={resetGame}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
