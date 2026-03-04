import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, Blocks, Play, RefreshCw, Loader2, Code2, Terminal, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

interface CodeBlock {
    id: string;
    code: string;
}

export default function AlgorithmAssembly() {
    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const [objective, setObjective] = useState<string>("Wait for the Engine to generate a challenge...");
    const [blocks, setBlocks] = useState<CodeBlock[]>([]);
    const [originalBlocks, setOriginalBlocks] = useState<CodeBlock[]>([]);

    const [consoleLogs, setConsoleLogs] = useState<{ sender: 'System' | 'Player 1' | 'Player 2', status?: 'success' | 'error', message: string }[]>([]);

    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);

    const [turn, setTurn] = useState<'P1' | 'P2'>('P1');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(true);

    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        isMounted.current = true;
        initChallenge();
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleLogs]);

    const logToConsole = (sender: 'System' | 'Player 1' | 'Player 2', message: string, status?: 'success' | 'error') => {
        if (!isMounted.current) return;
        setConsoleLogs(prev => [...prev, { sender, message, status }]);
    };

    const initChallenge = async () => {
        setIsGeneratingChallenge(true);
        setConsoleLogs([]);
        logToConsole('System', 'Booting up Algorithm Assembly Engine...');
        try {
            const prompt = `Generate a programming logic challenge. 
            Come up with a clear objective (e.g. "Write a function that returns the factorial of a number" or "Reverse an array in place").
            Provide EXACTLY 5 to 7 lines of pseudo-code (or language-agnostic code) that correctly implements this.
            Return a JSON object: 
            {
                "objective": "Detailed description of what the algorithm should do.",
                "lines": ["line 1 of correct code", "line 2", "line 3", "line 4", "line 5"]
            }`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'algorithmassembly', {}, prompt);

            if (!isMounted.current) return;

            if (response && response.objective && response.lines && Array.isArray(response.lines)) {
                setObjective(response.objective);

                // Jumble the lines
                const parsedBlocks: CodeBlock[] = response.lines.map((code: string) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    code: code.trim()
                }));

                setOriginalBlocks([...parsedBlocks]); // Keep original refs

                // Shuffle
                const shuffled = [...parsedBlocks].sort(() => Math.random() - 0.5);
                setBlocks([...shuffled]);

                logToConsole('System', `Challenge loaded: ${response.objective}`, 'success');
            } else {
                throw new Error("Invalid format");
            }
        } catch (e) {
            console.error(e);
            if (!isMounted.current) return;
            setObjective("Write a function to return the maximum value in an array.");
            const defaultLines = [
                "function findMax(arr) {",
                "  let max = arr[0];",
                "  for(let i=1; i<arr.length; i++) {",
                "    if(arr[i] > max) max = arr[i];",
                "  }",
                "  return max;",
                "}"
            ];
            const parsedBlocks = defaultLines.map(code => ({ id: Math.random().toString(36).substr(2, 9), code }));
            setOriginalBlocks([...parsedBlocks]);
            const shuffled = [...parsedBlocks].sort(() => Math.random() - 0.5);
            setBlocks([...shuffled]);
            logToConsole('System', 'Fallback Challenge loaded.', 'success');
        } finally {
            if (isMounted.current) setIsGeneratingChallenge(false);
        }
    };

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'Algorithm Assembly');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'algorithmassembly',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const testSubmission = async (submittedOrder: string[], player: 'P1' | 'P2', isAiPlayer: boolean) => {
        setIsAiThinking(true);
        const compiledCode = submittedOrder.join('\n');
        logToConsole(player === 'P1' ? 'Player 1' : 'Player 2', 'Running compilation and executing test suite...\n' + compiledCode);

        try {
            const evalPrompt = `We are playing an Algorithm Assembly game. 
            The goal is: "${objective}"
            The original valid blocks were: ${JSON.stringify(originalBlocks.map(b => b.code))}
            The player submitted the blocks in this exact order: 
            \`\`\`
            ${compiledCode}
            \`\`\`
            Does this submitted code logically achieve the objective, with correct block scoping and execution flow? (Ignore minor indentation, focus on logic/order).
            Return ONLY JSON:
            {"success": true/false, "feedback": "Short terminal-style output explaining exactly what failed, or 'All unit tests passed' if true."}`;

            const response = await generateNextMove(selectedLlm, apiKeys, 'algorithmassembly', {}, evalPrompt);

            if (!isMounted.current) return;

            const isSuccess = response?.success === true;
            const feedback = response?.feedback || (isSuccess ? 'All unit tests passed.' : 'Compilation/Logic Error.');

            logToConsole('System', feedback, isSuccess ? 'success' : 'error');

            if (isSuccess) {
                const w = gameMode === 'llm-vs-llm' ? (player === 'P1' ? 'ai-1' : 'ai-2') : (player === 'P1' ? 'user' : 'ai');
                handleEnd(w);
            } else {
                setTurn(player === 'P1' ? 'P2' : 'P1');
            }
        } catch (e) {
            console.error(e);
            if (!isMounted.current) return;
            logToConsole('System', 'Engine evaluator ran out of memory. Try again.', 'error');
            setTurn(player === 'P1' ? 'P2' : 'P1');
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider) => {
        if (gameOver || !isMounted.current || isGeneratingChallenge) return;
        setIsAiThinking(true);

        logToConsole(player === 'P1' ? 'Player 1' : 'Player 2', 'Synthesizing algorithm logic tree...');

        try {
            const prompt = `We are playing an Algorithm Assembly puzzle.
            The objective is: "${objective}"
            Here are the jumbled blocks of code available:
            ${JSON.stringify(originalBlocks.map((b, i) => ({ local_id: i, code: b.code })))}
            
            Rearrange the local_ids (0 to ${originalBlocks.length - 1}) into the perfect logical ordering to compile correctly.
            Return ONLY JSON: {"ordered_ids": [2, 0, 1, ...]} where the array contains the correct order of the local_ids.`;

            const response = await generateNextMove(llmToUse, apiKeys, 'algorithmassembly', {}, prompt);
            if (!isMounted.current) return;

            let arr = response?.ordered_ids;
            if (!Array.isArray(arr) || arr.length !== originalBlocks.length) {
                arr = [...Array(originalBlocks.length).keys()].sort(() => Math.random() - 0.5);
            }

            // The AI provides the order of the originalBlocks array.
            const submittedStrings = arr.map((idx: number) => originalBlocks[idx]?.code || "ERROR");

            // For visual flavor, we won't physically update the user's `blocks` UI board, 
            // the AI just submits a compiled string to the engine.
            await testSubmission(submittedStrings, player, true);

        } catch (e) {
            console.error(e);
            if (isMounted.current && !gameOver) {
                const randomStrings = [...originalBlocks].sort(() => Math.random() - 0.5).map(b => b.code);
                await testSubmission(randomStrings, player, true);
            }
        }
    }, [objective, originalBlocks, gameOver, isGeneratingChallenge, apiKeys]);

    useEffect(() => {
        if (gameOver || isGeneratingChallenge) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking) {
                setTimeout(() => makeAiMove('P1', player1Llm), 2000);
            } else if (turn === 'P2' && !isAiThinking) {
                setTimeout(() => makeAiMove('P2', selectedLlm), 2000);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking) {
            setTimeout(() => makeAiMove('P2', selectedLlm), 2000);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm, isGeneratingChallenge]);

    const moveBlock = (index: number, direction: -1 | 1) => {
        if (gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;

        const newBlocks = [...blocks];
        const swapIndex = index + direction;

        if (swapIndex < 0 || swapIndex >= newBlocks.length) return;

        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[swapIndex];
        newBlocks[swapIndex] = temp;

        setBlocks(newBlocks);
    };

    const handleRunCompilation = () => {
        if (gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2') return;
        testSubmission(blocks.map(b => b.code), 'P1', false);
    };

    const resetGame = () => {
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
        initChallenge();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[800px] overflow-hidden">

            {/* LEFT PANE: The IDE / Block Assembly */}
            <div className="flex-1 w-full bg-[#1e1e1e] rounded-2xl flex flex-col border border-white/10 shadow-2xl relative overflow-hidden">

                {/* IDE Header */}
                <div className="bg-[#2d2d2d] flex items-center justify-between px-4 py-2 border-b border-black/50">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-indigo-400" />
                        <span className="text-slate-300 font-mono text-sm tracking-wide">src/Algorithm.js</span>
                    </div>
                    <div className="flex gap-2">
                        <div className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${turn === 'P1' ? 'bg-indigo-500 text-white' : 'bg-transparent text-slate-500'}`}>
                            {gameMode === 'llm-vs-llm' ? `P1: ${player1Llm}` : 'You'}
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${turn === 'P2' ? 'bg-rose-500 text-white' : 'bg-transparent text-slate-500'}`}>
                            {gameMode === 'llm-vs-llm' ? `P2: ${selectedLlm}` : 'AI Opponent'}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-indigo-950/20 border-b border-white/5">
                    <Blocks className="w-8 h-8 text-indigo-400 shrink-0" />
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Objective</h3>
                        <p className="text-white font-mono leading-relaxed break-words">{objective}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-2">
                    {isGeneratingChallenge ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            Generating dynamic algorithm...
                        </div>
                    ) : (
                        <AnimatePresence>
                            {blocks.map((block, index) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={block.id}
                                    className={`group flex items-center gap-3 bg-[#2d2d2d] border border-[#404040] hover:border-indigo-500/50 p-2 rounded-lg 
                                        ${(gameMode === 'llm-vs-llm' || turn === 'P2' || isAiThinking || gameOver) ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                                    `}
                                >
                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="text-slate-500 hover:text-white disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                                        <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                                    </div>
                                    <div className="text-slate-600 select-none font-black w-6 text-right">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 text-slate-300 whitespace-pre font-mono overflow-x-auto">
                                        {block.code}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="p-4 bg-[#252526] border-t border-black/50 flex justify-between items-center">
                    <div className="text-xs text-slate-500 italic">
                        Assemble the physical blocks above into logical order.
                    </div>
                    <button
                        onClick={handleRunCompilation}
                        disabled={isGeneratingChallenge || isAiThinking || turn === 'P2' || gameOver || gameMode === 'llm-vs-llm'}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Play className="w-4 h-4" />
                        Compile & Test
                    </button>
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-20">
                        <div className="bg-[#1e1e1e] border border-white/10 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full">
                            {winner === 'draw' ? <RefreshCw className="w-16 h-16 text-slate-400 mx-auto mb-4" /> :
                                (winner === 'user' || winner === 'ai-1') ? <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" /> :
                                    <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4" />}

                            <h2 className="text-2xl font-black text-white mb-2">
                                {winner === 'user' ? 'Build Successful!' : winner === 'ai-1' ? 'AI 1 Compiled It!' : winner === 'ai-2' ? 'AI 2 Compiled It!' : 'Opponent Compiled It!'}
                            </h2>
                            <p className="text-slate-400 text-sm mb-6">Execution sequence validated correctly.</p>

                            {penalty && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6">
                                    <div className="text-[10px] text-rose-400 font-bold uppercase mb-1">Penalty Output</div>
                                    <div className="text-rose-200 text-sm italic">"{penalty}"</div>
                                </div>
                            )}

                            <ShareButtons
                                gameTitle="Algorithm Assembly"
                                result={(winner === 'user' || winner === 'ai-1') ? 'solved the logical puzzle' : 'failed to compile the algorithm'}
                                penalty={penalty}
                            />

                            <button onClick={resetGame} className="w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors mt-4">
                                Generate New Algorithm
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANE: Test Engine Terminal Output */}
            <div className="w-full lg:w-[400px] flex flex-col bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-xl overflow-hidden font-mono">
                <div className="bg-[#1a1a1a] flex items-center px-4 py-3 border-b border-black">
                    <Terminal className="w-4 h-4 text-emerald-500 mr-2" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Test Suite Console</span>
                    {isAiThinking && <Loader2 className="w-3 h-3 text-emerald-500 animate-spin ml-auto" />}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                    {consoleLogs.length === 0 && !isGeneratingChallenge && (
                        <div className="text-slate-600 italic">Waiting for compilation...</div>
                    )}
                    {consoleLogs.map((log, idx) => (
                        <div key={idx} className="space-y-1">
                            <span className={`font-bold text-xs ${log.sender === 'System' ? 'text-blue-500' : log.sender === 'Player 1' ? 'text-indigo-400' : 'text-rose-400'}`}>
                                {log.sender}
                            </span>
                            <div className={`p-3 rounded-md border ${log.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                                log.status === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                                    'bg-white/5 border-transparent text-slate-300'
                                }`}>
                                {log.status === 'success' && <CheckCircle2 className="w-4 h-4 inline mr-2 text-emerald-500" />}
                                {log.status === 'error' && <XCircle className="w-4 h-4 inline mr-2 text-rose-500" />}
                                <span className="whitespace-pre-wrap">{log.message}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

        </div>
    );
}
