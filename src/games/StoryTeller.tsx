import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Wand2, Loader2, Quote, RefreshCw, Languages, Info } from 'lucide-react';

interface StoryData {
    title: string;
    kural_tamil: string;
    kural_english: string;
    kural_meaning: string;
    story: string;
    conclusion: string;
}

const GENRES = ['Fable', 'Folklore', 'Modern Drama', 'Science Fiction', 'Mythological', 'Thriller'];
const TONES = ['Humorous', 'Serious', 'Inspiring', 'Melancholic', 'Mysterious'];
const THEMES = [
    'Virtuous Life (Aram)',
    'Wealth and Prosperity (Porul)',
    'Love and Desire (Inbam)',
    'Gratitude (Seinandri Arithal)',
    'Truthfulness (Voimai)',
    'Forgiveness (Poraiyudaimai)',
    'Non-Violence (Inna Seiyamai)',
    'Character/Conduct (Ozhukkamudaimai)',
    'Educational/Knowledge (Kalvi)',
    'Friendship (Natpu)'
];

export default function StoryTeller() {
    const [genre, setGenre] = useState(GENRES[0]);
    const [tone, setTone] = useState(TONES[0]);
    const [theme, setTheme] = useState(THEMES[0]);
    const [storyData, setStoryData] = useState<StoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { apiKeys, selectedLlm, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const generateStory = async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        resetSessionTokens();

        const systemInstruction = `You are a master story teller and an expert in Thirukural (the classical Tamil text).
Your task is to create a compelling, high-quality story based on a specific moral from Thirukural.
The user will provide a Genre, Tone, and a Moral Theme.

You MUST:
1. Choose a relevant Thirukural (couplet) that matches the Moral Theme.
2. Provide the Thirukural in Tamil script.
3. Provide the English translation and meaning of the Thirukural.
4. Write a short story (at least 100 words) in the specified Genre and Tone that illustrates this moral clearly. Also not more than 300 words.
5. Provide a title for the story.

Respond with ONLY a JSON object:
{
  "title": "Story Title",
  "kural_tamil": "தமிழ் திருக்குறள்",
  "kural_english": "English translation of Kural",
  "kural_meaning": "Detailed meaning of the kural",
  "story": "The full story text...",
  "conclusion": "How the story relates to the kural"
}`;

        const prompt = `Genre: ${genre}
Tone: ${tone}
Moral Theme: ${theme}`;

        try {
            const response = await getLlmResponse(
                prompt,
                apiKeys,
                selectedLlm,
                systemInstruction,
                'storyteller'
            );

            if (!isMounted.current) return;

            const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
            if (data.title && data.story) {
                setStoryData(data);
            } else {
                throw new Error('Invalid AI response');
            }
        } catch (error) {
            console.error('Story generation error:', error);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };

    const reset = () => {
        setStoryData(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {!storyData ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                >
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
                            <BookOpen className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight font-display">AI Story Teller</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Choose your parameters and let our AI create a grand tale based on the timeless wisdom of Thirukural.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-800/50 p-6 sm:p-8 rounded-[32px] border border-white/5 shadow-2xl">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Genre</label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none shadow-inner"
                            >
                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tone</label>
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none shadow-inner"
                            >
                                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Thirukural Theme</label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none shadow-inner"
                            >
                                {THEMES.map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={generateStory}
                            disabled={isLoading}
                            className="sm:col-span-2 group relative w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Weaving the tale...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        <span>Generate Story</span>
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={reset}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                        >
                            <RefreshCw className="w-4 h-4" /> Start Over
                        </button>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-indigo-500/20">{genre}</span>
                            <span className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-violet-500/20">{tone}</span>
                        </div>
                    </div>

                    {/* Story Card */}
                    <div className="bg-slate-900 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <div className="p-8 sm:p-12 space-y-12">
                            <div className="space-y-4 text-center">
                                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight bg-gradient-to-br from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent font-display">
                                    {storyData.title}
                                </h1>
                                <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto rounded-full opacity-50" />
                            </div>

                            {/* Thirukural Highlight */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition-opacity" />
                                <div className="relative bg-slate-950/50 rounded-3xl p-8 border border-white/10 backdrop-blur-sm space-y-6">
                                    <div className="flex items-start gap-4">
                                        <Quote className="w-8 h-8 text-indigo-500/40 shrink-0 rotate-180" />
                                        <div className="space-y-6 flex-1">
                                            <p className="text-2xl sm:text-3xl font-tamil font-bold text-indigo-100/95 leading-relaxed text-center">
                                                {storyData.kural_tamil}
                                            </p>
                                            <div className="space-y-3 pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest font-display">
                                                    <Languages className="w-3.5 h-3.5" /> Translation
                                                </div>
                                                <p className="text-slate-200 font-medium text-lg leading-relaxed">
                                                    {storyData.kural_english}
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest font-display">
                                                    <Info className="w-3.5 h-3.5" /> Meaning
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                                    <p className="text-slate-300 text-base leading-relaxed">
                                                        {storyData.kural_meaning}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Story Content */}
                            <div className="prose prose-invert max-w-none">
                                <div className="text-lg text-slate-300 leading-relaxed space-y-6 whitespace-pre-wrap font-serif">
                                    {storyData.story}
                                </div>
                            </div>

                            {/* Conclusion */}
                            <div className="pt-8 border-t border-white/5">
                                <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                    <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest mb-3">
                                        <Wand2 className="w-4 h-4" /> The Moral
                                    </div>
                                    <p className="text-indigo-200/80 italic font-medium">
                                        {storyData.conclusion}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pb-8">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-slate-500 hover:text-white text-sm font-bold transition-colors uppercase tracking-widest"
                        >
                            Back to top
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
                    >
                        <div className="text-center space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <BookOpen className="w-10 h-10 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Weaving your tale...</h3>
                                <p className="text-slate-400 animate-pulse">Consulting the wisdom of the ancients</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
