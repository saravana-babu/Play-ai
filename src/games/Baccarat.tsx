import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Star, User, Bot, CircleDollarSign } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Card = {
    rank: string;
    suit: string;
    value: number;
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♣', '♥', '♦'];

const getBaccaratValue = (rank: string): number => {
    if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
    if (rank === 'A') return 1;
    return parseInt(rank);
};

const calculateBaccaratScore = (hand: Card[]): number => {
    const sum = hand.reduce((acc, card) => acc + card.value, 0);
    return sum % 10;
};

export default function Baccarat() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [bankerHand, setBankerHand] = useState<Card[]>([]);
    const [betOn, setBetOn] = useState<'player' | 'banker' | 'tie' | null>(null);
    const [gameState, setGameState] = useState<'betting' | 'dealing' | 'gameOver'>('betting');
    const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);
    const [message, setMessage] = useState('Place your bet!');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const newDeck: Card[] = [];
        RANKS.forEach(rank => {
            SUITS.forEach(suit => {
                newDeck.push({ rank, suit, value: getBaccaratValue(rank) });
            });
        });
        setDeck(newDeck.sort(() => Math.random() - 0.5));
        setPlayerHand([]);
        setBankerHand([]);
        setBetOn(null);
        setGameState('betting');
        setWinner(null);
        setMessage('Place your bet!');
        setFunnyTask(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const deal = useCallback((bet: 'player' | 'banker' | 'tie') => {
        if (gameState !== 'betting') return;
        setBetOn(bet);
        setGameState('dealing');

        const pHand = [deck[0], deck[2]];
        const bHand = [deck[1], deck[3]];
        const remainingDeck = deck.slice(4);

        setPlayerHand(pHand);
        setBankerHand(bHand);
        setDeck(remainingDeck);

        setTimeout(() => {
            if (!isMounted.current) return;
            resolveBaccarat(pHand, bHand, remainingDeck);
        }, 1500);
    }, [deck, gameState]);

    const resolveBaccarat = (pHand: Card[], bHand: Card[], currentDeck: Card[]) => {
        let pScore = calculateBaccaratScore(pHand);
        let bScore = calculateBaccaratScore(bHand);
        let finalPHand = [...pHand];
        let finalBHand = [...bHand];
        let finalDeck = [...currentDeck];

        // Natural win
        if (pScore >= 8 || bScore >= 8) {
            finalize(pScore, bScore);
            return;
        }

        // Player third card rules
        let pThirdCardValue = -1;
        if (pScore <= 5) {
            const thirdCard = finalDeck[0];
            finalPHand.push(thirdCard);
            finalDeck = finalDeck.slice(1);
            pThirdCardValue = thirdCard.value;
            pScore = calculateBaccaratScore(finalPHand);
        }

        // Banker third card rules
        let bDraws = false;
        if (pThirdCardValue === -1) {
            if (bScore <= 5) bDraws = true;
        } else {
            if (bScore <= 2) bDraws = true;
            else if (bScore === 3 && pThirdCardValue !== 8) bDraws = true;
            else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(pThirdCardValue)) bDraws = true;
            else if (bScore === 5 && [4, 5, 6, 7].includes(pThirdCardValue)) bDraws = true;
            else if (bScore === 6 && [6, 7].includes(pThirdCardValue)) bDraws = true;
        }

        if (bDraws) {
            const thirdCard = finalDeck[0];
            finalBHand.push(thirdCard);
            finalDeck = finalDeck.slice(1);
            bScore = calculateBaccaratScore(finalBHand);
        }

        setPlayerHand(finalPHand);
        setBankerHand(finalBHand);
        setDeck(finalDeck);
        finalize(pScore, bScore);
    };

    const finalize = async (pScore: number, bScore: number) => {
        const gameWinner = pScore > bScore ? 'player' : bScore > pScore ? 'banker' : 'tie';
        setWinner(gameWinner);
        setGameState('gameOver');

        const wonBet = betOn === gameWinner;
        setMessage(wonBet ? 'You won your bet!' : 'House wins.');

        let task = null;
        if (!wonBet && apiKeys[selectedLlm] && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Baccarat');
            if (isMounted.current) setFunnyTask(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'baccarat',
                    winner: wonBet ? (gameMode === 'llm-vs-llm' ? 'ai-1' : 'user') : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    // LLM vs LLM betting logic
    useEffect(() => {
        if (gameState === 'betting' && gameMode === 'llm-vs-llm' && !isAiThinking) {
            makeLlmBet(player1Llm);
        }
    }, [gameState, gameMode]);

    const makeLlmBet = async (llm: LlmProvider) => {
        if (!apiKeys[llm] || !isMounted.current) return;
        setIsAiThinking(true);
        try {
            const systemInstruction = `You are a high-stakes Baccarat player. 
      Decide whether to bet on "player", "banker", or "tie".
      Statistically, Banker has the best odds.
      Return ONLY a JSON object: {"bet": "banker"}`;

            const response = await generateNextMove(llm, apiKeys, 'baccarat', {}, systemInstruction);
            if (isMounted.current && response?.bet) {
                deal(response.bet);
            }
        } catch (error) {
            deal('banker');
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const renderCard = (card: Card) => (
        <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-xl flex flex-col items-center justify-center border-2 border-slate-200 relative overflow-hidden"
        >
            <span className={`absolute top-2 left-2 font-bold ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.rank}</span>
            <span className={`text-4xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.suit}</span>
        </motion.div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-4">
            <div className="flex justify-between items-center text-white mb-4 px-2">
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <CircleDollarSign className="w-8 h-8 text-amber-500" />
                    ROYAL BACCARAT
                </h2>
                <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-white/10">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-[#064e3b] border-8 border-[#3f3f3f] rounded-[50px] p-8 sm:p-16 shadow-2xl relative min-h-[600px] flex flex-col justify-between items-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                {/* Banker Area */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="px-6 py-1 bg-black/30 rounded-full text-white/70 text-xs font-black uppercase tracking-[0.2em]">Banker</div>
                    <div className="flex gap-4 min-h-[144px]">
                        {bankerHand.map((card, i) => (
                            <div key={i}>{renderCard(card)}</div>
                        ))}
                    </div>
                    {bankerHand.length > 0 && (
                        <div className="text-2xl font-black text-amber-400 bg-black/40 px-4 py-1 rounded-lg">
                            {calculateBaccaratScore(bankerHand)}
                        </div>
                    )}
                </div>

                {/* Message / Status */}
                <div className="text-center z-10 py-8">
                    <div className={`text-2xl font-black px-10 py-4 rounded-3xl border-4 shadow-2xl ${gameState === 'gameOver' ? 'bg-amber-500 text-black border-white' : 'bg-black/50 text-white border-white/20'}`}>
                        {isAiThinking ? 'AI IS PLACING BET...' : message}
                    </div>
                </div>

                {/* Player Area */}
                <div className="flex flex-col items-center gap-4 w-full">
                    {playerHand.length > 0 && (
                        <div className="text-2xl font-black text-amber-400 bg-black/40 px-4 py-1 rounded-lg">
                            {calculateBaccaratScore(playerHand)}
                        </div>
                    )}
                    <div className="flex gap-4 min-h-[144px]">
                        {playerHand.map((card, i) => (
                            <div key={i}>{renderCard(card)}</div>
                        ))}
                    </div>
                    <div className="px-6 py-1 bg-black/30 rounded-full text-white/70 text-xs font-black uppercase tracking-[0.2em]">Player</div>
                </div>

                {/* Betting Controls */}
                {gameState === 'betting' && gameMode === 'human-vs-ai' && (
                    <div className="absolute bottom-12 flex gap-4">
                        <button onClick={() => deal('player')} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl border-b-4 border-indigo-900 transition-all hover:-translate-y-1">BET PLAYER</button>
                        <button onClick={() => deal('tie')} className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-xl border-b-4 border-emerald-900 transition-all hover:-translate-y-1">BET TIE</button>
                        <button onClick={() => deal('banker')} className="px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black shadow-xl border-b-4 border-rose-900 transition-all hover:-translate-y-1">BET BANKER</button>
                    </div>
                )}

                {/* Winner Overlay */}
                <AnimatePresence>
                    {gameState === 'gameOver' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                            <div className="text-center space-y-8 max-w-sm">
                                <Star className="w-20 h-20 text-amber-400 mx-auto animate-bounce" />
                                <h2 className="text-6xl font-black text-white italic">{winner?.toUpperCase()} WINS!</h2>
                                <p className="text-amber-200 text-xl font-bold">
                                    {betOn === winner ? 'CONGRATULATIONS!' : 'MODERN LUCK IS ON ITS WAY'}
                                </p>

                                {funnyTask && (
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                                        <p className="text-xs text-amber-400 font-black uppercase tracking-widest mb-1">Loss Penalty</p>
                                        <p className="text-white italic">"{funnyTask}"</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <ShareButtons gameTitle="Baccarat" result={betOn === winner ? 'beat the house at royal baccarat' : 'donated to the royal casino'} score={`${calculateBaccaratScore(playerHand)} to ${calculateBaccaratScore(bankerHand)}`} penalty={funnyTask} />
                                    <button onClick={initGame} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-xl shadow-xl transition-all">NEW ROUND</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start text-white/70">
                <Info className="w-6 h-6 text-amber-500" />
                <div className="text-xs space-y-1 leading-relaxed">
                    <p><strong className="text-white">Goal:</strong> Bet on which hand will have a score closest to 9.</p>
                    <p><strong className="text-white">Scoring:</strong> Tens/Face cards = 0, Aces = 1. Scores are calculated by adding card values and taking the last digit.</p>
                    <p><strong className="text-white">AI Mode:</strong> In AI vs AI, AI 1 chooses the bet based on statistics.</p>
                </div>
            </div>
        </div>
    );
}
