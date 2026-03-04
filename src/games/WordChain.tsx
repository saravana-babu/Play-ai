import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Send, Keyboard, Activity, Sparkles, BrainCircuit, History } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Component ---
export default function WordChain() {
  const [chain, setChain] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const initGame = useCallback(() => {
    setChain(['START']);
    setTurn('player');
    setGameOver(false);
    setScore(0);
    setWinner(null);
    setFunnyTask(null);
    resetSessionTokens();
  }, [resetSessionTokens]);

  useEffect(() => {
    isMounted.current = true;
    initGame();
    return () => { isMounted.current = false; };
  }, [initGame]);

  const handlePlayerMove = (e: React.FormEvent) => {
    e.preventDefault();
    const word = input.trim().toUpperCase();
    if (!word || gameOver || isAiThinking || turn !== 'player') return;

    const lastWord = chain[chain.length - 1];
    const lastChar = lastWord[lastWord.length - 1];

    if (word[0] !== lastChar) {
      alert(`Must start with "${lastChar}"`);
      return;
    }

    if (chain.includes(word)) {
      alert('Word already used!');
      return;
    }

    const newChain = [...chain, word];
    setChain(newChain);
    setScore(s => s + word.length);
    setInput('');
    setTurn('ai');
  };

  const makeAiMove = async (llm: LlmProvider) => {
    if (gameOver || !isMounted.current) return;
    setIsAiThinking(true);

    const lastWord = chain[chain.length - 1];
    const lastChar = lastWord[lastWord.length - 1];

    try {
      const systemInstruction = `You are a Word Chain expert.
            The current word is "${lastWord}". You must provide ONE word starting with "${lastChar}".
            Chain history: ${chain.join(', ')}
            Return ONLY a JSON object: {"word": "EXAMPLE"}`;

      const response = await generateNextMove(llm, apiKeys, 'wordchain', { chain }, systemInstruction);

      if (isMounted.current) {
        const aiWord = response?.word?.toUpperCase();
        if (aiWord && !chain.includes(aiWord) && aiWord[0] === lastChar) {
          setChain(prev => [...prev, aiWord]);
          setTurn('player');
        } else {
          finishGame('player'); // AI failed or repeated
        }
      }
    } catch (e) {
      console.error(e);
      if (isMounted.current) finishGame('player');
    } finally {
      if (isMounted.current) setIsAiThinking(false);
    }
  };

  useEffect(() => {
    if (turn === 'ai' && !gameOver) {
      setTimeout(() => makeAiMove(selectedLlm as LlmProvider), 1000);
    }
  }, [turn, gameOver]);

  const finishGame = async (gameWinner: 'player' | 'ai') => {
    setGameOver(true);
    setWinner(gameWinner);
    let task = null;
    if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Word Chain');
      setFunnyTask(task);
    }
    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({ game_id: 'wordchain', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Lexicon Score</p>
            <p className="text-2xl font-black text-indigo-400">{score}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter ${turn === 'player' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {turn === 'player' ? <Sparkles className="w-3 h-3" /> : <BrainCircuit className="w-3 h-3 animate-pulse" />}
            {turn === 'player' ? 'Your Turn' : 'AI Thinking'}
          </div>
          <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-[40px] border border-white/10 p-8 sm:p-12 min-h-[500px] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Visual Chain */}
        <div className="flex-1 flex flex-wrap gap-3 items-center justify-center p-4">
          {chain.map((word, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 shadow-lg
                                ${i === chain.length - 1 ? 'bg-indigo-500 border-indigo-400 text-white scale-110 z-10' : 'bg-slate-900 border-white/5 text-slate-400 opacity-60'}`}
            >
              <span className="font-mono text-xs opacity-30">#{i}</span>
              <span className="font-black tracking-widest">{word}</span>
              {i < chain.length - 1 && <div className="w-2 h-2 rounded-full bg-indigo-500/20" />}
            </motion.div>
          ))}
          {isAiThinking && (
            <div className="flex gap-2 p-3 bg-white/5 rounded-2xl animate-pulse">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
          )}
        </div>

        <div className="mt-auto space-y-6 flex flex-col items-center">
          <div className="w-full max-w-md relative">
            <form onSubmit={handlePlayerMove} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={turn === 'ai' || gameOver}
                placeholder={`Type a word starting with "${chain[chain.length - 1]?.[chain[chain.length - 1].length - 1] || '?'}"...`}
                className="w-full bg-slate-900 border-2 border-white/5 rounded-2xl px-8 py-5 text-xl text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-all font-black uppercase"
              />
              <button type="submit" disabled={turn === 'ai' || gameOver || !input.trim()} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl transition-all"><Send className="w-5 h-5" /></button>
            </form>
          </div>

          <div className="flex items-center gap-2 text-slate-600 text-[10px] uppercase font-black tracking-widest">
            <History className="w-3 h-3" />
            Sequence Trace Active
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 text-center">
            <div className="space-y-8 max-w-sm w-full">
              {winner === 'player' ? <Trophy className="w-24 h-24 text-emerald-400 mx-auto" /> : <Skull className="w-24 h-24 text-rose-500 mx-auto" />}
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">{winner === 'player' ? 'VOCAB_MASTER' : 'CHAIN_BROKEN'}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{winner === 'player' ? 'The AI was unable to find a continuation.' : 'You broke the sequence or repeated a word.'}</p>
              <div className="space-y-4 pt-4">
                <ShareButtons gameTitle="Word Chain" result={winner === 'player' ? 'defeated the linguistic engine' : 'was outmatched in word play'} score={score} />
                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">NEW VOCAB SESSION</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
