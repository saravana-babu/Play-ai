import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Cpu, Zap, Activity } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Gate = 'AND' | 'OR' | 'XOR' | null;

export default function CircuitMapping() {
    const [board, setBoard] = useState<Gate[]>(Array(9).fill(null));
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [turn, setTurn] = useState<'X' | 'O'>('X'); // X is User/AI-1, O is AI/AI-2

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const checkWinner = (currentBoard: Gate[]) => {
        // A simplified win condition: 3 of same gate in a row
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a]; // Returns the winning gate
            }
        }
        return null;
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Circuit Mapping');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'circuitmapping',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const makeAiMove = useCallback(async (player: 'X' | 'O', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];

            if (emptyIndices.length === 0) {
                setIsAiThinking(false);
                return;
            }

            const availableMoves = emptyIndices.flatMap(idx => [
                { index: idx, gate: 'AND' },
                { index: idx, gate: 'OR' },
                { index: idx, gate: 'XOR' }
            ]);

            const systemPrompt = `You are playing a game of Circuit Mapping on a 3x3 grid (indices 0-8). 
      Your goal is to get 3 of the SAME logic gate (AND, OR, XOR) in a row horizontally, vertically, or diagonally.
      Current board: ${JSON.stringify(board)}.
      Available indices: ${emptyIndices.join(', ')}.
      Choose ONE index and ONE gate (AND, OR, or XOR) to place. 
      Return ONLY a JSON object with 'index' (number) and 'gate' (string). Example: {"index": 4, "gate": "AND"}`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'circuitmapping',
                { board },
                systemPrompt
            );

            if (!isMounted.current) return;

            let chosenMove = response;
            if (!chosenMove || typeof chosenMove.index !== 'number' || !emptyIndices.includes(chosenMove.index)) {
                // Fallback
                const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                chosenMove = randomMove;
            }

            const newBoard = [...board];
            newBoard[chosenMove.index] = chosenMove.gate;
            setBoard(newBoard);

            const winningGate = checkWinner(newBoard);
            if (winningGate) {
                handleEnd(gameMode === 'llm-vs-llm' ? (player === 'X' ? 'ai-1' : 'ai-2') : 'ai');
            } else if (!newBoard.includes(null)) {
                handleEnd('draw');
            } else {
                setTurn(player === 'X' ? 'O' : 'X');
            }

        } catch (e) {
            console.error(e);
            // fallback
            const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];
            if (emptyIndices.length > 0) {
                const newBoard = [...board];
                newBoard[emptyIndices[0]] = 'AND';
                setBoard(newBoard);
                if (!newBoard.includes(null)) handleEnd('draw');
                else setTurn(player === 'X' ? 'O' : 'X');
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    }, [board, gameOver, gameMode, apiKeys]);

    useEffect(() => {
        if (gameOver) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'X' && !isAiThinking) {
                setTimeout(() => makeAiMove('X', player1Llm), 1000);
            } else if (turn === 'O' && !isAiThinking) {
                setTimeout(() => makeAiMove('O', selectedLlm), 1000);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'O' && !isAiThinking) {
            setTimeout(() => makeAiMove('O', selectedLlm), 1000);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm]);

    const handleCellClick = (index: number, gate: Gate) => {
        if (gameOver || board[index] !== null || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'O') return;

        const newBoard = [...board];
        newBoard[index] = gate;
        setBoard(newBoard);

        const winningGate = checkWinner(newBoard);
        if (winningGate) {
            handleEnd('user');
        } else if (!newBoard.includes(null)) {
            handleEnd('draw');
        } else {
            setTurn('O');
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('X');
        resetSessionTokens();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full max-w-md mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${turn === 'X' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">
                                {gameMode === 'llm-vs-llm' ? `AI 1 (${player1Llm}) - X` : 'You - X'}
                            </span>
                            {turn === 'X' && <span className="text-xs text-indigo-400">Current Turn</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col">
                            <span className="text-white font-bold">
                                {gameMode === 'llm-vs-llm' ? `AI 2 (${selectedLlm}) - O` : 'AI - O'}
                            </span>
                            {turn === 'O' && <span className="text-xs text-indigo-400">{isAiThinking ? 'Thinking...' : 'Current Turn'}</span>}
                        </div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${turn === 'O' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl relative">
                    <div className="grid grid-cols-3 gap-3">
                        {board.map((cell, idx) => (
                            <div key={idx} className="relative aspect-square">
                                {cell === null && !gameOver && turn === 'X' && gameMode === 'human-vs-ai' && !isAiThinking ? (
                                    <div className="absolute inset-0 grid grid-rows-3 gap-1 opactiy-0 hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleCellClick(idx, 'AND')} className="bg-slate-800 hover:bg-indigo-500 text-xs text-white rounded-md transition-colors">AND</button>
                                        <button onClick={() => handleCellClick(idx, 'OR')} className="bg-slate-800 hover:bg-emerald-500 text-xs text-white rounded-md transition-colors">OR</button>
                                        <button onClick={() => handleCellClick(idx, 'XOR')} className="bg-slate-800 hover:bg-rose-500 text-xs text-white rounded-md transition-colors">XOR</button>
                                    </div>
                                ) : (
                                    <div className={`w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${cell === 'AND' ? 'border-indigo-500 bg-indigo-500/10' :
                                        cell === 'OR' ? 'border-emerald-500 bg-emerald-500/10' :
                                            cell === 'XOR' ? 'border-rose-500 bg-rose-500/10' :
                                                'border-slate-800 bg-slate-800/50'
                                        }`}>
                                        {cell && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`font-bold text-xl ${cell === 'AND' ? 'text-indigo-400' : cell === 'OR' ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                {cell}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {(gameOver) && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6 text-center">
                            <div className="space-y-4">
                                {winner === 'draw' ? (
                                    <Activity className="w-12 h-12 text-slate-400 mx-auto" />
                                ) : winner === 'user' || winner === 'ai-1' ? (
                                    <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
                                ) : (
                                    <Skull className="w-12 h-12 text-rose-400 mx-auto" />
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {winner === 'draw' ? "It's a Short Circuit!" : winner === 'user' ? 'You Mapped It!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'AI Wins!'}
                                </h3>
                                <ShareButtons
                                    gameTitle="Circuit Mapping"
                                    result={winner === 'user' ? 'successfully mapped the circuit' : winner === 'draw' ? 'short-circuited the AI' : 'got overloaded'}
                                    penalty={penalty}
                                />
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform hover:scale-105 mt-4"
                                >
                                    Remap Circuit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-80 space-y-6">
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">How to Play</h3>
                    </div>
                    <div className="space-y-3 text-sm text-slate-400">
                        <p><strong className="text-white">Goal:</strong> Get 3 of the SAME logic gate (AND, OR, or XOR) in a row to win.</p>
                        <p><strong className="text-white">Turns:</strong> You and the AI take turns placing ANY logic gate in an empty spot.</p>
                        <p>Hover over an empty spot to select which gate to place.</p>
                    </div>
                </div>

                <AnimatePresence>
                    {penalty && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden"
                        >
                            <div className="relative z-10 text-center">
                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                                <p className="text-sm font-medium text-rose-200">"{penalty}"</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
