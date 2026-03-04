import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, Info, Cpu, Zap, Activity } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export default function PlantGrowth() {
    const [health, setHealth] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [turn, setTurn] = useState<'P1' | 'P2'>('P1'); // P1 is User/AI-1, P2 is AI/AI-2

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Plant Growth');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'plantgrowth',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const processMove = (player: 'P1' | 'P2', amount: number) => {
        const newHealth = health + amount;
        setHealth(newHealth);

        if (newHealth === 100) {
            handleEnd(gameMode === 'llm-vs-llm' ? (player === 'P1' ? 'ai-1' : 'ai-2') : (player === 'P1' ? 'user' : 'ai'));
        } else if (newHealth > 100) {
            // Bust! Other player wins
            handleEnd(gameMode === 'llm-vs-llm' ? (player === 'P1' ? 'ai-2' : 'ai-1') : (player === 'P1' ? 'ai' : 'user'));
        } else {
            setTurn(player === 'P1' ? 'P2' : 'P1');
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const systemPrompt = `We are playing Plant Growth. Current plant health is ${health}. The goal is to reach exactly 100.
      You can add 10 (Water), 20 (Fertilizer), or 30 (Sunlight). 
      If you exceed 100, you bust and lose immediately.
      Return ONLY a JSON object with 'amount' (number: 10, 20, or 30). Example: {"amount": 20}`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'plantgrowth',
                { health },
                systemPrompt
            );

            if (!isMounted.current) return;

            let chosenAmount = response?.amount;
            if (![10, 20, 30].includes(chosenAmount)) {
                // Fallback random
                chosenAmount = [10, 20, 30][Math.floor(Math.random() * 3)];
            }

            processMove(player, chosenAmount);
        } catch (e) {
            console.error(e);
            // Fallback
            if (isMounted.current && !gameOver) {
                processMove(player, [10, 20, 30][Math.floor(Math.random() * 3)]);
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    }, [health, gameOver, gameMode, apiKeys]);

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

    const handleActionClick = (amount: number) => {
        if (gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;
        processMove('P1', amount);
    };

    const resetGame = () => {
        setHealth(0);
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full max-w-md mx-auto space-y-6">

                <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl relative text-center">
                    <div className="mb-4 text-slate-400 font-medium">Plant Health</div>

                    <div className="relative h-64 w-24 mx-auto bg-slate-800 rounded-full border border-white/5 overflow-hidden flex items-end shadow-inner">
                        {/* Progress Fill */}
                        <motion.div
                            className={`w-full ${health > 100 ? 'bg-rose-500' : 'bg-emerald-500'} shadow-[0_0_20px_rgba(16,185,129,0.5)]`}
                            animate={{ height: `${Math.min(100, health)}%` }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                        />

                        {/* Target Line */}
                        <div className="absolute top-0 left-0 w-full border-t border-dashed border-white/50" />

                        {/* Readout */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white mix-blend-overlay">{health} / 100</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleActionClick(10)}
                            disabled={gameMode === 'llm-vs-llm' || turn === 'P2' || gameOver}
                            className="p-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-2xl font-bold disabled:opacity-50 transition-colors"
                        >
                            +10 Water
                        </button>
                        <button
                            onClick={() => handleActionClick(20)}
                            disabled={gameMode === 'llm-vs-llm' || turn === 'P2' || gameOver}
                            className="p-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-2xl font-bold disabled:opacity-50 transition-colors"
                        >
                            +20 Fertilizer
                        </button>
                        <button
                            onClick={() => handleActionClick(30)}
                            disabled={gameMode === 'llm-vs-llm' || turn === 'P2' || gameOver}
                            className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-2xl font-bold disabled:opacity-50 transition-colors"
                        >
                            +30 Sunlight
                        </button>
                    </div>

                    {gameOver && (
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
                                    {winner === 'user' ? 'Plant Reached 100!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'Opponent Wins!'}
                                </h3>
                                <p className="text-slate-300 max-w-[200px] mx-auto text-sm">
                                    {health > 100 ? 'Oops! Plant was over-nurtured to death.' : 'Perfect growth!'}
                                </p>
                                <ShareButtons
                                    gameTitle="Plant Growth"
                                    result={winner === 'user' ? 'grew a perfect plant' : 'over-nurtured the seedling'}
                                    score={health}
                                    penalty={penalty}
                                />
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform hover:scale-105 mt-4"
                                >
                                    Grow Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-80 space-y-6">
                <div className="flex flex-col gap-4">
                    {/* Turn Indicators */}
                    <div className={`p-4 rounded-2xl border transition-all ${turn === 'P1' ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-white/5 opacity-50'}`}>
                        <span className="block text-indigo-400 text-xs font-bold uppercase mb-1">Player 1</span>
                        <span className="text-white font-medium">{gameMode === 'llm-vs-llm' ? `AI 1 (${player1Llm})` : 'You'}</span>
                    </div>

                    <div className={`p-4 rounded-2xl border transition-all ${turn === 'P2' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 opacity-50'}`}>
                        <span className="block text-emerald-400 text-xs font-bold uppercase mb-1">Player 2</span>
                        <span className="text-white font-medium">{gameMode === 'llm-vs-llm' ? `AI 2 (${selectedLlm})` : 'AI'}</span>
                        {isAiThinking && turn === 'P2' && <span className="block text-xs mt-1 text-emerald-400/80 italic">Thinking...</span>}
                        {isAiThinking && turn === 'P1' && gameMode === 'llm-vs-llm' && <span className="block text-xs mt-1 text-indigo-400/80 italic">Thinking...</span>}
                    </div>
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">How to Play</h3>
                    </div>
                    <div className="space-y-3 text-sm text-slate-400">
                        <p><strong className="text-white">Goal:</strong> Hit precisely <strong>100 Health</strong> without going over.</p>
                        <p><strong className="text-white">Turns:</strong> Add +10, +20, or +30 health on your turn.</p>
                        <p>If you force the health over 100 on your turn, you instantly bust and the opponent wins.</p>
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
