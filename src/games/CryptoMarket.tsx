import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, RefreshCw, Trophy, Skull, Activity, DollarSign, BrainCircuit, Info } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export default function CryptoMarket() {
    const [day, setDay] = useState(1);
    const [priceHistory, setPriceHistory] = useState<number[]>([100]);
    const [news, setNews] = useState<string>("A mysterious whitepaper was just published.");

    const [p1Balance, setP1Balance] = useState({ cash: 1000, crypto: 0 }); // Player 1 (User / AI-1)
    const [p2Balance, setP2Balance] = useState({ cash: 1000, crypto: 0 }); // Player 2 (AI / AI-2)

    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);

    // Who is currently trading. Once both trade, we advance the day.
    const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
    const [isAiThinking, setIsAiThinking] = useState(false);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    // Constants
    const TOTAL_DAYS = 5; // A quick game

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const currentPrice = priceHistory[priceHistory.length - 1];

    const getNetWorth = (balance: { cash: number, crypto: number }, price: number) => {
        return balance.cash + (balance.crypto * price);
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Crypto Market');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'cryptocurrency',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    // Move to next day or end game
    const advanceDay = async () => {
        if (day >= TOTAL_DAYS) {
            // Game over, calculate winners
            const p1Net = getNetWorth(p1Balance, currentPrice);
            const p2Net = getNetWorth(p2Balance, currentPrice);

            let resultWinner: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' = 'draw';
            if (p1Net > p2Net) {
                resultWinner = gameMode === 'llm-vs-llm' ? 'ai-1' : 'user';
            } else if (p2Net > p1Net) {
                resultWinner = gameMode === 'llm-vs-llm' ? 'ai-2' : 'ai';
            }
            handleEnd(resultWinner);
            return;
        }

        // Generate new price and news using AI (we use selectedLlm as the "Game Master")
        setIsAiThinking(true);
        try {
            const systemPrompt = `You are a cryptocurrency market simulator. We are on day ${day + 1} of ${TOTAL_DAYS}.
      The last price was $${currentPrice.toFixed(2)}. The previous news was: "${news}".
      Generate a short, realistic crypto news headline (max 1 sentence) and determine the new price (can fluctuate wildly, go to 0, or moon). 
      Return ONLY a JSON object: {"news": "headline string", "newPrice": number}`;

            const response = await generateNextMove(
                selectedLlm,
                apiKeys,
                'cryptocurrency', // tracking key
                { day, lastPrice: currentPrice },
                systemPrompt
            );

            if (!isMounted.current) return;

            let newPrice = response?.newPrice;
            let newNews = response?.news;

            if (typeof newPrice !== 'number' || typeof newNews !== 'string') {
                const volatility = (Math.random() - 0.5) * 50;
                newPrice = Math.max(1, currentPrice + volatility);
                newNews = "The market is moving mysteriously.";
            }

            setPriceHistory(prev => [...prev, newPrice]);
            setNews(newNews);
            setDay(d => d + 1);
            setTurn('P1');
        } catch (e) {
            console.error(e);
            if (!isMounted.current) return;
            const volatility = (Math.random() - 0.5) * 50;
            setPriceHistory(prev => [...prev, Math.max(1, currentPrice + volatility)]);
            setNews("The market is experiencing technical difficulties, but trading continues.");
            setDay(d => d + 1);
            setTurn('P1');
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const processTrade = (player: 'P1' | 'P2', action: 'BUY' | 'SELL' | 'HOLD', amountUsd: number) => {
        const isP1 = player === 'P1';
        const currentBal = isP1 ? p1Balance : p2Balance;
        const setBal = isP1 ? setP1Balance : setP2Balance;

        let newBal = { ...currentBal };

        if (action === 'BUY' && currentBal.cash > 0) {
            const toSpend = Math.min(amountUsd, currentBal.cash);
            const cryptoGot = toSpend / currentPrice;
            newBal.cash -= toSpend;
            newBal.crypto += cryptoGot;
        } else if (action === 'SELL' && currentBal.crypto > 0) {
            // Find crypto equivalent of amountUsd, or max crypto
            const cryptoToSell = Math.min(amountUsd / currentPrice, currentBal.crypto);
            const cashGot = cryptoToSell * currentPrice;
            newBal.crypto -= cryptoToSell;
            newBal.cash += cashGot;
        }

        setBal(newBal);

        if (player === 'P1') {
            setTurn('P2');
        } else {
            advanceDay();
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const currentBal = player === 'P1' ? p1Balance : p2Balance;

            const systemPrompt = `You are a cryptocurrency trader playing against another player. 
      Day: ${day}/${TOTAL_DAYS}. Current Price: $${currentPrice.toFixed(2)}. News: "${news}".
      Your Balance: $${currentBal.cash.toFixed(2)} Cash | ${currentBal.crypto.toFixed(4)} Crypto.
      Your Net Worth: $${getNetWorth(currentBal, currentPrice).toFixed(2)}.
      Decide your move for this day.
      Return ONLY a JSON object: {"action": "BUY" | "SELL" | "HOLD", "amountUsd": number}.
      amountUsd is how much cash to spend buying, or how much crypto (in USD value) to sell. Make conservative or wild trades based on news.`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'cryptocurrency',
                { day, currentPrice, news, balance: currentBal },
                systemPrompt
            );

            if (!isMounted.current) return;

            let action = response?.action;
            let amountUsd = response?.amountUsd;

            if (!['BUY', 'SELL', 'HOLD'].includes(action) || typeof amountUsd !== 'number') {
                action = 'HOLD';
                amountUsd = 0;
            }

            processTrade(player, action, amountUsd);
        } catch (e) {
            console.error(e);
            if (isMounted.current && !gameOver) {
                processTrade(player, 'HOLD', 0);
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    }, [day, currentPrice, news, p1Balance, p2Balance, gameOver, gameMode, apiKeys]);

    useEffect(() => {
        if (gameOver) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking) {
                setTimeout(() => makeAiMove('P1', player1Llm), 1000);
            } else if (turn === 'P2' && !isAiThinking) {
                setTimeout(() => makeAiMove('P2', selectedLlm), 1000);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking) {
            setTimeout(() => makeAiMove('P2', selectedLlm), 1000);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm]);

    const handleActionClick = (action: 'BUY' | 'SELL' | 'HOLD', percentage: number = 0) => {
        if (gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;

        let amountUsd = 0;
        if (action === 'BUY') {
            amountUsd = p1Balance.cash * percentage;
        } else if (action === 'SELL') {
            amountUsd = (p1Balance.crypto * currentPrice) * percentage;
        }

        processTrade('P1', action, amountUsd);
    };

    const resetGame = () => {
        setDay(1);
        setPriceHistory([100]);
        setNews("A mysterious whitepaper was just published.");
        setP1Balance({ cash: 1000, crypto: 0 });
        setP2Balance({ cash: 1000, crypto: 0 });
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
    };

    // Calculate chart max/min for scaling
    const maxPrice = Math.max(...priceHistory, currentPrice * 1.2);
    const minPrice = Math.max(0, Math.min(...priceHistory) * 0.8);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full max-w-xl mx-auto space-y-6">

                {/* Market News */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex gap-4 items-center shadow-lg">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${priceHistory.length > 1 && currentPrice > priceHistory[priceHistory.length - 2] ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Market News - Day {day}/{TOTAL_DAYS}</span>
                        <p className="text-white text-sm font-medium">"{news}"</p>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl relative h-64 flex flex-col justify-end">
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                        <div>
                            <h3 className="text-3xl font-black text-white">$ {currentPrice.toFixed(2)}</h3>
                            {priceHistory.length > 1 && (
                                <span className={`text-sm font-bold flex items-center gap-1 ${currentPrice >= priceHistory[priceHistory.length - 2] ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {currentPrice >= priceHistory[priceHistory.length - 2] ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {Math.abs(((currentPrice - priceHistory[priceHistory.length - 2]) / priceHistory[priceHistory.length - 2]) * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sparkline Chart representation */}
                    <div className="relative w-full h-3/4 flex items-end justify-between px-2 gap-1 overflow-hidden">
                        {priceHistory.map((price, idx) => {
                            const heightPct = Math.max(10, ((price - minPrice) / (maxPrice - minPrice)) * 100);
                            const isUp = idx === 0 || price >= priceHistory[idx - 1];
                            return (
                                <div key={idx} className="flex-1 flex flex-col justify-end items-center group">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPct}%` }}
                                        transition={{ type: 'spring', damping: 20 }}
                                        className={`w-full rounded-t-sm opacity-80 ${isUp ? 'bg-emerald-500/50 hover:bg-emerald-500' : 'bg-rose-500/50 hover:bg-rose-500'}`}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {gameOver && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex items-center justify-center p-6 text-center z-10">
                            <div className="space-y-4">
                                {winner === 'draw' ? (
                                    <Activity className="w-12 h-12 text-slate-400 mx-auto" />
                                ) : winner === 'user' || winner === 'ai-1' ? (
                                    <Trophy className="w-12 h-12 text-emerald-400 mx-auto" />
                                ) : (
                                    <Skull className="w-12 h-12 text-rose-400 mx-auto" />
                                )}
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {winner === 'draw' ? "Market Tied!" : winner === 'user' ? 'You beat the market!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Wins!' : 'AI Out-traded You!'}
                                </h3>
                                <p className="text-slate-300 text-sm mb-4">
                                    {gameMode === 'human-vs-ai' ? `Your Final Net Worth: $${getNetWorth(p1Balance, currentPrice).toFixed(2)}` : `AI 1: $${getNetWorth(p1Balance, currentPrice).toFixed(2)} | AI 2: $${getNetWorth(p2Balance, currentPrice).toFixed(2)}`}
                                </p>

                                <ShareButtons
                                    gameTitle="Crypto Market"
                                    result={(winner === 'user' || winner === 'ai-1') ? 'beat the market' : 'got liquidated'}
                                    penalty={penalty}
                                />

                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-transform hover:scale-105 mt-4"
                                >
                                    Trade Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Controls */}
                <div className={`bg-slate-900 border ${turn === 'P1' && !gameOver ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/5 opacity-80'} rounded-3xl p-6 transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 rounded-full">
                                {gameMode === 'llm-vs-llm' ? <BrainCircuit className="w-5 h-5 text-indigo-400" /> : <DollarSign className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{gameMode === 'llm-vs-llm' ? `P1 (${player1Llm})` : 'Your Portfolio'}</div>
                                <div className="text-xl text-white font-black">${getNetWorth(p1Balance, currentPrice).toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                            <div>Cash: ${p1Balance.cash.toFixed(2)}</div>
                            <div>Crypto: {p1Balance.crypto.toFixed(4)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        <button onClick={() => handleActionClick('BUY', 1)} disabled={gameMode === 'llm-vs-llm' || turn !== 'P1' || gameOver || p1Balance.cash <= 0} className="col-span-2 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold rounded-xl transition-colors disabled:opacity-50">
                            Buy MAX
                        </button>
                        <button onClick={() => handleActionClick('HOLD')} disabled={gameMode === 'llm-vs-llm' || turn !== 'P1' || gameOver} className="col-span-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                            Hold
                        </button>
                        <button onClick={() => handleActionClick('SELL', 1)} disabled={gameMode === 'llm-vs-llm' || turn !== 'P1' || gameOver || p1Balance.crypto <= 0} className="col-span-2 py-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold rounded-xl transition-colors disabled:opacity-50">
                            Sell MAX
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-80 space-y-6">

                {/* P2 (AI) State */}
                <div className={`bg-slate-900 border ${turn === 'P2' && !gameOver ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-white/5'} rounded-3xl p-6 transition-all duration-300`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 rounded-full">
                                <BrainCircuit className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{gameMode === 'llm-vs-llm' ? `P2 (${selectedLlm})` : 'AI Opponent'}</div>
                                <div className="text-xl text-white font-black">${getNetWorth(p2Balance, currentPrice).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                        <div>Cash: ${p2Balance.cash.toFixed(2)}</div>
                        <div>Crypto: {p2Balance.crypto.toFixed(4)}</div>
                    </div>
                    {isAiThinking && turn === 'P2' && <div className="mt-4 text-xs font-bold text-rose-400 animate-pulse text-center">AI is analyzing markets...</div>}
                </div>

                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">How to Play</h3>
                    </div>
                    <div className="space-y-3 text-sm text-slate-400">
                        <p><strong className="text-white">Goal:</strong> Have the highest Net Worth after {TOTAL_DAYS} days of trading.</p>
                        <p>Every day, breaking news affects the market price. You and the AI take turns deciding whether to buy, sell, or hold your assets.</p>
                    </div>
                </div>

                <AnimatePresence>
                    {penalty && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden"
                        >
                            <div className="relative z-10 text-center">
                                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Penalty Task</p>
                                <p className="text-sm font-medium text-rose-200">"{penalty}"</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
