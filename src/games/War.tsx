import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Sword, User, Bot, Layers } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Card = {
    rank: string;
    suit: string;
    value: number;
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♣', '♥', '♦'];

const getRankValue = (rank: string): number => {
    return RANKS.indexOf(rank) + 2;
};

export default function War() {
    const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
    const [aiDeck, setAiDeck] = useState<Card[]>([]);
    const [playerCard, setPlayerCard] = useState<Card | null>(null);
    const [aiCard, setAiCard] = useState<Card | null>(null);
    const [warCards, setWarCards] = useState<Card[]>([]);
    const [message, setMessage] = useState('Flip your card!');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isFlipping, setIsFlipping] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const deck: Card[] = [];
        RANKS.forEach(rank => {
            SUITS.forEach(suit => {
                deck.push({ rank, suit, value: getRankValue(rank) });
            });
        });
        const shuffled = deck.sort(() => Math.random() - 0.5);

        setPlayerDeck(shuffled.slice(0, 26));
        setAiDeck(shuffled.slice(26));
        setPlayerCard(null);
        setAiCard(null);
        setWarCards([]);
        setMessage('Flip your card!');
        setGameOver(false);
        setWinner(null);
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

    const handleEnd = async (gameWinner: 'player' | 'ai') => {
        if (!isMounted.current) return;
        setGameOver(true);
        setWinner(gameWinner);

        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'War Card Game');
            if (isMounted.current) setFunnyTask(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'war',
                    winner: gameWinner === 'player' ? 'user' : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const flip = useCallback(() => {
        if (isFlipping || gameOver) return;
        if (playerDeck.length === 0) { handleEnd('ai'); return; }
        if (aiDeck.length === 0) { handleEnd('player'); return; }

        setIsFlipping(true);
        const pCard = playerDeck[0];
        const aCard = aiDeck[0];

        setPlayerCard(pCard);
        setAiCard(aCard);

        const newPlayerDeck = playerDeck.slice(1);
        const newAiDeck = aiDeck.slice(1);

        setTimeout(() => {
            if (!isMounted.current) return;
            resolveRound(pCard, aCard, newPlayerDeck, newAiDeck, []);
        }, 1000);
    }, [playerDeck, aiDeck, isFlipping, gameOver]);

    const resolveRound = (pCard: Card, aCard: Card, pDeck: Card[], aDeck: Card[], currentWarCards: Card[]) => {
        if (pCard.value > aCard.value) {
            setPlayerDeck([...pDeck, pCard, aCard, ...currentWarCards, ...warCards].sort(() => Math.random() - 0.5));
            setAiDeck(aDeck);
            setWarCards([]);
            setMessage('You won the round!');
            setIsFlipping(false);
        } else if (aCard.value > pCard.value) {
            setAiDeck([...aDeck, aCard, pCard, ...currentWarCards, ...warCards].sort(() => Math.random() - 0.5));
            setPlayerDeck(pDeck);
            setWarCards([]);
            setMessage('AI won the round!');
            setIsFlipping(false);
        } else {
            setMessage('WAR!');
            if (pDeck.length < 4 || aDeck.length < 4) {
                handleEnd(pDeck.length > aDeck.length ? 'player' : 'ai');
                return;
            }

            const newWarCards = [...currentWarCards, pCard, aCard, ...pDeck.slice(0, 3), ...aDeck.slice(0, 3)];
            setWarCards(prev => [...prev, ...newWarCards]);

            const nextPDeck = pDeck.slice(3);
            const nextADeck = aDeck.slice(3);

            setTimeout(() => {
                if (!isMounted.current) return;
                const nextPCard = nextPDeck[0];
                const nextACard = nextADeck[0];
                setPlayerCard(nextPCard);
                setAiCard(nextACard);
                resolveRound(nextPCard, nextACard, nextPDeck.slice(1), nextADeck.slice(1), []);
            }, 1500);
        }
    };

    // LLM vs LLM Auto-play
    useEffect(() => {
        if (gameMode === 'llm-vs-llm' && !gameOver && !isFlipping) {
            const timer = setTimeout(flip, 1500);
            return () => clearTimeout(timer);
        }
    }, [gameMode, gameOver, isFlipping, flip]);

    const renderCard = (card: Card | null, label: string, isAi = false) => (
        <div className="flex flex-col items-center gap-4">
            <div className={`flex items-center gap-2 font-bold ${isAi ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                {label}
            </div>
            <div className="relative w-32 h-44 sm:w-40 sm:h-56">
                <AnimatePresence mode="wait">
                    {card ? (
                        <motion.div
                            key={`${card.rank}${card.suit}`}
                            initial={{ scale: 0, rotateY: 180, x: isAi ? 100 : -100 }}
                            animate={{ scale: 1, rotateY: 0, x: 0 }}
                            exit={{ scale: 0, opacity: 0, y: -50 }}
                            className="w-full h-full bg-white rounded-2xl shadow-2xl border-2 border-slate-200 flex flex-col items-center justify-center relative overflow-hidden"
                        >
                            <div className={`absolute top-3 left-3 text-2xl font-bold ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                                {card.rank}
                            </div>
                            <div className={`text-7xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                                {card.suit}
                            </div>
                            <div className={`absolute bottom-3 right-3 text-2xl font-bold rotate-180 ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
                                {card.rank}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="w-full h-full bg-slate-800 rounded-2xl border-2 border-white/10 flex flex-col items-center justify-center">
                            <Layers className="w-12 h-12 text-white/10" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-4">
            <div className="flex justify-between items-center text-white mb-4 px-2">
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <Sword className="w-8 h-8 text-rose-500" />
                    WAR CARDS
                </h2>
                <div className="flex gap-4">
                    <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                        <span className="text-slate-500 uppercase block mb-1">Your Deck</span>
                        <span className="text-indigo-400 text-lg">{playerDeck.length}</span>
                    </div>
                    <div className="bg-slate-800 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-right">
                        <span className="text-slate-500 uppercase block mb-1">AI Deck</span>
                        <span className="text-emerald-400 text-lg">{aiDeck.length}</span>
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-white/10">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative min-h-[500px] flex flex-col justify-center items-center overflow-hidden">
                {warCards.length > 0 && (
                    <div className="absolute top-8 text-rose-400 font-black animate-pulse flex items-center gap-2 bg-rose-500/10 px-6 py-2 rounded-full border border-rose-500/30">
                        <Sword className="w-4 h-4" />
                        WAR POT: {warCards.length} CARDS
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-12 sm:gap-24">
                    {renderCard(playerCard, gameMode === 'llm-vs-llm' ? 'AI 1' : 'You')}

                    <div className="flex flex-col items-center gap-4">
                        <div className="text-3xl font-black text-white italic opacity-20">VS</div>
                        <div className={`px-6 py-2 rounded-2xl font-bold bg-white/5 border border-white/10 ${message.includes('You') ? 'text-indigo-400' : message.includes('AI') ? 'text-emerald-400' : 'text-white'}`}>
                            {message}
                        </div>
                    </div>

                    {renderCard(aiCard, 'AI 2', true)}
                </div>

                {!gameOver && !isFlipping && gameMode === 'human-vs-ai' && (
                    <button
                        onClick={flip}
                        className="mt-12 px-12 py-5 bg-gradient-to-r from-indigo-500 to-rose-500 text-white rounded-3xl font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 hover:shadow-indigo-500/20"
                    >
                        FLIP CARD
                    </button>
                )}

                <AnimatePresence>
                    {gameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-8 rounded-[40px]"
                        >
                            <div className="text-center space-y-8 max-w-sm w-full">
                                {winner === 'player' ? (
                                    <div className="space-y-4">
                                        <Trophy className="w-24 h-24 text-emerald-400 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">VICTORY!</h2>
                                        <p className="text-slate-400 font-medium">You conquered all cards!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Skull className="w-24 h-24 text-rose-500 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">DEFEAT</h2>
                                        <p className="text-slate-400 font-medium">The AI took your last card.</p>
                                    </div>
                                )}

                                {funnyTask && (
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <p className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                                        <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                                    </div>
                                )}

                                <ShareButtons
                                    gameTitle="War Cards"
                                    result={winner === 'player' ? 'won the ultimate card war' : 'lost the battle of cards'}
                                    score={`${playerDeck.length} vs ${aiDeck.length}`}
                                    penalty={funnyTask}
                                    onPlayAgain={initGame}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start">
                <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div className="space-y-2">
                    <p className="text-sm text-white font-bold">How to Play</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Both players flip a card. The higher card wins both and adds them to their deck.
                        If it's a tie, it's <span className="text-rose-500 font-bold">WAR!</span> Each player puts 3 cards face down and 1 face up.
                        Winner takes the whole pot. Collect all 52 cards to win!
                    </p>
                </div>
            </div>
        </div>
    );
}
