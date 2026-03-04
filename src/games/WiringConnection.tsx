import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy, Skull, Zap, Lightbulb, Play, Settings2, Info, Loader2 } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

type TileType = 'straight' | 'corner' | 't-shape' | 'cross' | 'source' | 'target' | 'empty';

interface Tile {
    type: TileType;
    rotation: number; // 0, 90, 180, 270
    id: string;
}

const GRID_SIZE = 5;

// Define connections for each tile type at 0 rotation
// Array of [N, E, S, W] 
const CONNECTIONS: Record<TileType, boolean[]> = {
    'straight': [true, false, true, false],
    'corner': [true, true, false, false],
    't-shape': [true, true, false, true],
    'cross': [true, true, true, true],
    'source': [false, true, false, false], // Source always points East
    'target': [false, false, false, true], // Target always expects from West
    'empty': [false, false, false, false]
};

const rotateConnections = (conns: boolean[], rotation: number): boolean[] => {
    const shifts = (rotation / 90) % 4;
    const result = [...conns];
    for (let i = 0; i < shifts; i++) {
        const last = result.pop()!;
        result.unshift(last);
    }
    return result;
};

export default function WiringConnection() {
    const [grid, setGrid] = useState<Tile[][]>([]);
    const [isPowered, setIsPowered] = useState<boolean[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [level, setLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [penalty, setPenalty] = useState<string | null>(null);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const generateLevel = useCallback(async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        setGameOver(false);
        setPenalty(null);
        resetSessionTokens();

        const systemPrompt = `You are a level designer for a "Wiring Connection" puzzle game.
    The game is a ${GRID_SIZE}x${GRID_SIZE} grid.
    Source is at (0, 2) pointing East.
    Target is at (${GRID_SIZE - 1}, 2) pointing West.
    
    Tiles: "straight", "corner", "t-shape", "cross", "empty".
    
    Generate a JSON grid that is SOLVABLE. 
    A solvable grid means there exists a set of rotations for each tile such that a path exists from source to target.
    
    Respond with ONLY a JSON object:
    {
      "tiles": [
        ["source", "corner", "straight", ...],
        [...]
      ]
    }
    The "source" must be at row 2, col 0. The "target" must be at row 2, col ${GRID_SIZE - 1}.
    All other cells should be one of the tile types.`;

        try {
            const response = await getLlmResponse(
                `Generate level ${level} difficulty. Use a mix of tiles. Make it challenging but solvable.`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                'wiring'
            );

            if (!isMounted.current) return;

            const data = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
            const tileTypes: TileType[][] = data.tiles;

            if (!tileTypes || tileTypes.length !== GRID_SIZE) {
                throw new Error('Invalid grid received');
            }

            const newGrid: Tile[][] = tileTypes.map((row, r) =>
                row.map((type, c) => ({
                    type,
                    rotation: Math.floor(Math.random() * 4) * 90,
                    id: `${r}-${c}-${Math.random()}`
                }))
            );

            // Force source and target positions to be sure
            newGrid[2][0] = { type: 'source', rotation: 0, id: `2-0-static` };
            newGrid[2][GRID_SIZE - 1] = { type: 'target', rotation: 0, id: `2-${GRID_SIZE - 1}-static` };

            setGrid(newGrid);
            checkConnectivity(newGrid);
        } catch (error) {
            console.error('Failed to generate level:', error);
            // Fallback grid
            const fallback: Tile[][] = Array(GRID_SIZE).fill(0).map((_, r) =>
                Array(GRID_SIZE).fill(0).map((_, c) => ({
                    type: 'straight',
                    rotation: Math.floor(Math.random() * 4) * 90,
                    id: `${r}-${c}-fallback`
                }))
            );
            fallback[2][0] = { type: 'source', rotation: 0, id: '2-0-f' };
            fallback[2][GRID_SIZE - 1] = { type: 'target', rotation: 0, id: `2-${GRID_SIZE - 1}-f` };
            setGrid(fallback);
            checkConnectivity(fallback);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, [level, apiKeys, selectedLlm]);

    useEffect(() => {
        generateLevel();
    }, [level]);

    const checkConnectivity = (currentGrid: Tile[][]) => {
        const powered = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false));
        const queue: [number, number][] = [];

        // Start from source (2, 0)
        queue.push([2, 0]);
        powered[2][0] = true;

        while (queue.length > 0) {
            const [r, c] = queue.shift()!;
            const tile = currentGrid[r][c];
            const myConns = rotateConnections(CONNECTIONS[tile.type], tile.rotation);

            // Neighbors: N, E, S, W
            const dr = [-1, 0, 1, 0];
            const dc = [0, 1, 0, -1];
            const opposites = [2, 3, 0, 1]; // Index of reciprocal connection

            for (let i = 0; i < 4; i++) {
                if (!myConns[i]) continue;

                const nr = r + dr[i];
                const nc = c + dc[i];

                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !powered[nr][nc]) {
                    const neighborTile = currentGrid[nr][nc];
                    const neighborConns = rotateConnections(CONNECTIONS[neighborTile.type], neighborTile.rotation);

                    if (neighborConns[opposites[i]]) {
                        powered[nr][nc] = true;
                        queue.push([nr, nc]);
                    }
                }
            }
        }

        setIsPowered(powered);

        if (powered[2][GRID_SIZE - 1]) {
            handleWin();
        }
    };

    const handleWin = async () => {
        if (gameOver || !isMounted.current) return;
        setGameOver(true);

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'wiring',
                    winner: 'user',
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const rotateTile = (r: number, c: number) => {
        if (gameOver || isLoading) return;
        const tile = grid[r][c];
        if (tile.type === 'source' || tile.type === 'target' || tile.type === 'empty') return;

        const newGrid = [...grid];
        newGrid[r][c] = { ...tile, rotation: (tile.rotation + 90) % 360 };
        setGrid(newGrid);
        checkConnectivity(newGrid);
    };

    const nextLevel = () => {
        setLevel(prev => prev + 1);
    };

    const renderTileIcon = (type: TileType, powered: boolean) => {
        const color = powered ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-600';
        switch (type) {
            case 'straight':
                return (
                    <div className={`w-full h-1 bg-current absolute rounded-full ${color}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
                        <div className="absolute inset-0 bg-current opacity-20 blur-[2px]" />
                    </div>
                );
            case 'corner':
                return (
                    <div className={`w-full h-full relative ${color}`}>
                        <div className="absolute w-1 h-1/2 bg-current left-1/2 -ml-0.5 top-0" />
                        <div className="absolute h-1 w-1/2 bg-current top-1/2 -mt-0.5 right-0" />
                        <div className="absolute w-2 h-2 rounded-full bg-current top-1/2 left-1/2 -ml-1 -mt-1" />
                    </div>
                );
            case 't-shape':
                return (
                    <div className={`w-full h-full relative ${color}`}>
                        <div className="absolute w-1 h-full bg-current left-1/2 -ml-0.5" />
                        <div className="absolute h-1 w-1/2 bg-current top-1/2 -mt-0.5 right-0" />
                    </div>
                );
            case 'cross':
                return (
                    <div className={`w-full h-full relative ${color}`}>
                        <div className="absolute w-1 h-full bg-current left-1/2 -ml-0.5" />
                        <div className="absolute h-1 w-full bg-current top-1/2 -mt-0.5" />
                    </div>
                );
            case 'source':
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="relative">
                            <Zap className={`w-8 h-8 ${powered ? 'text-yellow-400' : 'text-slate-500'} animate-pulse`} />
                            <div className="absolute -right-1 top-1/2 -mt-0.5 w-4 h-1 bg-yellow-400 rounded-full" />
                        </div>
                    </div>
                );
            case 'target':
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="relative">
                            <Lightbulb className={`w-8 h-8 ${powered ? 'text-yellow-400 fill-yellow-400/20' : 'text-slate-500'}`} />
                            <div className="absolute -left-1 top-1/2 -mt-0.5 w-4 h-1 bg-slate-500 rounded-full" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center bg-slate-900 border border-white/10 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grid Level</p>
                            <p className="text-xl font-black text-indigo-400">{level}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Zap className={`w-4 h-4 ${isPowered[2]?.[GRID_SIZE - 1] ? 'text-yellow-400' : 'text-slate-600'}`} />
                            <p className="text-sm font-bold text-slate-300">System Path: {isPowered[2]?.[GRID_SIZE - 1] ? 'CONNECTED' : 'OPEN LINK'}</p>
                        </div>
                    </div>
                    <button onClick={generateLevel} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <RefreshCw className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="bg-slate-950 p-4 sm:p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden aspect-square flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-slate-400 font-medium">AI is synthesizing power grid...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full max-w-[500px]">
                            {grid.length > 0 && grid.map((row, r) => row.map((tile, c) => (
                                <motion.button
                                    key={tile.id}
                                    onClick={() => rotateTile(r, c)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`aspect-square rounded-xl sm:rounded-2xl relative flex items-center justify-center transition-all duration-300 border-2 ${tile.type === 'source' || tile.type === 'target'
                                        ? 'bg-indigo-500/10 border-indigo-500/20 shadow-inner'
                                        : tile.type === 'empty'
                                            ? 'bg-transparent border-transparent'
                                            : 'bg-slate-900 border-white/5 hover:border-white/20 active:bg-slate-800'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ rotate: tile.rotation }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className="w-full h-full relative"
                                    >
                                        {renderTileIcon(tile.type, isPowered[r]?.[c] ?? false)}
                                    </motion.div>
                                </motion.button>
                            )))}
                        </div>
                    )}

                    <AnimatePresence>
                        {gameOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-8"
                            >
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border-2 border-emerald-500/50">
                                        <Trophy className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h3 className="text-4xl font-black text-white">Grid Restored!</h3>
                                    <p className="text-slate-400">Level {level} completed. The power flow is stable.</p>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={nextLevel}
                                            className="flex-1 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Play className="w-5 h-5" /> Next Level
                                        </button>
                                        <ShareButtons
                                            gameTitle="Wiring Connection"
                                            result={`restored power grid level ${level}`}
                                            score={level}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="w-full md:w-80 space-y-6">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <Settings2 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">System Manual</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">1</div>
                            <p className="text-sm text-slate-400 leading-relaxed">The power originates from the <span className="text-indigo-300 font-bold">Source (Zap Icon)</span> on the left.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">2</div>
                            <p className="text-sm text-slate-400 leading-relaxed"><span className="text-indigo-300 font-bold">Click</span> on any wire segment to rotate it by 90 degrees.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">3</div>
                            <p className="text-sm text-slate-400 leading-relaxed">Form a continuous path to the <span className="text-indigo-300 font-bold">Bulb</span> to restore power and complete the level.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 flex gap-4 items-start">
                    <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                    <div className="space-y-1">
                        <p className="text-sm text-white font-bold">Tech Tip</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Powered wires will glow with yellow energy. Use T-junctions to split paths and corners to navigate around obstacles.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
