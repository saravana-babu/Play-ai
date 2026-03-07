import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Wand2, Compass, RefreshCw, Star, ChevronRight, Cpu } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const LOCAL_SCENES = [
    { text: "You find yourself at the edge of a magical forest. The trees whisper secrets and fireflies dance around you.", choices: ["Enter the forest", "Follow the river"], scene_title: "The Enchanted Threshold" },
    { text: "A friendly dragon lands beside you! Its scales shimmer like jewels and it offers you a ride.", choices: ["Ride the dragon", "Ask for a quest"], scene_title: "The Jewel Dragon" },
    { text: "You discover a hidden treehouse filled with glowing books. Each one contains a different adventure!", choices: ["Read the golden book", "Climb higher up"], scene_title: "The Library in the Sky" },
    { text: "A mischievous fairy sprinkles stardust on you! You start floating gently above the meadow!", choices: ["Fly to the castle", "Land in the garden"], scene_title: "Stardust Wings" },
    { text: "You find a treasure chest under a rainbow. Inside is a magical friendship bracelet that grants one wish!", choices: ["Wish for adventure", "Share with a friend"], scene_title: "Rainbow's Gift" },
];

export default function KidsStoryAdventure() {
    const [scene, setScene] = useState<{ text: string; choices: string[]; scene_title: string } | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState<'idle' | 'playing' | 'won'>('idle');
    const [loading, setLoading] = useState(true);
    const { apiKeys, selectedLlm, gameSessionTokens } = useStore();

    const fetchScene = async (choice?: string) => {
        setLoading(true);
        setStatus('playing');
        const currentStep = step + 1;
        setStep(currentStep);
        const newHistory = choice ? [...history, choice] : history;
        if (choice) setHistory(newHistory);

        try {
            const isEnding = currentStep >= 5;
            const systemInstruction = `You are a magical storyteller for kids aged 4-10.
            Create the next scene of an interactive fantasy story.
            Previous choices: ${newHistory.join(' → ') || 'This is the beginning!'}.
            ${isEnding ? 'This is the FINAL scene — give a happy, magical ending!' : `This is scene ${currentStep} of 5.`}
            Return JSON:
            {
              "text": "The story scene text. Vivid and magical. Max 50 words. Use descriptive language kids would love.",
              "choices": ${isEnding ? '[]' : '["Choice A (max 4 words)", "Choice B (max 4 words)"]'},
              "scene_title": "A dramatic title for this scene"
            }
            Only return JSON.`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'kids-story', { history: newHistory, step: currentStep }, systemInstruction);
            if (response.text && response.scene_title) {
                setScene(response);
                if (isEnding) setStatus('won');
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            const local = LOCAL_SCENES[Math.min(currentStep - 1, LOCAL_SCENES.length - 1)];
            setScene(local);
            if (currentStep >= 5) setStatus('won');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScene(); }, []);

    const restart = () => {
        setStep(0);
        setHistory([]);
        setStatus('idle');
        fetchScene();
    };

    if (status === 'won' && !loading && scene) {
        return (
            <div className="text-center space-y-8 py-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {['📖', '✨', '🌟', '🧚', '🦄', '🌈', '🏰', '🐉'].map((e, i) => (
                        <motion.div key={i} initial={{ y: '120%', x: `${5 + i * 12}%` }}
                            animate={{ y: '-10%' }} transition={{ duration: 4, delay: i * 0.3, repeat: Infinity }}
                            className="absolute text-3xl">{e}</motion.div>
                    ))}
                </div>

                <motion.div initial={{ scale: 0, rotate: -720 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.2, type: 'spring' }}
                    className="w-28 h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative z-10"
                >
                    <BookOpen className="w-14 h-14 text-white" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10 space-y-6 max-w-lg mx-auto px-4">
                    <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        ✨ The End ✨
                    </h2>
                    <div className="bg-slate-900/80 rounded-3xl p-8 border border-white/5">
                        <p className="text-xl text-slate-200 font-medium leading-relaxed italic">"{scene.text}"</p>
                    </div>

                    {/* Journey recap */}
                    <div className="bg-slate-950 border border-white/5 rounded-2xl p-6">
                        <p className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-4">Your Journey</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {history.map((choice, i) => (
                                <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                                    className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-xs font-bold">
                                    {choice}
                                </motion.span>
                            ))}
                        </div>
                        <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{step}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Pages</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{history.length}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Choices</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <ShareButtons gameTitle="Story Adventure" result="co-created a magical adventure" score={step} penalty="Draw a picture of this story!"
                    onPlayAgain={restart} />
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
                            <motion.div key={i} animate={{ scale: i < step ? 1 : 0.7 }}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${i < step
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800/80 border border-white/5'}`}
                            >
                                {i < step ? <Star className="w-4 h-4 text-white" /> : <span className="text-slate-600 text-xs">{i + 1}</span>}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <button onClick={restart} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Scene card */}
            <AnimatePresence mode="wait">
                <motion.div key={step}
                    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                    className="relative rounded-[2.5rem] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-pink-500/15" />
                    <div className="relative m-[1px] bg-slate-950 rounded-[2.5rem] overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                            <Wand2 className="w-48 h-48 text-indigo-400 -rotate-12" />
                        </div>

                        {loading ? (
                            <div className="py-24 flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                    <Wand2 className="w-10 h-10 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-white font-black text-xl animate-pulse">Casting magic spells...</p>
                                    <p className="text-slate-500 text-xs italic uppercase tracking-widest">The story unfolds...</p>
                                </div>
                            </div>
                        ) : scene && (
                            <div className="p-8 sm:p-10 space-y-8 relative z-10">
                                {/* Scene title */}
                                <div className="flex items-center justify-center gap-3">
                                    <Star className="w-4 h-4 text-indigo-400" />
                                    <h3 className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em]">{scene.scene_title}</h3>
                                    <Star className="w-4 h-4 text-indigo-400" />
                                </div>

                                {/* Story text */}
                                <div className="bg-slate-900/50 rounded-3xl p-6 sm:p-8 border border-white/5">
                                    <p className="text-xl sm:text-2xl font-medium text-slate-100 leading-relaxed text-center italic">
                                        "{scene.text}"
                                    </p>
                                </div>

                                {/* Choice buttons */}
                                {scene.choices.length > 0 && (
                                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                                        {scene.choices.map((choice, i) => (
                                            <motion.button key={choice}
                                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                                                whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
                                                onClick={() => fetchScene(choice)}
                                                className={`group flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all border-b-4 active:border-b-0 active:translate-y-1
                                                    ${i === 0
                                                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 border-indigo-700 hover:from-indigo-400 hover:to-blue-500 text-white'
                                                        : 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-700 hover:from-purple-400 hover:to-pink-500 text-white'}`}
                                            >
                                                <span>{choice}</span>
                                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Journey so far */}
            {history.length > 0 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 flex items-start gap-4"
                >
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-2">Your Path</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {history.map((choice, i) => (
                                <span key={i} className="px-2 py-1 bg-white/5 rounded-lg text-slate-400 text-[11px] font-bold">
                                    {choice} {i < history.length - 1 ? '→' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
