import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, RefreshCw, Trophy, Skull, Cpu, Binary, ChevronRight, ChevronLeft, Save, Square } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface Rule {
    state: number;
    read: number;
    write: number;
    move: 'L' | 'R';
    nextState: number;
}

interface TuringState {
    tape: number[];
    head: number;
    currentState: number;
    steps: number;
    rules: Rule[];
}

// --- Component ---
export default function TuringMachine() {
    const [gameState, setGameState] = useState<TuringState | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [selectedRuleIdx, setSelectedRuleIdx] = useState<number | null>(null);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initMachine = useCallback(() => {
        const tape = [0, 1, 0, 0, 1, 0, 1, 1, 0, 0];
        const initialRules: Rule[] = [
            { state: 1, read: 0, write: 1, move: 'R', nextState: 1 },
            { state: 1, read: 1, write: 0, move: 'R', nextState: 1 },
        ];

        setGameState({
            tape,
            head: 0,
            currentState: 1,
            steps: 0,
            rules: initialRules
        });
        setGameOver(false);
        setIsRunning(false);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initMachine();
        return () => { isMounted.current = false; };
    }, [initMachine]);

    const step = () => {
        if (!gameState || gameOver) return;

        const { tape, head, currentState, rules, steps } = gameState;
        const currentSymbol = tape[head];
        const rule = rules.find(r => r.state === currentState && r.read === currentSymbol);

        if (!rule) {
            // Halt
            checkWin(gameState);
            setIsRunning(false);
            return;
        }

        const newTape = [...tape];
        newTape[head] = rule.write;

        let newHead = head + (rule.move === 'R' ? 1 : -1);
        if (newHead < 0) newHead = 0;
        if (newHead >= tape.length) newHead = tape.length - 1;

        setGameState({
            ...gameState,
            tape: newTape,
            head: newHead,
            currentState: rule.nextState,
            steps: steps + 1
        });

        if (steps > 50) {
            finishGame('ai'); // Infinite loop or too long
        }
    };

    const run = () => {
        setIsRunning(true);
    };

    const stop = () => {
        setIsRunning(false);
    };

    useEffect(() => {
        let timer: any;
        if (isRunning && !gameOver) {
            timer = setInterval(step, 300);
        }
        return () => clearInterval(timer);
    }, [isRunning, gameOver, gameState]);

    const checkWin = (state: TuringState) => {
        // Goal: Fill tape with all 1s
        const allOnes = state.tape.every(v => v === 1);
        if (allOnes) finishGame('player');
        else finishGame('ai');
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Turing Simulator');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'turingmachine', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    if (!gameState) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">State</p>
                        <p className="text-2xl font-black text-indigo-400">q{gameState.currentState}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Compute Steps</p>
                        <p className="text-2xl font-black text-white">{gameState.steps}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={isRunning ? stop : run} className={`p-4 rounded-xl transition-all shadow-lg flex items-center gap-2 font-black uppercase text-xs ${isRunning ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                        {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        {isRunning ? 'HALT' : 'EXECUTE'}
                    </button>
                    <button onClick={initMachine} className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="bg-slate-950 rounded-[40px] border border-white/10 p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-2xl">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />

                {/* Tape */}
                <div className="flex gap-2 relative z-10">
                    {gameState.tape.map((val, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: gameState.head === i ? 1.2 : 1,
                                backgroundColor: gameState.head === i ? '#4f46e5' : '#0f172a',
                                borderColor: gameState.head === i ? '#818cf8' : 'rgba(255,255,255,0.05)'
                            }}
                            className={`w-12 h-16 border-2 rounded-xl flex items-center justify-center text-xl font-black transition-all
                                ${val === 1 ? 'text-emerald-400' : 'text-slate-600'}`}
                        >
                            {val}
                            {gameState.head === i && <motion.div layoutId="head-pointer" className="absolute -bottom-4 w-2 h-2 bg-indigo-400 rotate-45" />}
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">
                    PARSING_TAPE_DATA_STREAM
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-6 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Settings className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Action Rules (δ)</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        {gameState.rules.map((rule, i) => (
                            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">If (State q{rule.state}, Read {rule.read})</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Save className="w-3 h-3 text-indigo-400" />
                                        <span className="text-sm font-black text-white">Write {rule.write}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                                        {rule.move === 'R' ? <ChevronRight className="w-4 h-4 text-emerald-400" /> : <ChevronLeft className="w-4 h-4 text-rose-400" />}
                                        <span className="text-xs font-bold text-slate-400">Move {rule.move}</span>
                                    </div>
                                </div>
                                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-white">
                                    → q{rule.nextState}
                                </div>
                            </div>
                        ))}
                        <button className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-indigo-500/30 transition-all opacity-50 hover:opacity-100 group">
                            <Binary className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mb-2" />
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Add Micro-Instruction</span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-8 shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Cpu className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Instruction Manual</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Your objective is to manipulate the tape rules until the machine fills the entire 10-bit buffer with "1" and then halts correctly. Beware of infinite loops.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Global Objective</span>
                            <div className="flex gap-2 mt-2">
                                {Array.from({ length: 10 }).map((_, i) => <div key={i} className="flex-1 h-2 bg-emerald-500/50 rounded-full" />)}
                            </div>
                            <p className="text-[10px] text-emerald-400/70 mt-2 font-mono italic">TARGET: [1,1,1,1,1,1,1,1,1,1]</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 text-center">
                        <div className="space-y-8 max-w-sm w-full">
                            {winner === 'player' ? (
                                <Trophy className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                            ) : (
                                <Skull className="w-20 h-20 text-rose-500 mx-auto" />
                            )}
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">{winner === 'player' ? 'HALTED_SUCCESS' : 'COMPUTE_ERROR'}</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total cycles processed: {gameState.steps}</p>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="Turing Simulator" result={winner === 'player' ? 'solved the universal computation' : 'triggered a kernel panic'} score={`${gameState.steps} Steps`} />
                                <button onClick={initMachine} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">SYSTEM REBOOT</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
