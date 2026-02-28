import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask, getLlmResponse } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Brain, Sparkles, Loader2 } from 'lucide-react';

const ICONS = ['🌟', '🍎', '🚀', '🎸', '🍦', '🎮', '🌈', '🐱', '🍕', '⚽', '💎', '🎨'];

export default function MemoryMatch() {
  const [cards, setCards] = useState<{ id: number; icon: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initGame = () => {
    const deck = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({ id: index, icon, flipped: false, matched: false }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setGameOver(false);
    setFunnyTask(null);
    setAiMessage(null);
    resetSessionTokens();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched || gameOver) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          if (matchedCards.every(c => c.matched)) handleWin();
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const getAiMemoryBoost = async () => {
    if (gameOver || isAiThinking || !isMounted.current) return;
    setIsAiThinking(true);
    setAiMessage(null);

    try {
      const prompt = `I am playing a Memory Match game. I have made ${moves} moves. 
      The icons are: ${ICONS.join(', ')}. 
      Give me a funny or encouraging "Memory Boost" tip to help me find the pairs. 
      Keep it very short (max 1 sentence).`;
      
      const response = await getLlmResponse(prompt, apiKeys, selectedLlm, "You are a memory coach.", 'memory');
      if (!isMounted.current) return;
      setAiMessage(response);
    } catch (error) {
      if (!isMounted.current) return;
      console.error('AI Boost failed:', error);
      setAiMessage("Focus your mind, the stars are aligned!");
    } finally {
      if (isMounted.current) {
        setIsAiThinking(false);
      }
    }
  };

  const handleWin = async () => {
    if (!isMounted.current) return;
    setGameOver(true);
    if (user && isMounted.current) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'memory',
          winner: 'user',
          funny_task: null,
          total_tokens: gameSessionTokens
        })
      });
    }
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex justify-between w-full mb-8 px-4 items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Moves: {moves}</span>
          </div>
          <button 
            onClick={getAiMemoryBoost}
            disabled={isAiThinking || gameOver}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all text-xs font-bold uppercase tracking-wider"
          >
            {isAiThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI Boost
          </button>
        </div>
        <button onClick={initGame} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reset
        </button>
      </div>

      <AnimatePresence>
        {aiMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 items-start"
          >
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-100 italic">"{aiMessage}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-8">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(index)}
            className={`w-16 h-20 sm:w-20 sm:h-28 rounded-xl border-2 transition-all flex items-center justify-center text-3xl
              ${card.flipped || card.matched 
                ? 'bg-slate-800 border-indigo-500/50 rotate-y-180' 
                : 'bg-slate-900 border-white/10 hover:border-white/20'}
              ${card.matched ? 'opacity-50 grayscale-[0.5]' : ''}
            `}
          >
            {(card.flipped || card.matched) ? card.icon : '?'}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="bg-emerald-500/20 text-emerald-400 px-8 py-4 rounded-3xl border border-emerald-500/30 inline-block mb-6">
              <Trophy className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">Memory Master!</h3>
              <p className="text-sm opacity-80">Completed in {moves} moves</p>
            </div>
            <div>
              <button onClick={initGame} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
