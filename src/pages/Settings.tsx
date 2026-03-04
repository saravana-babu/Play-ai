import React, { useState, useEffect } from 'react';
import { useStore, LlmProvider, OllamaSettings, ApiKeys } from '../store/useStore';
import { fetchApi } from '../lib/api';
import { Key, Save, AlertCircle, CheckCircle2, BrainCircuit, Globe, Server, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

const PROVIDER_MODELS: Record<string, string[]> = {
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
};

export default function Settings() {
  const {
    user,
    apiKeys,
    selectedLlm,
    providerModels,
    ollamaSettings,
    providerQuotas,
    setApiKeys,
    setSelectedLlm,
    setProviderModel,
    setOllamaSettings
  } = useStore();

  const [inputKeys, setInputKeys] = useState<ApiKeys>({ ...apiKeys });
  const [inputLlm, setInputLlm] = useState<LlmProvider>(selectedLlm);
  const [inputModels, setInputModels] = useState<Record<string, string>>({ ...providerModels });
  const [inputOllama, setInputOllama] = useState<OllamaSettings>({ ...ollamaSettings });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setInputKeys({ ...apiKeys });
    setInputLlm(selectedLlm);
    setInputModels({ ...providerModels });
    setInputOllama({ ...ollamaSettings });
  }, [apiKeys, selectedLlm, providerModels, ollamaSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (user) {
        await fetchApi('/profiles/me', {
          method: 'POST',
          body: JSON.stringify({
            gemini_key: inputKeys.gemini,
            openai_key: inputKeys.openai,
            anthropic_key: inputKeys.anthropic,
            deepseek_key: inputKeys.deepseek,
            groq_key: inputKeys.groq,
            selected_llm: inputLlm,
            provider_models: inputModels,
            ollama_url: inputOllama.url,
            ollama_model: inputOllama.model
          })
        });
      }

      setApiKeys(inputKeys);
      setSelectedLlm(inputLlm);
      (Object.entries(inputModels) as [LlmProvider, string][]).forEach(([provider, model]) => {
        setProviderModel(provider, model);
      });
      setOllamaSettings(inputOllama);

      setMessage({ type: 'success', text: 'Settings updated and synced successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to sync settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">AI Configuration</h1>
          <p className="text-slate-400 mt-2 font-medium">Power your matches with world-class intelligence.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest">
          v2.1 Experimental
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Settings2 className="w-40 h-40 text-white" />
        </div>

        {message && (
          <div className={`mb-8 p-6 rounded-[2rem] flex items-center gap-4 text-sm font-bold ${message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-12 relative z-10">
          {/* Active Provider Selection */}
          <section className="space-y-6 text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Active Engine</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(['gemini', 'openai', 'anthropic', 'deepseek', 'groq', 'ollama'] as LlmProvider[]).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setInputLlm(provider)}
                  className={`flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-[2rem] border transition-all ${inputLlm === provider
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20'
                    : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                    }`}
                >
                  <span className="capitalize text-xs font-black tracking-tighter italic">{provider}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Detailed Provider Config */}
          <section className="grid md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
            {/* API Providers */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Cloud Provisioning</h3>
              </div>

              {Object.keys(PROVIDER_MODELS).map(provider => (
                <div key={provider} className="space-y-3 bg-slate-950/50 p-6 rounded-[2rem] border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{provider} Secret</label>
                    <select
                      value={inputModels[provider as LlmProvider]}
                      onChange={(e) => setInputModels({ ...inputModels, [provider]: e.target.value })}
                      className="bg-slate-900 text-[10px] font-black text-indigo-400 border border-indigo-500/20 rounded-full px-3 py-1 outline-none cursor-pointer hover:bg-indigo-500/10 transition-colors"
                    >
                      {PROVIDER_MODELS[provider].map(m => <option key={m} value={m} className="bg-slate-800">{m}</option>)}
                    </select>
                  </div>
                  <input
                    type="password"
                    value={inputKeys[provider as keyof ApiKeys]}
                    onChange={(e) => setInputKeys({ ...inputKeys, [provider]: e.target.value })}
                    placeholder={`Enter ${provider} key...`}
                    className="block w-full px-5 py-3 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Ollama & Local Infra */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Local Infrastructure (Ollama)</h3>
              </div>

              <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-emerald-500/10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={inputOllama.url}
                    onChange={(e) => setInputOllama({ ...inputOllama, url: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="block w-full px-5 py-3 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <Server className="w-3 h-3" /> Model Manifest
                  </label>
                  <input
                    type="text"
                    value={inputOllama.model}
                    onChange={(e) => setInputOllama({ ...inputOllama, model: e.target.value })}
                    placeholder="e.g. llama3, mistral..."
                    className="block w-full px-5 py-3 bg-slate-950 border border-white/10 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-xs"
                  />
                </div>

                <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] text-emerald-400 font-medium leading-relaxed italic">
                    Ensure Ollama is running with OAI compatibility enabled (standard in newer versions).
                  </p>
                </div>
              </div>

              {/* Quotas */}
              <div className="bg-slate-950 border border-white/5 rounded-[2rem] p-8 space-y-6">
                <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Hardware Utilization</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(providerQuotas).map(([provider, tokens]) => (
                    <div key={provider} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{provider}</p>
                      <p className="text-lg font-black text-white tabular-nums">{tokens.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-8">
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-4 px-10 py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span>Synchronize Architecture</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Resource Footer */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-10 space-y-4 shadow-xl">
          <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Provisioning Matrix</h3>
          <ul className="space-y-4 text-xs font-medium text-slate-400">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> <strong>Gemini:</strong> High-bandwidth logic (Flash 1.5) via Google AI Studio.</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> <strong>Groq:</strong> Ultra-fast inference for real-time race scenarios.</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> <strong>Ollama:</strong> Zero-cost local execution for offline gaming.</li>
          </ul>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-4">
          <Globe className="w-10 h-10 text-slate-700" />
          <p className="text-xs text-slate-500 leading-relaxed font-bold">
            All keys are stored locally via `neuroplay-storage`. <br />
            We never proxy your intelligence through external middle-servers.
          </p>
        </div>
      </div>
    </div>
  );
}
