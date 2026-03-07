import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Sparkles, Brain, Rocket, TreePine, Apple, CaseSensitive, HelpCircle, Zap, CheckCircle2, Cpu, GraduationCap } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const LOCAL_QUESTIONS: Record<string, Array<{ q: string; a: string; options: string[]; hint: string }>> = {
    'dinofacts': [
        { q: "What is the biggest dinosaur ever?", a: "Argentinosaurus", options: ["Argentinosaurus", "T-Rex", "Stegosaurus"], hint: "It's named after a country!" },
        { q: "Which dinosaur had three horns on its head?", a: "Triceratops", options: ["Triceratops", "Pterodactyl", "Velociraptor"], hint: "'Tri' means three!" },
        { q: "What does 'dinosaur' mean?", a: "Terrible Lizard", options: ["Terrible Lizard", "Big Animal", "Ancient Bird"], hint: "The word comes from Greek!" },
    ],
    'spaceexplorer': [
        { q: "Which planet is known as the Red Planet?", a: "Mars", options: ["Mars", "Jupiter", "Venus"], hint: "It's named after a Roman god!" },
        { q: "How many planets are in our solar system?", a: "8", options: ["8", "9", "7"], hint: "Pluto isn't counted anymore!" },
        { q: "What is the closest star to Earth?", a: "The Sun", options: ["The Sun", "Polaris", "Sirius"], hint: "You see it every day!" },
    ],
    'ecohero': [
        { q: "What gas do trees breathe in?", a: "Carbon Dioxide", options: ["Carbon Dioxide", "Oxygen", "Nitrogen"], hint: "It's what we breathe OUT!" },
        { q: "How much of Earth is covered by water?", a: "About 70%", options: ["About 70%", "About 50%", "About 90%"], hint: "More than half!" },
        { q: "What are the 3 R's of recycling?", a: "Reduce, Reuse, Recycle", options: ["Reduce, Reuse, Recycle", "Run, Rest, Relax", "Read, Write, Remember"], hint: "They all start with 'Re'!" },
    ],
    'mathfruit': [
        { q: "🍎🍎🍎 + 🍎🍎 = ?", a: "5", options: ["5", "4", "6"], hint: "Count all the apples!" },
        { q: "🍊🍊🍊🍊 - 🍊 = ?", a: "3", options: ["3", "4", "2"], hint: "Take one orange away!" },
        { q: "🍌🍌 + 🍌🍌 + 🍌 = ?", a: "5", options: ["5", "4", "6"], hint: "Two plus two plus one!" },
    ],
    'letteradventure': [
        { q: "Which letter comes after 'M'?", a: "N", options: ["N", "O", "L"], hint: "Sing the alphabet song!" },
        { q: "How many vowels are in English?", a: "5", options: ["5", "6", "4"], hint: "A, E, I, O, U!" },
        { q: "What letter does 'Elephant' start with?", a: "E", options: ["E", "L", "A"], hint: "Say the word slowly!" },
    ],
};

export default function KidsTriviaBundle() {
    const { id } = useParams<{ id: string }>();
    const [question, setQuestion] = useState<{ q: string; a: string; options: string[]; hint: string } | null>(null);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'idle' | 'picking' | 'playing' | 'correct' | 'wrong' | 'won'>('idle');
    const [loading, setLoading] = useState(true);
    const [showHint, setShowHint] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [usedLocal, setUsedLocal] = useState(0);
    const [topics, setTopics] = useState<Array<{ name: string; emoji: string; description: string }>>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const getConfig = () => {
        const currentId = selectedTopic || id;
        switch (currentId) {
            case 'dinofacts': return { persona: 'a paleontologist dinosaur expert for kids', topic: 'dinosaurs', icon: <Brain className="w-6 h-6 text-amber-500" />, color: 'amber', title: 'Dino Explorer', gradient: 'from-amber-500 to-orange-600' };
            case 'spaceexplorer': return { persona: 'a friendly astronaut space guide', topic: 'space and planets', icon: <Rocket className="w-6 h-6 text-indigo-400" />, color: 'indigo', title: 'Space Voyager', gradient: 'from-indigo-500 to-blue-600' };
            case 'ecohero': return { persona: 'a nature-loving eco warrior', topic: 'nature and saving the planet', icon: <TreePine className="w-6 h-6 text-emerald-500" />, color: 'emerald', title: 'Eco Hero', gradient: 'from-emerald-500 to-teal-600' };
            case 'mathfruit': return { persona: 'a cheerful chef who loves counting fruit', topic: 'simple addition and subtraction with fruit emojis', icon: <Apple className="w-6 h-6 text-rose-500" />, color: 'rose', title: 'Math Fruit', gradient: 'from-rose-500 to-pink-600' };
            case 'letteradventure': return { persona: 'a magic elf who loves the alphabet', topic: 'letters and simple words', icon: <CaseSensitive className="w-6 h-6 text-blue-400" />, color: 'blue', title: 'Letter Adventure', gradient: 'from-blue-500 to-cyan-600' };
            default: return { persona: 'a friendly elementary teacher', topic: selectedTopic || 'learning fun', icon: <Sparkles className="w-6 h-6 text-indigo-400" />, color: 'indigo', title: selectedTopic || 'Magic Discovery', gradient: 'from-indigo-500 to-violet-600' };
        }
    };

    const config = getConfig();

    const fetchTopics = async () => {
        setLoading(true);
        setStatus('picking');
        try {
            const systemInstruction = `You are a magical AI teacher for kids. 
            Suggest 3 fun and educational categories for a trivia game for children aged 5-8.
            Return JSON:
            {
              "topics": [
                { "name": "Topic Name", "emoji": "🍎", "description": "Short description (max 10 words)" },
                ...
              ]
            }
            Only return JSON.`;
            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-trivia-topics', {}, systemInstruction);
            setTopics(response.topics || []);
        } catch (error) {
            setTopics([
                { name: 'Sea Animals', emoji: '🐬', description: 'Dive deep into the ocean!' },
                { name: 'Superheroes', emoji: '🦸', description: 'Faster than a speeding bullet!' },
                { name: 'Yummy Food', emoji: '🍕', description: 'Learn about what we eat!' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestion = async () => {
        setLoading(true);
        setStatus('playing');
        setShowHint(false);
        setSelectedAnswer('');

        try {
            const systemInstruction = `You are ${config.persona}.
            Generate a fun multiple choice question for a child aged 5-10 about ${config.topic}.
            Return JSON:
            {
              "q": "The question text. Under 20 words. Fun and engaging.",
              "a": "Correct answer (keep short, 1-3 words)",
              "options": ["Option A", "Option B", "Option C"],
              "hint": "A helpful simple hint. Under 10 words."
            }
            The correct answer MUST be one of the 3 options. Keep it age-appropriate! Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, `kids-trivia-${selectedTopic || id}`, { round: score + 1 }, systemInstruction);
            if (response.q && response.a && response.options) {
                setQuestion(response);
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            const pool = LOCAL_QUESTIONS[id || ''] || LOCAL_QUESTIONS['letteradventure'];
            setQuestion(pool[usedLocal % pool.length]);
            setUsedLocal(u => u + 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id === 'kidsdiscovery' && !selectedTopic) {
            fetchTopics();
        } else {
            fetchQuestion();
        }
    }, [id, selectedTopic]);

    const handleAnswer = (val: string) => {
        if (status !== 'playing') return;
        setSelectedAnswer(val);
        if (val === question?.a) {
            setScore(s => s + 1);
            setStatus('correct');
            if (score + 1 >= 5) {
                setTimeout(() => setStatus('won'), 1500);
            } else {
                setTimeout(() => fetchQuestion(), 2000);
            }
        } else {
            setStatus('wrong');
            setTimeout(() => { setStatus('playing'); setSelectedAnswer(''); }, 1500);
        }
    };

    if (status === 'picking') {
        return (
            <div className="space-y-8 p-4">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">Magic Discovery</span>
                    </div>
                    <h2 className="text-3xl font-black text-white">What should we learn about today?</h2>
                    <p className="text-slate-400">Pick a magical topic to start your adventure!</p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <p className="text-slate-500 font-bold animate-pulse">Consulting the magic library...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                        {topics.map((t, i) => (
                            <motion.button key={t.name}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTopic(t.name)}
                                className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-4 hover:border-indigo-500/50 transition-all group shadow-xl"
                            >
                                <span className="text-6xl block group-hover:scale-110 transition-transform mb-4">{t.emoji}</span>
                                <h3 className="text-xl font-black text-white">{t.name}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (status === 'won') {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {['🏆', '✨', '🌟', '🎉', '💫', '⭐', '🎊', '🔥'].map((e, i) => (
                        <motion.div key={i} initial={{ y: '120%', x: `${10 + i * 12}%` }}
                            animate={{ y: '-10%' }} transition={{ duration: 3, delay: i * 0.15, repeat: Infinity }}
                            className="absolute text-3xl">{e}</motion.div>
                    ))}
                </div>
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className={`w-28 h-28 bg-gradient-to-br ${config.gradient} rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative z-10`}
                >
                    <Trophy className="w-14 h-14 text-white" />
                </motion.div>
                <div className="relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                        🏆 {config.title} Master! 🏆
                    </h2>
                    <p className="text-slate-400 text-lg mt-4">You aced every question! Incredible brain power!</p>
                </div>
                <ShareButtons gameTitle={config.title} result={`mastered ${config.title}`} score={score} penalty="Jump 10 times and cheer!"
                    onPlayAgain={() => { setScore(0); setUsedLocal(0); setSelectedTopic(null); setStatus('idle'); }} />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Token Usage Badge */}
            <div className="absolute -top-12 right-0 flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/5 rounded-full shadow-lg">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tokens: <span className="text-indigo-400">{gameSessionTokens.toLocaleString()}</span>
                </span>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} animate={{ scale: i < score ? 1 : 0.7 }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${i < score
                                    ? `bg-gradient-to-br ${config.gradient} shadow-lg`
                                    : 'bg-slate-800/80 border border-white/5'}`}
                            >
                                {i < score ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-slate-600 text-xs">{i + 1}</span>}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    {!loading && !showHint && status === 'playing' && (
                        <button onClick={() => setShowHint(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-bold">
                            <HelpCircle className="w-3.5 h-3.5" /> Hint
                        </button>
                    )}
                    <button onClick={() => { setScore(0); setSelectedTopic(null); setStatus('idle'); }} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Question card */}
            <AnimatePresence mode="wait">
                <motion.div key={question?.q}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="relative rounded-[2.5rem] overflow-hidden"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br from-${config.color}-500/10 via-transparent to-${config.color}-500/10`} />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-center gap-2">
                            {config.icon}
                            <span className={`text-${config.color}-400 text-xs font-black uppercase tracking-[0.2em]`}>{config.title}</span>
                        </div>

                        {loading ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-full border-4 border-${config.color}-500/20 border-t-${config.color}-500 animate-spin`} />
                                    {config.icon}
                                </div>
                                <p className="text-slate-500 font-bold animate-pulse">Discovering new knowledge...</p>
                            </div>
                        ) : question && (
                            <>
                                <div className={`bg-${config.color}-500/5 border border-${config.color}-500/10 rounded-3xl p-6 sm:p-8`}>
                                    <p className="text-2xl sm:text-3xl font-black text-white leading-snug text-center">{question.q}</p>
                                </div>

                                <AnimatePresence>
                                    {showHint && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl overflow-hidden">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <span className="text-amber-300 font-bold text-sm">💡 {question.hint}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {question.options.map((option, i) => (
                                        <motion.button key={option}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                                            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAnswer(option)} disabled={status !== 'playing'}
                                            className={`px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border
                                                ${selectedAnswer === option && status === 'correct'
                                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                                                    : selectedAnswer === option && status === 'wrong'
                                                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                                                        : `bg-slate-900 border-white/5 text-slate-300 hover:text-white hover:border-${config.color}-500/50 hover:bg-${config.color}-500/10`}`}
                                        >
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.p key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className={`text-center font-black text-sm ${status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-rose-400' : 'text-slate-600'}`}>
                                        {status === 'correct' ? '🎉 Correct! You\'re brilliant!' : status === 'wrong' ? '🤔 Not quite! Try again!' : 'Choose your answer!'}
                                    </motion.p>
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
