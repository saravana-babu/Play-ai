import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Cpu, Zap, Activity, Orbit } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Qubit = 0 | 1;

export default function QuantumLogic() {
    const [board, setBoard] = useState<Qubit[]>(Array(9).fill(0).map(() => Math.random() > 0.5 ? 1 : 0));
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [turn, setTurn] = useState<'P1' | 'P2'>('P1'); // P1 is 1s, P2 is 0s

    // Highlight recently collapsed qubits
    const [collapsedIndices, setCollapsedIndices] = useState<number[]>([]);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const checkWinner = (currentBoard: Qubit[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (currentBoard[a] === 1 && currentBoard[b] === 1 && currentBoard[c] === 1) return 'P1';
            if (currentBoard[a] === 0 && currentBoard[b] === 0 && currentBoard[c] === 0) return 'P2';
        }
        return null;
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Quantum Gate Logic');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'quantumlogic',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const applyQuantumGate = (index: number, player: 'P1' | 'P2') => {
        const newBoard = [...board];
        // 1. Flip Target
        newBoard[index] = newBoard[index] === 1 ? 0 : 1;

        // 2. Collapse Neighbors
        const neighbors = [];
        const row = Math.floor(index / 3);
        const col = index % 3;
        if (row > 0) neighbors.push(index - 3);
        if (row < 2) neighbors.push(index + 3);
        if (col > 0) neighbors.push(index - 1);
        if (col < 2) neighbors.push(index + 1);

        neighbors.forEach(n => {
            newBoard[n] = Math.random() > 0.5 ? 1 : 0;
        });

        setBoard(newBoard);
        setCollapsedIndices(neighbors);
        setTimeout(() => { if (isMounted.current) setCollapsedIndices([]) }, 1000);

        const winningPlayer = checkWinner(newBoard);
        if (winningPlayer) {
            handleEnd(gameMode === 'llm-vs-llm' ? (winningPlayer === 'P1' ? 'ai-1' : 'ai-2') : (winningPlayer === 'P1' ? 'user' : 'ai'));
        } else {
            setTurn(player === 'P1' ? 'P2' : 'P1');
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const systemPrompt = `We are playing 'Quantum Gate Logic' on a 3x3 grid (indices 0-8).
      You are ${player === 'P1' ? 'P1. Your goal is to get 3 Qubits of spin UP (1) in a row.' : 'P2. Your goal is to get 3 Qubits of spin DOWN (0) in a row.'}
      Current board (0=Down, 1=Up): ${JSON.stringify(board)}.
      When you apply a gate to an index, that qubit FLIPS. But its orthogonal neighbors are completely RANDOMIZED.
      Choose ONE index (0-8) to apply your quantum gate.
      Return ONLY a JSON object with 'index' (number). Example: {"index": 4}`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'quantumlogic',
                { board },
                systemPrompt
            );

            if (!isMounted.current) return;

            let chosenIndex = response?.index;
            if (typeof chosenIndex !== 'number' || chosenIndex < 0 || chosenIndex > 8) {
                chosenIndex = Math.floor(Math.random() * 9);
            }

            applyQuantumGate(chosenIndex, player);

        } catch (e) {
            console.error(e);
            if (isMounted.current && !gameOver) {
                applyQuantumGate(Math.floor(Math.random() * 9), player);
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    }, [board, gameOver, gameMode, apiKeys]);

    useEffect(() => {
        if (gameOver) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking) {
                setTimeout(() => makeAiMove('P1', player1Llm), 1500);
            } else if (turn === 'P2' && !isAiThinking) {
                setTimeout(() => makeAiMove('P2', selectedLlm), 1500);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking) {
            setTimeout(() => makeAiMove('P2', selectedLlm), 1500);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm]);

    const handleCellClick = (index: number) => {
        if (gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;
        applyQuantumGate(index, 'P1');
    };

    const resetGame = () => {
        setBoard(Array(9).fill(0).map(() => Math.random() > 0.5 ? 1 : 0));
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full max-w-md mx-auto">

                <div className="mb-6 flex justify-between items-center bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-xl">
                    <div className={`flex flex-col items-center p-3 rounded-xl transition-all ${turn === 'P1' ? 'bg-indigo-500/20 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'opacity-50'}`}>
                        <span className="text-indigo-400 font-bold text-sm uppercase mb-1">Spin UP (1)</span>
                        <span className="text-white font-black">{gameMode === 'llm-vs-llm' ? `P1 (${player1Llm})` : 'You'}</span>
                    </div>

                    <button onClick={resetGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors shrink-0">
                        <RefreshCw className="w-5 h-5" />
                    </button>

                    <div className={`flex flex-col items-center p-3 rounded-xl transition-all ${turn === 'P2' ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'opacity-50'}`}>
                        <span className="text-emerald-400 font-bold text-sm uppercase mb-1">Spin DOWN (0)</span>
                        <span className="text-white font-black">{gameMode === 'llm-vs-llm' ? `P2 (${selectedLlm})` : 'AI'}</span>
                    </div>
                </div>

                <div className="bg-slate-950 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">

                    {/* Decorative quantum grid background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="grid grid-cols-3 gap-4 relative z-10">
                        {board.map((cell, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleCellClick(idx)}
                                disabled={gameOver || isAiThinking || (gameMode === 'human-vs-ai' && turn === 'P2') || gameMode === 'llm-vs-llm'}
                                className={`relative aspect-square rounded-full border-[4px] flex items-center justify-center transition-all duration-500 ${cell === 1
                                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.5),0_0_15px_rgba(99,102,241,0.5)] hover:bg-indigo-500/30'
                                    : 'border-emerald-500/50 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.5),0_0_15px_rgba(16,185,129,0.5)] hover:bg-emerald-500/30'
                                    } disabled:cursor-not-allowed`}
                            >
                                {/* Orbit animation for Qubits */}
                                <motion.div
                                    animate={cell === 1 ? { rotate: 360 } : { rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-2 border border-white/20 rounded-full"
                                />

                                <span className={`text-4xl font-black ${cell === 1 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                    {cell === 1 ? '↑' : '↓'}
                                </span>

                                <AnimatePresence>
                                    {collapsedIndices.includes(idx) && (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 1 }}
                                            animate={{ scale: 2, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-white/50 rounded-full blur-sm"
                                        />
                                    )}
                                </AnimatePresence>
                            </button>
                        ))}
                    </div>

                    {(gameOver) && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 text-center z-20">
                            <div className="space-y-4">
                                {winner === 'draw' ? (
                                    <Activity className="w-12 h-12 text-slate-400 mx-auto" />
                                ) : winner === 'user' || winner === 'ai-1' ? (
                                    <Trophy className="w-12 h-12 text-indigo-400 mx-auto" />
                                ) : (
                                    <Skull className="w-12 h-12 text-emerald-400 mx-auto" />
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {winner === 'user' ? 'Quantum Supremacy!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'Wavefunction Collapsed!'}
                                </h3>
                                <p className="text-slate-300 text-sm">
                                    {winner === 'user' || winner === 'ai-1' ? '3 Spin UPs aligned.' : '3 Spin DOWNs aligned.'}
                                </p>

                                <ShareButtons
                                    gameTitle="Quantum Gate Logic"
                                    result={(winner === 'user' || winner === 'ai-1') ? 'achieved quantum supremacy' : 'collapsed the wavefunction'}
                                    penalty={penalty}
                                />

                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform hover:scale-105 mt-4"
                                >
                                    Reset Entanglement
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
                            <Orbit className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Quantum Rules</h3>
                    </div>
                    <div className="space-y-3 text-sm text-slate-400">
                        <p><strong className="text-indigo-400">Goal (P1):</strong> Align three <strong>UP (↑)</strong> qubits in a row.</p>
                        <p><strong className="text-emerald-400">Goal (P2):</strong> Align three <strong>DOWN (↓)</strong> qubits in a row.</p>
                        <p className="text-white bg-white/5 p-3 rounded-xl border border-white/10 mt-4">
                            <strong>The Catch:</strong> Applying a gate to flip a qubit causes its horizontal and vertical neighbors to collapse into a random state! Chaos ensues.
                        </p>
                    </div>
                </div>

                {isAiThinking && turn === 'P2' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center animate-pulse">
                        <span className="text-emerald-400 font-bold text-sm">AI is calculating superpositions...</span>
                    </div>
                )}

                {isAiThinking && turn === 'P1' && gameMode === 'llm-vs-llm' && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl text-center animate-pulse">
                        <span className="text-indigo-400 font-bold text-sm">AI 1 is calculating superpositions...</span>
                    </div>
                )}

                <AnimatePresence>
                    {penalty && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden mt-6"
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
