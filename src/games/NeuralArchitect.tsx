import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, Play, RefreshCw, Loader2, Cpu, Network, Zap, Target, Layers, PlusCircle, XCircle } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

export type LayerType = 'Input' | 'Dense' | 'Conv2D' | 'MaxPooling' | 'LSTM' | 'Dropout' | 'Flatten' | 'Output';

export interface LayerNode {
    id: string;
    type: LayerType;
}

const LAYER_COLORS: Record<LayerType, string> = {
    'Input': 'bg-slate-500 text-white border-slate-400',
    'Dense': 'bg-indigo-500 text-white border-indigo-400',
    'Conv2D': 'bg-emerald-500 text-white border-emerald-400',
    'MaxPooling': 'bg-teal-500 text-white border-teal-400',
    'LSTM': 'bg-amber-500 text-white border-amber-400',
    'Dropout': 'bg-rose-500 text-white border-rose-400',
    'Flatten': 'bg-blue-500 text-white border-blue-400',
    'Output': 'bg-fuchsia-500 text-white border-fuchsia-400',
};

const LAYER_DESCRIPTIONS: Record<LayerType, string> = {
    'Input': 'Receives the raw data.',
    'Dense': 'Fully connected layer, good for final decisions.',
    'Conv2D': 'Extracts spatial features (images/grids).',
    'MaxPooling': 'Downsamples spatial dimensions.',
    'LSTM': 'Processes sequential/time-series data.',
    'Dropout': 'Prevents overfitting by dropping connections.',
    'Flatten': 'Converts multi-dimensional data into 1D.',
    'Output': 'Produces the final prediction.',
};

export default function NeuralArchitect() {
    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const [taskInfo, setTaskInfo] = useState<{ name: string, description: string, data_type: string } | null>(null);
    const [isGeneratingTask, setIsGeneratingTask] = useState(true);

    const [p1Layers, setP1Layers] = useState<LayerNode[]>([{ id: 'p1-in', type: 'Input' }]);
    const [p2Layers, setP2Layers] = useState<LayerNode[]>([{ id: 'p2-in', type: 'Input' }]);

    const [p1Score, setP1Score] = useState<number | null>(null);
    const [p2Score, setP2Score] = useState<number | null>(null);

    // Status logs for the training console
    const [consoleLogs, setConsoleLogs] = useState<{ sender: string, text: string }[]>([]);

    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);

    const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
    const [isAiThinking, setIsAiThinking] = useState(false);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        isMounted.current = true;
        initTask();
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleLogs]);

    const logToConsole = (sender: string, text: string) => {
        if (!isMounted.current) return;
        setConsoleLogs(prev => [...prev, { sender, text }]);
    };

    const initTask = async () => {
        setIsGeneratingTask(true);
        setConsoleLogs([]);
        logToConsole('System', 'Initializing Task Generator Engine...');
        try {
            const prompt = `Generate a very specific AI/Machine Learning problem task.
            Return ONLY a valid JSON object:
            {
                "name": "Short Name (e.g. Sentiment Analyzer, Image Classifier)",
                "description": "A 2-3 sentence description of what the model needs to achieve.",
                "data_type": "The type of data it receives (e.g. 'Images (28x28 pixels)', 'Text Sequence', 'Tabular Data')"
            }`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'neuralarchitect', {}, prompt);

            if (!isMounted.current) return;

            if (response && response.name && response.description) {
                setTaskInfo(response);
                logToConsole('System', `New Dataset Loaded: ${response.name}`);
            } else {
                throw new Error("Invalid format");
            }
        } catch (e) {
            console.error(e);
            if (!isMounted.current) return;
            setTaskInfo({
                name: "Dog Breed Image Classifier",
                description: "The model needs to classify 120 different breeds of dogs from 256x256 RGB images.",
                data_type: "Images (256x256x3)"
            });
            logToConsole('System', 'Fallback Dataset Loaded.');
        } finally {
            if (isMounted.current) setIsGeneratingTask(false);
        }
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Neural Architect');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'neuralarchitect',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const evaluateArchitecture = async (player: 'P1' | 'P2', layers: LayerNode[]) => {
        setIsAiThinking(true);
        const sequence = layers.map(l => l.type).join(' -> ');
        logToConsole(`Evaluator`, `Compiling Architecture for ${player}:\n${sequence}`);
        logToConsole(`Evaluator`, `Initiating distributed training on pseudo-cluster...`);

        try {
            const evalPrompt = `We are playing "Neural Architect".
            The AI task is: "${taskInfo?.name}"
            Description: "${taskInfo?.description}"
            Data Type: "${taskInfo?.data_type}"
            
            The player submitted the following neural network architecture:
            ${sequence}
            
            Evaluate how structurally sound and logically correct this architecture is for the specific data type and task.
            For example: Image classification usually needs Convolutional layers + MaxPooling -> Flatten -> Dense -> Output.
            Text usually needs Embedding/LSTM/RNN -> Dense -> Output.
            A network missing an Output layer is incomplete. A network mixing randomly is bad.
            
            Return ONLY a valid JSON object:
            {
                "score": <A number from 0 to 100 representing accuracy percentage>,
                "feedback": "<1-2 sentence constructive feedback on why it scored that way>"
            }`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'neuralarchitect', {}, evalPrompt);

            if (!isMounted.current) return;

            const score = typeof response?.score === 'number' ? Math.min(100, Math.max(0, response.score)) : Math.floor(Math.random() * 50);
            const feedback = response?.feedback || 'Model compilation completed with warnings.';

            logToConsole('Evaluator', `Validation Accuracy: ${score}%.\nFeedback: ${feedback}`);

            if (player === 'P1') {
                setP1Score(score);
                setTurn('P2');
            } else {
                setP2Score(score);
                // Game over, determine winner
                const finalP1Score = p1Score || 0;
                if (finalP1Score > score) {
                    handleEnd(gameMode === 'llm-vs-llm' ? 'ai-1' : 'user');
                } else if (score > finalP1Score) {
                    handleEnd(gameMode === 'llm-vs-llm' ? 'ai-2' : 'ai');
                } else {
                    handleEnd('draw');
                }
            }
        } catch (e) {
            console.error(e);
            if (!isMounted.current) return;
            const fallbackScore = Math.floor(Math.random() * 100);
            logToConsole('System', `Evaluation crashed. Estimated Accuracy: ${fallbackScore}%`);

            if (player === 'P1') {
                setP1Score(fallbackScore);
                setTurn('P2');
            } else {
                setP2Score(fallbackScore);
                const finalP1Score = p1Score || 0;
                handleEnd(finalP1Score > fallbackScore ? (gameMode === 'llm-vs-llm' ? 'ai-1' : 'user') : (fallbackScore > finalP1Score ? (gameMode === 'llm-vs-llm' ? 'ai-2' : 'ai') : 'draw'));
            }
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current || isGeneratingTask) return;
        setIsAiThinking(true);

        logToConsole(player === 'P1' ? 'Player 1 (AI)' : 'Player 2 (AI)', 'Designing neural graph...');

        try {
            const prompt = `We are playing "Neural Architect".
            The AI task is: "${taskInfo?.name}"
            Data Type: "${taskInfo?.data_type}"
            Description: "${taskInfo?.description}"
            
            You must design a neural network architecture using ONLY the following layer types:
            ['Input', 'Dense', 'Conv2D', 'MaxPooling', 'LSTM', 'Dropout', 'Flatten', 'Output']
            
            Provide the sequence of layers that perfectly solves this problem. It MUST start with 'Input' and end with 'Output'. Limit to max 8 layers.
            Return ONLY a JSON array of strings:
            {
                "layers": ["Input", "Conv2D", "MaxPooling", "Flatten", "Dense", "Output"]
            }`;

            const response = await generateNextMove(llmToUse, apiKeys, 'neuralarchitect', {}, prompt);
            if (!isMounted.current) return;

            let chosenTypes: LayerType[] = response?.layers || ['Input', 'Dense', 'Output'];

            // Validate and cast
            const validSet = new Set(['Input', 'Dense', 'Conv2D', 'MaxPooling', 'LSTM', 'Dropout', 'Flatten', 'Output']);
            chosenTypes = chosenTypes.filter(t => validSet.has(t)) as LayerType[];
            if (chosenTypes.length === 0) chosenTypes = ['Input', 'Dense', 'Output'];

            const newNodes: LayerNode[] = chosenTypes.map((t, i) => ({
                id: `ai-${i}-${Math.random().toString(36).substr(2, 9)}`,
                type: t
            }));

            if (player === 'P1') {
                setP1Layers(newNodes);
            } else {
                setP2Layers(newNodes);
            }

            await evaluateArchitecture(player, newNodes);

        } catch (e) {
            console.error(e);
            if (isMounted.current && !gameOver) {
                const fallbackNodes: LayerNode[] = ['Input', 'Dense', 'Output'].map((t, i) => ({ id: `fallback-${i}`, type: t as LayerType }));
                if (player === 'P1') setP1Layers(fallbackNodes); else setP2Layers(fallbackNodes);
                await evaluateArchitecture(player, fallbackNodes);
            }
        }
    }, [taskInfo, gameOver, isGeneratingTask, p1Score, apiKeys]);

    useEffect(() => {
        if (gameOver || isGeneratingTask) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking && p1Score === null) {
                setTimeout(() => makeAiMove('P1', player1Llm), 1500);
            } else if (turn === 'P2' && !isAiThinking && p2Score === null) {
                setTimeout(() => makeAiMove('P2', selectedLlm), 1500);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking && p2Score === null) {
            setTimeout(() => makeAiMove('P2', selectedLlm), 1500);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm, isGeneratingTask, p1Score, p2Score]);

    const handleAddLayer = (type: LayerType) => {
        if (gameOver || isAiThinking || turn !== 'P1' || gameMode === 'llm-vs-llm' || p1Layers.length >= 8) return;
        setP1Layers([...p1Layers, { id: Math.random().toString(36).substr(2, 9), type }]);
    };

    const handleRemoveLayer = (index: number) => {
        if (gameOver || isAiThinking || turn !== 'P1' || gameMode === 'llm-vs-llm') return;
        if (index === 0) return; // don't remove input
        const newL = [...p1Layers];
        newL.splice(index, 1);
        setP1Layers(newL);
    };

    const handleTrainSubmit = () => {
        if (gameOver || isAiThinking || turn !== 'P1' || gameMode === 'llm-vs-llm') return;
        evaluateArchitecture('P1', p1Layers);
    };

    const resetGame = () => {
        setP1Layers([{ id: 'p1-in', type: 'Input' }]);
        setP2Layers([{ id: 'p2-in', type: 'Input' }]);
        setP1Score(null);
        setP2Score(null);
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
        initTask();
    };

    const currentLayers = turn === 'P1' || (gameOver) ? p1Layers : p2Layers;
    const isHumanTurn = turn === 'P1' && gameMode === 'human-vs-ai';

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[800px] overflow-hidden">

            {/* LEFT PANE: Architect Board */}
            <div className="flex-1 min-w-0 bg-[#0f172a] rounded-2xl flex flex-col border border-white/10 shadow-2xl relative overflow-hidden ring-1 ring-white/5">

                {/* Header info */}
                <div className="bg-slate-900 border-b border-white/10 p-5 flex flex-col gap-3 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Network className="w-6 h-6 text-fuchsia-400" />
                            <h2 className="text-xl font-bold text-white">Neural Architect</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center bg-slate-800 rounded-xl px-4 py-2 border border-white/5">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{gameMode === 'llm-vs-llm' ? `P1: ${player1Llm}` : 'You (P1)'}</div>
                                <div className="text-lg font-black text-indigo-400">{p1Score !== null ? `${p1Score}%` : '--'}</div>
                            </div>
                            <div className="text-center bg-slate-800 rounded-xl px-4 py-2 border border-white/5">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{gameMode === 'llm-vs-llm' ? `P2: ${selectedLlm}` : 'Opponent (P2)'}</div>
                                <div className="text-lg font-black text-emerald-400">{p2Score !== null ? `${p2Score}%` : '--'}</div>
                            </div>
                        </div>
                    </div>
                    {isGeneratingTask ? (
                        <div className="text-slate-400 text-sm flex items-center gap-2 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" /> Fetching Dataset & Objectives...
                        </div>
                    ) : taskInfo && (
                        <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-4 rounded-xl flex items-start gap-4 text-sm mt-2">
                            <Target className="w-6 h-6 text-fuchsia-400 shrink-0 mt-1" />
                            <div>
                                <strong className="text-fuchsia-300 block mb-1 uppercase tracking-wider text-xs">Target Objective: {taskInfo.name}</strong>
                                <span className="text-white block mb-2">{taskInfo.description}</span>
                                <span className="text-slate-400 text-xs py-1 px-2 bg-slate-950 rounded border border-white/5 font-mono">Input Data: {taskInfo.data_type}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Graph Area */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">

                    {/* Visual connections behind layers */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-slate-800 -translate-x-1/2 z-0"></div>

                    <div className="space-y-4 z-10 w-full max-w-sm flex flex-col items-center pb-24">
                        <AnimatePresence>
                            {currentLayers.map((layer, index) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    key={layer.id}
                                    className={`w-full relative bg-slate-900 border-2 rounded-xl p-4 shadow-lg text-center font-bold font-mono tracking-wide
                                        ${LAYER_COLORS[layer.type]}
                                    `}
                                >
                                    {layer.type}
                                    {isHumanTurn && index !== 0 && (
                                        <button
                                            onClick={() => handleRemoveLayer(index)}
                                            className="absolute -right-3 -top-3 bg-slate-900 text-slate-400 hover:text-rose-500 rounded-full transition-colors"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isHumanTurn && !gameOver && p1Layers.length < 8 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-12 h-12 bg-slate-800 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-400 transition-colors z-10 mt-2"
                            >
                                <PlusCircle className="w-6 h-6" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Toolbox Footer */}
                {(!gameOver && isHumanTurn && !isGeneratingTask) && (
                    <div className="bg-slate-950 border-t border-white/10 p-4 absolute bottom-0 left-0 right-0 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 text-xs font-bold uppercase flex items-center gap-2"><Layers className="w-4 h-4" /> Layer Toolbox</span>
                            <span className="text-slate-500 text-xs">{p1Layers.length}/8 Layers</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {(['Dense', 'Conv2D', 'MaxPooling', 'LSTM', 'Dropout', 'Flatten', 'Output'] as LayerType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleAddLayer(type)}
                                    title={LAYER_DESCRIPTIONS[type]}
                                    className={`px-4 py-2 shrink-0 rounded-lg text-xs font-bold border whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity ${LAYER_COLORS[type]}`}
                                >
                                    + {type}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleTrainSubmit}
                                disabled={p1Layers.length < 2 || isAiThinking}
                                className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(192,38,211,0.4)] transition-all flex items-center gap-2 w-full justify-center"
                            >
                                <Zap className="w-5 h-5" /> Compile & Predict
                            </button>
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-30">
                        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full">
                            {winner === 'draw' ? <RefreshCw className="w-16 h-16 text-slate-400 mx-auto mb-4" /> :
                                (winner === 'user' || winner === 'ai-1') ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" /> :
                                    <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4" />}

                            <h2 className="text-2xl font-black text-white mb-2">
                                {winner === 'draw' ? 'Tied Models!' : winner === 'user' ? 'You Designed the Best Architecture!' : winner === 'ai-1' ? 'AI 1 Wins!' : winner === 'ai-2' ? 'AI 2 Validated Better!' : 'Opponent Built a Better Model!'}
                            </h2>
                            <p className="text-slate-400 text-sm mb-6">P1: {p1Score}% vs P2: {p2Score}%</p>

                            {penalty && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6">
                                    <div className="text-[10px] text-rose-400 font-bold uppercase mb-1">Overfitting Penalty</div>
                                    <div className="text-rose-200 text-sm italic">"{penalty}"</div>
                                </div>
                            )}

                            <ShareButtons
                                gameTitle="Neural Architect"
                                result={(winner === 'user' || winner === 'ai-1') ? 'won' : winner === 'draw' ? 'tied' : 'lost'}
                                penalty={penalty}
                            />

                            <button onClick={resetGame} className="w-full px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold transition-colors mt-4">
                                Next Epoch (Play Again)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANE: Training Console */}
            <div className="w-full lg:w-[350px] flex flex-col bg-[#050505] rounded-2xl border border-white/10 shadow-xl overflow-hidden font-mono text-sm relative">
                <div className="bg-[#111] flex items-center px-4 py-3 border-b border-white/10 shadow-md z-10">
                    <Cpu className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Training Monitor</span>
                    {isAiThinking && <Loader2 className="w-3 h-3 text-fuchsia-400 animate-spin ml-auto" />}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {consoleLogs.map((log, idx) => (
                        <div key={idx} className="space-y-1">
                            <span className={`font-bold text-[10px] uppercase tracking-wider ${log.sender === 'System' ? 'text-indigo-400' : log.sender === 'Evaluator' ? 'text-emerald-400' : 'text-fuchsia-400'}`}>
                                [{log.sender}]
                            </span>
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-white/10 break-words">
                                {log.text}
                            </div>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

        </div>
    );
}
