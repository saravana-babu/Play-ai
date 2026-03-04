import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Coins, User, Bot, Crown } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type Card = { rank: string; suit: string; value: number };
type Stage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♣', '♥', '♦'];

const getCardValue = (rank: string) => RANKS.indexOf(rank) + 2;

export default function Poker() {
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [aiHand, setAiHand] = useState<Card[]>([]);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [pot, setPot] = useState(0);
    const [playerChips, setPlayerChips] = useState(1000);
    const [aiChips, setAiChips] = useState(1000);
    const [currentBet, setCurrentBet] = useState(0);
    const [stage, setStage] = useState<Stage>('preflop');
    const [turn, setTurn] = useState<'player' | 'ai'>('player');
    const [message, setMessage] = useState('Your turn! Call, Raise, or Fold?');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | 'tie' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initHand = useCallback(() => {
        const newDeck: Card[] = [];
        RANKS.forEach(rank => SUITS.forEach(suit => newDeck.push({ rank, suit, value: getCardValue(rank) })));
        const shuffled = newDeck.sort(() => Math.random() - 0.5);

        setPlayerHand([shuffled[0], shuffled[1]]);
        setAiHand([shuffled[2], shuffled[3]]);
        setCommunityCards([]);
        setDeck(shuffled.slice(4));
        setPot(40);
        setPlayerChips(prev => prev - 20);
        setAiChips(prev => prev - 20);
        setStage('preflop');
        setTurn('player');
        setCurrentBet(20);
        setMessage('Hand started. Blinds in.');
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initHand();
        return () => { isMounted.current = false; };
    }, [initHand]);

    const advanceStage = useCallback(() => {
        if (stage === 'preflop') {
            setCommunityCards(deck.slice(0, 3));
            setDeck(prev => prev.slice(3));
            setStage('flop');
        } else if (stage === 'flop') {
            setCommunityCards(prev => [...prev, deck[0]]);
            setDeck(prev => prev.slice(1));
            setStage('turn');
        } else if (stage === 'turn') {
            setCommunityCards(prev => [...prev, deck[0]]);
            setDeck(prev => prev.slice(1));
            setStage('river');
        } else {
            setStage('showdown');
            resolveWinner();
        }
        setCurrentBet(0);
        setTurn('player');
    }, [stage, deck]);

    const resolveWinner = () => {
        // Simplified hand strength (sum of values)
        const pStrength = [...playerHand, ...communityCards].reduce((acc, c) => acc + c.value, 0);
        const aStrength = [...aiHand, ...communityCards].reduce((acc, c) => acc + c.value, 0);

        let result: 'player' | 'ai' | 'tie';
        if (pStrength > aStrength) {
            result = 'player';
            setPlayerChips(prev => prev + pot);
        } else if (aStrength > pStrength) {
            result = 'ai';
            setAiChips(prev => prev + pot);
        } else {
            result = 'tie';
            setPlayerChips(prev => prev + pot / 2);
            setAiChips(prev => prev + pot / 2);
        }

        setWinner(result);
        setGameOver(true);
        handleHistory(result);
    };

    const handleHistory = async (res: 'player' | 'ai' | 'tie') => {
        let task = null;
        if (res === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Poker');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'poker',
                    winner: res === 'player' ? 'user' : res === 'ai' ? 'ai' : 'draw',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const playerAction = (action: 'call' | 'raise' | 'fold') => {
        if (turn !== 'player' || gameOver) return;

        if (action === 'fold') {
            setAiChips(prev => prev + pot);
            setWinner('ai');
            setGameOver(true);
            handleHistory('ai');
            return;
        }

        if (action === 'call') {
            const callAmt = currentBet;
            setPlayerChips(prev => prev - callAmt);
            setPot(prev => prev + callAmt);
            advanceStage();
        } else {
            const raiseAmt = 40;
            setPlayerChips(prev => prev - (currentBet + raiseAmt));
            setPot(prev => prev + currentBet + raiseAmt);
            setCurrentBet(raiseAmt);
            setTurn('ai');
        }
    };

    // AI Logic
    useEffect(() => {
        if (turn === 'ai' && !gameOver && !isAiThinking) {
            makeAiMove();
        }
    }, [turn, gameOver]);

    const makeAiMove = async () => {
        const llm = gameMode === 'llm-vs-llm' && turn === 'player' ? player1Llm : selectedLlm;
        if (!apiKeys[llm]) {
            // Fallback
            setTimeout(() => {
                if (stage === 'river') resolveWinner(); else advanceStage();
            }, 1000);
            return;
        }

        setIsAiThinking(true);
        try {
            const systemInstruction = `You are a Poker Pro. 
        Hand: ${aiHand.map(c => `${c.rank}${c.suit}`).join(', ')}
        Community: ${communityCards.map(c => `${c.rank}${c.suit}`).join(', ')}
        Stage: ${stage}
        Pot: ${pot}
        Chips: ${aiChips}
        You must "call", "raise", or "fold".
        Return ONLY a JSON object: {"action": "call"}`;

            const response = await generateNextMove(llm, apiKeys, 'poker', { aiHand, communityCards, stage, pot }, systemInstruction);
            if (isMounted.current) {
                if (response?.action === 'fold') {
                    setPlayerChips(prev => prev + pot);
                    setWinner('player');
                    setGameOver(true);
                    handleHistory('player');
                } else if (response?.action === 'raise') {
                    const raiseAmt = 40;
                    setAiChips(prev => prev - (currentBet + raiseAmt));
                    setPot(prev => prev + currentBet + raiseAmt);
                    setCurrentBet(raiseAmt);
                    setTurn('player');
                } else {
                    setAiChips(prev => prev - currentBet);
                    setPot(prev => prev + currentBet);
                    advanceStage();
                }
            }
        } catch (e) {
            advanceStage();
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const renderCard = (card: Card, hidden = false) => (
        <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className={`w-14 h-20 sm:w-20 sm:h-28 rounded-lg shadow-xl border-2 flex flex-col items-center justify-center relative overflow-hidden ${hidden ? 'bg-indigo-950 border-indigo-400/30' : 'bg-white border-slate-200'}`}
        >
            {hidden ? <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 to-transparent" /> : (
                <>
                    <span className={`absolute top-1 left-1 font-bold text-xs ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.rank}</span>
                    <span className={`text-2xl ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.suit}</span>
                </>
            )}
        </motion.div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-amber-500" />
                    <h2 className="text-2xl font-black text-white italic tracking-tighter">ELITE POKER</h2>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-black">{playerChips}</span>
                    </div>
                    <button onClick={initHand} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-white/10">
                        <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            <div className="bg-emerald-950 border-[12px] border-amber-900/50 rounded-[60px] p-8 sm:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative min-h-[550px] flex flex-col justify-between items-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 pointer-events-none" />

                {/* AI Opponent */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-1 bg-black/40 rounded-full border border-white/10 text-white/50 text-xs font-bold">
                        <Bot className="w-4 h-4" /> AI OPPONENT [${aiChips}]
                    </div>
                    <div className="flex gap-2">
                        {aiHand.map((c, i) => (
                            <div key={i}>{renderCard(c, !gameOver)}</div>
                        ))}
                    </div>
                </div>

                {/* Pot & Community */}
                <div className="flex flex-col items-center gap-6 z-10">
                    <div className="bg-black/50 px-8 py-3 rounded-3xl border-2 border-amber-500/30 flex flex-col items-center shadow-2xl">
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">CURRENT POT</span>
                        <span className="text-3xl font-black text-white">$ {pot}</span>
                    </div>
                    <div className="flex gap-2 sm:gap-4 h-28 items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                        {communityCards.map((c, i) => <div key={i}>{renderCard(c)}</div>)}
                        {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                            <div key={i} className="w-14 h-20 sm:w-20 sm:h-28 rounded-lg border-2 border-white/5 bg-white/5" />
                        ))}
                    </div>
                </div>

                {/* Player */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        {playerHand.map((c, i) => (
                            <div key={i}>{renderCard(c)}</div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                        <User className="w-4 h-4" /> YOU [${playerChips}]
                    </div>
                </div>

                {/* Actions */}
                {turn === 'player' && !gameOver && (
                    <div className="absolute bottom-8 flex gap-3">
                        <button onClick={() => playerAction('fold')} className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1">FOLD</button>
                        <button onClick={() => playerAction('call')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/30 transition-transform hover:-translate-y-1">CALL {currentBet > 0 ? `$${currentBet}` : ''}</button>
                        <button onClick={() => playerAction('raise')} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1">RAISE $40</button>
                    </div>
                )}

                {isAiThinking && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                            <span className="font-bold text-slate-900">AI IS CALCULATING...</span>
                        </div>
                    </div>
                )}

                {/* Winner Overlay */}
                <AnimatePresence>
                    {gameOver && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-8">
                            <div className="text-center space-y-6 max-w-sm">
                                {winner === 'player' ? <Trophy className="w-20 h-20 text-indigo-400 mx-auto" /> : <Skull className="w-20 h-20 text-rose-500 mx-auto" />}
                                <h2 className="text-6xl font-black text-white italic">{winner === 'player' ? 'YOU WON!' : 'AI WON!'}</h2>
                                <p className="text-indigo-200 text-xl font-bold">The pot of ${pot} is yours!</p>
                                {funnyTask && <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-white italic">"{funnyTask}"</div>}
                                <div className="space-y-4">
                                    <ShareButtons gameTitle="Elite Poker" result={winner === 'player' ? 'bluffed the AI and took the pot' : 'got outplayed by the Poker AI'} score={`$${pot}`} penalty={funnyTask} />
                                    <button onClick={initHand} className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-xl shadow-xl transition-all">NEXT HAND</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex gap-4 items-start text-white/70">
                <Info className="w-6 h-6 text-amber-500" />
                <div className="text-xs space-y-1">
                    <p><strong className="text-white">Texas Hold'em:</strong> Use your 2 cards and 5 community cards to make the best hand.</p>
                    <p><strong className="text-white">AI Intel:</strong> The LLM analyzes your betting patterns and the board to decide its strategy.</p>
                    <p><strong className="text-white">Special:</strong> In AI vs AI mode, two different brains battle for the chips!</p>
                </div>
            </div>
        </div>
    );
}
