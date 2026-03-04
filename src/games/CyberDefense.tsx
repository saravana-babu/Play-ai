import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, Zap, Terminal, Lock, Unlock, Cpu, RefreshCw, Trophy, Skull, Activity, Binary, User } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
type NodeType = 'entry' | 'relay' | 'firewall' | 'core';
type Owner = 'neutral' | 'ai' | 'player';

interface Node {
    id: string;
    type: NodeType;
    owner: Owner;
    health: number; // 0 to 100
    row: number;
    col: number;
}

interface CyberState {
    nodes: Node[];
    turn: 'player' | 'ai';
    power: number; // Resources to take actions
    generation: number;
}

// --- Constants ---
const GRID_SIZE = 5;
const MAX_HEALTH = 100;
const POWER_GAIN = 10;

// --- Component ---
export default function CyberDefense() {
    const [gameState, setGameState] = useState<CyberState | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>(['[SYS] SECURITY_PROTOCOLS_INITIALIZED', '[SYS] STANDING_BY_FOR_INTRUSION']);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 10));
    };

    const initGame = useCallback(() => {
        const nodes: Node[] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let type: NodeType = 'relay';
                if (r === 0 && c === 2) type = 'entry';
                if (r === GRID_SIZE - 1 && c === 2) type = 'core';

                nodes.push({
                    id: `${r}-${c}`,
                    type,
                    owner: type === 'entry' ? 'ai' : type === 'core' ? 'player' : 'neutral',
                    health: MAX_HEALTH,
                    row: r,
                    col: c
                });
            }
        }

        setGameState({
            nodes,
            turn: 'player',
            power: 50,
            generation: 1
        });
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        setLogs(['[SYS] NETWORK_TOPOLOGY_MAPPED', '[SYS] FIREWALL_READY']);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    // --- Action Logic ---
    const handleAction = (nodeId: string, action: 'defend' | 'attack') => {
        if (!gameState || gameState.turn !== 'player' || gameOver || isAiThinking) return;
        if (gameMode === 'llm-vs-llm') return;

        processAction('player', nodeId, action);
    };

    const processAction = (actor: 'player' | 'ai', nodeId: string, action: 'defend' | 'attack') => {
        setGameState(prev => {
            if (!prev) return null;
            const cost = action === 'defend' ? 20 : 30;
            if (prev.power < cost) {
                addLog(`[WARN] INSUFFICIENT_POWER: ${actor.toUpperCase()}`);
                return prev;
            }

            const newNodes = prev.nodes.map(node => {
                if (node.id === nodeId) {
                    if (action === 'defend') {
                        return { ...node, owner: actor, health: Math.min(MAX_HEALTH, node.health + 40) };
                    } else {
                        const newHealth = node.health - (actor === 'player' ? 50 : 40);
                        if (newHealth <= 0) {
                            return { ...node, owner: actor, health: MAX_HEALTH / 2 };
                        }
                        return { ...node, health: newHealth };
                    }
                }
                return node;
            });

            addLog(`[${actor === 'player' ? 'USR' : 'EXT'}] ${action.toUpperCase()}_NODE_${nodeId}`);

            // End Turn Logic
            const nextTurn = actor === 'player' ? 'ai' : 'player';
            const newPower = Math.min(100, prev.power - cost + POWER_GAIN);

            const newState = {
                ...prev,
                nodes: newNodes,
                turn: nextTurn,
                power: newPower,
                generation: prev.generation + 1
            };

            checkWin(newState);
            return newState;
        });
    };

    const checkWin = (state: CyberState) => {
        const core = state.nodes.find(n => n.type === 'core');
        const entry = state.nodes.find(n => n.type === 'entry');

        if (core?.owner === 'ai') finishGame('ai');
        else if (entry?.owner === 'player') finishGame('player');
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        if (gameOver) return;
        setGameOver(true);
        setWinner(gameWinner);

        let task = null;
        if (gameWinner === 'ai' && gameMode !== 'llm-vs-llm' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Cyber Defense');
            setFunnyTask(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'cybersecurity',
                    winner: gameWinner === 'player' ? 'user' : 'ai',
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    // --- AI Logic ---
    useEffect(() => {
        if (!gameOver && !isAiThinking) {
            if (gameMode === 'llm-vs-llm' || (gameMode === 'human-vs-ai' && gameState?.turn === 'ai')) {
                const llm: LlmProvider = (gameMode === 'llm-vs-llm' && gameState?.turn === 'player') ? (player1Llm as LlmProvider) : (selectedLlm as LlmProvider);
                makeAiMove(llm);
            }
        }
    }, [gameState?.turn, gameMode, gameOver]);

    const makeAiMove = async (llm: LlmProvider) => {
        if (!gameState || !apiKeys[llm] || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const systemInstruction = `You are a hacker playing "Cyber Defense".
            The grid is 5x5. Entry is 0-2, Core is 4-2.
            Nodes: ${gameState.nodes.map(n => `(${n.id}:${n.owner}:${n.health}HP)`).join(', ')}
            Your Power: ${gameState.power}
            Goal: Capture the CORE by attacking adjacent nodes.
            Return JSON: {"nodeId": "r-c", "action": "attack" | "defend"}`;

            const response = await generateNextMove(llm, apiKeys, 'cybersecurity', gameState, systemInstruction);

            if (isMounted.current && response?.nodeId && response?.action) {
                processAction(gameState.turn, response.nodeId, response.action);
            } else {
                // Fallback
                const targets = gameState.nodes.filter(n => n.owner !== gameState.turn);
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                processAction(gameState.turn, randomTarget.id, 'attack');
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    if (!gameState) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl gap-4">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Grid Power</p>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                            <p className="text-2xl font-black text-white">{gameState.power}<span className="text-xs text-slate-500">/100</span></p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Active Turn</p>
                        <div className="flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/10">
                            {gameState.turn === 'player' ? <User className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />}
                            <p className="text-sm font-black uppercase text-white">{gameState.turn === 'player' ? (gameMode === 'llm-vs-llm' ? 'HACKER 1' : 'USER') : 'HACKER 2'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end mr-4">
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Activity key={i} className={`w-3 h-3 ${i < 3 ? 'text-indigo-500' : 'text-slate-700'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-indigo-500/30">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Main Board */}
                <div className="lg:col-span-2 bg-slate-950 rounded-[40px] border border-indigo-500/20 p-8 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl ring-1 ring-indigo-500/10">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.5)]" />

                    <div className="grid grid-cols-5 gap-3 relative z-10 w-full max-w-[450px]">
                        {gameState.nodes.map(node => (
                            <motion.button
                                key={node.id}
                                whileHover={!gameOver ? { scale: 1.05 } : {}}
                                whileTap={!gameOver ? { scale: 0.95 } : {}}
                                onClick={() => handleAction(node.id, node.owner === 'player' ? 'defend' : 'attack')}
                                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all relative group
                                    ${node.owner === 'player' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' :
                                        node.owner === 'ai' ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]' :
                                            'bg-slate-900 border-white/5 hover:border-indigo-500/50'}`}
                            >
                                <div className="absolute top-1 right-1 w-1 h-1 rounded-full animate-ping bg-current opacity-30" />
                                {node.type === 'core' && <Lock className={`w-6 h-6 ${node.owner === 'player' ? 'text-emerald-400' : 'text-slate-500'}`} />}
                                {node.type === 'entry' && <Binary className={`w-6 h-6 ${node.owner === 'ai' ? 'text-rose-400' : 'text-slate-500'}`} />}
                                {node.type === 'relay' && <Cpu className={`w-5 h-5 ${node.owner === 'neutral' ? 'text-slate-700' : 'text-current'}`} />}

                                <div className="mt-1 w-full px-2">
                                    <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${node.owner === 'player' ? 'bg-emerald-500' : node.owner === 'ai' ? 'bg-rose-500' : 'bg-slate-600'}`}
                                            style={{ width: `${node.health}%` }}
                                        />
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <div className="mt-8 flex gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[10px] text-slate-500 font-black uppercase">User Control</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                            <span className="text-[10px] text-slate-500 font-black uppercase">Threat Control</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Console */}
                <div className="bg-slate-900/50 rounded-[40px] border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Terminal className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Network_Logs.std</span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-rose-500/20" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                        </div>
                    </div>

                    <div className="flex-1 p-6 font-mono text-[11px] space-y-2 overflow-y-auto bg-black/40">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.startsWith('[WARN]') ? 'text-amber-400' : log.startsWith('[SYS]') ? 'text-indigo-400' : 'text-slate-500'}`}>
                                <span className="opacity-30 mr-2">{logs.length - i}</span>
                                {log}
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-900/50 border-t border-white/5 space-y-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Mission Objective</p>
                            <p className="text-[10px] text-slate-300 leading-relaxed italic">
                                Prevent the AI intrusion from reaching the CORE at the bottom. Capture the Entry node to win.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {isAiThinking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                        <div className="bg-slate-900/90 border border-indigo-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
                            <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                            <span className="text-sm font-black text-white italic tracking-tighter">BREACHING FIREWALL...</span>
                        </div>
                    </motion.div>
                )}

                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8"
                    >
                        <div className="text-center space-y-8 max-w-md w-full">
                            {winner === 'player' ? (
                                <div className="space-y-4">
                                    <Trophy className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                                    <h2 className="text-5xl font-black text-white italic tracking-tighter">SECURED</h2>
                                    <p className="text-emerald-400 font-medium tracking-widest uppercase text-xs">Intrusion neutralized successfully.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Skull className="w-20 h-20 text-rose-500 mx-auto drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                                    <h2 className="text-5xl font-black text-rose-500 italic tracking-tighter">COMPROMISED</h2>
                                    <p className="text-rose-400 font-medium tracking-widest uppercase text-xs">System core has been breached.</p>
                                </div>
                            )}

                            {funnyTask && (
                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                    <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-2">Unauthorized Access Penalty</p>
                                    <p className="text-lg text-rose-100 italic font-medium">"{funnyTask}"</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <ShareButtons
                                    gameTitle="Cyber Defense"
                                    result={winner === 'player' ? 'neutralized the viral threat' : 'suffered a critical system failure'}
                                    score={`Generation ${gameState.generation}`}
                                    penalty={funnyTask}
                                />
                                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl transition-all shadow-xl">
                                    RESET PROTOCOLS
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
