import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Info, Layout, User, Bot, Sparkles, Timer, History } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
type Suit = '♠' | '♣' | '♥' | '♦';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    value: number;
    isFaceUp: boolean;
    color: 'red' | 'black';
}

interface GameState {
    deck: Card[];
    waste: Card[];
    foundation: Record<Suit, Card[]>;
    tableau: Card[][];
    score: number;
    moves: number;
}

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['♠', '♣', '♥', '♦'];

const getRankValue = (rank: Rank): number => {
    return RANKS.indexOf(rank) + 1;
};

const createCard = (rank: Rank, suit: Suit): Card => ({
    id: `${rank}${suit}-${Math.random().toString(36).substr(2, 9)}`,
    suit,
    rank,
    value: getRankValue(rank),
    isFaceUp: false,
    color: (suit === '♥' || suit === '♦') ? 'red' : 'black',
});

// --- Component ---
export default function Solitaire() {
    const [playerState, setPlayerState] = useState<GameState | null>(null);
    const [aiState, setAiState] = useState<GameState | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const [activeBoard, setActiveBoard] = useState<'player' | 'ai'>('player');

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Logic ---
    const initGame = useCallback(() => {
        const deck: Card[] = [];
        SUITS.forEach(suit => {
            RANKS.forEach(rank => {
                deck.push(createCard(rank, suit));
            });
        });

        const shuffle = (array: Card[]) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        const shuffled = shuffle(deck);

        const createBoard = (cards: Card[]): GameState => {
            const tableau: Card[][] = [[], [], [], [], [], [], []];
            let cardIdx = 0;
            for (let col = 0; col < 7; col++) {
                for (let row = 0; row <= col; row++) {
                    const card = { ...cards[cardIdx++] };
                    if (row === col) card.isFaceUp = true;
                    tableau[col].push(card);
                }
            }

            return {
                deck: cards.slice(cardIdx),
                waste: [],
                foundation: { '♠': [], '♣': [], '♥': [], '♦': [] },
                tableau,
                score: 0,
                moves: 0
            };
        };

        const board1 = createBoard(shuffled);
        const board2 = JSON.parse(JSON.stringify(board1)); // Identical seed

        setPlayerState(board1);
        setAiState(board2);
        setIsGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        setTime(0);
        resetSessionTokens();

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [initGame]);

    // --- Move Helpers ---
    const canMoveToTableau = (card: Card, targetCol: Card[]) => {
        if (targetCol.length === 0) return card.rank === 'K';
        const lastCard = targetCol[targetCol.length - 1];
        return lastCard.isFaceUp && lastCard.color !== card.color && lastCard.value === card.value + 1;
    };

    const canMoveToFoundation = (card: Card, targetPile: Card[]) => {
        if (targetPile.length === 0) return card.rank === 'A';
        const lastCard = targetPile[targetPile.length - 1];
        return lastCard.suit === card.suit && lastCard.value === card.value - 1;
    };

    const handleDraw = (boardType: 'player' | 'ai') => {
        const setState = boardType === 'player' ? setPlayerState : setAiState;
        setState(prev => {
            if (!prev) return null;
            if (prev.deck.length === 0) {
                return {
                    ...prev,
                    deck: [...prev.waste].reverse().map(c => ({ ...c, isFaceUp: false })),
                    waste: [],
                    moves: prev.moves + 1
                };
            }
            const newCard = { ...prev.deck[0], isFaceUp: true };
            return {
                ...prev,
                deck: prev.deck.slice(1),
                waste: [...prev.waste, newCard],
                moves: prev.moves + 1
            };
        });
    };

    const moveToFoundation = (boardType: 'player' | 'ai', card: Card, from: { type: 'tableau' | 'waste', idx?: number }) => {
        const setState = boardType === 'player' ? setPlayerState : setAiState;
        setState(prev => {
            if (!prev) return null;
            const pile = prev.foundation[card.suit];
            if (!canMoveToFoundation(card, pile)) return prev;

            let newTableau = [...prev.tableau];
            let newWaste = [...prev.waste];

            if (from.type === 'tableau' && from.idx !== undefined) {
                newTableau[from.idx] = newTableau[from.idx].slice(0, -1);
                if (newTableau[from.idx].length > 0) {
                    const last = newTableau[from.idx][newTableau[from.idx].length - 1];
                    if (!last.isFaceUp) last.isFaceUp = true;
                }
            } else {
                newWaste = newWaste.slice(0, -1);
            }

            const newState = {
                ...prev,
                tableau: newTableau,
                waste: newWaste,
                foundation: {
                    ...prev.foundation,
                    [card.suit]: [...pile, card]
                },
                score: prev.score + 10,
                moves: prev.moves + 1
            };

            checkWin(newState, boardType);
            return newState;
        });
    };

    const checkWin = (state: GameState, boardType: 'player' | 'ai') => {
        const totalFoundation = Object.values(state.foundation).reduce((acc, p) => acc + p.length, 0);
        if (totalFoundation === 52) {
            handleEnd(boardType);
        }
    };

    const handleEnd = async (gameWinner: 'player' | 'ai') => {
        if (!isMounted.current) return;
        setIsGameOver(true);
        setWinner(gameWinner);
        if (timerRef.current) clearInterval(timerRef.current);

        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Solitaire');
            setFunnyTask(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'solitaire',
                    winner: gameWinner === 'player' ? 'user' : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    // --- AI Logic ---
    useEffect(() => {
        if ((gameMode === 'llm-vs-llm' || (gameMode === 'human-vs-ai' && activeBoard === 'ai')) && !isGameOver && !isAiThinking) {
            const llm = (gameMode === 'llm-vs-llm' && activeBoard === 'player') ? player1Llm : selectedLlm;
            makeAiMove(llm);
        }
    }, [playerState, aiState, gameMode, activeBoard, isGameOver]);

    const makeAiMove = async (llm: LlmProvider) => {
        if (!apiKeys[llm] || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const state = activeBoard === 'player' ? playerState : aiState;
            if (!state) return;

            const systemInstruction = `You are playing Solitaire Klondike.
      Tableau consists of 7 columns. Foundation is where you stack A to K by suit.
      Current State (Simplified):
      Foundation Counts: ${(Object.entries(state.foundation) as [Suit, Card[]][]).map(([s, p]) => `${s}:${p.length}`).join(', ')}
      Waste Top: ${state.waste.length > 0 ? `${state.waste[state.waste.length - 1].rank}${state.waste[state.waste.length - 1].suit}` : 'None'}
      Tableau Tops: ${state.tableau.map((c: Card[], i: number) => `Col${i + 1}: ${c.length > 0 ? `${c[c.length - 1].rank}${c[c.length - 1].suit}` : 'Empty'}`).join(' | ')}
      
      Suggest a move. Priority: 1. To Foundation, 2. Tableau to Tableau, 3. Waste to Tableau, 4. Draw.
      Return ONLY a JSON object: {"action": "draw"} or {"action": "auto"} (let the internal engine find the best logical move).
      Actually, for Solitaire, I will give you the strategy: Try to uncover hidden cards.
      If you return {"action": "auto"}, I will execute the most logical move.`;

            const response = await generateNextMove(llm, apiKeys, 'solitaire', state, systemInstruction);

            if (isMounted.current) {
                if (response?.action === 'draw') {
                    handleDraw(activeBoard);
                } else {
                    // Auto-move logic fallback
                    executeAutoMove(activeBoard);
                }

                if (gameMode === 'llm-vs-llm') {
                    setActiveBoard(prev => prev === 'player' ? 'ai' : 'player');
                }
            }
        } catch (e) {
            executeAutoMove(activeBoard);
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const executeAutoMove = (boardType: 'player' | 'ai') => {
        const setState = boardType === 'player' ? setPlayerState : setAiState;
        setState(prev => {
            if (!prev) return null;

            // 1. Move from Waste to Foundation
            if (prev.waste.length > 0) {
                const card = prev.waste[prev.waste.length - 1];
                if (canMoveToFoundation(card, prev.foundation[card.suit])) {
                    const newWaste = prev.waste.slice(0, -1);
                    return { ...prev, waste: newWaste, foundation: { ...prev.foundation, [card.suit]: [...prev.foundation[card.suit], card] }, score: prev.score + 10, moves: prev.moves + 1 };
                }
            }

            // 2. Move from Tableau to Foundation
            for (let i = 0; i < 7; i++) {
                if (prev.tableau[i].length > 0) {
                    const card = prev.tableau[i][prev.tableau[i].length - 1];
                    if (canMoveToFoundation(card, prev.foundation[card.suit])) {
                        const newTab = [...prev.tableau];
                        newTab[i] = newTab[i].slice(0, -1);
                        if (newTab[i].length > 0) newTab[i][newTab[i].length - 1].isFaceUp = true;
                        return { ...prev, tableau: newTab, foundation: { ...prev.foundation, [card.suit]: [...prev.foundation[card.suit], card] }, score: prev.score + 10, moves: prev.moves + 1 };
                    }
                }
            }

            // 3. Move from Waste to Tableau
            if (prev.waste.length > 0) {
                const card = prev.waste[prev.waste.length - 1];
                for (let i = 0; i < 7; i++) {
                    if (canMoveToTableau(card, prev.tableau[i])) {
                        const newTab = [...prev.tableau];
                        newTab[i] = [...newTab[i], card];
                        return { ...prev, waste: prev.waste.slice(0, -1), tableau: newTab, moves: prev.moves + 1 };
                    }
                }
            }

            // 4. Move from Tableau to Tableau
            for (let i = 0; i < 7; i++) {
                if (prev.tableau[i].length > 0) {
                    // Find the first face-up card in the column
                    const col = prev.tableau[i];
                    const firstFaceUpIdx = col.findIndex(c => c.isFaceUp);
                    if (firstFaceUpIdx === -1) continue;

                    const cardsToMove = col.slice(firstFaceUpIdx);
                    for (let j = 0; j < 7; j++) {
                        if (i === j) continue;
                        if (canMoveToTableau(cardsToMove[0], prev.tableau[j])) {
                            const newTab = [...prev.tableau];
                            newTab[i] = col.slice(0, firstFaceUpIdx);
                            if (newTab[i].length > 0) newTab[i][newTab[i].length - 1].isFaceUp = true;
                            newTab[j] = [...newTab[j], ...cardsToMove];
                            return { ...prev, tableau: newTab, moves: prev.moves + 1 };
                        }
                    }
                }
            }

            // 5. Draw
            if (prev.deck.length > 0 || prev.waste.length > 0) {
                if (prev.deck.length === 0) {
                    return { ...prev, deck: [...prev.waste].reverse().map(c => ({ ...c, isFaceUp: false })), waste: [], moves: prev.moves + 1 };
                }
                const newCard = { ...prev.deck[0], isFaceUp: true };
                return { ...prev, deck: prev.deck.slice(1), waste: [...prev.waste, newCard], moves: prev.moves + 1 };
            }

            return prev;
        });
    };

    // --- Render Helpers ---
    const renderCard = (card: Card, isDragging = false, index = 0) => (
        <motion.div
            layoutId={card.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-10 h-14 sm:w-16 sm:h-24 rounded-lg shadow-md border flex flex-col items-center justify-center relative overflow-hidden transition-all ${card.isFaceUp ? 'bg-white border-slate-200' : 'bg-indigo-900 border-indigo-400/20'}`}
            style={{ zIndex: index }}
        >
            {card.isFaceUp ? (
                <>
                    <span className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>{card.rank}</span>
                    <span className={`text-lg sm:text-3xl ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>{card.suit}</span>
                </>
            ) : (
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 to-transparent" />
            )}
        </motion.div>
    );

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!playerState || !aiState) return null;

    const currentBoard = activeBoard === 'player' ? playerState : aiState;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-4 sm:p-6 rounded-3xl border border-white/10 shadow-xl gap-4">
                <div className="flex gap-6">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Time</p>
                        <div className="flex items-center gap-2 text-xl font-black text-white">
                            <Timer className="w-4 h-4 text-indigo-400" />
                            {formatTime(time)}
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Score</p>
                        <p className="text-xl font-black text-amber-400">{currentBoard.score}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Moves</p>
                        <p className="text-xl font-black text-indigo-400">{currentBoard.moves}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-800 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setActiveBoard('player')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeBoard === 'player' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            {gameMode === 'llm-vs-llm' ? 'AI Player 1' : 'Your Board'}
                        </button>
                        <button
                            onClick={() => setActiveBoard('ai')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeBoard === 'ai' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            {gameMode === 'llm-vs-llm' ? 'AI Player 2' : 'AI Opponent'}
                        </button>
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/10">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-[#1a472a] border-[12px] border-[#2c1d12] rounded-[40px] p-4 sm:p-8 shadow-2xl relative min-h-[600px] flex flex-col gap-8 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />

                {/* Top Row: Stock, Waste, Foundation */}
                <div className="grid grid-cols-7 gap-2 sm:gap-4 relative z-10">
                    <div className="col-span-1 flex flex-col gap-1 items-center">
                        <button
                            onClick={() => activeBoard === 'player' && handleDraw('player')}
                            className={`w-10 h-14 sm:w-16 sm:h-24 rounded-lg border-2 border-white/10 flex items-center justify-center transition-all ${currentBoard.deck.length > 0 ? 'bg-indigo-900 shadow-xl cursor-pointer hover:translate-y-[-2px]' : 'bg-black/20'}`}
                        >
                            {currentBoard.deck.length > 0 ? (
                                <RefreshCw className="w-5 h-5 text-white/20" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-white/5" />
                            )}
                        </button>
                        <span className="text-[8px] text-white/30 font-bold uppercase">{currentBoard.deck.length}</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                        {currentBoard.waste.length > 0 && (
                            <div
                                onClick={() => activeBoard === 'player' && moveToFoundation('player', currentBoard.waste[currentBoard.waste.length - 1], { type: 'waste' })}
                                className="cursor-pointer hover:translate-y-[-4px] transition-transform"
                            >
                                {renderCard(currentBoard.waste[currentBoard.waste.length - 1])}
                            </div>
                        )}
                    </div>

                    <div className="col-span-1" />

                    {SUITS.map(suit => (
                        <div key={suit} className="col-span-1 w-10 h-14 sm:w-16 sm:h-24 rounded-lg border-2 border-white/5 bg-black/10 flex items-center justify-center relative">
                            <span className="text-white/5 text-2xl sm:text-4xl absolute pointer-events-none">{suit}</span>
                            {currentBoard.foundation[suit].length > 0 && (
                                renderCard(currentBoard.foundation[suit][currentBoard.foundation[suit].length - 1])
                            )}
                        </div>
                    ))}
                </div>

                {/* Tableau */}
                <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1 relative z-10">
                    {currentBoard.tableau.map((col, colIdx) => (
                        <div key={colIdx} className="col-span-1 flex flex-col items-center">
                            <div className="w-10 h-14 sm:w-16 sm:h-24 rounded-lg border-2 border-white/5 bg-black/5 mb-[-56px] sm:mb-[-96px]" />
                            {col.map((card, cardIdx) => (
                                <div
                                    key={card.id}
                                    className="w-full flex justify-center"
                                    style={{ marginTop: cardIdx === 0 ? 0 : '-36px', sm: { marginTop: cardIdx === 0 ? 0 : '-64px' } } as any}
                                    onClick={() => {
                                        if (activeBoard === 'player' && card.isFaceUp && cardIdx === col.length - 1) {
                                            moveToFoundation('player', card, { type: 'tableau', idx: colIdx });
                                        }
                                    }}
                                >
                                    {renderCard(card, false, cardIdx)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Message Overlay */}
                {isAiThinking && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-white/90 px-6 py-3 rounded-2xl shadow-2xl border border-indigo-500/20 flex items-center gap-3"
                        >
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-black text-slate-800 uppercase tracking-tight">AI is strategizing...</span>
                        </motion.div>
                    </div>
                )}

                <AnimatePresence>
                    {isGameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-8"
                        >
                            <div className="text-center space-y-8 max-w-md w-full">
                                {winner === 'player' ? (
                                    <div className="space-y-4">
                                        <Trophy className="w-24 h-24 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">SOLITAIRE CHAMP!</h2>
                                        <p className="text-slate-400 font-medium">Clearance in {formatTime(time)} with {playerState.moves} moves.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Skull className="w-24 h-24 text-rose-500 mx-auto" />
                                        <h2 className="text-5xl font-black text-white italic tracking-tighter">AI ASCENDANCY</h2>
                                        <p className="text-slate-400 font-medium">The AI solved it faster this time.</p>
                                    </div>
                                )}

                                {funnyTask && (
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Loss Penalty</p>
                                        <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                                    </div>
                                )}

                                <ShareButtons
                                    gameTitle="Solitaire Duel"
                                    result={winner === 'player' ? 'conquered the deck' : 'got outpaced by the AI'}
                                    score={`${playerState.score} points`}
                                    penalty={funnyTask}
                                    onPlayAgain={initGame}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4">
                    <h3 className="text-white font-black flex items-center gap-2">
                        <Layout className="w-5 h-5 text-indigo-400" />
                        Game Rules
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="font-bold text-white mb-1 uppercase tracking-tighter">Objective</p>
                            Move all cards to the four foundation piles (top right), sorted by suit from Ace to King.
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="font-bold text-white mb-1 uppercase tracking-tighter">Tableau</p>
                            Cards can be placed on other cards if they are of the opposite color and exactly one rank lower.
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-64 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-2">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Global Duel Mode</p>
                    <p className="text-xs text-indigo-200/70">
                        You and the AI start with the exact same deck. The first one to clear the board or reach the highest score wins.
                        Switch between boards using the tabs above.
                    </p>
                </div>
            </div>
        </div>
    );
}
