import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Lock, Sparkles, BrainCircuit, ShieldCheck, Zap, Laugh, Cpu, AlertTriangle, Wrench, Search, ChevronDown, Rocket } from 'lucide-react';
import { GAMES } from '../lib/games';
import { TOOLS } from '../lib/tools';
import { useStore } from '../store/useStore';
import HeroCarousel from '../components/HeroCarousel';

export default function Home() {
  const { user, apiKeys } = useStore();
  const navigate = useNavigate();
  const [activeGameCategory, setActiveGameCategory] = useState<string>('All');
  const [activeToolCategory, setActiveToolCategory] = useState<string>('All');
  const [gameSearch, setGameSearch] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [viewMode, setViewMode] = useState<'games' | 'tools'>('games');

  const gameCategories = ['All', ...Array.from(new Set(GAMES.map((g) => g.category)))];
  const toolCategories = ['All', ...Array.from(new Set(TOOLS.map((t) => t.category)))];

  const hasAnyKey = !!(apiKeys.gemini || apiKeys.openai || apiKeys.anthropic || apiKeys.deepseek || apiKeys.groq);

  const CustomDropdown = ({
    value,
    onChange,
    options,
    activeColor
  }: {
    value: string,
    onChange: (val: string) => void,
    options: string[],
    activeColor: string
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="relative z-20 sm:max-w-xs w-full sm:w-48">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between focus:outline-none focus:border-${activeColor}-500 transition-colors text-sm text-white`}
        >
          <span className="truncate pr-2">{value}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto no-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === opt
                    ? `bg-${activeColor}-500/20 text-${activeColor}-400 font-medium`
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-8 sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md shadow-2xl"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Powered by</span>
                <div className="relative h-4 w-24 overflow-hidden">
                  <motion.div
                    animate={{
                      y: [0, -16, -32, -48, -64, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <span className="h-4 flex items-center text-white">Gemini</span>
                    <span className="h-4 flex items-center text-blue-400">GPT-4o</span>
                    <span className="h-4 flex items-center text-orange-400">Claude</span>
                    <span className="h-4 flex items-center text-emerald-400">DeepSeek</span>
                    <span className="h-4 flex items-center text-rose-400">Groq</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1] italic uppercase">
              The Nexus of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-sky-400">Play & Productivity</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl font-medium leading-relaxed italic">
              Compete against hyper-intelligent LLMs in 50+ games or accelerate your digital workflow with 50+ premium AI assistants. One platform, infinite intelligence.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {!hasAnyKey ? (
                <Link
                  to="/settings"
                  className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-2xl shadow-white/10"
                >
                  <Lock className="w-5 h-5" />
                  Connect API Key
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setViewMode('games');
                      document.getElementById('games-tools')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl shadow-indigo-600/30 group"
                  >
                    <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Browse Games
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('tools');
                      document.getElementById('games-tools')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xl shadow-emerald-600/30 group"
                  >
                    <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Browse Tools
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full" />
            <HeroCarousel />
          </div>
        </div>
      </section>



      {/* Split Library: Games & Tools */}
      <div id="games-tools" className="space-y-12 scroll-mt-20">

        {/* Toggle Switch optimized for Mobile/Tablet - Now Sticky - Hidden on Desktop */}
        <div className="xl:hidden sticky top-[4.5rem] z-30 py-2 bg-slate-950/50 backdrop-blur-xl -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex p-1.5 bg-slate-900 border border-white/10 rounded-[2rem] max-w-md mx-auto shadow-2xl overflow-hidden relative group">
            <motion.div
              animate={{ x: viewMode === 'games' ? 0 : '100%' }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`absolute inset-y-1.5 left-1.5 w-[48.5%] rounded-[1.5rem] shadow-2xl ${viewMode === 'games' ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-emerald-600 shadow-emerald-500/40'}`}
            />
            <button
              onClick={() => setViewMode('games')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${viewMode === 'games' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BrainCircuit className={`w-5 h-5 ${viewMode === 'games' ? 'text-white' : 'text-slate-600'}`} />
              Game Nexus
            </button>
            <button
              onClick={() => setViewMode('tools')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${viewMode === 'tools' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cpu className={`w-5 h-5 ${viewMode === 'tools' ? 'text-white' : 'text-slate-600'}`} />
              Tool Engine
            </button>
          </div>
        </div>

        {/* Dynamic Grid System */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

          {/* Games Column */}
          <section className={`space-y-8 ${viewMode !== 'games' ? 'hidden xl:block' : 'block'}`}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <Play className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Deterministic Games</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">{GAMES.length} Modules Online</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Find a challenge..."
                    value={gameSearch}
                    onChange={(e) => setGameSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all text-sm text-white font-medium"
                  />
                </div>
                <CustomDropdown
                  value={activeGameCategory}
                  onChange={setActiveGameCategory}
                  options={gameCategories}
                  activeColor="indigo"
                />
              </div>
            </div>

            <div className="space-y-12">
              {gameCategories.filter(c => c !== 'All' && (activeGameCategory === 'All' || c === activeGameCategory)).map(category => {
                const gamesInCategory = GAMES.filter(g => g.category === category && (g.title.toLowerCase().includes(gameSearch.toLowerCase()) || g.description.toLowerCase().includes(gameSearch.toLowerCase())));
                if (gamesInCategory.length === 0) return null;
                return (
                  <div key={category} className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] border-l-2 border-indigo-500 pl-4">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {gamesInCategory.map((game, index) => (
                        <motion.div key={game.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                          <Link
                            to={(game.isPlayable && user && (game.requiresAi === false || hasAnyKey)) ? `/games/${game.id}` : '#'}
                            onClick={(e) => {
                              const canPlay = game.isPlayable && user && (game.requiresAi === false || hasAnyKey);
                              if (!canPlay) {
                                e.preventDefault();
                                if (!user) navigate('/login');
                                else if (game.requiresAi !== false && !hasAnyKey) navigate('/settings');
                                else alert('This game is coming soon!');
                              }
                            }}
                            className={`group block p-6 rounded-3xl border transition-all h-full relative overflow-hidden ${game.isPlayable ? 'bg-slate-900/50 border-white/5 hover:bg-slate-900 hover:border-indigo-500/30' : 'bg-slate-950/50 border-white/[0.02] grayscale opacity-50 cursor-not-allowed'}`}
                          >
                            <h4 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors mb-2 italic uppercase">
                              {game.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                              {game.description}
                            </p>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/[0.01] rounded-full group-hover:scale-150 transition-transform" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tools Column */}
          <section className={`space-y-8 ${viewMode !== 'tools' ? 'hidden xl:block' : 'block'}`}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Rocket className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Cognitive Tools</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">{TOOLS.length} LLM Assistants</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Find an agent..."
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm text-white font-medium"
                  />
                </div>
                <CustomDropdown
                  value={activeToolCategory}
                  onChange={setActiveToolCategory}
                  options={toolCategories}
                  activeColor="emerald"
                />
              </div>
            </div>

            <div className="space-y-12">
              {toolCategories.filter(c => c !== 'All' && (activeToolCategory === 'All' || c === activeToolCategory)).map(category => {
                const toolsInCategory = TOOLS.filter(t => t.category === category && (t.title.toLowerCase().includes(toolSearch.toLowerCase()) || t.description.toLowerCase().includes(toolSearch.toLowerCase())));
                if (toolsInCategory.length === 0) return null;
                return (
                  <div key={category} className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] border-l-2 border-emerald-500 pl-4">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {toolsInCategory.map((tool, index) => (
                        <motion.div key={tool.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                          <Link
                            to={(tool.isAvailable && user && (tool.requiresAi === false || hasAnyKey)) ? `/tools/${tool.id}` : '#'}
                            onClick={(e) => {
                              const canUse = tool.isAvailable && user && (tool.requiresAi === false || hasAnyKey);
                              if (!canUse) {
                                e.preventDefault();
                                if (!user) navigate('/login');
                                else if (tool.requiresAi !== false && !hasAnyKey) navigate('/settings');
                                else alert('This tool is coming soon!');
                              }
                            }}
                            className={`group block p-6 rounded-3xl border transition-all h-full relative overflow-hidden ${tool.isAvailable ? 'bg-slate-900/50 border-white/5 hover:bg-slate-900 hover:border-emerald-500/30' : 'bg-slate-950/50 border-white/[0.02] grayscale opacity-50 cursor-not-allowed'}`}
                          >
                            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors mb-2 italic uppercase">
                              {tool.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                              {tool.description}
                            </p>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/[0.01] rounded-full group-hover:scale-150 transition-transform" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Ultra-Minimal BYOK Note */}
      <div className="pt-16 pb-6 text-center border-t border-white/5 opacity-50">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span>Shielded Topology</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800" />
          <span>Bring Your Own Key (BYOK) Enabled</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-800" />
          <Link to="/settings" className="text-indigo-500 hover:text-indigo-400 transition-colors">Interface Settings</Link>
        </p>
      </div>
    </div>
  );
}
