import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Sparkles, Shapes, SpellCheck, Wand, GraduationCap, Mountain, HelpCircle, Zap, CheckCircle2, Cpu, BrainCircuit } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const LOCAL_CHALLENGES: Record<string, Array<{ q: string; a: string; options: string[]; hint: string }>> = {
    'shapemastery': [
        { q: "I have 3 sides and 3 corners. What shape am I?", a: "Triangle", options: ["Triangle", "Square", "Circle"], hint: "Think of a mountain!" },
        { q: "I have no corners and I'm perfectly round. What shape am I?", a: "Circle", options: ["Circle", "Oval", "Triangle"], hint: "Like a pizza!" },
        { q: "I have 4 equal sides and 4 right angles. What shape am I?", a: "Square", options: ["Square", "Rectangle", "Diamond"], hint: "Each side is the same!" },
    ],
    'wordscramblekids': [
        { q: "Unscramble: T-A-C. What toy or animal is this?", a: "Cat", options: ["Cat", "Bat", "Hat"], hint: "It purrs!" },
        { q: "Unscramble: G-O-D. What adorable animal is this?", a: "Dog", options: ["Dog", "Frog", "Fog"], hint: "Man's best friend!" },
        { q: "Unscramble: R-A-C. What vehicle is this?", a: "Car", options: ["Car", "Jar", "Bar"], hint: "It has 4 wheels!" },
    ],
    'magicword': [
        { q: "What rhymes with 'hat' and is a small animal?", a: "Cat", options: ["Cat", "Dog", "Rat"], hint: "It says Meow!" },
        { q: "What rhymes with 'fun' and shines in the sky?", a: "Sun", options: ["Sun", "Moon", "Star"], hint: "It keeps you warm!" },
        { q: "Complete: The __ is blue. (Color of sky)", a: "sky", options: ["sky", "sea", "eye"], hint: "Look up!" },
    ],
    'grammarguardian': [
        { q: "Fix: 'I has a red ball.' What's correct?", a: "I have a red ball.", options: ["I have a red ball.", "I had a red ball.", "I is a red ball."], hint: "'I' goes with 'have'!" },
        { q: "Fix: 'She goed to school.' What's correct?", a: "She went to school.", options: ["She went to school.", "She goed to school.", "She go to school."], hint: "Past tense of 'go'!" },
        { q: "Fix: 'The cat catched the mouse.' What's correct?", a: "The cat caught the mouse.", options: ["The cat caught the mouse.", "The cat catched the mouse.", "The cat catch the mouse."], hint: "Past tense of 'catch'!" },
    ],
    'creativedoodle': [
        { q: "We're building a park! What should we add first?", a: "A big slide", options: ["A big slide", "A rocket", "A cave"], hint: "Kids love to go wheee!" },
        { q: "Our underwater world needs something! What fits best?", a: "Colorful coral reef", options: ["Colorful coral reef", "A bookshelf", "A car"], hint: "Fish love to hide here!" },
        { q: "We're making a space station! What room is most important?", a: "Control room", options: ["Control room", "Kitchen", "Bedroom"], hint: "Where astronauts drive!" },
    ],
};

export default function KidsLogicBundle() {
    const { id } = useParams<{ id: string }>();
    const [challenge, setChallenge] = useState<{ q: string; a: string; options: string[]; hint: string } | null>(null);
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
            case 'shapemastery': return { persona: 'a geometry wizard for kids', topic: 'shapes (triangle, circle, square, star, etc)', icon: <Shapes className="w-6 h-6 text-indigo-400" />, color: 'indigo', title: 'Shape Explorer', gradient: 'from-indigo-500 to-violet-600' };
            case 'wordscramblekids': return { persona: 'a word smith who loves toys and animals', topic: 'common toys and animals (max 5 letters)', icon: <SpellCheck className="w-6 h-6 text-amber-500" />, color: 'amber', title: 'Word Scramble', gradient: 'from-amber-500 to-orange-600' };
            case 'magicword': return { persona: 'a wise AI owl who loves reading', topic: 'rhyming words and simple spellings', icon: <Wand className="w-6 h-6 text-violet-500" />, color: 'violet', title: 'Magic Word', gradient: 'from-violet-500 to-purple-600' };
            case 'grammarguardian': return { persona: 'a mischievous robot who makes grammar mistakes', topic: 'fixing broken sentences for kids', icon: <GraduationCap className="w-6 h-6 text-blue-500" />, color: 'blue', title: 'Grammar Guardian', gradient: 'from-blue-500 to-cyan-600' };
            case 'creativedoodle': return { persona: 'a creative artist AI who helps kids build worlds', topic: 'choosing what to add to a scene', icon: <Mountain className="w-6 h-6 text-emerald-500" />, color: 'emerald', title: 'Scene-Maker', gradient: 'from-emerald-500 to-teal-600' };
            default: return { persona: 'a logic bot for kids', topic: selectedTopic || 'logic puzzles', icon: <BrainCircuit className="w-6 h-6 text-indigo-400" />, color: 'indigo', title: selectedTopic || 'Brain Puzzles', gradient: 'from-indigo-500 to-violet-600' };
        }
    };

    const config = getConfig();

    const fetchTopics = async () => {
        setLoading(true);
        setStatus('picking');
        try {
            const systemInstruction = `You are a funny AI robot who loves brain puzzles for kids. 
            Suggest 3 fun logic puzzle categories for children aged 5-10.
            Return JSON:
            {
              "topics": [
                { "name": "Puzzle Type Name", "emoji": "🧠", "description": "Short description (max 10 words)" },
                ...
              ]
            }
            Only return JSON.`;
            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-logic-topics', {}, systemInstruction);
            setTopics(response.topics || []);
        } catch (error) {
            setTopics([
                { name: 'Mystery Maps', emoji: '🗺️', description: 'Find the right path!' },
                { name: 'Secret Codes', emoji: '🔐', description: 'Decode the magic messages!' },
                { name: 'Odd One Out', emoji: '🧐', description: 'Find the one that doesn\'t fit!' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchChallenge = async () => {
        setLoading(true);
        setStatus('playing');
        setShowHint(false);
        setSelectedAnswer('');

        try {
            const systemInstruction = `You are ${config.persona}.
            Create a fun challenge for a child aged 5-10 about ${config.topic}.
            Return JSON:
            {
              "q": "Challenge question. Under 20 words. Must be clear and engaging.",
              "a": "The correct answer (1-5 words)",
              "options": ["Option A", "Option B", "Option C"],
              "hint": "A helpful hint. Under 10 words."
            }
            The correct answer MUST be one of the 3 options. Very child-friendly! Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, `kids-logic-${selectedTopic || id}`, { round: score + 1 }, systemInstruction);
            if (response.q && response.a && response.options) {
                setChallenge(response);
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            const pool = LOCAL_CHALLENGES[id || ''] || LOCAL_CHALLENGES['shapemastery'];
            setChallenge(pool[usedLocal % pool.length]);
            setUsedLocal(u => u + 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id === 'logicpuzzles' && !selectedTopic) {
            fetchTopics();
        } else {
            fetchChallenge();
        }
    }, [id, selectedTopic]);

    const handleAnswer = (val: string) => {
        if (status !== 'playing') return;
        setSelectedAnswer(val);
        if (val === challenge?.a) {
            setScore(s => s + 1);
            setStatus('correct');
            if (score + 1 >= 5) {
                setTimeout(() => setStatus('won'), 1500);
            } else {
                setTimeout(() => fetchChallenge(), 2000);
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
                        <BrainCircuit className="w-4 h-4 text-indigo-400" />
                        <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">Brain Puzzles</span>
                    </div>
                    <h2 className="text-3xl font-black text-white">Choose your challenge!</h2>
                    <p className="text-slate-400">Which brain power do you want to use today?</p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <p className="text-slate-500 font-bold animate-pulse">Calculating puzzle difficulty...</p>
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
                    {['🧩', '✨', '🌟', '🎉', '💡', '⭐', '🔮', '🎊'].map((e, i) => (
                        <motion.div key={i} initial={{ y: '120%', x: `${10 + i * 12}%` }}
                            animate={{ y: '-10%' }} transition={{ duration: 3, delay: i * 0.15, repeat: Infinity }}
                            className="absolute text-3xl">{e}</motion.div>
                    ))}
                </div>
                <motion.div initial={{ scale: 0. }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className={`w-28 h-28 bg-gradient-to-br ${config.gradient} rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative z-10`}
                >
                    <Trophy className="w-14 h-14 text-white" />
                </motion.div>
                <div className="relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                        🧩 {config.title} Champion! 🧩
                    </h2>
                    <p className="text-slate-400 text-lg mt-4">You solved all the puzzles! Your brain is amazing!</p>
                </div>
                <ShareButtons gameTitle={config.title} result={`conquered every ${config.title} puzzle`} score={score} penalty="Spin around 3 times and cheer!"
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

            {/* Challenge card */}
            <AnimatePresence mode="wait">
                <motion.div key={challenge?.q}
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
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
                                <p className="text-slate-500 font-bold animate-pulse">Crafting a puzzle...</p>
                            </div>
                        ) : challenge && (
                            <>
                                <div className={`bg-${config.color}-500/5 border border-${config.color}-500/10 rounded-3xl p-6 sm:p-8`}>
                                    <p className="text-2xl sm:text-3xl font-black text-white leading-snug text-center">{challenge.q}</p>
                                </div>

                                <AnimatePresence>
                                    {showHint && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl overflow-hidden">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <span className="text-amber-300 font-bold text-sm">💡 {challenge.hint}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {challenge.options.map((option, i) => (
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
                                        {status === 'correct' ? '🎉 Brilliant thinking!' : status === 'wrong' ? '🤔 Almost! Try once more!' : 'Think carefully...'}
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
