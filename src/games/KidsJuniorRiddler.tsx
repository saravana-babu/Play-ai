import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Lightbulb, RefreshCw, Brain, HelpCircle, Zap, Cpu } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const LOCAL_RIDDLES = [
    { riddle: "I have keys but no doors. I have space but no room. You can enter but can't go outside. What am I?", answer: "Keyboard", wrong: ["Piano", "Phone", "Car"] },
    { riddle: "I have hands but I can't clap. I have a face but I can't smile. What am I?", answer: "Clock", wrong: ["Robot", "Mirror", "Doll"] },
    { riddle: "I get bigger when you take things away from me. What am I?", answer: "Hole", wrong: ["Balloon", "Cloud", "Shadow"] },
    { riddle: "I have legs but I never walk. You rest on me when you're tired. What am I?", answer: "Chair", wrong: ["Table", "Bed", "Spider"] },
    { riddle: "I have a head and a tail but no body. Kings flip me for decisions! What am I?", answer: "Coin", wrong: ["Snake", "Arrow", "Key"] },
    { riddle: "The more you take, the more you leave behind. What am I?", answer: "Footsteps", wrong: ["Cookies", "Breath", "Photos"] },
    { riddle: "I can travel around the world while staying in a corner. What am I?", answer: "Stamp", wrong: ["Spider", "Shadow", "Snail"] },
    { riddle: "I have teeth but I never eat. I help your hair look neat! What am I?", answer: "Comb", wrong: ["Shark", "Zipper", "Fork"] },
];

export default function KidsJuniorRiddler() {
    const [riddle, setRiddle] = useState('');
    const [answer, setAnswer] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'idle' | 'playing' | 'correct' | 'wrong' | 'won'>('idle');
    const [loading, setLoading] = useState(true);
    const [showHint, setShowHint] = useState(false);
    const [hint, setHint] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const fetchRiddle = async () => {
        setLoading(true);
        setStatus('playing');
        setShowHint(false);
        setSelectedAnswer('');

        try {
            const systemInstruction = `You are a hilarious AI riddle master for kids aged 5-10.
            Generate a fun, simple riddle. The answer must be a common object or thing.
            Return JSON:
            {
              "riddle": "The riddle text. Must be under 25 words. Use descriptive clues.",
              "answer": "A single word answer",
              "wrong_options": ["wrong1", "wrong2", "wrong3"],
              "hint": "A simple, helpful hint without giving the answer away. Under 10 words.",
              "emoji": "An emoji representing the answer"
            }
            Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-riddle', { round: score + 1 }, systemInstruction);
            if (response.riddle && response.answer && response.wrong_options) {
                setRiddle(response.riddle);
                setAnswer(response.answer);
                setHint(response.hint || 'Think about everyday objects!');
                setOptions([response.answer, ...response.wrong_options].sort(() => 0.5 - Math.random()));
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            const local = LOCAL_RIDDLES[Math.floor(Math.random() * LOCAL_RIDDLES.length)];
            setRiddle(local.riddle);
            setAnswer(local.answer);
            setHint('Think carefully about each word!');
            setOptions([local.answer, ...local.wrong].sort(() => 0.5 - Math.random()));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRiddle(); }, []);

    const handleChoice = (choice: string) => {
        if (status !== 'playing') return;
        setSelectedAnswer(choice);
        if (choice === answer) {
            setScore(s => s + 1);
            setStatus('correct');
            if (score + 1 >= 5) {
                setTimeout(() => setStatus('won'), 1500);
            } else {
                setTimeout(() => fetchRiddle(), 2000);
            }
        } else {
            setStatus('wrong');
            setTimeout(() => { setStatus('playing'); setSelectedAnswer(''); }, 1500);
        }
    };

    if (status === 'won') {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {['💡', '🧠', '✨', '🎉', '❓', '💫', '🏆', '⚡'].map((e, i) => (
                        <motion.div key={i} initial={{ y: '120%', x: `${10 + i * 12}%` }}
                            animate={{ y: '-10%' }} transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                            className="absolute text-3xl">{e}</motion.div>
                    ))}
                </div>
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-28 h-28 bg-gradient-to-br from-violet-500 to-purple-700 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-violet-500/30 z-10 relative"
                >
                    <Trophy className="w-14 h-14 text-white" />
                </motion.div>
                <div className="relative z-10 space-y-3">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                        🧠 Riddle Champion! 🧠
                    </h2>
                    <p className="text-slate-400 text-lg">You solved every single riddle! Your brain is on fire!</p>
                </div>
                <ShareButtons gameTitle="Junior Riddler" result="solved every AI riddle" score={score} penalty="Make up a riddle and tell someone!"
                    onPlayAgain={() => { setScore(0); fetchRiddle(); }} />
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
                                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20'
                                    : 'bg-slate-800/80 border border-white/5'}`}
                            >
                                {i < score ? <Lightbulb className="w-4 h-4 text-white" /> : <span className="text-slate-600 text-xs">•</span>}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!loading && !showHint && status === 'playing' && (
                        <button onClick={() => setShowHint(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-bold">
                            <HelpCircle className="w-3.5 h-3.5" /> Hint
                        </button>
                    )}
                    <button onClick={fetchRiddle} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Riddle card */}
            <AnimatePresence mode="wait">
                <motion.div key={riddle}
                    initial={{ opacity: 0, y: 30, rotateX: 10 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="relative rounded-[2.5rem] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10" />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-center gap-2">
                            <Brain className="w-4 h-4 text-violet-400" />
                            <span className="text-violet-400 text-xs font-black uppercase tracking-[0.2em]">AI Riddle #{score + 1}</span>
                        </div>

                        {loading ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
                                    <Lightbulb className="w-8 h-8 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <p className="text-slate-500 font-bold animate-pulse">Thinking of a tricky one...</p>
                            </div>
                        ) : (
                            <>
                                {/* Riddle text */}
                                <div className="bg-violet-500/5 border border-violet-500/10 rounded-3xl p-6 sm:p-8">
                                    <p className="text-2xl sm:text-3xl font-black text-white leading-snug text-center">
                                        "{riddle}"
                                    </p>
                                </div>

                                {/* Hint */}
                                <AnimatePresence>
                                    {showHint && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl overflow-hidden"
                                        >
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <span className="text-amber-300 font-bold text-sm">💡 {hint}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-3">
                                    {options.map((option, i) => (
                                        <motion.button key={option}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                                            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleChoice(option)} disabled={status !== 'playing'}
                                            className={`px-6 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border
                                                ${selectedAnswer === option && status === 'correct'
                                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                                                    : selectedAnswer === option && status === 'wrong'
                                                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                                                        : 'bg-slate-900 border-white/5 text-slate-300 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10'}`}
                                        >
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.p key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className={`text-center font-black text-sm ${status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-rose-400' : 'text-slate-600'}`}
                                    >
                                        {status === 'correct' ? '🎉 Brilliant! You cracked it!' : status === 'wrong' ? '🤔 Not quite! Give it another go!' : 'Think carefully...'}
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
