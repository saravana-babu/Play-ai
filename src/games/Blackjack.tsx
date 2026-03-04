import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, BrainCircuit, User, Bot, Hand } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Card = {
    rank: string;
    suit: string;
    value: number;
};

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♣', '♥', '♦'];

const getCardValue = (rank: string): number => {
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    if (rank === 'A') return 11;
    return parseInt(rank);
};

const calculateScore = (hand: Card[]): number => {
    let score = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
};

export default function Blackjack() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'dealerTurn' | 'gameOver'>('playing');
    const [winner, setWinner] = useState<'player' | 'dealer' | 'push' | null>(null);
    const [message, setMessage] = useState('Your turn! Hit or Stand?');
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const newDeck: Card[] = [];
        RANKS.forEach(rank => {
            SUITS.forEach(suit => {
                newDeck.push({ rank, suit, value: getCardValue(rank) });
            });
        });
        const shuffled = newDeck.sort(() => Math.random() - 0.5);

        setPlayerHand([shuffled[0], shuffled[2]]);
        setDealerHand([shuffled[1], shuffled[3]]);
        setDeck(shuffled.slice(4));
        setGameState('playing');
        setWinner(null);
        setMessage('Your turn! Hit or Stand?');
        setFunnyTask(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => {
            isMounted.current = false;
        };
    }, [initGame]);

    const handleEnd = async (result: 'player' | 'dealer' | 'push') => {
        if (!isMounted.current) return;
        setGameState('gameOver');
        setWinner(result);

        let task = null;
        if (result === 'dealer' && apiKeys[selectedLlm] && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Blackjack');
            if (isMounted.current) setFunnyTask(task);
        }

        if (user && isMounted.current) {
            let winnerLabel = result === 'player' ? 'user' : result === 'dealer' ? 'ai' : 'draw';
            if (gameMode === 'llm-vs-llm') {
                winnerLabel = result === 'player' ? 'ai-1' : result === 'dealer' ? 'ai-2' : 'draw';
            }

            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'blackjack',
                    winner: winnerLabel,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const stand = useCallback(() => {
        if (gameState !== 'playing') return;
        setGameState('dealerTurn');
    }, [gameState]);

    const hit = useCallback(() => {
        if (gameState !== 'playing' || deck.length === 0) return;
        const newCard = deck[0];
        const newHand = [...playerHand, newCard];
        setPlayerHand(newHand);
        setDeck(deck.slice(1));

        if (calculateScore(newHand) > 21) {
            setMessage('Bust! Dealer wins.');
            handleEnd('dealer');
        }
    }, [deck, playerHand, gameState]);

    // Dealer logic
    useEffect(() => {
        if (gameState === 'dealerTurn' && !isAiThinking) {
            const dScore = calculateScore(dealerHand);
            if (dScore < 17) {
                setIsAiThinking(true);
                setTimeout(() => {
                    if (!isMounted.current) return;
                    const newCard = deck[0];
                    setDealerHand(prev => [...prev, newCard]);
                    setDeck(prev => prev.slice(1));
                    setIsAiThinking(false);
                }, 1000);
            } else {
                const pScore = calculateScore(playerHand);
                if (dScore > 21) {
                    setMessage('Dealer busts! You win!');
                    handleEnd('player');
                } else if (dScore > pScore) {
                    setMessage('Dealer wins!');
                    handleEnd('dealer');
                } else if (dScore < pScore) {
                    setMessage('You win!');
                    handleEnd('player');
                } else {
                    setMessage('Push!');
                    handleEnd('push');
                }
            }
        }
    }, [gameState, dealerHand, playerHand, deck, isAiThinking]);

    // LLM vs LLM / Human vs AI move trigger
    useEffect(() => {
        if (gameState === 'playing' && !isAiThinking) {
            if (gameMode === 'llm-vs-llm') {
                makeLlmMove(player1Llm, 'player');
            } else if (gameMode === 'human-vs-ai') {
                // In human vs ai, the AI is the dealer, whose logic is programmatic (standard rules)
                // But we could use AI to provide "advise" or maybe the user wants AI to play as player too?
                // Usually "Human vs AI" means Human is player, AI is opponent.
                // In Blackjack, the opponent is the Dealer.
                // If the dealer logic is programmatic, is it really "AI"?
                // Let's make the dealer an LLM if we want it to be "AI".
                // But standard Blackjack dealer is strictly following rules.
                // Let's stick to standard rules for dealer, but if gameMode is llm-vs-llm, 
                // AI 1 plays as player and AI 2 (standard dealer) or maybe AI 2 plays as another player?
                // Let's keep it simple: player (Human or AI 1) vs Dealer (Programmatic or AI 2).
            }
        }
    }, [gameState, gameMode, playerHand]);

    const makeLlmMove = async (llm: LlmProvider, role: 'player') => {
        if (gameState !== 'playing' || !apiKeys[llm] || !isMounted.current) return;

        setIsAiThinking(true);
        try {
            const pScore = calculateScore(playerHand);
            const dVisible = dealerHand[0];
            const systemInstruction = `You are playing Blackjack.
      Your hand: ${playerHand.map(c => `${c.rank}${c.suit}`).join(', ')} (Score: ${pScore})
      Dealer's visible card: ${dVisible.rank}${dVisible.suit}
      
      Decide whether to "hit" or "stand".
      Return ONLY a JSON object: {"action": "hit"} or {"action": "stand"}`;

            const response = await generateNextMove(
                llm,
                apiKeys,
                'blackjack',
                { playerHand, dealerVisible: dVisible, pScore },
                systemInstruction
            );

            if (!isMounted.current) return;

            if (response && response.action === 'hit') {
                hit();
            } else {
                stand();
            }
        } catch (error) {
            console.error('AI Error:', error);
            // Fallback: hit if below 17
            if (calculateScore(playerHand) < 17) hit();
            else stand();
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const renderCard = (card: Card, hidden = false) => (
        <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            className={`w-20 h-28 sm:w-24 sm:h-36 rounded-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden ${hidden ? 'bg-slate-800 border-2 border-indigo-500/30' : 'bg-white border-2 border-slate-200'}`}
        >
            {hidden ? (
                <div className="flex flex-col items-center gap-2">
                    <Bot className="w-8 h-8 text-indigo-400 opacity-20" />
                    <div className="w-full h-2 bg-indigo-500/10 rounded-full" />
                </div>
            ) : (
                <>
                    <div className={`absolute top-2 left-2 text-lg font-bold ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {card.rank}
                    </div>
                    <div className={`text-5xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {card.suit}
                    </div>
                    <div className={`absolute bottom-2 right-2 text-lg font-bold rotate-180 ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {card.rank}
                    </div>
                </>
            )}
        </motion.div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-4">
            <div className="flex justify-between items-center text-white mb-4 px-2">
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <Hand className="w-8 h-8 text-indigo-400" />
                    BLACKJACK
                </h2>
                <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all active:scale-95 border border-white/10">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-6 sm:p-12 shadow-2xl relative min-h-[600px] flex flex-col justify-between overflow-hidden">
                {/* Dealer Area */}
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-bold">
                        <Bot className="w-4 h-4" /> Dealer {gameState === 'playing' ? '(?)' : `(${calculateScore(dealerHand)})`}
                    </div>
                    <div className="flex justify-center -space-x-12 sm:-space-x-16 pt-4 h-40">
                        {dealerHand.map((card, i) => (
                            <div key={i} style={{ zIndex: i }}>
                                {renderCard(card, i === 1 && gameState === 'playing')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action / Message Board */}
                <div className="text-center z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={message}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`inline-block px-8 py-4 rounded-3xl border-2 font-bold text-lg shadow-lg ${winner === 'player' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                    winner === 'dealer' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' :
                                        winner === 'push' ? 'bg-slate-500/20 border-slate-500/30 text-slate-300' :
                                            'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                }`}
                        >
                            {isAiThinking ? (
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    AI is deciding...
                                </div>
                            ) : message}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Player Area */}
                <div className="flex flex-col items-center gap-8">
                    <div className="flex justify-center -space-x-12 sm:-space-x-16 h-40">
                        {playerHand.map((card, i) => (
                            <div key={i} style={{ zIndex: i }}>
                                {renderCard(card)}
                            </div>
                        ))}
                    </div>

                    <div className="w-full flex flex-col items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-bold">
                                <User className="w-4 h-4" /> {gameMode === 'llm-vs-llm' ? `AI Player (${calculateScore(playerHand)})` : `You (${calculateScore(playerHand)})`}
                            </div>
                        </div>

                        {gameState === 'playing' && gameMode === 'human-vs-ai' && (
                            <div className="flex gap-4">
                                <button
                                    onClick={hit}
                                    disabled={isAiThinking}
                                    className="px-10 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95"
                                >
                                    HIT
                                </button>
                                <button
                                    onClick={stand}
                                    disabled={isAiThinking}
                                    className="px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-xl shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                                >
                                    STAND
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Over Overlay */}
                <AnimatePresence>
                    {gameState === 'gameOver' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-8 rounded-[40px]"
                        >
                            <div className="text-center space-y-8 max-w-sm w-full">
                                {winner === 'player' ? (
                                    <div className="space-y-4">
                                        <Trophy className="w-24 h-24 text-emerald-400 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">YOU WIN!</h2>
                                        <p className="text-slate-400 font-medium">Beat the dealer with {calculateScore(playerHand)}</p>
                                    </div>
                                ) : winner === 'dealer' ? (
                                    <div className="space-y-4">
                                        <Skull className="w-24 h-24 text-rose-500 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">DEALER WINS</h2>
                                        <p className="text-slate-400 font-medium">Better luck next time!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <RefreshCw className="w-24 h-24 text-slate-400 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">PUSH</h2>
                                        <p className="text-slate-400 font-medium">It's a tie!</p>
                                    </div>
                                )}

                                {funnyTask && (
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                                        <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4">
                                    <ShareButtons
                                        gameTitle="Blackjack"
                                        result={winner === 'player' ? 'beat the house' : winner === 'dealer' ? 'got busted by the dealer' : 'had a push'}
                                        score={`${calculateScore(playerHand)} vs ${calculateScore(dealerHand)}`}
                                        penalty={funnyTask}
                                    />
                                    <button
                                        onClick={initGame}
                                        className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl transition-all shadow-xl shadow-indigo-500/20 hover:-translate-y-1 active:scale-95"
                                    >
                                        PLAY AGAIN
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
                <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div className="space-y-2">
                    <p className="text-sm text-white font-bold">Rules & Strategy</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Get as close to 21 as possible without going over. Number cards are face value, face cards are 10, and Aces are 1 or 11.
                        The dealer must hit until they have at least 17. In <span className="text-indigo-400 font-bold">LLM vs LLM</span> mode,
                        one AI plays as the player and another as the dealer.
                    </p>
                </div>
            </div>
        </div>
    );
}
