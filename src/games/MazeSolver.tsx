import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
    RefreshCw,
    Trophy,
    Skull,
    Info,
    MapPin,
    Flag,
    User,
    Bot,
    Zap,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BrainCircuit,
    Timer,
    Lightbulb,
    Search,
    MessageSquareQuote
} from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
type Cell = 0 | 1; // 0: path, 1: wall
type Position = [number, number];

interface MazeData {
    grid: Cell[][];
    start: Position;
    end: Position;
    tactics: string;
    parTime: number;
    title: string;
}

export default function MazeSolver() {
    // --- State ---
    const [maze, setMaze] = useState<MazeData | null>(null);
    const [playerPos, setPlayerPos] = useState<Position>([0, 0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameState, setGameState] = useState<'won' | 'lost' | 'playing'>('playing');
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintPath, setHintPath] = useState<Position[]>([]);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();

    // --- Refs ---
    const isMounted = useRef(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const GRID_SIZE = 14;

    // --- Maze Solver (BFS for verification) ---
    const solveMaze = useCallback((grid: Cell[][], start: Position, end: Position): Position[] | null => {
        const rows = grid.length;
        const cols = grid[0].length;
        const queue: [Position, Position[]][] = [[start, [start]]];
        const visited = new Set<string>();
        visited.add(`${start[0]},${start[1]}`);

        while (queue.length > 0) {
            const [[r, c], path] = queue.shift()!;
            if (r === end[0] && c === end[1]) return path;

            const neighbors: Position[] = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
            for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0 && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    queue.push([[nr, nc], [...path, [nr, nc]]]);
                }
            }
        }
        return null;
    }, []);

    // --- Generation ---
    const generateMaze = useCallback(async () => {
        if (!isMounted.current) return;
        setIsGenerating(true);
        setMaze(null);
        setIsGameOver(false);
        setGameState('playing');
        setFunnyTask(null);
        setTime(0);
        setShowHint(false);
        setHintPath([]);
        resetSessionTokens();

        const prompt = `Act as an AI Maze Architect. Generate a complex 14x14 maze.
        
        Requirements:
        1. 'grid' is a 14x14 2D array of 0 (path) and 1 (wall).
        2. 'start' is [0, 0], 'end' is [13, 13].
        3. MUST be solvable.
        4. 'title' is a cool name for this maze.
        5. 'tactics' is a cryptic strategic hint.
        6. 'parTime' is estimated completion time in seconds.

        Return strictly JSON:
        {
            "title": "Stellar Labyrinth",
            "grid": [[0,1,...], ...],
            "start": [0, 0],
            "end": [13, 13],
            "tactics": "Follow the shadows of the binary stars...",
            "parTime": 35
        }`;

        try {
            let validMaze = false;
            let attempts = 0;
            let data: MazeData | null = null;

            while (!validMaze && attempts < 2) {
                const response = await getLlmResponse(prompt, apiKeys, selectedLlm, "Maze Logic Expert", 'mazesolver');
                data = JSON.parse(response);

                if (data && data.grid) {
                    const solution = solveMaze(data.grid, data.start, data.end);
                    if (solution) {
                        validMaze = true;
                        setMaze(data);
                        setPlayerPos(data.start);
                        setHintPath(solution);
                    }
                }
                attempts++;
            }

            if (!validMaze) throw new Error("Could not generate solvable maze");

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => setTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error("AI Maze Generation Failed:", err);
            // Emergency local generation logic could go here, but for now we'll just try again or show error
        } finally {
            setIsGenerating(false);
        }
    }, [apiKeys, selectedLlm, resetSessionTokens, solveMaze]);

    useEffect(() => {
        isMounted.current = true;
        generateMaze();
        return () => {
            isMounted.current = false;
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [generateMaze]);

    // --- Movement ---
    const handleMove = useCallback((dr: number, dc: number) => {
        if (isGameOver || !maze || isGenerating) return;

        setPlayerPos(prev => {
            const nr = prev[0] + dr;
            const nc = prev[1] + dc;

            if (nr >= 0 && nr < maze.grid.length && nc >= 0 && nc < maze.grid[0].length && maze.grid[nr][nc] === 0) {
                if (nr === maze.end[0] && nc === maze.end[1]) {
                    finishGame('won');
                }
                return [nr, nc];
            }
            return prev;
        });
    }, [isGameOver, maze, isGenerating]);

    const finishGame = async (status: 'won' | 'lost') => {
        if (!isMounted.current || isGameOver) return;
        setIsGameOver(true);
        setGameState(status);
        if (timerRef.current) clearInterval(timerRef.current);

        let task = null;
        if (status === 'lost' || (status === 'won' && time > (maze?.parTime || 30) * 2)) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Maze Runner');
            setFunnyTask(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'mazesolver',
                    winner: status === 'won' ? 'user' : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens,
                    score: `${time}s`
                })
            });
        }
    };

    // Keyboard
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                if (e.key === 'ArrowUp') handleMove(-1, 0);
                if (e.key === 'ArrowDown') handleMove(1, 0);
                if (e.key === 'ArrowLeft') handleMove(0, -1);
                if (e.key === 'ArrowRight') handleMove(0, 1);
            }
        };
        window.addEventListener('keydown', down);
        return () => window.removeEventListener('keydown', down);
    }, [handleMove]);

    // --- Rendering ---
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-10">
                <motion.div
                    animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="relative"
                >
                    <BrainCircuit className="w-24 h-24 text-indigo-500" />
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full"
                    />
                </motion.div>
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase tabular-nums">Constructing Void</h2>
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                className="w-3 h-3 bg-indigo-500 rounded-full"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!maze) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20 space-y-10">
            {/* HUD */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 border-b-white/10 shadow-2xl">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                            <Zap className="w-10 h-10 text-amber-400 fill-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{maze.title}</h2>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">Neural Labyrinth v2.0</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <div className="flex-1 min-w-[140px] bg-slate-950/60 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center">
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Timer className="w-3 h-3" /> Elapsed
                        </p>
                        <p className="text-3xl font-black text-white tabular-nums italic">{time}s</p>
                    </div>
                    <div className="flex-1 min-w-[140px] bg-slate-950/60 p-5 rounded-[2rem] border border-white/5 flex flex-col items-center">
                        <p className="text-[10px] text-amber-500/60 font-extrabold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Trophy className="w-3 h-3" /> Par Time
                        </p>
                        <p className="text-3xl font-black text-amber-400 tabular-nums italic">{maze.parTime}s</p>
                    </div>
                    <button
                        onClick={generateMaze}
                        className="p-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[2rem] transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)] active:scale-95 flex items-center gap-3"
                    >
                        <RefreshCw className="w-7 h-7" />
                        <span className="font-black text-xs uppercase hidden sm:inline">New Maze</span>
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
                {/* Labyrinth */}
                <div className="relative flex justify-center">
                    <div className="absolute -inset-20 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative p-6 bg-slate-900 rounded-[3.5rem] border-4 border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
                        <div
                            className="grid gap-1 lg:gap-2"
                            style={{
                                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                                width: 'min(90vw, 600px)',
                                aspectRatio: '1/1'
                            }}
                        >
                            {maze.grid.map((row, rIdx) =>
                                row.map((cell, cIdx) => {
                                    const isStart = maze.start[0] === rIdx && maze.start[1] === cIdx;
                                    const isEnd = maze.end[0] === rIdx && maze.end[1] === cIdx;
                                    const isP = playerPos[0] === rIdx && playerPos[1] === cIdx;
                                    const isHint = hintPath.some(p => p[0] === rIdx && p[1] === cIdx);

                                    return (
                                        <div
                                            key={`${rIdx}-${cIdx}`}
                                            className={`
                                                rounded-lg transition-all duration-300 relative
                                                ${cell === 1 ? 'bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-slate-950/50 hover:bg-slate-950'}
                                                ${isStart ? 'ring-2 ring-emerald-500/20' : ''}
                                                ${isEnd ? 'ring-2 ring-rose-500/20' : ''}
                                            `}
                                        >
                                            {isStart && !isP && <MapPin className="absolute inset-0 m-auto w-4 h-4 text-emerald-500/30" />}
                                            {isEnd && !isP && <Flag className="absolute inset-0 m-auto w-4 h-4 text-rose-500/40 animate-pulse" />}

                                            {/* Hint Path */}
                                            {showHint && isHint && !isP && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute inset-2 bg-indigo-500/20 rounded-full"
                                                />
                                            )}

                                            {isP && (
                                                <motion.div
                                                    layoutId="cursor"
                                                    className="absolute inset-1 bg-indigo-500 rounded-md z-20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                                                >
                                                    <User className="w-full h-full p-1 text-white" />
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8 h-full">
                    {/* Tactics */}
                    <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Lightbulb className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-black text-sm uppercase tracking-widest underline decoration-indigo-500 underline-offset-8">Architect's Note</h3>
                        </div>
                        <p className="text-slate-400 font-medium italic leading-relaxed">
                            "{maze.tactics}"
                        </p>
                    </div>

                    {/* Hint Button */}
                    <button
                        onClick={() => setShowHint(!showHint)}
                        className={`w-full p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group
                            ${showHint ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-indigo-500/30'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <Search className="w-6 h-6" />
                            <span className="font-black text-xs uppercase tracking-widest">{showHint ? 'System Revealing...' : 'Request Scan'}</span>
                        </div>
                        {!showHint && <span className="text-[10px] font-bold opacity-50 bg-white/5 px-3 py-1 rounded-full uppercase">Analyze</span>}
                    </button>

                    {/* Controls Display */}
                    <div className="grid grid-cols-3 gap-3">
                        <div />
                        <button onClick={() => handleMove(-1, 0)} className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex justify-center hover:bg-slate-800 active:scale-95"><ChevronUp className="text-slate-400" /></button>
                        <div />
                        <button onClick={() => handleMove(0, -1)} className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex justify-center hover:bg-slate-800 active:scale-95"><ChevronLeft className="text-slate-400" /></button>
                        <button onClick={() => handleMove(1, 0)} className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex justify-center hover:bg-slate-800 active:scale-95"><ChevronDown className="text-slate-400" /></button>
                        <button onClick={() => handleMove(0, 1)} className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 flex justify-center hover:bg-slate-800 active:scale-95"><ChevronRight className="text-slate-400" /></button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
                    >
                        <div className="w-full max-w-2xl bg-slate-900 rounded-[4rem] border border-white/10 p-16 shadow-2xl text-center space-y-12">
                            {gameState === 'won' ? (
                                <div className="space-y-6">
                                    <div className="relative inline-block">
                                        <Trophy className="w-32 h-32 text-emerald-400 mx-auto drop-shadow-[0_0_50px_rgba(52,211,153,0.4)]" />
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute -inset-8 border border-emerald-500/10 rounded-full border-dashed" />
                                    </div>
                                    <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">Navigator!</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Extraction Successful • {time}s</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <Skull className="w-32 h-32 text-rose-500 mx-auto drop-shadow-[0_0_50px_rgba(244,63,94,0.4)]" />
                                    <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">System Fail</h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Connection Terminated • Trap Detected</p>
                                </div>
                            )}

                            {funnyTask && (
                                <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] relative group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20" />
                                    <MessageSquareQuote className="absolute right-6 top-6 w-12 h-12 text-indigo-500/10" />
                                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Bot className="w-3 h-3" /> Architect's Decree
                                    </p>
                                    <p className="text-2xl text-indigo-100 font-bold italic leading-relaxed">
                                        "{funnyTask}"
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <ShareButtons
                                    gameTitle="Maze Master"
                                    result={gameState === 'won' ? 'extracted successfully from the neural void' : 'got assimilated by the maze'}
                                    score={`${time}s`}
                                    penalty={funnyTask}
                                    onPlayAgain={generateMaze}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
