import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, RefreshCw, Trophy, Skull, Activity, Cpu, Binary, Share2, Info, Lightbulb } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface Node {
    id: number;
    row: number;
    col: number;
    type: 'empty' | 'power' | 'ground' | 'relay';
    isActive: boolean;
}

interface Connection {
    from: number;
    to: number;
}

// --- Component ---
export default function CircuitConnector() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGrid = useCallback(() => {
        const newNodes: Node[] = [];
        const size = 5;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let type: 'empty' | 'power' | 'ground' | 'relay' = 'relay';
                if (r === 0 && c === 0) type = 'power';
                if (r === size - 1 && c === size - 1) type = 'ground';
                newNodes.push({ id: r * size + c, row: r, col: c, type, isActive: type === 'power' });
            }
        }
        setNodes(newNodes);
        setConnections([]);
        setGameOver(false);
        setWinner(null);
        setSelectedNodeId(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGrid();
        return () => { isMounted.current = false; };
    }, [initGrid]);

    const handleNodeClick = (id: number) => {
        if (gameOver || isAiThinking) return;

        if (selectedNodeId === null) {
            setSelectedNodeId(id);
        } else {
            if (selectedNodeId !== id) {
                // Try connecting
                const node1 = nodes.find(n => n.id === selectedNodeId)!;
                const node2 = nodes.find(n => n.id === id)!;
                const dist = Math.abs(node1.row - node2.row) + Math.abs(node1.col - node2.col);

                if (dist === 1) {
                    const alreadyExists = connections.some(c => (c.from === node1.id && c.to === node2.id) || (c.from === node2.id && c.to === node1.id));
                    if (!alreadyExists) {
                        const newConns = [...connections, { from: node1.id, to: node2.id }];
                        setConnections(newConns);
                        updateActiveNodes(newConns);
                    }
                }
            }
            setSelectedNodeId(null);
        }
    };

    const updateActiveNodes = (conns: Connection[]) => {
        const activeIds = new Set<number>();
        activeIds.add(nodes.find(n => n.type === 'power')!.id);

        let added = true;
        while (added) {
            added = false;
            conns.forEach(c => {
                if (activeIds.has(c.from) && !activeIds.has(c.to)) {
                    activeIds.add(c.to);
                    added = true;
                } else if (activeIds.has(c.to) && !activeIds.has(c.from)) {
                    activeIds.add(c.from);
                    added = true;
                }
            });
        }

        setNodes(prev => prev.map(n => ({ ...n, isActive: activeIds.has(n.id) })));

        const ground = nodes.find(n => n.type === 'ground')!;
        if (activeIds.has(ground.id)) {
            finishGame('player');
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Circuit Connector');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'circuitconnector', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    if (nodes.length === 0) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
                <div className="flex gap-8 text-center sm:text-left">
                    <div className="text-center">
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Voltage</p>
                        <p className="text-2xl font-black text-white">{nodes.filter(n => n.isActive).length * 4}V</p>
                    </div>
                </div>
                <button onClick={initGrid} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-950 rounded-[40px] border border-white/5 p-8 flex items-center justify-center relative overflow-hidden shadow-2xl min-h-[500px]">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                    <div className="grid grid-cols-5 gap-6 relative z-10">
                        {nodes.map(node => (
                            <motion.button
                                key={node.id}
                                whileHover={{ scale: 1.1 }}
                                onClick={() => handleNodeClick(node.id)}
                                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all relative
                                    ${node.isActive ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-slate-900'}
                                    ${selectedNodeId === node.id ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-110' : ''}`}
                            >
                                {node.type === 'power' && <Zap className={`w-6 h-6 ${node.isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />}
                                {node.type === 'ground' && <Lightbulb className={`w-6 h-6 ${node.isActive ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-slate-600'}`} />}
                                {node.type === 'relay' && <div className={`w-2 h-2 rounded-full ${node.isActive ? 'bg-emerald-400' : 'bg-slate-700'}`} />}
                            </motion.button>
                        ))}

                        {/* Dynamic connection lines (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            {connections.map((c, i) => {
                                const n1 = nodes.find(n => n.id === c.from)!;
                                const n2 = nodes.find(n => n.id === c.to)!;
                                const x1 = n1.col * 72 + 24;
                                const y1 = n1.row * 72 + 24;
                                const x2 = n2.col * 72 + 24;
                                const y2 = n2.row * 72 + 24;
                                return (
                                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                                        className={`stroke-2 transition-all duration-500 ${n1.isActive && n2.isActive ? 'stroke-emerald-400 shadow-xl' : 'stroke-white/10'}`}
                                        strokeWidth="2" strokeDasharray={n1.isActive && n2.isActive ? '0' : '5,5'} />
                                );
                            })}
                        </svg>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-8 shadow-xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Binary className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Hardware Link</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Complete the circuit by connecting the Power Source (Zap) to the Ground Terminal (Lightbulb). Click two adjacent nodes to wire them.
                        </p>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
                        <Activity className="w-8 h-8 text-emerald-500" />
                        <div className="text-center">
                            <span className="text-[10px] text-slate-500 font-black uppercase">Load Status</span>
                            <p className="text-lg font-black text-white">{winner === 'player' ? 'CLOSED_LOOP' : 'OPEN_CIRCUIT'}</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end">
                        <div className="w-full p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-indigo-400 font-black uppercase">AI_ADVERSARY</span>
                                <span className="text-[10px] font-bold text-white">Neural Net v4.2</span>
                            </div>
                            <Cpu className="w-5 h-5 text-indigo-400 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 text-center">
                        <div className="space-y-8 max-w-sm w-full">
                            <Trophy className="w-20 h-20 text-emerald-400 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">POWER_RESTORED</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Connectivity established across all grid sectors.</p>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="Circuit Connector" result="bridged the electronic gap" score="RELIABLE" />
                                <button onClick={initGrid} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">NEXT ASSEMBLY</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
