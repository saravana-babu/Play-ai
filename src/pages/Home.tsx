import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, Lock, Sparkles, BrainCircuit, ShieldCheck, Zap, Laugh, Cpu, AlertTriangle } from 'lucide-react';
import { GAMES } from '../lib/games';
import { useStore } from '../store/useStore';
import DemoGame from '../components/DemoGame';

export default function Home() {
  const { user, apiKeys } = useStore();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(GAMES.map((g) => g.category)))];

  const filteredGames =
    activeCategory === 'All'
      ? GAMES
      : GAMES.filter((g) => g.category === activeCategory);

  const hasAnyKey = !!(apiKeys.gemini || apiKeys.openai || apiKeys.anthropic);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-8 sm:p-12 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Multiple LLMs</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Challenge the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Play-AI.in</span> Mind
            </h1>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Play 50+ brain-teasing games against advanced AI. Win to prove your intellect, lose and face a hilarious penalty task.
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
            <DemoGame />
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
            Switch between Gemini, OpenAI, and Anthropic on the fly to experience different AI personalities and challenges.
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
            This website utilizes your personal API keys (Gemini, OpenAI, or Anthropic) to power AI features. 
            <span className="text-amber-400/80 font-medium"> You are solely responsible for any costs incurred through your API usage.</span> 
            Please monitor your usage limits and billing settings on your respective provider's dashboard.
          </p>
        </div>
      </section>

      {/* Games Grid */}
      <section id="games" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Game Library</h2>
          
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 gap-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={game.isPlayable && user && hasAnyKey ? `/games/${game.id}` : '#'}
                onClick={(e) => {
                  if (!game.isPlayable || !user || !hasAnyKey) {
                    e.preventDefault();
                    if (!user) navigate('/login');
                    else if (!hasAnyKey) navigate('/settings');
                    else alert('This game is coming soon!');
                  }
                }}
                className={`block relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
                  game.isPlayable
                    ? 'bg-slate-900 border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 group cursor-pointer'
                    : 'bg-slate-900/50 border-white/5 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {game.category}
                  </span>
                  {!game.isPlayable && (
                    <span className="text-xs font-medium text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded-md">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${game.isPlayable ? 'text-white group-hover:text-indigo-400 transition-colors' : 'text-slate-300'}`}>
                  {game.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {game.description}
                </p>
                
                {game.isPlayable && (
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                      <Play className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

