import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, Sparkles, RefreshCw, Trophy, Skull, Activity, FlaskConical, Target, Zap } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface Organism {
    id: string;
    genes: number[]; // 4 values representing different traits
    fitness: number;
}

interface GeneticState {
    population: Organism[];
    target: number[];
    generation: number;
    mutationRate: number;
}

// --- Utils ---
const calculateFitness = (genes: number[], target: number[]): number => {
    const diff = genes.reduce((acc, gene, i) => acc + Math.abs(gene - target[i]), 0);
    return Math.max(0, 100 - (diff * 2.5)); // Normalized 0-100
};

const createOrganism = (target: number[]): Organism => {
    const genes = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    return {
        id: Math.random().toString(36).substring(7),
        genes,
        fitness: calculateFitness(genes, target)
    };
};

// --- Component ---
export default function Genetic() {
    const [gameState, setGameState] = useState<GeneticState | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const target = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
        const population = Array.from({ length: 12 }, () => createOrganism(target));

        setGameState({
            population,
            target,
            generation: 1,
            mutationRate: 0.1
        });
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        setSelectedIds([]);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const handleSelect = (id: string) => {
        if (gameOver || isAiThinking) return;
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else if (selectedIds.length < 2) {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const runBreeding = () => {
        if (selectedIds.length !== 2 || !gameState) return;

        const parent1 = gameState.population.find(o => o.id === selectedIds[0])!;
        const parent2 = gameState.population.find(o => o.id === selectedIds[1])!;

        // Generate 4 new offspring
        const nextPop: Organism[] = [];
        for (let i = 0; i < 12; i++) {
            const childGenes = parent1.genes.map((gene, idx) => {
                let val = Math.random() > 0.5 ? gene : parent2.genes[idx];
                if (Math.random() < gameState.mutationRate) val = Math.floor(Math.random() * 10);
                return val;
            });
            nextPop.push({
                id: Math.random().toString(36).substring(7),
                genes: childGenes,
                fitness: calculateFitness(childGenes, gameState.target)
            });
        }

        const maxFitness = Math.max(...nextPop.map(o => o.fitness));
        const newGen = gameState.generation + 1;

        setGameState({
            ...gameState,
            population: nextPop,
            generation: newGen
        });
        setSelectedIds([]);

        if (maxFitness >= 95) {
            finishGame('player');
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Gene Breeder');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'genetic', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    // AI logic
    useEffect(() => {
        if ((gameMode === 'llm-vs-llm' || gameMode === 'human-vs-ai') && !gameOver && !isAiThinking && gameState && gameState.generation < 50) {
            // High fidelity Duel: AI simulates its own generation loop
            // For now, simpler: user vs AI "benchmark"
        }
    }, [gameState?.generation, gameMode]);

    if (!gameState) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Generation</p>
                        <p className="text-2xl font-black text-white">{gameState.generation}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Max Fitness</p>
                        <p className="text-2xl font-black text-emerald-400">{Math.max(...gameState.population.map(o => o.fitness)).toFixed(1)}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-400" />
                        <div className="flex gap-1">
                            {gameState.target.map((t, i) => <span key={i} className="text-xs font-mono text-white">{t}</span>)}
                        </div>
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-slate-950 rounded-[40px] border border-white/5 p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 relative overflow-hidden min-h-[500px]">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

                    {gameState.population.map(org => (
                        <motion.button
                            key={org.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(org.id)}
                            className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all relative group
                                ${selectedIds.includes(org.id) ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}
                        >
                            <div className="relative">
                                <Dna className={`w-12 h-12 ${org.fitness > 80 ? 'text-emerald-400' : org.fitness > 50 ? 'text-indigo-400' : 'text-slate-600'}`} />
                                {org.fitness > 90 && <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />}
                            </div>
                            <div className="space-y-1 w-full">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                    <span>Fit</span>
                                    <span>{org.fitness.toFixed(0)}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${org.fitness}%` }} className={`h-full ${org.fitness > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {org.genes.map((g, i) => (
                                    <span key={i} className={`text-[8px] font-mono px-1 rounded ${g === gameState.target[i] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>{g}</span>
                                ))}
                            </div>
                        </motion.button>
                    ))}
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-8 shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <FlaskConical className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Breeding Lab</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Select two organisms with high fitness scores to produce the next generation. Goal is to reach 95% fitness.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center gap-4">
                        {selectedIds.length === 2 ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full space-y-4">
                                <div className="flex items-center justify-around">
                                    <Dna className="w-10 h-10 text-indigo-400" />
                                    <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                                    <Dna className="w-10 h-10 text-indigo-400" />
                                </div>
                                <button onClick={runBreeding} className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black shadow-xl transition-all">BREED SPECIES</button>
                            </motion.div>
                        ) : (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-xs font-black text-slate-500 italic">Select 2 subjects...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-center">
                        <Activity className="w-4 h-4 text-indigo-400 mx-auto mb-2" />
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Target DNA Sequence</span>
                        <div className="flex justify-center gap-2 mt-2">
                            {gameState.target.map((t, i) => <div key={i} className="w-6 h-8 bg-slate-800 rounded flex items-center justify-center text-sm font-mono text-white border border-white/10">{t}</div>)}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8">
                        <div className="text-center space-y-8 max-w-sm w-full">
                            <div className="space-y-4">
                                <Trophy className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">EVOLVED</h2>
                                <p className="text-slate-400 font-medium tracking-widest text-[10px]">Species reached peak fitness at Generation {gameState.generation}.</p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="Gene Breeder" result="successfully evolved a superior species" score={`Gen ${gameState.generation}`} />
                                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl">START NEW COLONY</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
