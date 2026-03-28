import React from 'react';
import { Link } from 'react-router-dom';
import { GAMES } from '../lib/games';
import { TOOLS } from '../lib/tools';
import { Map, Gamepad2, Wrench, Home, User, Settings, Shield, ChevronRight, Sparkles, Zap, Brain, Globe, Bot, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export default function Sitemap() {
    const categories = Array.from(new Set([...GAMES.map(g => g.category), ...TOOLS.map(t => t.category)]));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="space-y-20 max-w-7xl mx-auto py-12 px-6">
            {/* Hero Section */}
            <div className="relative text-center space-y-6 py-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-[0.2em]"
                >
                    <Map className="w-4 h-4" /> Comprehensive Index
                </motion.div>

                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">
                    Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Map</span>
                </h1>

                <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg italic">
                    Navigating the intersection of artificial intelligence and interactive digital logic. Every node is an opportunity for discovery.
                </p>
            </div>

            {/* Core Infrastructure */}
            <section className="space-y-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <Globe className="w-8 h-8 text-sky-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Core Infrastructure</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Base Platform Access Points</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { to: '/', icon: Home, label: 'Neural Nexus', desc: 'Main entry point and discovery home.', color: 'text-indigo-400' },
                        { to: 'https://github.com/saravana-babu/Play-ai/tree/main/chrome-extension', icon: Sparkles, label: 'Web Assistant', desc: 'Flagship Chrome Extension for AI browsing.', color: 'text-sky-400' },
                        { to: '/docs', icon: Monitor, label: 'Blueprint', desc: 'Installation guide and technical docs.', color: 'text-emerald-400' },
                        { to: '/settings', icon: Settings, label: 'System Params', desc: 'Configure global API vectors and UI.', color: 'text-amber-400' },
                    ].map((link, i) => (
                        <motion.div key={i} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 400 }}>
                            <Link to={link.to} className="p-8 rounded-[2rem] bg-slate-900 border border-white/5 hover:border-white/20 transition-all group block h-full shadow-lg relative overflow-hidden">
                                <link.icon className={`w-10 h-10 ${link.color} mb-6 transition-transform group-hover:scale-110`} />
                                <h3 className="font-black text-white text-xl mb-2">{link.label}</h3>
                                <p className="text-sm text-slate-500 font-medium italic">{link.desc}</p>
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/[0.02] rounded-full" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Advanced AI Tools */}
            <section className="space-y-12">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <Bot className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Cognitive Toolset</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{TOOLS.length} LLM-Integrated Solutions</p>
                        </div>
                    </div>
                    <div className="hidden sm:block text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Directory 4.0 // 2026</div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {TOOLS.map((tool) => (
                        <motion.div key={tool.id} variants={itemVariants}>
                            <Link to={`/tool/${tool.id}`} className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-emerald-500/30 transition-all group block h-full">
                                <span className="text-[10px] font-black text-emerald-500/70 tracking-widest uppercase italic">{tool.category}</span>
                                <h3 className="font-black text-white mt-2 group-hover:text-emerald-400 transition-colors flex items-center justify-between gap-2">
                                    {tool.title}
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                </h3>
                                <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed italic line-clamp-2">{tool.description}</p>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Logic & Strategy Games */}
            <section className="space-y-12 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <Gamepad2 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Game Theory Simulations</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{GAMES.length} Deterministic Challenges</p>
                        </div>
                    </div>
                    <div className="hidden sm:block text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Playable Modules</div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {GAMES.map((game) => (
                        <motion.div key={game.id} variants={itemVariants}>
                            <Link to={`/game/${game.id}`} className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-indigo-500/30 transition-all group block h-full">
                                <span className="text-[10px] font-black text-indigo-400/70 tracking-widest uppercase italic">{game.category}</span>
                                <h3 className="font-black text-white mt-2 group-hover:text-indigo-400 transition-colors flex items-center justify-between gap-2">
                                    {game.title}
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                                </h3>
                                <p className="text-xs text-slate-500 mt-3 font-medium leading-relaxed italic line-clamp-2">{game.description}</p>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div>
    );
}
