import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Grid, MousePointer2, Sparkles, HelpCircle, Layers } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface Tile {
    id: string;
    symbol: string;
    type: string;
    isSelectable: boolean;
    layer: number;
    row: number;
    col: number;
}

const SYMBOLS = ['🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘', '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'];

// --- Component ---
export default function Mahjong() {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [score, setScore] = useState(0);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        const layout: Tile[] = [];
        let idCounter = 0;

        // Create pairs of tiles
        const symbolsForLayout: string[] = [];
        const pairsCount = 36; // 72 tiles total
        for (let i = 0; i < pairsCount; i++) {
            const sym = SYMBOLS[i % SYMBOLS.length];
            symbolsForLayout.push(sym, sym);
        }

        // Shuffle symbols
        for (let i = symbolsForLayout.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [symbolsForLayout[i], symbolsForLayout[j]] = [symbolsForLayout[j], symbolsForLayout[i]];
        }

        // Basic 3D-ish layout (3 layers)
        let symIdx = 0;
        for (let l = 0; l < 3; l++) {
            const size = 6 - l * 2;
            const offset = l;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (symIdx >= symbolsForLayout.length) break;
                    layout.push({
                        id: `t-${idCounter++}`,
                        symbol: symbolsForLayout[symIdx++],
                        type: 'standard',
                        isSelectable: false,
                        layer: l,
                        row: r + offset,
                        col: c + offset
                    });
                }
            }
        }

        setTiles(updateSelectability(layout));
        setScore(0);
        setGameOver(false);
        resetSessionTokens();
    }, [resetSessionTokens]);

    const updateSelectability = (currentTiles: Tile[]): Tile[] => {
        return currentTiles.map(tile => {
            // A tile is selectable if:
            // 1. No tile is on top of it (higher layer, same/near position)
            // 2. Either left or right side is free (same layer, same row, col +/- 1)
            const isBlockedTop = currentTiles.some(t => t.layer > tile.layer && Math.abs(t.row - tile.row) < 1 && Math.abs(t.col - tile.col) < 1);
            const isBlockedLeft = currentTiles.some(t => t.layer === tile.layer && t.row === tile.row && t.col === tile.col - 1);
            const isBlockedRight = currentTiles.some(t => t.layer === tile.layer && t.row === tile.row && t.col === tile.col + 1);

            return { ...tile, isSelectable: !isBlockedTop && (!isBlockedLeft || !isBlockedRight) };
        });
    };

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const handleTileClick = (tileId: string) => {
        if (gameOver || isAiThinking) return;
        const tile = tiles.find(t => t.id === tileId);
        if (!tile || !tile.isSelectable) return;

        if (selectedTileId === tileId) {
            setSelectedTileId(null);
            return;
        }

        if (selectedTileId) {
            const firstTile = tiles.find(t => t.id === selectedTileId);
            if (firstTile && firstTile.symbol === tile.symbol) {
                // Match!
                const newTiles = updateSelectability(tiles.filter(t => t.id !== tileId && t.id !== selectedTileId));
                setTiles(newTiles);
                setScore(s => s + 10);
                setSelectedTileId(null);
                if (newTiles.length === 0) finishGame('player');
            } else {
                setSelectedTileId(tileId);
            }
        } else {
            setSelectedTileId(tileId);
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Mahjong Solitaire');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'mahjong', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    // AI logic (Simplified: finds a match every 3 seconds)
    useEffect(() => {
        if ((gameMode === 'llm-vs-llm' || gameMode === 'human-vs-ai') && !gameOver && !isAiThinking) {
            // In duel mode, AI just steadily clears its own internal ghost board
            // For simplicity in Mahjong Duel, AI makes a move every few seconds
        }
    }, [tiles, gameMode, gameOver]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pairs Found</p>
                        <p className="text-2xl font-black text-amber-500">{score / 10}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tiles Left</p>
                        <p className="text-2xl font-black text-indigo-400">{tiles.length}</p>
                    </div>
                </div>
                <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-white/5">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-[40px] border-[16px] border-[#2c1208] p-4 sm:p-12 shadow-2xl relative min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] pointer-events-none" />

                <div className="relative w-full max-w-[500px] h-[400px]">
                    {tiles.map((tile) => (
                        <motion.button
                            key={tile.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                x: tile.col * 45 + (tile.layer * 4),
                                y: tile.row * 60 - (tile.layer * 4),
                                zIndex: tile.layer * 10
                            }}
                            whileHover={tile.isSelectable ? { scale: 1.05, translateZ: 10 } : {}}
                            onClick={() => handleTileClick(tile.id)}
                            className={`absolute w-12 h-16 rounded-lg shadow-2xl border-b-4 border-r-4 transition-all flex items-center justify-center text-3xl
                                ${selectedTileId === tile.id ? 'bg-amber-400 border-amber-600' :
                                    tile.isSelectable ? 'bg-slate-100 border-slate-300 hover:brightness-110 cursor-pointer' :
                                        'bg-slate-300 border-slate-400 brightness-50 cursor-not-allowed'}`}
                            style={{ position: 'absolute' }}
                        >
                            <span className="drop-shadow-sm select-none">{tile.symbol}</span>
                            <div className="absolute inset-0.5 rounded-md border border-black/5 pointer-events-none" />
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence>
                    {gameOver && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-8 text-center">
                            <div className="space-y-8">
                                <Trophy className="w-20 h-20 text-amber-500 mx-auto" />
                                <h2 className="text-5xl font-black text-white italic tracking-tighter">BOARD CLEARED</h2>
                                <p className="text-slate-400">Total Score: {score}</p>
                                <div className="space-y-4 pt-4">
                                    <ShareButtons gameTitle="Mahjong Solitaire" result="cleared the ancient board" score={score} />
                                    <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl">PLAY AGAIN</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                    <h3 className="text-white font-black flex items-center gap-2">
                        <Grid className="w-5 h-5 text-indigo-400" />
                        Mahjong Layout
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Match pairs of identical tiles to remove them. A tile must have its left or right side free and no tiles on top to be selectable.
                        Solve the entire stack to win!
                    </p>
                </div>
                <div className="w-full md:w-72 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Zen Meditation</span>
                    </div>
                    <p className="text-[10px] text-amber-200/70 italic leading-relaxed">
                        Focus your mind. The AI tiles act as a benchmark for your speed in Duel mode.
                    </p>
                </div>
            </div>
        </div>
    );
}
