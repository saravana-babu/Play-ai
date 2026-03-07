import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Hash, Trophy, RefreshCw, Sparkles, Wand2, Search, Eye, CheckCircle2, Cpu } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const OBJECTS = [
    { name: 'Apple', emoji: '🍎' }, { name: 'Car', emoji: '🚗' }, { name: 'Cat', emoji: '🐱' },
    { name: 'Flower', emoji: '🌸' }, { name: 'Star', emoji: '⭐' }, { name: 'Cake', emoji: '🍰' },
    { name: 'Rocket', emoji: '🚀' }, { name: 'Fish', emoji: '🐟' }, { name: 'Heart', emoji: '❤️' },
];
const DECOR = ['🌳', '🌲', '☁️', '☀️', '🏠', '🎁', '🎈', '🧸', '🚀', '🌻', '🍀', '🎵'];

export default function KidsEmojiCount() {
    const [target, setTarget] = useState(OBJECTS[0]);
    const [field, setField] = useState<string[]>([]);
    const [count, setCount] = useState(0);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'idle' | 'playing' | 'correct' | 'wrong' | 'won'>('idle');
    const [loading, setLoading] = useState(true);
    const [aiIntro, setAiIntro] = useState('');
    const [aiFact, setAiFact] = useState('');
    const [highlighted, setHighlighted] = useState<number[]>([]);
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const startRound = async () => {
        setLoading(true);
        setStatus('playing');
        setHighlighted([]);
        const randomTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
        setTarget(randomTarget);
        const targetCount = Math.floor(Math.random() * 5) + 3;
        setCount(targetCount);

        const totalSize = 20;
        const newField: string[] = Array(totalSize).fill('');
        const indices = Array.from({ length: totalSize }, (_, i) => i).sort(() => 0.5 - Math.random());
        const targetIndices: number[] = [];
        for (let i = 0; i < targetCount; i++) {
            newField[indices[i]] = randomTarget.emoji;
            targetIndices.push(indices[i]);
        }
        for (let i = targetCount; i < totalSize; i++) {
            const useDeco = Math.random() > 0.35;
            if (useDeco) {
                newField[indices[i]] = DECOR[Math.floor(Math.random() * DECOR.length)];
            } else {
                let other = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
                while (other.name === randomTarget.name) other = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
                newField[indices[i]] = other.emoji;
            }
        }
        setField(newField);

        try {
            const systemInstruction = `You are a magical garden fairy for kids aged 3-6.
            The target emoji is ${randomTarget.name} (${randomTarget.emoji}), and there are ${targetCount} of them hidden.
            Generate a JSON response:
            {
              "intro": "A whimsical 1-sentence welcome inviting the kid to count. Use emojis. Max 15 words.",
              "fact": "A fun number fact for kids. Example: 'Did you know? Octopuses have 8 arms!'. Max 15 words.",
              "cheer": "A short cheer like 'You can do it, little counter!'"
            }
            Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-count', { object: randomTarget.name, count: targetCount }, systemInstruction);
            setAiIntro(response.intro || `Find all the ${randomTarget.emoji} in the magic garden!`);
            setAiFact(response.fact || `The number ${targetCount} is special — just like you!`);
        } catch {
            setAiIntro(`Welcome to the Emoji Garden! 🌈 Count all the ${randomTarget.emoji}!`);
            setAiFact(`The number ${targetCount} is how many fingers you have on one hand${targetCount === 5 ? '!' : ' (almost)!'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { startRound(); }, []);

    const handleAnswer = (val: number) => {
        if (status !== 'playing') return;
        if (val === count) {
            setScore(s => s + 1);
            setStatus('correct');
            // Highlight the target emojis
            const targetIdx = field.map((e, i) => e === target.emoji ? i : -1).filter(i => i !== -1);
            setHighlighted(targetIdx);
            if (score + 1 >= 5) {
                setTimeout(() => setStatus('won'), 1500);
            } else {
                setTimeout(() => startRound(), 2200);
            }
        } else {
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1200);
        }
    };

    if (status === 'won') {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {['🔢', '✨', '🌟', '🎉', '🧮', '💯', '🏆', '⭐'].map((e, i) => (
                        <motion.div key={i} initial={{ y: '120%', x: `${10 + i * 12}%` }}
                            animate={{ y: '-10%' }} transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                            className="absolute text-3xl">{e}</motion.div>
                    ))}
                </div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 relative z-10"
                >
                    <Trophy className="w-14 h-14 text-white" />
                </motion.div>
                <div className="relative z-10">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-amber-300 via-orange-300 to-rose-400 bg-clip-text text-transparent">
                        🧮 Number Wizard! 🧮
                    </h2>
                    <p className="text-slate-400 text-lg mt-4">You counted perfectly every time!</p>
                </div>
                <ShareButtons gameTitle="Emoji Count" result="counted every hidden emoji perfectly" score={score} penalty="Count backwards from 20!"
                    onPlayAgain={() => { setScore(0); startRound(); }} />
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
                <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div key={i} animate={{ scale: i < score ? 1 : 0.7 }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${i < score
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800/80 border border-white/5'}`}
                        >
                            {i < score ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-slate-600 text-xs">•</span>}
                        </motion.div>
                    ))}
                </div>
                <button onClick={startRound} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Main card */}
            <AnimatePresence mode="wait">
                <motion.div key={target.name + score}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="relative rounded-[2.5rem] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10" />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-center gap-2">
                            <Wand2 className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-400 text-xs font-black uppercase tracking-[0.2em]">Emoji Garden</span>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                                    <Search className="w-8 h-8 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <p className="text-slate-500 font-bold animate-pulse">Growing the magic garden...</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl sm:text-2xl font-black text-white text-center leading-snug">{aiIntro}</h3>

                                {/* Emoji grid */}
                                <div className="bg-slate-900/50 p-4 sm:p-6 rounded-[2rem] border border-white/5">
                                    <div className="grid grid-cols-5 gap-3">
                                        {field.map((emoji, i) => (
                                            <motion.div key={i}
                                                initial={{ scale: 0, rotate: Math.random() * 20 - 10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: i * 0.03, type: 'spring', bounce: 0.4 }}
                                                className={`text-2xl sm:text-3xl flex items-center justify-center h-12 sm:h-14 rounded-2xl transition-all cursor-default
                                                    ${highlighted.includes(i)
                                                        ? 'bg-amber-500/20 ring-2 ring-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                                                        : 'bg-white/5 hover:bg-white/10'}`}
                                            >
                                                {emoji}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Question & buttons */}
                                <div className="space-y-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Eye className="w-5 h-5 text-amber-400" />
                                        <p className="text-slate-300 font-black text-lg">
                                            How many <span className="text-2xl mx-1">{target.emoji}</span> do you see?
                                        </p>
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        {[count - 2, count - 1, count, count + 1, count + 2].filter(n => n >= 1 && n <= 9).slice(0, 5).sort(() => 0.5 - Math.random()).map(num => (
                                            <motion.button key={num} whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.9 }}
                                                onClick={() => handleAnswer(num)} disabled={status !== 'playing'}
                                                className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-amber-500/20 transition-all active:shadow-none"
                                            >
                                                {num}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.p key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className={`font-black ${status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-rose-400' : 'text-slate-600'} text-sm`}
                                        >
                                            {status === 'correct' ? '🎉 Perfect count! You\'re a genius!' : status === 'wrong' ? '🤔 Not quite! Count again carefully!' : 'Take your time...'}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Fun fact */}
            {!loading && aiFact && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-white/5 rounded-2xl p-5 flex items-start gap-4"
                >
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">🔢 Number Fun</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{aiFact}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
