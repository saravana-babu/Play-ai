import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
    Database,
    Zap,
    Trophy,
    Skull,
    RefreshCw,
    Loader2,
    CircuitBoard,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Brain
} from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type DataStructure = 'Stack' | 'Queue' | 'HashMap' | 'LinkedList' | 'BST' | 'Min-Heap' | 'Trie' | 'Graph';

interface Scenario {
    problem: string;
    requirement: string;
    choices: DataStructure[];
    correctChoice: DataStructure;
    explanation: string;
}

const STRUCTURE_DATA: Record<DataStructure, { icon: string, desc: string, color: string }> = {
    'Stack': { icon: '🥞', desc: 'Last-In, First-Out (LIFO). Best for undo/redo or local history.', color: 'bg-orange-500' },
    'Queue': { icon: '🎟️', desc: 'First-In, First-Out (FIFO). Best for processing orders or buffers.', color: 'bg-blue-500' },
    'HashMap': { icon: '🔑', desc: 'Key-Value pairs. O(1) average lookup/insert.', color: 'bg-emerald-500' },
    'LinkedList': { icon: '🔗', desc: 'Linear collection with fast insertions at ends.', color: 'bg-indigo-500' },
    'BST': { icon: '🌲', desc: 'Sorted binary tree. Efficient search, insert, delete in O(log n).', color: 'bg-lime-500' },
    'Min-Heap': { icon: '⛰️', desc: 'Priority-based tree. Constant time access to smallest element.', color: 'bg-amber-500' },
    'Trie': { icon: '📖', desc: 'Prefix tree. Fast for auto-complete and dictionary lookups.', color: 'bg-violet-500' },
    'Graph': { icon: '🕸️', desc: 'Network of nodes and edges. Best for relationships and paths.', color: 'bg-rose-500' },
};

export default function DataStructureFlow() {
    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChoice, setSelectedChoice] = useState<DataStructure | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [penalty, setPenalty] = useState<string | null>(null);
    const [questionsPlayed, setQuestionsPlayed] = useState(0);
    const maxQuestions = 5;

    useEffect(() => {
        isMounted.current = true;
        fetchScenario();
        return () => { isMounted.current = false; };
    }, []);

    const fetchScenario = async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        setIsRevealed(false);
        setSelectedChoice(null);

        try {
            const prompt = `Generate a realistic system design or algorithmic "User Story" that requires a specific data structure to solve efficiently.
            The possible correct choices are: ['Stack', 'Queue', 'HashMap', 'LinkedList', 'BST', 'Min-Heap', 'Trie', 'Graph'].
            
            Return ONLY a JSON object:
            {
                "problem": "A descriptive scenario (e.g. You are building a browser's history feature...)",
                "requirement": "The core technical constraint (e.g. We need to go back to the most recently visited page in O(1).)",
                "choices": ["StructureA", "StructureB", "StructureC", "StructureD"], // 4 unique structures, including the correct one
                "correctChoice": "The precise name from the list",
                "explanation": "A 1-sentence explanation of why it fits best."
            }`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'datastructure', {}, prompt);

            if (isMounted.current) {
                if (response && response.correctChoice) {
                    setScenario(response);
                } else {
                    throw new Error("Invalid format");
                }
            }
        } catch (e) {
            console.error(e);
            // Fallback
            setScenario({
                problem: "You are designing the back button functionality for a web browser.",
                requirement: "You need to access the most recently visited URL in constant time and remove it.",
                choices: ['Stack', 'Queue', 'HashMap', 'LinkedList'],
                correctChoice: 'Stack',
                explanation: "A Stack's LIFO property naturally manages navigation history where the last visited is the first to go back to."
            });
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    const handleChoice = (choice: DataStructure) => {
        if (isRevealed || isLoading || gameOver) return;
        setSelectedChoice(choice);
        setIsRevealed(true);
        setQuestionsPlayed(q => q + 1);

        if (choice === scenario?.correctChoice) {
            setScore(s => s + 20);
            setStreak(s => s + 1);
        } else {
            setStreak(0);
        }

        if (questionsPlayed + 1 >= maxQuestions) {
            setTimeout(() => handleEnd(), 2000);
        } else {
            // Next question after a delay
            setTimeout(() => fetchScenario(), 3000);
        }
    };

    const handleEnd = async () => {
        setGameOver(true);
        let task = null;
        if (score < 60 && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Data Structure Flow');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'datastructure',
                    winner: score >= 60 ? 'user' : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const restart = () => {
        setScore(0);
        setStreak(0);
        setQuestionsPlayed(0);
        setGameOver(false);
        setPenalty(null);
        resetSessionTokens();
        fetchScenario();
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full h-[700px] overflow-hidden">

            {/* Header Stats */}
            <div className="flex justify-between items-center bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Data Structure Flow</h2>
                        <p className="text-xs text-slate-400">Question {Math.min(maxQuestions, questionsPlayed + 1)} / {maxQuestions}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-800 border border-white/5 rounded-2xl px-6 py-2 text-center min-w-[100px]">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Accuracy</span>
                        <span className="text-2xl font-black text-emerald-400">{score}%</span>
                    </div>
                    {streak > 1 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-orange-500/20 border border-orange-500/30 rounded-2xl px-4 py-2 flex items-center gap-2"
                        >
                            <Zap className="w-5 h-5 text-orange-400 fill-current" />
                            <span className="text-orange-400 font-bold">x{streak} Streak!</span>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">

                {/* LEFT: Scenario Panel */}
                <div className="flex-[3] bg-slate-950 border border-white/10 rounded-3xl p-8 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain className="w-48 h-48 text-indigo-400" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-8">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 block">System Requirement</span>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="h-6 w-3/4 bg-slate-800 rounded-lg animate-pulse" />
                                    <div className="h-20 w-full bg-slate-800/50 rounded-xl animate-pulse" />
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={questionsPlayed}
                                >
                                    <h3 className="text-2xl font-black text-white leading-tight mb-4">
                                        {scenario?.problem}
                                    </h3>
                                    <div className="bg-white/5 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                                        <p className="text-slate-300 italic text-sm">
                                            "{scenario?.requirement}"
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {isRevealed && scenario && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-auto p-6 rounded-2xl border ${selectedChoice === scenario.correctChoice ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {selectedChoice === scenario.correctChoice ?
                                        <CheckCircle2 className="text-emerald-400 w-6 h-6" /> :
                                        <XCircle className="text-rose-400 w-6 h-6" />
                                    }
                                    <h4 className={`font-bold uppercase tracking-widest text-xs ${selectedChoice === scenario.correctChoice ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {selectedChoice === scenario.correctChoice ? 'Architectural Fit!' : 'Structural Misalignment'}
                                    </h4>
                                </div>
                                <p className="text-white text-sm leading-relaxed">
                                    {scenario.explanation}
                                </p>
                            </motion.div>
                        )}

                        {!isRevealed && !isLoading && !gameOver && (
                            <div className="mt-auto flex items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-3xl animate-pulse">
                                <p className="text-slate-500 text-sm font-medium">Analyze the scenario and pick a structure...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Choices Grid */}
                <div className="flex-[2] grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5" />
                        ))
                    ) : (
                        scenario?.choices.map((choice) => {
                            const isCorrect = choice === scenario.correctChoice;
                            const isSelected = selectedChoice === choice;
                            const metadata = STRUCTURE_DATA[choice];

                            return (
                                <motion.button
                                    key={choice}
                                    whileHover={!isRevealed ? { scale: 1.02, x: 5 } : {}}
                                    whileTap={!isRevealed ? { scale: 0.98 } : {}}
                                    onClick={() => handleChoice(choice)}
                                    disabled={isRevealed}
                                    className={`relative p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden
                                        ${!isRevealed
                                            ? 'bg-slate-900 border-white/5 hover:bg-slate-800 hover:border-indigo-500/40'
                                            : isCorrect
                                                ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                : isSelected
                                                    ? 'bg-rose-500/20 border-rose-500'
                                                    : 'bg-slate-900 border-white/5 opacity-40'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg ${metadata.color} transform -rotate-12 group-hover:rotate-0 transition-transform`}>
                                            {metadata.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg">{choice}</h4>
                                            <p className="text-slate-400 text-[10px] leading-tight mt-1 line-clamp-2">
                                                {metadata.desc}
                                            </p>
                                        </div>
                                        {isRevealed && isCorrect && (
                                            <div className="ml-auto">
                                                <CircuitBoard className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Decoration */}
                                    <div className={`absolute top-0 right-0 bottom-0 w-1 ${metadata.color} opacity-20`} />
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* End Game Overlay */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] text-center shadow-2xl max-w-md w-full relative overflow-hidden"
                        >
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full" />

                            <div className="relative z-10">
                                {score >= 60 ? (
                                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-glow" />
                                ) : (
                                    <Skull className="w-20 h-20 text-rose-500 mx-auto mb-6" />
                                )}

                                <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                                    {score >= 60 ? 'Chief Architect' : 'Junior Dev'}
                                </h2>
                                <p className="text-slate-400 mb-8 border-t border-white/5 pt-4">
                                    Final Score: <span className="text-white font-bold">{score} / 100</span>
                                </p>

                                {penalty && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl mb-8 text-left">
                                        <div className="text-[10px] text-rose-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Zap className="w-3 h-3" /> Stack Overflow Penalty
                                        </div>
                                        <p className="text-rose-200 text-sm italic leading-relaxed">
                                            "{penalty}"
                                        </p>
                                    </div>
                                )}

                                <ShareButtons
                                    gameTitle="Data Structure Flow"
                                    result={score >= 60 ? 'won' : 'lost'}
                                    penalty={penalty}
                                />

                                <button
                                    onClick={restart}
                                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 flex items-center justify-center gap-3 mt-4"
                                >
                                    <RefreshCw className="w-5 h-5" /> Start New Sprint
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
