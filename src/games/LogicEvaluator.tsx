import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { ToggleLeft, ToggleRight, Sparkles, RefreshCw, Trophy, Skull, Activity, Cpu, Binary, Zap, Code } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
type GateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR';

interface LogicProblem {
    a: boolean;
    b: boolean;
    target: boolean;
    availableGates: GateType[];
}

// --- Component ---
export default function LogicEvaluator() {
    const [problem, setProblem] = useState<LogicProblem | null>(null);
    const [selectedGate, setSelectedGate] = useState<GateType | null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [history, setHistory] = useState<{ prob: string, status: 'pass' | 'fail' }[]>([]);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const generateProblem = useCallback(() => {
        const a = Math.random() > 0.5;
        const b = Math.random() > 0.5;
        const gates: GateType[] = ['AND', 'OR', 'XOR', 'NAND', 'NOR'];
        const chosenGate = gates[Math.floor(Math.random() * gates.length)];

        let target = false;
        switch (chosenGate) {
            case 'AND': target = a && b; break;
            case 'OR': target = a || b; break;
            case 'XOR': target = a !== b; break;
            case 'NAND': target = !(a && b); break;
            case 'NOR': target = !(a || b); break;
        }

        setProblem({ a, b, target, availableGates: gates });
        setSelectedGate(null);
    }, []);

    const initGame = useCallback(() => {
        setScore(0);
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        setHistory([]);
        generateProblem();
        resetSessionTokens();
    }, [generateProblem, resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const handleEvaluate = () => {
        if (!problem || !selectedGate || gameOver) return;

        let result = false;
        switch (selectedGate) {
            case 'AND': result = problem.a && problem.b; break;
            case 'OR': result = problem.a || problem.b; break;
            case 'XOR': result = problem.a !== problem.b; break;
            case 'NAND': result = !(problem.a && problem.b); break;
            case 'NOR': result = !(problem.a || problem.b); break;
        }

        const isCorrect = result === problem.target;
        if (isCorrect) {
            setScore(s => s + 20);
            setHistory(h => [{ prob: `${problem.a ? 1 : 0} ${selectedGate} ${problem.b ? 1 : 0} = ${result ? 1 : 0}`, status: 'pass' }, ...h].slice(0, 5));
            if (score + 20 >= 100) {
                finishGame('player');
            } else {
                generateProblem();
            }
        } else {
            setHistory(h => [{ prob: `${problem.a ? 1 : 0} ${selectedGate} ${problem.b ? 1 : 0} != ${problem.target ? 1 : 0}`, status: 'fail' }, ...h].slice(0, 5));
            // Penalty or score reduction
            setScore(s => Math.max(0, s - 10));
            generateProblem();
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Logic Evaluator');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'logicevaluation', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    if (!problem) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Signal Strength</p>
                        <p className="text-2xl font-black text-white">{score}%</p>
                    </div>
                </div>
                <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
                <div className="bg-slate-950 rounded-[40px] border border-white/5 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

                    <div className="flex items-center gap-12 mb-12 relative z-10 w-full justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${problem.a ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-white/10 text-slate-500'}`}>
                                <Binary className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-tighter">Input A</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${problem.b ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-white/10 text-slate-500'}`}>
                                <Binary className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-black text-white uppercase tracking-tighter">Input B</span>
                        </div>
                    </div>

                    <div className="w-full max-w-[280px] space-y-4 relative z-10">
                        <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Expected Output</span>
                            <span className={`text-sm font-black ${problem.target ? 'text-emerald-400' : 'text-rose-400'}`}>{problem.target ? 'HIGH' : 'LOW'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {problem.availableGates.map(gate => (
                                <button
                                    key={gate}
                                    onClick={() => setSelectedGate(gate)}
                                    className={`py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all border-2
                                        ${selectedGate === gate ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20' : 'bg-slate-800 text-slate-400 border-white/5 hover:border-white/20'}`}
                                >
                                    {gate}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleEvaluate}
                            disabled={!selectedGate || gameOver}
                            className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-[24px] font-black text-lg transition-all shadow-xl active:scale-95"
                        >
                            PROCESS GATE
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />

                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Code className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Logic Terminal</h3>
                    </div>

                    <div className="flex-1 space-y-3 font-mono text-[11px] overflow-y-auto pr-2">
                        {history.map((item, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                                {item.status === 'pass' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                <span className="uppercase tracking-tighter">{item.prob}</span>
                                <span className="ml-auto opacity-40">#{history.length - i}</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] text-indigo-400 font-black uppercase">Instruction Set</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            Select the correct logic gate that transforms Input A and Input B into the Expected Output. Reach 100% Signal Strength to win.
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 text-center">
                        <div className="space-y-8 max-w-sm w-full">
                            <Trophy className="w-20 h-20 text-amber-500 mx-auto drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">SYSTEM_PASS</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Logic sequence validated with 100% accuracy.</p>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="Logic Evaluator" result="mastered the complex boolean gates" score="100%" />
                                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">START OVER</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
