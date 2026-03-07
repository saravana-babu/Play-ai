import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { PawPrint, Trophy, RefreshCw, Sparkles, MessageSquare, Heart, Volume2, MapPin, Cpu } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const ANIMALS = [
    { name: 'Lion', emoji: '🦁', sound: 'Roar!', habitat: 'Savanna' },
    { name: 'Elephant', emoji: '🐘', sound: 'Pawoo!', habitat: 'Jungle' },
    { name: 'Monkey', emoji: '🐒', sound: 'Oo-oo-ah-ah!', habitat: 'Rainforest' },
    { name: 'Frog', emoji: '🐸', sound: 'Ribbit!', habitat: 'Pond' },
    { name: 'Cow', emoji: '🐮', sound: 'Moo!', habitat: 'Farm' },
    { name: 'Duck', emoji: '🦆', sound: 'Quack!', habitat: 'Lake' },
    { name: 'Cat', emoji: '🐱', sound: 'Meow!', habitat: 'Home' },
    { name: 'Dog', emoji: '🐶', sound: 'Woof!', habitat: 'Home' },
    { name: 'Bee', emoji: '🐝', sound: 'Bzzz!', habitat: 'Garden' },
    { name: 'Sheep', emoji: '🐑', sound: 'Baa!', habitat: 'Meadow' },
    { name: 'Penguin', emoji: '🐧', sound: 'Squawk!', habitat: 'Antarctica' },
    { name: 'Dolphin', emoji: '🐬', sound: 'Click-click!', habitat: 'Ocean' },
];

const LOCAL_HINTS: Record<string, { hint: string; fact: string }> = {
    'Lion': { hint: 'I am the king of the jungle with a golden mane! 👑', fact: 'A lion\'s roar can be heard from 5 miles away!' },
    'Elephant': { hint: 'I have a very long nose and the biggest ears! 👂', fact: 'Elephants can recognize themselves in mirrors!' },
    'Monkey': { hint: 'I love swinging on branches and eating bananas! 🍌', fact: 'Monkeys can count and understand basic math!' },
    'Frog': { hint: 'I start life as a tadpole in the water! 💧', fact: 'A group of frogs is called an "army"!' },
    'Cow': { hint: 'I give you creamy milk every morning! 🥛', fact: 'Cows have best friends and get stressed when separated!' },
    'Duck': { hint: 'I waddle on land and paddle in the water! 🌊', fact: 'A duck\'s quack doesn\'t echo, and nobody knows why!' },
    'Cat': { hint: 'I love to chase yarn and take naps in sunlight! 😴', fact: 'Cats spend 70% of their lives sleeping!' },
    'Dog': { hint: 'I wag my tail when I\'m happy to see you! 🦮', fact: 'Dogs can smell 10,000 times better than humans!' },
    'Bee': { hint: 'I make something golden and sweet in my hive! 🍯', fact: 'Bees visit about 2 million flowers to make 1 pound of honey!' },
    'Sheep': { hint: 'My fluffy coat keeps you warm in winter! 🧤', fact: 'Sheep can remember 50 different faces for years!' },
    'Penguin': { hint: 'I wear a tuxedo and love the cold! 🥶', fact: 'Penguins propose with a pebble they search for!' },
    'Dolphin': { hint: 'I\'m the smartest swimmer in the deep blue sea! 🌊', fact: 'Dolphins sleep with one eye open!' },
};

export default function KidsAnimalDiscovery() {
    const [targetAnimal, setTargetAnimal] = useState(ANIMALS[0]);
    const [options, setOptions] = useState<typeof ANIMALS>([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'idle' | 'playing' | 'correct' | 'wrong' | 'won'>('idle');
    const [aiHint, setAiHint] = useState('');
    const [aiFact, setAiFact] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedWrong, setSelectedWrong] = useState('');
    const [showSound, setShowSound] = useState(false);
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const startRound = async () => {
        setLoading(true);
        setStatus('playing');
        setSelectedWrong('');
        setShowSound(false);
        const randomTarget = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        setTargetAnimal(randomTarget);

        const shuffled = [...ANIMALS].sort(() => 0.5 - Math.random());
        const filtered = shuffled.filter(a => a.name !== randomTarget.name).slice(0, 2);
        setOptions([...filtered, randomTarget].sort(() => 0.5 - Math.random()));

        try {
            const systemInstruction = `You are a magical safari guide AI for kids aged 3-8.
            The target animal is ${randomTarget.name} (${randomTarget.emoji}).
            Generate a JSON response:
            {
              "hint": "A fun clue about this animal WITHOUT saying its name. Mention a physical trait or behavior. Use emojis. Max 15 words.",
              "fact": "An amazing, surprising fact about this animal that kids would love. Max 15 words.",
              "encouragement": "A short encouraging phrase for the kid."
            }
            Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-animal', { animal: randomTarget.name, round: score + 1 }, systemInstruction);
            setAiHint(response.hint || LOCAL_HINTS[randomTarget.name]?.hint || `Can you find the animal that says ${randomTarget.sound}?`);
            setAiFact(response.fact || LOCAL_HINTS[randomTarget.name]?.fact || `${randomTarget.name}s are amazing creatures!`);
        } catch (error) {
            const fb = LOCAL_HINTS[randomTarget.name];
            setAiHint(fb?.hint || `Can you find the animal that goes ${randomTarget.sound}?`);
            setAiFact(fb?.fact || `${randomTarget.name}s are amazing creatures!`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { startRound(); }, []);

    const handleChoice = (animal: typeof ANIMALS[0]) => {
        if (status !== 'playing') return;
        if (animal.name === targetAnimal.name) {
            setScore(s => s + 1);
            setStatus('correct');
            if (score + 1 >= 5) {
                setTimeout(() => setStatus('won'), 1500);
            } else {
                setTimeout(() => startRound(), 2000);
            }
        } else {
            setSelectedWrong(animal.name);
            setStatus('wrong');
            setShowSound(true);
            setTimeout(() => { setStatus('playing'); setSelectedWrong(''); }, 1500);
        }
    };

    if (status === 'won') {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {ANIMALS.slice(0, 8).map((a, i) => (
                        <motion.div key={a.name} initial={{ y: '120%', x: `${10 + i * 12}%` }}
                            animate={{ y: ['-10%', '120%'] }} transition={{ duration: 4, delay: i * 0.3, repeat: Infinity }}
                            className="absolute text-4xl">{a.emoji}</motion.div>
                    ))}
                </div>

                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 relative z-10"
                >
                    <Trophy className="w-14 h-14 text-white drop-shadow-lg" />
                </motion.div>
                <div className="relative z-10 space-y-3">
                    <h2 className="text-5xl font-black bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                        🏆 Safari Legend! 🏆
                    </h2>
                    <p className="text-slate-400 text-lg">You discovered all the animals! You're a true wildlife explorer!</p>
                </div>
                <ShareButtons gameTitle="Animal Discovery" result="discovered all the safari animals" score={score} penalty="Do your best animal impression!"
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
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} animate={{ scale: i < score ? 1 : 0.7 }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${i < score
                                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-800/80 border border-white/5'}`}
                            >
                                {i < score ? <PawPrint className="w-4 h-4 text-white" /> : <span className="text-slate-600 text-xs">•</span>}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <button onClick={startRound} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* AI Hint Card */}
            <AnimatePresence mode="wait">
                <motion.div key={targetAnimal.name + score}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="relative overflow-hidden rounded-[2.5rem]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10" />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-center gap-2">
                            <PawPrint className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">Safari Guide's Clue</span>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                                    <PawPrint className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <p className="text-slate-500 font-bold animate-pulse">Searching the safari...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-900/80 rounded-3xl p-6 border border-emerald-500/10">
                                    <p className="text-2xl sm:text-3xl font-black text-white leading-snug text-center">
                                        "{aiHint}"
                                    </p>
                                </div>

                                {/* Sound hint - shows after wrong answer */}
                                {showSound && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl"
                                    >
                                        <Volume2 className="w-5 h-5 text-amber-400" />
                                        <span className="text-amber-300 font-black text-lg">Hint: I say "{targetAnimal.sound}"</span>
                                    </motion.div>
                                )}

                                {/* Status */}
                                <AnimatePresence mode="wait">
                                    <motion.p key={status} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className={`text-center text-lg font-black ${status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-rose-400' : 'text-slate-500'}`}
                                    >
                                        {status === 'correct' ? '🐾 You found me! Amazing!' : status === 'wrong' ? '🤔 That\'s not me! Listen to my sound!' : 'Which animal am I? Tap below!'}
                                    </motion.p>
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Animal choices */}
            {!loading && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-4"
                >
                    {options.map((animal, i) => (
                        <motion.button key={animal.name}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                            whileHover={{ scale: 1.06, y: -6 }} whileTap={{ scale: 0.92 }}
                            onClick={() => handleChoice(animal)} disabled={status !== 'playing'}
                            className={`relative h-36 bg-slate-900 rounded-[2rem] border flex flex-col items-center justify-center gap-2 transition-all overflow-hidden group
                                ${status === 'correct' && animal.name === targetAnimal.name ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/50' : ''}
                                ${selectedWrong === animal.name ? 'border-rose-400 bg-rose-500/10 animate-shake' : 'border-white/5 hover:border-emerald-500/30'}`}
                        >
                            <span className="text-5xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">{animal.emoji}</span>
                            <span className="font-black text-xs uppercase tracking-widest text-slate-500 group-hover:text-emerald-400 transition-colors">{animal.name}</span>
                            <div className="absolute bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MapPin className="w-2.5 h-2.5 text-slate-600" />
                                <span className="text-[10px] text-slate-600">{animal.habitat}</span>
                            </div>
                            {status === 'correct' && animal.name === targetAnimal.name && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm">
                                    <span className="text-5xl">🎉</span>
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Fun fact */}
            {!loading && aiFact && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-white/5 rounded-2xl p-5 flex items-start gap-4"
                >
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">🧠 Did You Know?</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{aiFact}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
