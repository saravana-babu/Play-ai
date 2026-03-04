import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Target, Flag, RefreshCw, Trophy, Skull, Zap, AlertTriangle, Navigation, Map as MapIcon } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
type CellType = 'empty' | 'wall' | 'start' | 'end';

interface GridCell {
    row: number;
    col: number;
    type: CellType;
}

interface RobotState {
    grid: GridCell[];
    robotPos: { row: number, col: number };
    steps: number;
}

// --- Constants ---
const GRID_SIZE = 10;

// --- Component ---
export default function RobotPath() {
    const [gameState, setGameState] = useState<RobotState | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [path, setPath] = useState<{ row: number, col: number }[]>([]);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGrid = useCallback(() => {
        const grid: GridCell[] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let type: CellType = 'empty';
                if (r === 0 && c === 0) type = 'start';
                if (r === GRID_SIZE - 1 && c === GRID_SIZE - 1) type = 'end';
                // Random walls but leave path openish
                if (type === 'empty' && Math.random() < 0.25) type = 'wall';

                grid.push({ row: r, col: c, type });
            }
        }

        setGameState({
            grid,
            robotPos: { row: 0, col: 0 },
            steps: 0
        });
        setPath([{ row: 0, col: 0 }]);
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGrid();
        return () => { isMounted.current = false; };
    }, [initGrid]);

    const moveRobot = (row: number, col: number) => {
        if (!gameState || gameOver || isAiThinking) return;

        // Check adjacency and walls
        const { robotPos } = gameState;
        const isAdjacent = Math.abs(row - robotPos.row) + Math.abs(col - robotPos.col) === 1;
        const targetCell = gameState.grid.find(c => c.row === row && c.col === col);

        if (isAdjacent && targetCell?.type !== 'wall') {
            const nextState = {
                ...gameState,
                robotPos: { row, col },
                steps: gameState.steps + 1
            };
            setGameState(nextState);
            setPath(prev => [...prev, { row, col }]);

            if (targetCell?.type === 'end') {
                finishGame('player');
            }
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Robot Pathfinding');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'robotpath', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    // AI Logic would use a pathfinding algorithm or LLM
    // For now, simpler duel pattern

    if (!gameState) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Energy Used</p>
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <p className="text-2xl font-black text-white">{gameState.steps} <span className="text-xs text-slate-500">kW</span></p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={initGrid} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                <div className="lg:col-span-3 bg-slate-950 rounded-[40px] border border-white/5 p-4 sm:p-10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                    <div className="grid grid-cols-10 gap-1 w-full max-w-[500px]">
                        {gameState.grid.map((cell, i) => {
                            const isRobot = gameState.robotPos.row === cell.row && gameState.robotPos.col === cell.col;
                            const isPath = path.some(p => p.row === cell.row && p.col === cell.col);

                            return (
                                <motion.div
                                    key={i}
                                    onClick={() => moveRobot(cell.row, cell.col)}
                                    className={`aspect-square rounded-sm flex items-center justify-center relative transition-all cursor-pointer
                                        ${cell.type === 'wall' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800/80'}
                                        ${isPath && !isRobot ? 'bg-indigo-500/10' : ''}`}
                                >
                                    {cell.type === 'start' && <Flag className="w-4 h-4 text-emerald-400" />}
                                    {cell.type === 'end' && <Target className="w-4 h-4 text-rose-500 animate-pulse" />}
                                    {isRobot && (
                                        <motion.div layoutId="robot" className="w-full h-full bg-indigo-500 flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10">
                                            <Bot className="w-6 h-6 text-white" />
                                        </motion.div>
                                    )}
                                    {cell.type === 'wall' && <div className="absolute inset-1 border border-white/5 rounded-sm" />}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 flex flex-col p-8 space-y-8 shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Navigation className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Nav System</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Guide the autonomous unit to the target coordinates using minimum energy steps.
                        </p>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                        {path.slice(-5).map((p, i) => (
                            <div key={i} className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                                <span className="w-4 h-4 bg-white/5 rounded flex items-center justify-center">{i + 1}</span>
                                <span className="uppercase tracking-tighter text-indigo-400">POS_LOG_{i}</span>
                                <span>[{p.row}, {p.col}]</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4 items-center">
                        <MapIcon className="w-5 h-5 text-indigo-400" />
                        <div>
                            <p className="text-[10px] text-white font-black uppercase">Shortest Path AI</p>
                            <p className="text-[9px] text-slate-500 italic">Finding optimal route...</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8">
                        <div className="text-center space-y-8 max-w-sm w-full">
                            <div className="space-y-4">
                                <Trophy className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">MISSION_COMPLETE</h2>
                                <p className="text-slate-400 font-medium tracking-widest text-[10px]">Target reached in {gameState.steps} steps.</p>
                            </div>
                            <div className="space-y-4">
                                <ShareButtons gameTitle="Robot Pathfinding" result="successfully navigated the complex maze" score={gameState.steps} />
                                <button onClick={initGrid} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">NEW COORDINATES</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
