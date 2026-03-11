import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Wrench, Sparkles, BrainCircuit, ShieldCheck, Zap } from 'lucide-react';

const CAROUSEL_ITEMS = [
    {
        type: 'game',
        title: 'Wiring Connection',
        category: 'Puzzle',
        icon: <BrainCircuit className="w-8 h-8 text-indigo-400" />,
        colorClasses: {
            bg: 'bg-indigo-500/10',
            ring: 'ring-indigo-500/20',
            shadow: 'shadow-indigo-500/20',
            text: 'text-indigo-400',
            fill: 'bg-indigo-500'
        },
        description: 'Correctly wire the power grid before the system overloads.'
    },
    {
        type: 'tool',
        title: 'SEO Blog Writer',
        category: 'Writing',
        icon: <Wrench className="w-8 h-8 text-emerald-400" />,
        colorClasses: {
            bg: 'bg-emerald-500/10',
            ring: 'ring-emerald-500/20',
            shadow: 'shadow-emerald-500/20',
            text: 'text-emerald-400',
            fill: 'bg-emerald-500'
        },
        description: 'Generate SEO-optimized blog posts formatted in perfect Markdown.'
    },
    {
        type: 'game',
        title: 'Cyber Defense',
        category: 'Strategy',
        icon: <ShieldCheck className="w-8 h-8 text-rose-400" />,
        colorClasses: {
            bg: 'bg-rose-500/10',
            ring: 'ring-rose-500/20',
            shadow: 'shadow-rose-500/20',
            text: 'text-rose-400',
            fill: 'bg-rose-500'
        },
        description: 'Defend your server from a relentless cyber attack.'
    },
    {
        type: 'tool',
        title: 'API Mock Generator',
        category: 'Developer',
        icon: <Zap className="w-8 h-8 text-amber-400" />,
        colorClasses: {
            bg: 'bg-amber-500/10',
            ring: 'ring-amber-500/20',
            shadow: 'shadow-amber-500/20',
            text: 'text-amber-400',
            fill: 'bg-amber-500'
        },
        description: 'Automatically generate mock API responses and OpenAPI specs.'
    }
];

export default function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
        }, 4000); // Rotate every 4 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full aspect-square max-w-md mx-auto">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative h-full w-full flex items-center justify-center pt-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="w-full max-w-sm"
                    >
                        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                            {/* Card Header */}
                            <div className="bg-slate-800/50 p-4 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-3 w-3 rounded-full bg-rose-500" />
                                    <span className="flex h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-300">
                                    {CAROUSEL_ITEMS[currentIndex].type === 'game' ? (
                                        <><Play className="w-3 h-3 text-indigo-400" /> Game Preview</>
                                    ) : (
                                        <><Sparkles className="w-3 h-3 text-emerald-400" /> Tool Preview</>
                                    )}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-8 flex flex-col items-center text-center gap-4">
                                <div className={`w-20 h-20 rounded-2xl ${CAROUSEL_ITEMS[currentIndex].colorClasses.bg} flex items-center justify-center ring-1 ${CAROUSEL_ITEMS[currentIndex].colorClasses.ring} shadow-[0_0_30px_rgba(0,0,0,0.3)] ${CAROUSEL_ITEMS[currentIndex].colorClasses.shadow}`}>
                                    {CAROUSEL_ITEMS[currentIndex].icon}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${CAROUSEL_ITEMS[currentIndex].colorClasses.text} mb-1 uppercase tracking-wide`}>
                                        {CAROUSEL_ITEMS[currentIndex].category}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {CAROUSEL_ITEMS[currentIndex].title}
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {CAROUSEL_ITEMS[currentIndex].description}
                                    </p>
                                </div>
                            </div>

                            {/* Fake UI Element depending on type */}
                            <div className="px-6 pb-6 mt-auto">
                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 4, ease: "linear" }}
                                        className={`h-full ${CAROUSEL_ITEMS[currentIndex].colorClasses.fill}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Indicators */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                    {CAROUSEL_ITEMS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
