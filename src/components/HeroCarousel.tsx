import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles,Zap, Layout, ShieldCheck, Cpu } from 'lucide-react';

const CAROUSEL_ITEMS = [
    {
        type: 'extension',
        title: 'Smart Assistant',
        category: 'Productivity',
        image: '/extension-insights.png',
        icon: <Zap className="w-6 h-6 text-indigo-400" />,
        colorClasses: {
            bg: 'bg-indigo-500/10',
            ring: 'ring-indigo-500/40',
            fill: 'bg-indigo-500'
        },
        description: 'Instant page summaries and 1-click insights for any website.'
    },
    {
        type: 'extension',
        title: 'Floating Access',
        category: 'Seamless UI',
        image: '/extension-fab.png',
        icon: <Layout className="w-6 h-6 text-emerald-400" />,
        colorClasses: {
            bg: 'bg-emerald-500/10',
            ring: 'ring-emerald-500/40',
            fill: 'bg-emerald-500'
        },
        description: 'A minimal, non-intrusive floating button that stays with you.'
    },
    {
        type: 'security',
        title: 'BYOK Security',
        category: 'Privacy First',
        icon: <ShieldCheck className="w-12 h-12 text-sky-400" />,
        colorClasses: {
            bg: 'bg-sky-500/10',
            ring: 'ring-sky-500/40',
            fill: 'bg-sky-500'
        },
        description: 'Your API keys stay local. We never store or see your credentials.'
    }
];

export default function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
        }, 5000); 
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full aspect-square max-w-lg mx-auto">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 rounded-full blur-[100px] animate-pulse" />

            <div className="relative h-full w-full flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -30 }}
                        transition={{ duration: 0.8, cubicBezier: [0.19, 1, 0.22, 1] }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] group">
                            
                            {/* Browser Header Decoration */}
                            <div className="bg-white/[0.03] px-6 py-4 border-b border-white/5 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                    <Sparkles className="w-3 h-3" /> Live Demo
                                </div>
                            </div>

                            {/* Media/Content Area */}
                            <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                                {CAROUSEL_ITEMS[currentIndex].image ? (
                                    <motion.img 
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 1.2 }}
                                        src={CAROUSEL_ITEMS[currentIndex].image} 
                                        alt={CAROUSEL_ITEMS[currentIndex].title}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-12 bg-gradient-to-b from-slate-900 to-slate-950">
                                        <div className={`p-6 rounded-[2rem] ${CAROUSEL_ITEMS[currentIndex].colorClasses.bg} border border-white/10`}>
                                            {CAROUSEL_ITEMS[currentIndex].icon}
                                        </div>
                                        <div className="w-full h-px bg-white/5" />
                                        <div className="flex gap-4">
                                            <div className="w-12 h-2 rounded-full bg-white/5" />
                                            <div className="w-20 h-2 rounded-full bg-indigo-500/20" />
                                        </div>
                                    </div>
                                )}
                                
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                            </div>

                            {/* Info Area */}
                            <div className="p-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                        {CAROUSEL_ITEMS[currentIndex].category}
                                    </span>
                                    <div className={`w-8 h-8 rounded-lg ${CAROUSEL_ITEMS[currentIndex].colorClasses.bg} flex items-center justify-center border border-white/5`}>
                                        <Cpu className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                        {CAROUSEL_ITEMS[currentIndex].title}
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                                        {CAROUSEL_ITEMS[currentIndex].description}
                                    </p>
                                </div>
                            </div>

                            {/* Interactive Progress Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                                <motion.div
                                    key={currentIndex + '-line'}
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className={`h-full ${CAROUSEL_ITEMS[currentIndex].colorClasses.fill}`}
                                />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Dots */}
                <div className="absolute -bottom-12 flex gap-4">
                    {CAROUSEL_ITEMS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-700 ${idx === currentIndex ? 'w-10 bg-indigo-500' : 'w-2 bg-white/10'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
