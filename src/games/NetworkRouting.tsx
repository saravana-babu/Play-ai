import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Network, Router, Activity } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Node = 'P1' | 'P2' | null;

export default function NetworkRouting() {
    const [board, setBoard] = useState<Node[]>(Array(25).fill(null)); // 5x5 grid
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [turn, setTurn] = useState<'P1' | 'P2'>('P1');

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const checkWinner = (currentBoard: Node[]) => {
        // P1 (Left to Right) - check if any node in col 0 connects to col 4
        // P2 (Top to Bottom) - check if any node in row 0 connects to row 4

        const bfs = (player: 'P1' | 'P2', startIndices: number[], isTarget: (idx: number) => boolean) => {
            const queue = [...startIndices];
            const visited = new Set<number>(startIndices);

            while (queue.length > 0) {
                const curr = queue.shift()!;
                if (isTarget(curr)) return true;

                // neighbors: up, down, left, right
                const neighbors = [];
                const row = Math.floor(curr / 5);
                const col = curr % 5;

                if (row > 0) neighbors.push(curr - 5);
                if (row < 4) neighbors.push(curr + 5);
                if (col > 0) neighbors.push(curr - 1);
                if (col < 4) neighbors.push(curr + 1);

                for (const n of neighbors) {
                    if (currentBoard[n] === player && !visited.has(n)) {
                        visited.add(n);
                        queue.push(n);
                    }
                }
            }
            return false;
        };

        // P1 target checking
        const p1Starts = [0, 5, 10, 15, 20].filter(i => currentBoard[i] === 'P1');
        if (bfs('P1', p1Starts, (idx) => idx % 5 === 4)) return 'P1';

        // P2 target checking
        const p2Starts = [0, 1, 2, 3, 4].filter(i => currentBoard[i] === 'P2');
        if (bfs('P2', p2Starts, (idx) => Math.floor(idx / 5) === 4)) return 'P2';

        return null;
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Network Routing');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'networkrouting',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];

            if (emptyIndices.length === 0) {
                setIsAiThinking(false);
                return;
            }

            const systemPrompt = `We are playing 'Network Routing' on a 5x5 grid (indices 0-24). 
      You are ${player === 'P1' ? 'P1. Your goal is to connect the Left edge (cols 0) to Right edge (cols 4).' : 'P2. Your goal is to connect the Top edge (rows 0) to Bottom edge (rows 4).'}
      Current board state: ${JSON.stringify(board)}.
      Available valid indices: ${emptyIndices.join(', ')}.
      Choose ONE available empty index to place your router node. DO NOT pick an index that is already taken.
      Return ONLY a JSON object with 'index' (number). Example: {"index": 12}`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'networkrouting',
                { board },
                systemPrompt
            );

            if (!isMounted.current) return;

            let chosenIndex = response?.index;
            if (typeof chosenIndex !== 'number' || !emptyIndices.includes(chosenIndex)) {
                // Fallback
                chosenIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }

            const newBoard = [...board];
            newBoard[chosenIndex] = player;
            setBoard(newBoard);

            const winningPlayer = checkWinner(newBoard);
            if (winningPlayer) {
                handleEnd(gameMode === 'llm-vs-llm' ? (player === 'P1' ? 'ai-1' : 'ai-2') : 'ai');
            } else if (!newBoard.includes(null)) {
                handleEnd('draw');
            } else {
                setTurn(player === 'P1' ? 'P2' : 'P1');
            }

        } catch (e) {
            console.error(e);
            const emptyIndices = board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null) as number[];
            if (emptyIndices.length > 0) {
                const newBoard = [...board];
                newBoard[emptyIndices[0]] = player;
                setBoard(newBoard);
                if (!newBoard.includes(null)) handleEnd('draw');
                else setTurn(player === 'P1' ? 'P2' : 'P1');
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    }, [board, gameOver, gameMode, apiKeys]);

    useEffect(() => {
        if (gameOver) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking) {
                setTimeout(() => makeAiMove('P1', player1Llm), 1000);
            } else if (turn === 'P2' && !isAiThinking) {
                setTimeout(() => makeAiMove('P2', selectedLlm), 1000);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking) {
            setTimeout(() => makeAiMove('P2', selectedLlm), 1000);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm]);

    const handleCellClick = (index: number) => {
        if (gameOver || board[index] !== null || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;

        const newBoard = [...board];
        newBoard[index] = 'P1';
        setBoard(newBoard);

        const winningPlayer = checkWinner(newBoard);
        if (winningPlayer) {
            handleEnd('user');
        } else if (!newBoard.includes(null)) {
            handleEnd('draw');
        } else {
            setTurn('P2');
        }
    };

    const resetGame = () => {
        setBoard(Array(25).fill(null));
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full max-w-md mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${turn === 'P1' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                            <Network className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">
                                {gameMode === 'llm-vs-llm' ? `AI 1 (${player1Llm})` : 'You (Left ↔ Right)'}
                            </span>
                            {turn === 'P1' && <span className="text-xs text-indigo-400">Current Turn</span>}
                        </div>
                    </div>

                    <button onClick={resetGame} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors shrink-0">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl relative">

                    <div className="flex justify-between items-center mb-4 text-xs font-bold text-rose-400/80 uppercase px-4 pointer-events-none">
                        <span>↓ Top to Bottom (P2) Target</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 px-6">
                        {board.map((cell, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleCellClick(idx)}
                                className={`relative aspect-square rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${cell === null && !gameOver && turn === 'P1' && gameMode === 'human-vs-ai' && !isAiThinking
                                    ? 'border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/60 hover:bg-indigo-500/20 cursor-pointer'
                                    : cell === 'P1' ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                                        : cell === 'P2' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                            : 'border-slate-800 bg-slate-800/50 cursor-not-allowed'
                                    }`}
                            >
                                {cell === 'P1' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Router className="w-6 h-6 text-indigo-400" /></motion.div>}
                                {cell === 'P2' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><ServerIcon className="w-6 h-6 text-rose-400" /></motion.div>}
                            </div>
                        ))}
                    </div>

                    <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-indigo-400/80 uppercase -rotate-90 whitespace-nowrap">Left to Right (P1)</span>
                    </div>

                    {(gameOver) && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6 text-center z-10">
                            <div className="space-y-4">
                                {winner === 'draw' ? (
                                    <Activity className="w-12 h-12 text-slate-400 mx-auto" />
                                ) : winner === 'user' || winner === 'ai-1' ? (
                                    <Trophy className="w-12 h-12 text-indigo-400 mx-auto" />
                                ) : (
                                    <Skull className="w-12 h-12 text-rose-400 mx-auto" />
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {winner === 'draw' ? "Deadlock!" : winner === 'user' ? 'Network Linked!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'AI Wins!'}
                                </h3>
                                <ShareButtons
                                    gameTitle="Network Routing"
                                    result={winner === 'user' ? 'became the network master' : winner === 'draw' ? 'deadlocked the connection' : 'lost packet connectivity'}
                                    penalty={penalty}
                                />
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform hover:scale-105 mt-4"
                                >
                                    Reroute Network
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
                        <p><strong className="text-white">Goal (You):</strong> Connect exactly an unbroken line of routers from the <strong>LEFT</strong> edge to the <strong>RIGHT</strong> edge of the grid.</p>
                        <p><strong className="text-white">Goal (AI):</strong> Connect an unbroken line from the <strong>TOP</strong> to <strong>BOTTOM</strong> edge.</p>
                        <p>Click any empty space to place your node and block the AI.</p>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${turn === 'P2' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-white/5 opacity-50'}`}>
                    <span className="block text-rose-400 text-xs font-bold uppercase mb-1">Player 2 (AI)</span>
                    <span className="text-white font-medium">{gameMode === 'llm-vs-llm' ? `AI 2 (${selectedLlm})` : 'AI Opponent'}</span>
                    {isAiThinking && turn === 'P2' && <span className="block text-xs mt-1 text-rose-400/80 italic">Routing packets...</span>}
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

// Inline helper icon
const ServerIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <line x1="6" x2="6.01" y1="6" y2="6" />
        <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
)
