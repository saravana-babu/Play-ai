import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, BrainCircuit, HelpCircle, User, Bot } from 'lucide-react';

type Card = { rank: string; suit: string };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♣', '♥', '♦'];

export default function GoFish() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [playerBooks, setPlayerBooks] = useState<string[]>([]);
  const [aiBooks, setAiBooks] = useState<string[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [message, setMessage] = useState('Your turn! Ask for a rank.');
  const [gameOver, setGameOver] = useState(false);
  const [funnyTask, setFunnyTask] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const { apiKeys, selectedLlm, user } = useStore();

  const initGame = () => {
    const newDeck: Card[] = [];
    RANKS.forEach(rank => {
      SUITS.forEach(suit => {
        newDeck.push({ rank, suit });
      });
    });
    const shuffled = newDeck.sort(() => Math.random() - 0.5);
    
    setPlayerHand(shuffled.slice(0, 7));
    setAiHand(shuffled.slice(7, 14));
    setDeck(shuffled.slice(14));
    setPlayerBooks([]);
    setAiBooks([]);
    setTurn('player');
    setMessage('Your turn! Ask for a rank.');
    setGameOver(false);
    setFunnyTask(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const checkBooks = (hand: Card[], setBooks: React.Dispatch<React.SetStateAction<string[]>>) => {
    const counts: Record<string, number> = {};
    hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    
    const completedRanks = Object.keys(counts).filter(r => counts[r] === 4);
    if (completedRanks.length > 0) {
      setBooks(prev => [...prev, ...completedRanks]);
      return hand.filter(c => !completedRanks.includes(c.rank));
    }
    return hand;
  };

  const handleAsk = (rank: string) => {
    if (turn !== 'player' || gameOver) return;

    const matches = aiHand.filter(c => c.rank === rank);
    if (matches.length > 0) {
      const newPlayerHand = [...playerHand, ...matches];
      const newAiHand = aiHand.filter(c => c.rank !== rank);
      
      const checkedHand = checkBooks(newPlayerHand, setPlayerBooks);
      setPlayerHand(checkedHand);
      setAiHand(newAiHand);
      setMessage(`AI had ${matches.length} ${rank}${matches.length > 1 ? 's' : ''}! You get another turn.`);
      
      if (checkedHand.length === 0 || newAiHand.length === 0) checkGameOver(checkedHand, newAiHand);
    } else {
      setMessage(`AI says: Go Fish!`);
      goFish('player');
    }
  };

  const goFish = (who: 'player' | 'ai') => {
    if (deck.length === 0) {
      setTurn(who === 'player' ? 'ai' : 'player');
      if (who === 'ai') setTimeout(makeAiMove, 1000);
      return;
    }

    const newCard = deck[0];
    const newDeck = deck.slice(1);
    setDeck(newDeck);

    if (who === 'player') {
      const newHand = [...playerHand, newCard];
      const checkedHand = checkBooks(newHand, setPlayerBooks);
      setPlayerHand(checkedHand);
      setTurn('ai');
      setTimeout(makeAiMove, 1500);
    } else {
      const newHand = [...aiHand, newCard];
      const checkedHand = checkBooks(newHand, setAiBooks);
      setAiHand(checkedHand);
      setTurn('player');
    }
  };

  const makeAiMove = async () => {
    if (gameOver) return;
    setIsAiThinking(true);
    
    try {
      const playerRanks = playerHand.map(c => c.rank);
      const aiRanks = Array.from(new Set(aiHand.map(c => c.rank)));
      
      const systemInstruction = `You are playing Go Fish. 
      Your hand has these ranks: ${aiRanks.join(', ')}.
      Ask for a rank that you think the player might have.
      Return ONLY a JSON object: {"rank": "A"}`;

      const response = await generateNextMove(
        selectedLlm,
        apiKeys,
        'gofish',
        { aiHand: aiRanks },
        systemInstruction
      );

      const askedRank = response?.rank || aiRanks[Math.floor(Math.random() * aiRanks.length)];
      
      const matches = playerHand.filter(c => c.rank === askedRank);
      if (matches.length > 0) {
        const newAiHand = [...aiHand, ...matches];
        const newPlayerHand = playerHand.filter(c => c.rank !== askedRank);
        
        const checkedHand = checkBooks(newAiHand, setAiBooks);
        setAiHand(checkedHand);
        setPlayerHand(newPlayerHand);
        setMessage(`AI asked for ${askedRank} and got ${matches.length}! AI gets another turn.`);
        
        if (checkedHand.length === 0 || newPlayerHand.length === 0) {
          checkGameOver(newPlayerHand, checkedHand);
        } else {
          setTimeout(makeAiMove, 1500);
        }
      } else {
        setMessage(`You say: Go Fish!`);
        setTimeout(() => goFish('ai'), 1000);
      }
    } catch (error) {
      // Fallback
      const aiRanks = Array.from(new Set(aiHand.map(c => c.rank)));
      const askedRank = aiRanks[Math.floor(Math.random() * aiRanks.length)];
      const matches = playerHand.filter(c => c.rank === askedRank);
      if (matches.length > 0) {
        setAiHand(prev => checkBooks([...prev, ...matches], setAiBooks));
        setPlayerHand(prev => prev.filter(c => c.rank !== askedRank));
        setTimeout(makeAiMove, 1500);
      } else {
        goFish('ai');
      }
    } finally {
      setIsAiThinking(false);
    }
  };

  const checkGameOver = (pHand: Card[], aHand: Card[]) => {
    if (pHand.length === 0 || aHand.length === 0 || deck.length === 0) {
      handleEnd(playerBooks.length > aiBooks.length ? 'player' : 'ai');
    }
  };

  const handleEnd = async (winner: 'player' | 'ai') => {
    setGameOver(true);
    let task = null;
    if (winner === 'ai' && apiKeys[selectedLlm]) {
      task = await generateFunnyTask(selectedLlm, apiKeys, 'Go Fish');
      setFunnyTask(task);
    }

    if (user) {
      await fetchApi('/history', {
        method: 'POST',
        body: JSON.stringify({
          game_id: 'gofish',
          winner: winner === 'player' ? 'user' : 'ai',
          funny_task: task
        })
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Your Books</p>
            <p className="text-2xl font-black text-indigo-400">{playerBooks.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">AI Books</p>
            <p className="text-2xl font-black text-emerald-400">{aiBooks.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Deck</p>
            <p className="text-2xl font-black text-slate-400">{deck.length}</p>
          </div>
        </div>
        <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
        {/* AI Hand */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Bot className="w-5 h-5" /> AI Hand ({aiHand.length})
          </div>
          <div className="flex -space-x-8">
            {aiHand.map((_, i) => (
              <div key={i} className="w-16 h-24 bg-slate-800 border-2 border-white/10 rounded-xl shadow-xl transform rotate-[-5deg]" />
            ))}
          </div>
        </div>

        {/* Message Board */}
        <div className="text-center py-8">
          <div className={`inline-block px-6 py-3 rounded-2xl border ${turn === 'player' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
            {isAiThinking ? 'AI is thinking...' : message}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <User className="w-5 h-5" /> Your Hand
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {playerHand.map((card, i) => (
              <button
                key={i}
                onClick={() => handleAsk(card.rank)}
                disabled={turn !== 'player' || gameOver}
                className={`w-16 h-24 bg-white rounded-xl shadow-xl flex flex-col items-center justify-center text-slate-900 font-bold transition-all hover:-translate-y-2 hover:shadow-indigo-500/20 disabled:opacity-50 disabled:hover:translate-y-0 ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}
              >
                <span className="text-lg">{card.rank}</span>
                <span className="text-2xl">{card.suit}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-8"
            >
              <div className="text-center space-y-8 max-w-md">
                {playerBooks.length > aiBooks.length ? (
                  <div className="space-y-2">
                    <Trophy className="w-20 h-20 text-emerald-400 mx-auto" />
                    <h2 className="text-4xl font-black text-white">Victory!</h2>
                    <p className="text-slate-400">You collected {playerBooks.length} books!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skull className="w-20 h-20 text-rose-500 mx-auto" />
                    <h2 className="text-4xl font-black text-white">Defeat!</h2>
                    <p className="text-slate-400">AI collected {aiBooks.length} books.</p>
                  </div>
                )}

                {funnyTask && (
                  <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                    <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                  </div>
                )}

                <button
                  onClick={initGame}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
        <HelpCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="text-sm text-white font-bold">How to Play</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Click a card in your hand to ask the AI for that rank. If they have it, you get all their cards of that rank and another turn. 
            If not, you "Go Fish" and draw from the deck. Collect 4 of a kind to make a "book". Most books wins!
          </p>
        </div>
      </div>
    </div>
  );
}
