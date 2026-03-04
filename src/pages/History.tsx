import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { Trophy, Frown, Minus, Calendar, Gamepad2 } from 'lucide-react';
import { GAMES } from '../lib/games';

interface GameResult {
  id: string;
  game_id: string;
  winner: 'user' | 'ai' | 'draw' | 'ai-1' | 'ai-2';
  funny_task: string | null;
  total_tokens: number;
  created_at: string;
}

export default function History() {
  const { user } = useStore();
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const data = await fetchApi('/history');
      setResults(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGameTitle = (id: string) => {
    return GAMES.find((g) => g.id === id)?.title || id;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Match History</h1>
        <p className="text-slate-400 mt-2">Your past battles against the AI.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading history...</div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-white/5 rounded-3xl">
          <Gamepad2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No games played yet</h2>
          <p className="text-slate-400">Play a game to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 rounded-2xl border ${result.winner === 'user'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : (result.winner === 'ai' || result.winner === 'ai-1' || result.winner === 'ai-2')
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-slate-800 border-white/10'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${result.winner === 'user' ? 'bg-emerald-500/20 text-emerald-400' :
                      (result.winner === 'ai' || result.winner === 'ai-1' || result.winner === 'ai-2') ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                    {result.winner === 'user' ? <Trophy className="w-5 h-5" /> :
                      (result.winner === 'ai' || result.winner === 'ai-1' || result.winner === 'ai-2') ? <Frown className="w-5 h-5" /> :
                        <Minus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{getGameTitle(result.game_id)}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(result.created_at).toLocaleString()}
                      <span className="mx-1">•</span>
                      <span className="font-semibold text-indigo-400">{result.total_tokens?.toLocaleString() || 0} Tokens</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${result.winner === 'user' ? 'bg-emerald-500/10 text-emerald-400' :
                    (result.winner === 'ai' || result.winner === 'ai-1' || result.winner === 'ai-2') ? 'bg-rose-500/10 text-rose-400' :
                      'bg-slate-700 text-slate-300'
                  }`}>
                  {result.winner === 'user' ? 'Victory' :
                    result.winner === 'ai' ? 'Defeat' :
                      result.winner === 'ai-1' ? 'AI 1 Won' :
                        result.winner === 'ai-2' ? 'AI 2 Won' : 'Draw'}
                </div>
              </div>

              {result.winner === 'ai' && result.funny_task && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">Penalty Task</p>
                  <p className="text-sm font-medium text-rose-200">{result.funny_task}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
