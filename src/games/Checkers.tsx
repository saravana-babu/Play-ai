import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, BrainCircuit } from 'lucide-react';

type Piece = 'w' | 'b' | 'wk' | 'bk' | null;
type Board = Piece[][];
type Player = 'w' | 'b';

export default function Checkers() {
  const [board, setBoard] = useState<Board>([]);
  const [turn, setTurn] = useState<Player>('w');
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initGame = () => {
    const newBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) newBoard[r][c] = 'b';
          else if (r > 4) newBoard[r][c] = 'w';
        }
      }
    }
    setBoard(newBoard);
    setTurn('w');
    setSelected(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
    setFunnyTask(null);
    setIsAiThinking(false);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
  }, []);

  const getValidMoves = (r: number, c: number, b: Board, player: Player) => {
    const moves: [number, number][] = [];
    const piece = b[r][c];
    if (!piece || !piece.startsWith(player)) return moves;

    const directions = piece.endsWith('k') ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : 
                      player === 'w' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];

    // Check for jumps first
    directions.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      const jr = r + 2 * dr;
      const jc = c + 2 * dc;

      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8) {
        const midPiece = b[nr][nc];
        if (midPiece && !midPiece.startsWith(player) && b[jr][jc] === null) {
          moves.push([jr, jc]);
        }
      }
    });

    // If no jumps, check for regular moves
    if (moves.length === 0) {
      directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && b[nr][nc] === null) {
          moves.push([nr, nc]);
        }
      });
    }

    return moves;
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameOver || turn !== 'w' || isAiThinking) return;

    if (selected && validMoves.some(([vr, vc]) => vr === r && vc === c)) {
      makeMove(selected[0], selected[1], r, c);
    } else {
      const piece = board[r][c];
      if (piece && piece.startsWith('w')) {
        setSelected([r, c]);
        setValidMoves(getValidMoves(r, c, board, 'w'));
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    }
  };

  const makeMove = (fr: number, fc: number, tr: number, tc: number) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fr][fc];
    newBoard[tr][tc] = piece;
    newBoard[fr][fc] = null;

    // Capture
    if (Math.abs(tr - fr) === 2) {
      newBoard[(fr + tr) / 2][(fc + tc) / 2] = null;
    }

    // Kinging
    if (turn === 'w' && tr === 0) newBoard[tr][tc] = 'wk';
    if (turn === 'b' && tr === 7) newBoard[tr][tc] = 'bk';

    setBoard(newBoard);
    setSelected(null);
    setValidMoves([]);

    if (checkWin(newBoard, turn === 'w' ? 'b' : 'w')) {
      handleEnd(turn);
    } else {
      const nextTurn = turn === 'w' ? 'b' : 'w';
      setTurn(nextTurn);
      if (nextTurn === 'b') {
        setTimeout(() => aiMove(newBoard), 1000);
      }
    }
  };

  const aiMove = async (currentBoard: Board) => {
    if (gameOver || !isMounted.current) return;
    setIsAiThinking(true);

    try {
      // Find all valid moves for AI
      const allMoves: {from: [number, number], to: [number, number]}[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c]?.startsWith('b')) {
            const moves = getValidMoves(r, c, currentBoard, 'b');
            moves.forEach(m => allMoves.push({from: [r, c], to: m}));
          }
        }
      }

      if (allMoves.length === 0) {
        handleEnd('w');
        return;
      }

      const systemInstruction = `You are a Checkers Grandmaster. 
      Board State: ${JSON.stringify(currentBoard)}
      Valid Moves for AI (Black): ${JSON.stringify(allMoves)}
      
      Choose the best move to win.
      Return ONLY a JSON object: {"from": [row, col], "to": [row, col]}`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'checkers',
        { board: currentBoard },
        systemInstruction
      );

      if (!isMounted.current) return;

      const chosen = response && response.from && response.to ? response : 
                    (allMoves.filter(m => Math.abs(m.to[0] - m.from[0]) === 2)[0] || allMoves[Math.floor(Math.random() * allMoves.length)]);

      const newBoard = currentBoard.map(row => [...row]);
      const piece = newBoard[chosen.from[0]][chosen.from[1]];
      newBoard[chosen.to[0]][chosen.to[1]] = piece;
      newBoard[chosen.from[0]][chosen.from[1]] = null;

      if (Math.abs(chosen.to[0] - chosen.from[0]) === 2) {
        newBoard[(chosen.from[0] + chosen.to[0]) / 2][(chosen.from[1] + chosen.to[1]) / 2] = null;
      }

      if (chosen.to[0] === 7 && newBoard[chosen.to[0]][chosen.to[1]] === 'b') newBoard[chosen.to[0]][chosen.to[1]] = 'bk';

      setBoard(newBoard);
      
      if (checkWin(newBoard, 'w')) {
        handleEnd('b');
      } else {
        setTurn('w');
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('Checkers AI Error:', error);
      // Fallback to random move
      const allMoves: {from: [number, number], to: [number, number]}[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c]?.startsWith('b')) {
            const moves = getValidMoves(r, c, currentBoard, 'b');
            moves.forEach(m => allMoves.push({from: [r, c], to: m}));
          }
        }
      }
      if (allMoves.length > 0) {
        const chosen = allMoves[Math.floor(Math.random() * allMoves.length)];
        const newBoard = currentBoard.map(row => [...row]);
        const piece = newBoard[chosen.from[0]][chosen.from[1]];
        newBoard[chosen.to[0]][chosen.to[1]] = piece;
        newBoard[chosen.from[0]][chosen.from[1]] = null;
        if (Math.abs(chosen.to[0] - chosen.from[0]) === 2) {
          newBoard[(chosen.from[0] + chosen.to[0]) / 2][(chosen.from[1] + chosen.to[1]) / 2] = null;
        }
        if (chosen.to[0] === 7 && newBoard[chosen.to[0]][chosen.to[1]] === 'b') newBoard[chosen.to[0]][chosen.to[1]] = 'bk';
        setBoard(newBoard);
        setTurn('w');
      }
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const checkWin = (b: Board, player: Player) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.startsWith(player)) {
          if (getValidMoves(r, c, b, player).length > 0) return false;
        }
      }
    }
    return true;
  };

  const handleEnd = async (w: Player) => {
    if (!isMounted.current) return;
    setGameOver(true);
    setWinner(w);
    let task = null;
    if (w === 'b' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Checkers');
      if (!isMounted.current) return;
      setFunnyTask(task);
    }

    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'checkers',
          winner: w === 'w' ? 'user' : 'ai',
          funny_task: task,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 items-center px-4">
        <div className={`px-4 py-2 rounded-xl border transition-all ${turn === 'w' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <span className="font-bold">Your Turn</span>
        </div>
        <div className="flex items-center gap-4">
          {isAiThinking && <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />}
          <button onClick={initGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className={`px-4 py-2 rounded-xl border transition-all ${turn === 'b' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-white/10 text-slate-400'}`}>
          <span className="font-bold">AI Turn</span>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-3xl border border-white/10 shadow-2xl w-full aspect-square grid grid-cols-8 gap-1">
        {board.map((row, r) => 
          row.map((cell, c) => {
            const isDark = (r + c) % 2 === 1;
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative flex items-center justify-center rounded-sm transition-all
                  ${isDark ? 'bg-slate-800' : 'bg-slate-950'}
                  ${isValidMove ? 'cursor-pointer ring-2 ring-emerald-500/50 ring-inset bg-emerald-500/10' : ''}
                  ${isSelected ? 'bg-indigo-500/20 ring-2 ring-indigo-500 ring-inset' : ''}
                `}
              >
                {cell && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-4/5 h-4/5 rounded-full shadow-lg flex items-center justify-center
                      ${cell.startsWith('w') ? 'bg-white' : 'bg-slate-700'}
                      ${cell.endsWith('k') ? 'border-4 border-amber-400' : ''}
                    `}
                  >
                    {cell.endsWith('k') && <span className="text-amber-400 text-xs font-black">K</span>}
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center space-y-6 w-full"
          >
            <div className={`p-8 rounded-3xl border ${winner === 'w' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              {winner === 'w' ? (
                <>
                  <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Victory!</h3>
                  <p className="text-slate-400">You've captured all AI pieces.</p>
                </>
              ) : (
                <>
                  <Skull className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-white mb-2">Defeat!</h3>
                  <p className="text-slate-400">The AI has won the game.</p>
                </>
              )}
            </div>

            {funnyTask && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty</p>
                <p className="text-lg text-rose-200 italic">"{funnyTask}"</p>
              </div>
            )}

            <button onClick={initGame} className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all">
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex gap-4 items-start w-full">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
        <div className="text-sm text-slate-400 space-y-2">
          <p><strong className="text-white">Goal:</strong> Capture all opponent pieces or block them from moving.</p>
          <p><strong className="text-white">Movement:</strong> Pieces move diagonally forward. Kings can move backward.</p>
          <p><strong className="text-white">Capture:</strong> Jump over an opponent's piece to an empty square behind it.</p>
        </div>
      </div>
    </div>
  );
}
