import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RefreshCw, Palette, Star, Heart, Zap, Cpu } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const COLORS = [
    { name: 'Red', hex: '#ef4444', emoji: '🍎', bg: 'from-red-500 to-rose-600' },
    { name: 'Blue', hex: '#3b82f6', emoji: '🦋', bg: 'from-blue-500 to-indigo-600' },
    { name: 'Green', hex: '#22c55e', emoji: '🌲', bg: 'from-emerald-500 to-green-600' },
    { name: 'Yellow', hex: '#eab308', emoji: '☀️', bg: 'from-yellow-400 to-amber-500' },
    { name: 'Purple', hex: '#a855f7', emoji: '🍇', bg: 'from-purple-500 to-violet-600' },
    { name: 'Orange', hex: '#f97316', emoji: '🍊', bg: 'from-orange-500 to-amber-600' },
    { name: 'Pink', hex: '#ec4899', emoji: '🌸', bg: 'from-pink-500 to-rose-600' },
];

const CELEBRATIONS = ['🌟', '⭐', '✨', '🎉', '🎊', '💫', '🌈', '🦄'];

export default function KidsColorMatch() {
    const [targetColor, setTargetColor] = useState(COLORS[0]);
    const [options, setOptions] = useState<typeof COLORS>([]);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [status, setStatus] = useState<'idle' | 'playing' | 'correct' | 'wrong' | 'won'>('idle');
    const [aiMessage, setAiMessage] = useState('');
    const [funFact, setFunFact] = useState('');
    const [loading, setLoading] = useState(true);
    const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const spawnParticles = useCallback(() => {
        const newParticles = Array.from({ length: 8 }, (_, i) => ({
            id: Date.now() + i,
            emoji: CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)],
            x: Math.random() * 100,
            y: Math.random() * 100,
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 2000);
    }, []);

    const startRound = async () => {
        setLoading(true);
        setStatus('playing');
        const randomTarget = COLORS[Math.floor(Math.random() * COLORS.length)];
        setTargetColor(randomTarget);

        const shuffled = [...COLORS].sort(() => 0.5 - Math.random());
        const filtered = shuffled.filter(c => c.name !== randomTarget.name).slice(0, 3);
        setOptions([...filtered, randomTarget].sort(() => 0.5 - Math.random()));

        try {
            const systemInstruction = `You are a magical rainbow fairy guide for little kids aged 3-6.
            The target color is ${randomTarget.name}.
            Generate a JSON response with:
            {
              "message": "A fun 1-sentence clue about this color WITHOUT saying the color name. Use emojis. Example: 'This color is like a beautiful sunset! 🌅'. Max 12 words.",
              "fun_fact": "A very simple, fascinating color fact for kids. 1 sentence. Example: 'Flamingos turn pink from eating shrimp!' Max 15 words.",
              "character_says": "What a magical color buddy would say. 1 sentence encouragement."
            }
            Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-color', { color: randomTarget.name, round: score + 1 }, systemInstruction);
            setAiMessage(response.message || `This color is just like a ${randomTarget.emoji}!`);
            setFunFact(response.fun_fact || `${randomTarget.name} is one of the most beautiful colors in the rainbow!`);
        } catch (error) {
            const fallbacks: Record<string, { msg: string; fact: string }> = {
                'Red': { msg: 'This color is like a juicy apple! 🍎', fact: 'Red is the first color babies can see!' },
                'Blue': { msg: 'The sky and ocean share this beautiful color! 🌊', fact: 'Blue is the most popular favorite color in the world!' },
                'Green': { msg: 'Trees and grass are dressed in this color! 🌳', fact: 'Green is the color of nature and new beginnings!' },
                'Yellow': { msg: 'The sun shines bright in this happy color! ☀️', fact: 'Yellow is the most visible color from far away!' },
                'Purple': { msg: 'Kings and queens love to wear this royal shade! 👑', fact: 'Purple was once the rarest and most expensive color!' },
                'Orange': { msg: 'Sunsets paint the sky in this warm glow! 🌅', fact: 'The color was named after the fruit, not the other way around!' },
                'Pink': { msg: 'Cherry blossoms bloom in this sweet color! 🌸', fact: 'There is a lake in Australia that is naturally pink!' },
            };
            const fb = fallbacks[randomTarget.name] || { msg: `Find the ${randomTarget.emoji}!`, fact: 'Colors make the world beautiful!' };
            setAiMessage(fb.msg);
            setFunFact(fb.fact);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { startRound(); }, []);

    const handleChoice = (color: typeof COLORS[0]) => {
        if (status !== 'playing') return;
        if (color.name === targetColor.name) {
            const newScore = score + 1;
            setScore(newScore);
            setStreak(s => s + 1);
            setStatus('correct');
            spawnParticles();
            if (newScore >= 5) {
                setTimeout(() => setStatus('won'), 1200);
            } else {
                setTimeout(() => startRound(), 1800);
            }
        } else {
            setStreak(0);
            setStatus('wrong');
            setTimeout(() => setStatus('playing'), 1200);
        }
    };

    if (status === 'won') {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: '110%', x: `${Math.random() * 100}%`, opacity: 0 }}
                            animate={{ y: '-10%', opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 3, delay: i * 0.15, repeat: Infinity }}
                            className="absolute text-3xl"
                        >
                            {CELEBRATIONS[i % CELEBRATIONS.length]}
                        </motion.div>
                    ))}
                </div>

                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-28 h-28 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/40 relative z-10"
                >
                    <Trophy className="w-14 h-14 text-white drop-shadow-lg" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                        🌈 Rainbow Master! 🌈
                    </h2>
                    <p className="text-slate-400 text-lg mt-4">You found ALL the colors! You're absolutely amazing!</p>
                    <div className="flex justify-center gap-2 mt-3">
                        {COLORS.map(c => (
                            <motion.div key={c.name} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: Math.random() * 0.5 }}
                                className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>
                </motion.div>
                <ShareButtons gameTitle="Color Matcher" result="found all the rainbow colors" score={score} penalty="Do a rainbow dance!" onPlayAgain={() => { setScore(0); setStreak(0); startRound(); }} />
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
            {/* Celebration particles */}
            <AnimatePresence>
                {particles.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 1, scale: 0, x: `${p.x}%`, y: `${p.y}%` }}
                        animate={{ opacity: 0, scale: 2, y: `${p.y - 30}%` }} exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }} className="absolute text-3xl pointer-events-none z-50"
                    >{p.emoji}</motion.div>
                ))}
            </AnimatePresence>

            {/* Score bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} initial={false} animate={{ scale: i < score ? 1 : 0.7, opacity: i < score ? 1 : 0.3 }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${i < score ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30' : 'bg-slate-800'}`}
                            >
                                {i < score ? '⭐' : '○'}
                            </motion.div>
                        ))}
                    </div>
                    {streak >= 2 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                            <Zap className="w-3 h-3 text-orange-400" />
                            <span className="text-orange-400 text-xs font-black">{streak}x STREAK!</span>
                        </motion.div>
                    )}
                </div>
                <button onClick={startRound} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Main game area */}
            <AnimatePresence mode="wait">
                <motion.div key={targetColor.name + score}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="relative rounded-[2.5rem] overflow-hidden"
                >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 rounded-[2.5rem]" />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] p-8 space-y-6">
                        {/* AI Message */}
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">Rainbow Fairy says</span>
                            </div>

                            {loading ? (
                                <div className="py-8 flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                        <Palette className="w-7 h-7 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                                    </div>
                                    <p className="text-slate-500 font-bold animate-pulse text-sm">Mixing magical colors...</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-snug">
                                        {aiMessage}
                                    </h3>

                                    {/* Color preview circle */}
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
                                        className="w-28 h-28 mx-auto rounded-full shadow-2xl flex items-center justify-center text-5xl ring-4 ring-white/10"
                                        style={{ backgroundColor: `${targetColor.hex}30`, boxShadow: `0 0 60px ${targetColor.hex}30` }}
                                    >
                                        <span className="drop-shadow-lg">{targetColor.emoji}</span>
                                    </motion.div>

                                    {/* Status message */}
                                    <AnimatePresence mode="wait">
                                        <motion.p key={status} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className={`text-lg font-black ${status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-rose-400' : 'text-slate-500'}`}
                                        >
                                            {status === 'correct' ? '🎉 AMAZING! You got it!' : status === 'wrong' ? '😊 Oops! Try another one!' : 'Tap the right color below!'}
                                        </motion.p>
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Color buttons grid */}
            {!loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {options.map((color, i) => (
                        <motion.button key={color.name}
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}
                            whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.92 }}
                            onClick={() => handleChoice(color)}
                            disabled={status !== 'playing'}
                            className={`relative h-28 sm:h-32 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 group transition-all overflow-hidden
                                ${status === 'correct' && color.name === targetColor.name ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950' : ''}
                                ${status === 'wrong' && color.name !== targetColor.name ? 'opacity-60' : ''}`}
                            style={{ backgroundColor: color.hex }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-4xl drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform">{color.emoji}</span>
                            <span className="font-black text-white text-sm uppercase tracking-[0.2em] drop-shadow-lg relative z-10">{color.name}</span>
                            {status === 'correct' && color.name === targetColor.name && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-3xl">
                                    <span className="text-5xl">✅</span>
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Fun fact footer */}
            {!loading && funFact && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-white/5 rounded-2xl p-5 flex items-start gap-4"
                >
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <Star className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">✨ Color Fun Fact</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{funFact}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
