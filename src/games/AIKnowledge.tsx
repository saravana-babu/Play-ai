import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RefreshCw, BrainCircuit, Sparkles, HelpCircle, Send, Timer, Star, Gem } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface Question {
    category: string;
    points: number;
    question: string;
    options: string[];
    correct: number;
}

const CATEGORIES = ['LLM Architecture', 'Reinforcement Learning', 'Computer Vision', 'Generative Art'];

// --- Component ---
export default function AIKnowledgeBoard() {
    const [board, setBoard] = useState<{ [cat: string]: Question[] }>({});
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [answeredIds, setAnsweredIds] = useState<string[]>([]);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const newBoard: { [cat: string]: Question[] } = {};
        CATEGORIES.forEach(cat => {
            newBoard[cat] = [100, 200, 300, 400, 500].map(pts => ({
                category: cat,
                points: pts,
                question: `What is the core component of ${cat} in modern AI?`,
                options: ['Transformer', 'CNN', 'MLP', 'RNN'],
                correct: 0
            }));
        });
        setBoard(newBoard);
        setScore(0);
        setAnsweredIds([]);
        setGameOver(false);
        setWinner(null);
        setSelectedQuestion(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const handleSelect = (q: Question, id: string) => {
        if (answeredIds.includes(id) || gameOver) return;
        setSelectedQuestion(q);
        setAnsweredIds([...answeredIds, id]);
    };

    const handleAnswer = (idx: number) => {
        if (!selectedQuestion) return;
        if (idx === selectedQuestion.correct) {
            setScore(s => s + selectedQuestion.points);
        } else {
            setScore(s => Math.max(0, s - selectedQuestion.points / 2));
        }
        setSelectedQuestion(null);
        if (answeredIds.length === 20) {
            finishGame('player');
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'AI Knowledge Board');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'aiknowledge', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Knowledge Points</p>
                        <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-emerald-400" />
                            <p className="text-2xl font-black text-white">{score}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-[10px] text-indigo-400 font-black uppercase">
                        <Timer className="w-3 h-3" />
                        Session Active
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Jeopardy Board */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map(cat => (
                    <div key={cat} className="space-y-4">
                        <div className="bg-indigo-600 p-4 rounded-2xl text-center shadow-lg border border-indigo-400/50">
                            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tighter">{cat}</span>
                        </div>
                        {board[cat]?.map((q, i) => {
                            const id = `${cat}-${i}`;
                            const isAnswered = answeredIds.includes(id);
                            return (
                                <motion.button
                                    key={id}
                                    whileHover={!isAnswered ? { scale: 1.05 } : {}}
                                    whileTap={!isAnswered ? { scale: 0.95 } : {}}
                                    onClick={() => handleSelect(q, id)}
                                    className={`w-full py-8 sm:py-12 rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden group
                                        ${isAnswered ? 'bg-slate-900 border-white/5 opacity-30 cursor-not-allowed' : 'bg-slate-900 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/5 shadow-xl'}`}
                                >
                                    {!isAnswered && (
                                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                                    )}
                                    <span className={`text-xl sm:text-3xl font-black ${isAnswered ? 'text-slate-700' : 'text-indigo-400'}`}>${q.points}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Question Modal */}
            <AnimatePresence>
                {selectedQuestion && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8">
                        <div className="bg-slate-900 border border-white/10 p-8 sm:p-12 rounded-[40px] max-w-2xl w-full space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-br-full -translate-x-8 -translate-y-8 blur-2xl" />

                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{selectedQuestion.category}</span>
                                    <h3 className="text-3xl font-black text-white italic tracking-tighter">${selectedQuestion.points} Challenger</h3>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>

                            <p className="text-xl text-slate-200 font-medium leading-relaxed italic">
                                "{selectedQuestion.question}"
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedQuestion.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(i)}
                                        className="p-6 bg-slate-950 border border-white/5 rounded-3xl text-left hover:border-indigo-500 group transition-all relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className="text-slate-300 font-bold group-hover:text-white">{opt}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-8 text-center">
                        <div className="space-y-8 max-w-md w-full">
                            <Trophy className="w-24 h-24 text-amber-400 mx-auto drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">KNOWLEDGE_ACQUIRED</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global ranking synchronized. Score: {score}</p>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="AI Knowledge Board" result="benchmarked at expert level" score={score} />
                                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-xl transition-all active:scale-95">RESTART COMPETITION</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-slate-900/50 p-8 rounded-[40px] border border-white/5 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
                <Sparkles className="w-12 h-12 text-indigo-400 shrink-0" />
                <div className="space-y-2">
                    <h4 className="text-white font-black uppercase tracking-widest text-sm">Trivia Simulation Mode</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                        The AI handles board generation and benchmarking. In AI vs AI mode, two LLMs will compete for the highest score by solving these logic blocks simultaneously.
                    </p>
                </div>
                <div className="flex -space-x-3 ml-auto">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center"><Star className="w-4 h-4 text-amber-500/50" /></div>)}
                </div>
            </div>
        </div>
    );
}
