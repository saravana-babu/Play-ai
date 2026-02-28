import React from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Cpu } from 'lucide-react';

export default function TokenLogViewer() {
  const { logs, sessionTokens, gameSessionTokens, providerQuotas, clearLogs } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="mt-12 border-t border-white/10 pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Usage Logs</h3>
            <p className="text-xs text-slate-500">Real-time token tracking for this session</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Provider Quotas */}
          <div className="flex gap-2 mr-2 border-r border-white/10 pr-4">
            {Object.entries(providerQuotas).map(([provider, tokens]) => tokens > 0 && (
              <div key={provider} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase ${
                provider === 'gemini' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400' :
                provider === 'openai' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                'bg-amber-500/5 border-amber-500/20 text-amber-400'
              }`}>
                {provider}: {tokens.toLocaleString()}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-1">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300">Game: {gameSessionTokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-white/5 rounded-full">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-300">Total: {sessionTokens.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <button 
            onClick={clearLogs}
            className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
            title="Clear Logs"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/5 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Game</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3 text-right">Prompt</th>
                      <th className="px-4 py-3 text-right">Completion</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...logs].reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium capitalize">{log.gameId}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            log.provider === 'gemini' ? 'bg-indigo-500/10 text-indigo-400' :
                            log.provider === 'openai' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {log.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">{log.promptTokens}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{log.completionTokens}</td>
                        <td className="px-4 py-3 text-right text-white font-bold">{log.totalTokens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
