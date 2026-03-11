import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogOut, Settings, User as UserIcon, History, Gamepad2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchApi, removeAuthToken, getAuthToken } from '../lib/api';
import { motion } from 'motion/react';

export default function Layout() {
  const { user, setUser, setApiKeys, setSelectedLlm, setProviderModel, setOllamaSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchApi('/auth/me')
        .then((data) => {
          setUser(data.user);
          return fetchApi('/profiles/me');
        })
        .then((data) => {
          if (data) {
            setApiKeys({
              gemini: data.gemini_key || '',
              openai: data.openai_key || '',
              anthropic: data.anthropic_key || '',
              deepseek: data.deepseek_key || '',
              groq: data.groq_key || '',
            });
            if (data.selected_llm) {
              setSelectedLlm(data.selected_llm);
            }
            if (data.provider_models) {
              Object.entries(data.provider_models).forEach(([provider, model]) => {
                setProviderModel(provider as any, model as string);
              });
            }
            if (data.ollama_url || data.ollama_model) {
              setOllamaSettings({
                url: data.ollama_url || 'http://localhost:11434',
                model: data.ollama_model || 'llama3'
              });
            }
          }
        })
        .catch((err) => {
          console.error('Auth error:', err);
          removeAuthToken();
          setUser(null);
        });
    }
  }, [setUser, setApiKeys, setSelectedLlm, setProviderModel, setOllamaSettings]);

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-indigo-500/20 rounded-xl group-hover:bg-indigo-500/30 transition-colors">
                <Brain className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Play-AI.in
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/history"
                    className={`p-2 rounded-lg transition-colors ${location.pathname === '/history' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    title="History"
                  >
                    <History className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/settings"
                    className={`p-2 rounded-lg transition-colors ${location.pathname === '/settings' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400 font-medium">© 2026 Play-AI.in. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/sitemap" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
              Sitemap / SEO Directory
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
