import React, { useState, useEffect } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { fetchApi } from '../lib/api';
import { Key, Save, AlertCircle, CheckCircle2, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { user, apiKeys, selectedLlm, providerQuotas, setApiKeys, setSelectedLlm } = useStore();
  const [inputKeys, setInputKeys] = useState({
    gemini: apiKeys.gemini || '',
    openai: apiKeys.openai || '',
    anthropic: apiKeys.anthropic || '',
  });
  const [inputLlm, setInputLlm] = useState<LlmProvider>(selectedLlm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setInputKeys({
      gemini: apiKeys.gemini || '',
      openai: apiKeys.openai || '',
      anthropic: apiKeys.anthropic || '',
    });
    setInputLlm(selectedLlm);
  }, [apiKeys, selectedLlm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...inputKeys,
        selectedLlm: inputLlm
      };

      if (user) {
        await fetchApi('/profiles/me', {
          method: 'POST',
          body: JSON.stringify({
            gemini_key: inputKeys.gemini,
            openai_key: inputKeys.openai,
            anthropic_key: inputKeys.anthropic,
            selected_llm: inputLlm
          })
        });
      }

      setApiKeys(inputKeys);
      setSelectedLlm(inputLlm);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your account and AI configuration.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Providers</h2>
            <p className="text-sm text-slate-400">Configure multiple LLMs and choose your preferred opponent.</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default AI Opponent
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['gemini', 'openai', 'anthropic'] as LlmProvider[]).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setInputLlm(provider)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                    inputLlm === provider
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span className="capitalize">{provider}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Note: Changing the LLM during an active game will discard your current progress.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-slate-300">Provider Quotas (Session)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(providerQuotas).map(([provider, tokens]) => (
                <div key={provider} className="bg-slate-950 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{provider}</p>
                  <p className="text-xl font-black text-white">{tokens.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Tokens Used</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={inputKeys.gemini}
                onChange={(e) => setInputKeys({ ...inputKeys, gemini: e.target.value })}
                placeholder="AIzaSy..."
                className="block w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={inputKeys.openai}
                onChange={(e) => setInputKeys({ ...inputKeys, openai: e.target.value })}
                placeholder="sk-..."
                className="block w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={inputKeys.anthropic}
                onChange={(e) => setInputKeys({ ...inputKeys, anthropic: e.target.value })}
                placeholder="sk-ant-..."
                className="block w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (!inputKeys.gemini && !inputKeys.openai && !inputKeys.anthropic)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </motion.div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-lg font-semibold text-white mb-2">How to get API Keys?</h3>
        <ul className="space-y-3 text-sm text-slate-400">
          <li><strong>Gemini:</strong> Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a></li>
          <li><strong>OpenAI:</strong> Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">OpenAI Platform</a></li>
          <li><strong>Anthropic:</strong> Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Anthropic Console</a></li>
        </ul>
      </div>
    </div>
  );
}
