import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, RefreshCw, Trophy, Skull, Brain, BarChart3, LineChart, Cpu, SlidersHorizontal, Sparkles, Activity } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface HyperParams {
    learningRate: number;
    batchSize: number;
    epochs: number;
    optimizer: 'Adam' | 'SGD' | 'RMSprop';
    layers: number;
}

interface TrainingPoint {
    epoch: number;
    loss: number;
    accuracy: number;
}

// --- Component ---
export default function MLTuning() {
    const [params, setParams] = useState<HyperParams>({
        learningRate: 0.01,
        batchSize: 32,
        epochs: 50,
        optimizer: 'Adam',
        layers: 3
    });

    const [history, setHistory] = useState<TrainingPoint[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'idle' | 'training' | 'stable' | 'diverged'>('idle');

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const runTraining = useCallback(() => {
        setIsTraining(true);
        setStatus('training');
        setHistory([]);

        let currentLoss = 1.0;
        let currentAcc = 0.0;
        const newHistory: TrainingPoint[] = [];

        // Simple simulation logic
        const interval = setInterval(() => {
            const epoch = newHistory.length + 1;

            // Heuristic for "Good" tuning
            const isGoodLR = params.learningRate > 0.0005 && params.learningRate < 0.05;
            const isGoodBatch = params.batchSize >= 16;

            if (params.learningRate > 0.5) {
                // Divergence
                currentLoss += Math.random() * 0.2;
                setStatus('diverged');
            } else {
                const decay = isGoodLR && isGoodBatch ? (0.9 + Math.random() * 0.05) : (0.95 + Math.random() * 0.04);
                currentLoss *= decay;
                currentAcc = Math.min(0.99, currentAcc + (1 - currentLoss) * 0.1);
            }

            newHistory.push({ epoch, loss: currentLoss, accuracy: currentAcc });
            setHistory([...newHistory]);

            if (epoch >= params.epochs || currentLoss < 0.01 || currentLoss > 5) {
                clearInterval(interval);
                setIsTraining(false);
                if (currentLoss < 0.1) {
                    setStatus('stable');
                    setScore(Math.floor(currentAcc * 1000));
                    setGameOver(true);
                } else if (currentLoss > 2) {
                    setStatus('diverged');
                    setGameOver(true);
                }
            }
        }, 50);

        return () => clearInterval(interval);
    }, [params]);

    const initGame = () => {
        setHistory([]);
        setIsTraining(false);
        setGameOver(false);
        setStatus('idle');
        resetSessionTokens();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Final Accuracy</p>
                        <p className="text-2xl font-black text-white">
                            {history.length > 0 ? (history[history.length - 1].accuracy * 100).toFixed(1) : '0.0'}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Training Loss</p>
                        <p className={`text-2xl font-black ${status === 'diverged' ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {history.length > 0 ? history[history.length - 1].loss.toFixed(4) : '0.0000'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${isTraining ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                        <span className="text-xs font-black text-white uppercase tracking-tighter">{status}</span>
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-white/5">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
                {/* Control Panel */}
                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 space-y-8 flex flex-col shadow-xl">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Settings className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Hyper-Parameters</h3>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Learning Rate</label>
                                <span className="text-xs font-mono text-indigo-400">{params.learningRate}</span>
                            </div>
                            <input
                                type="range" min="0.0001" max="1" step="0.0001"
                                value={params.learningRate}
                                onChange={e => setParams({ ...params, learningRate: parseFloat(e.target.value) })}
                                disabled={isTraining}
                                className="w-full accent-indigo-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Batch Size</label>
                                <span className="text-xs font-mono text-indigo-400">{params.batchSize}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[8, 16, 32, 64].map(b => (
                                    <button
                                        key={b}
                                        onClick={() => setParams({ ...params, batchSize: b })}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${params.batchSize === b ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Optimizer</label>
                                <Sparkles className="w-3 h-3 text-amber-500" />
                            </div>
                            <select
                                value={params.optimizer}
                                onChange={e => setParams({ ...params, optimizer: e.target.value as any })}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option className="bg-slate-800">Adam</option>
                                <option className="bg-slate-800">SGD</option>
                                <option className="bg-slate-800">RMSprop</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={runTraining}
                        disabled={isTraining || gameOver}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isTraining ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                        {isTraining ? 'TRAINING...' : 'RUN SIMULATION'}
                    </button>
                </div>

                {/* Visualization / Graphics */}
                <div className="lg:col-span-2 bg-slate-950 rounded-[40px] border border-indigo-500/10 p-4 sm:p-10 relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                    <div className="flex justify-between items-center mb-10 z-10">
                        <div className="flex items-center gap-3">
                            <LineChart className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Convergence_Viz</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="text-[9px] text-slate-500 font-black uppercase">Accuracy</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                <span className="text-[9px] text-slate-500 font-black uppercase">Loss</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative flex items-end gap-1 px-2 border-l border-b border-white/5 pb-2">
                        {history.length > 0 ? (
                            history.map((p, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-px group h-full relative">
                                    <div
                                        className="w-full bg-indigo-500 opacity-60 rounded-t-sm group-hover:opacity-100 transition-opacity"
                                        style={{ height: `${p.accuracy * 100}%` }}
                                    />
                                    <div
                                        className="w-full bg-rose-500/40 rounded-t-sm absolute bottom-0 group-hover:bg-rose-500 transition-colors"
                                        style={{ height: `${Math.min(1, p.loss) * 100}%` }}
                                    />
                                    {i % 10 === 0 && <span className="absolute -bottom-6 left-0 text-[8px] text-slate-600 font-bold">{i}</span>}
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800 font-black text-4xl italic opacity-20 pointer-events-none">
                                WAITING FOR COMPUTATION
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {gameOver && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-8">
                                <div className="text-center space-y-8 max-w-sm w-full">
                                    {status === 'stable' ? (
                                        <div className="space-y-4">
                                            <Brain className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">MODEL STABLE</h2>
                                            <p className="text-slate-400 font-medium tracking-widest text-[10px]">Optimal convergence reached with {(history[history.length - 1].accuracy * 100).toFixed(2)}% acc.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Skull className="w-20 h-20 text-rose-500 mx-auto" />
                                            <h2 className="text-5xl font-black text-rose-500 italic tracking-tighter uppercase">DIVERGED</h2>
                                            <p className="text-slate-400 font-medium tracking-widest text-[10px]">High learning rate caused gradients to explode.</p>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4">
                                        <ShareButtons gameTitle="ML Tuning Sim" result={status === 'stable' ? 'optimized a world-class AI model' : 'blew up the neural network'} score={`${(history[history.length - 1]?.accuracy * 100 || 0).toFixed(1)}%`} />
                                        <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all hover:-translate-y-1">NEXT EXPERIMENT</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <h3 className="text-white font-black flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Researcher's Guide
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-[11px] text-slate-400 leading-relaxed">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="font-bold text-white mb-1 uppercase tracking-tighter">Learning Rate</p>
                            Controls how fast the model adjusts. Too high = overflow (Divergence). Too low = never finishes.
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="font-bold text-white mb-1 uppercase tracking-tighter">Optimizer</p>
                            Adam is generally the safest bet for stability, while SGD offers pure control.
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-64 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl text-center space-y-2">
                    <Cpu className="w-6 h-6 text-indigo-400 mx-auto" />
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest leading-tight">Compute Distributed</p>
                    <p className="text-[9px] text-indigo-200/50 italic px-2">AI versus AI mode leverages reinforcement learning to find the optimal params first.</p>
                </div>
            </div>
        </div>
    );
}
