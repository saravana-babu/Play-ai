import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Lock, Sparkles, BrainCircuit, ShieldCheck, Zap, Laugh, Cpu, AlertTriangle, Wrench, Search, ChevronDown } from 'lucide-react';
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
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-8 sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <div className="relative h-5 w-20 overflow-hidden font-bold">
                  <motion.div
                    animate={{
                      y: [0, -20, -40, -60, -80, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <span className="h-5 flex items-center">Gemini</span>
                    <span className="h-5 flex items-center text-blue-400">GPT-4o</span>
                    <span className="h-5 flex items-center text-orange-400">Claude</span>
                    <span className="h-5 flex items-center text-emerald-400">DeepSeek</span>
                    <span className="h-5 flex items-center text-rose-400">Groq</span>
                  </motion.div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">Play-AI.in</span> Universe
            </h1>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Play 50+ brain-teasing games against advanced AI, and supercharge your workflow with our extensive library of 50+ AI-powered tools. Win to prove your intellect, lose and face a hilarious penalty task.
            </p>

            {!hasAnyKey ? (
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/settings"
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  <Lock className="w-5 h-5" />
                  Setup API Key to Play
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="#games"
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  <BrainCircuit className="w-5 h-5" />
                  Browse Games
                </a>
              </div>
            )}
          </div>

          <div className="relative hidden lg:block">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 space-y-4 hover:border-indigo-500/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">AI-Powered</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Games are enhanced by state-of-the-art LLMs, providing a unique and challenging experience every time.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 space-y-4 hover:border-violet-500/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Dynamic Content</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            From logic puzzles to memory tests, our 50+ games are designed to push your cognitive limits.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 space-y-4 hover:border-emerald-500/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Laugh className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Funny Penalties</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Lose a game? Our AI will generate a funny, harmless task for you to complete as a penalty!
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 space-y-4 hover:border-amber-500/30 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Multi-Model Support</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Switch between Gemini, OpenAI, Anthropic, DeepSeek, and Groq on the fly to experience different AI personalities.
          </p>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-bold text-white">Important Disclaimer</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            This website utilizes your personal API keys (Gemini, OpenAI, Anthropic, DeepSeek, or Groq) to power AI features.
            <span className="text-amber-400/80 font-medium"> You are solely responsible for any costs incurred through your API usage.</span>
            Please monitor your usage limits and billing settings on your respective provider's dashboard.
          </p>
        </div>
      </section>

      {/* Split Library: Games & Tools */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Left Column: Games Grid */}
        <section id="games" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Play className="w-6 h-6 text-indigo-400" />
              Games
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-white"
              />
            </div>
            <CustomDropdown
              value={activeGameCategory}
              onChange={setActiveGameCategory}
              options={gameCategories}
              activeColor="indigo"
            />
          </div>

          <div className="space-y-8">
            {gameCategories.filter(c => c !== 'All' && (activeGameCategory === 'All' || c === activeGameCategory)).map(category => {
              const gamesInCategory = GAMES.filter(g => g.category === category && (g.title.toLowerCase().includes(gameSearch.toLowerCase()) || g.description.toLowerCase().includes(gameSearch.toLowerCase())));

              if (gamesInCategory.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 border-b border-white/5 pb-2 flex items-center justify-between">
                    {category}
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{gamesInCategory.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gamesInCategory.map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
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
                          className={`block relative overflow-hidden rounded-xl border p-4 transition-all duration-300 h-full ${game.isPlayable
                            ? 'bg-slate-900 border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 group cursor-pointer'
                            : 'bg-slate-900/50 border-white/5 opacity-75 cursor-not-allowed'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                              {game.category}
                            </span>
                            {!game.isPlayable && (
                              <span className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md">
                                Soon
                              </span>
                            )}
                          </div>
                          <h4 className={`text-lg font-bold mb-1 ${game.isPlayable ? 'text-white group-hover:text-indigo-400 transition-colors' : 'text-slate-300'}`}>
                            {game.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {game.description}
                          </p>

                          {game.isPlayable && (
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                                <Play className="w-3 h-3 ml-0.5" />
                              </div>
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {GAMES.filter(g => (activeGameCategory === 'All' || g.category === activeGameCategory) && (g.title.toLowerCase().includes(gameSearch.toLowerCase()) || g.description.toLowerCase().includes(gameSearch.toLowerCase()))).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No games found matching your search.
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Tools Grid */}
        <section id="tools" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="w-6 h-6 text-emerald-400" />
              AI Tools
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-sm text-white"
              />
            </div>
            <CustomDropdown
              value={activeToolCategory}
              onChange={setActiveToolCategory}
              options={toolCategories}
              activeColor="emerald"
            />
          </div>

          <div className="space-y-8">
            {toolCategories.filter(c => c !== 'All' && (activeToolCategory === 'All' || c === activeToolCategory)).map(category => {
              const toolsInCategory = TOOLS.filter(t => t.category === category && (t.title.toLowerCase().includes(toolSearch.toLowerCase()) || t.description.toLowerCase().includes(toolSearch.toLowerCase())));

              if (toolsInCategory.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-200 border-b border-white/5 pb-2 flex items-center justify-between">
                    {category}
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{toolsInCategory.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {toolsInCategory.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
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
                          className={`block relative overflow-hidden rounded-xl border p-4 transition-all duration-300 h-full ${tool.isAvailable
                            ? 'bg-slate-900 border-white/10 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 group cursor-pointer'
                            : 'bg-slate-900/50 border-white/5 opacity-75 cursor-not-allowed'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                              {tool.category}
                            </span>
                            {!tool.isAvailable && (
                              <span className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md">
                                Soon
                              </span>
                            )}
                          </div>
                          <h4 className={`text-lg font-bold mb-1 ${tool.isAvailable ? 'text-white group-hover:text-emerald-400 transition-colors' : 'text-slate-300'}`}>
                            {tool.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {tool.description}
                          </p>

                          {tool.isAvailable && (
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                                <Wrench className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {TOOLS.filter(t => (activeToolCategory === 'All' || t.category === activeToolCategory) && (t.title.toLowerCase().includes(toolSearch.toLowerCase()) || t.description.toLowerCase().includes(toolSearch.toLowerCase()))).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No tools found matching your search.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
