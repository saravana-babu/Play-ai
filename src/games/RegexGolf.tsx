import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Check, X, RefreshCw, Trophy, Skull, Activity, Binary, Terminal, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

// --- Types ---
interface TestSet {
    matches: string[];
    excludes: string[];
}

const PUZZLES: TestSet[] = [
    { matches: ['apple', 'apricot', 'apply'], excludes: ['banana', 'cherry', 'date'] },
    { matches: ['123', '456', '789'], excludes: ['abc', 'def', 'ghi'] },
    { matches: ['dog', 'cog', 'fog'], excludes: ['dig', 'log', 'frog'] },
    { matches: ['cat', 'bat', 'rat'], excludes: ['can', 'bar', 'raw'] },
];

// --- Component ---
export default function RegexGolf() {
    const [puzzleIdx, setPuzzleIdx] = useState(0);
    const [regexStr, setRegexStr] = useState('');
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
    const [funnyTask, setFunnyTask] = useState<string | null>(null);

    const { apiKeys, selectedLlm, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);

    const initGame = useCallback(() => {
        setPuzzleIdx(0);
        setRegexStr('');
        setScore(0);
        setGameOver(false);
        setWinner(null);
        setFunnyTask(null);
        resetSessionTokens();
    }, [resetSessionTokens]);

    useEffect(() => {
        isMounted.current = true;
        initGame();
        return () => { isMounted.current = false; };
    }, [initGame]);

    const getCurrentResults = () => {
        const puzzle = PUZZLES[puzzleIdx];
        let regex: RegExp;
        try {
            regex = new RegExp(regexStr);
        } catch (e) {
            return {
                matchResults: puzzle.matches.map(() => false),
                excludeResults: puzzle.excludes.map(() => true), // Assuming they don't match invalid regex
                isValid: false
            };
        }

        return {
            matchResults: puzzle.matches.map(s => regex.test(s)),
            excludeResults: puzzle.excludes.map(s => !regex.test(s)),
            isValid: true
        };
    };

    const results = getCurrentResults();
    const isSolved = results.isValid && results.matchResults.every(v => v) && results.excludeResults.every(v => v);

    const handleNext = () => {
        if (puzzleIdx < PUZZLES.length - 1) {
            setPuzzleIdx(s => s + 1);
            setRegexStr('');
            setScore(s => s + 25);
        } else {
            finishGame('player');
        }
    };

    const finishGame = async (gameWinner: 'player' | 'ai') => {
        setGameOver(true);
        setWinner(gameWinner);
        let task = null;
        if (gameWinner === 'ai' && apiKeys[selectedLlm]) {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'RegEx Golf');
            setFunnyTask(task);
        }
        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({ game_id: 'regexgolf', winner: gameWinner, funny_task: task, total_tokens: gameSessionTokens })
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">XP Points</p>
                        <p className="text-2xl font-black text-indigo-400">{score + (isSolved ? 25 : 0)}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={initGame} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/5"><RefreshCw className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <div className="bg-slate-950 rounded-[40px] border border-white/5 p-8 flex flex-col gap-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm italic">Pattern Editor</h3>
                    </div>

                    <div className="flex-1 space-y-6 flex flex-col justify-center">
                        <div className="space-y-4">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Regular Expression</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-mono">/</span>
                                <input
                                    type="text"
                                    value={regexStr}
                                    onChange={e => setRegexStr(e.target.value)}
                                    placeholder="your-regex-here"
                                    className="w-full bg-slate-900 border-2 border-white/5 rounded-2xl px-8 py-5 text-lg font-mono text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 font-mono">/g</span>
                            </div>
                            {!results.isValid && regexStr && (
                                <p className="text-[10px] text-rose-500 font-bold uppercase flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Invalid Regex Syntax
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!isSolved || gameOver}
                            className={`w-full py-5 rounded-3xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3
                                ${isSolved ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            {isSolved ? <Check className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6 opacity-20" />}
                            {puzzleIdx === PUZZLES.length - 1 ? 'HALT & COMMIT' : 'NEXT STAGE'}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[40px] border border-white/5 p-8 flex flex-col gap-8 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Code className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">Unit Tests</h3>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-3">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Expected Success</span>
                            <div className="grid gap-2">
                                {PUZZLES[puzzleIdx].matches.map((s, i) => (
                                    <div key={i} className={`px-4 py-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-all
                                        ${results.matchResults[i] ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                                        {s}
                                        {results.matchResults[i] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-20" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Required Failure</span>
                            <div className="grid gap-2">
                                {PUZZLES[puzzleIdx].excludes.map((s, i) => (
                                    <div key={i} className={`px-4 py-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-all
                                        ${results.excludeResults[i] ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-600'}`}>
                                        {s}
                                        {results.excludeResults[i] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4 opacity-20" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-4 items-center">
                        <HelpCircle className="w-5 h-5 text-indigo-400" />
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                            Craft a pattern that captures all positive cases while ignoring all negative ones. Shortness counts toward your reputation.
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {gameOver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 text-center">
                        <div className="space-y-8 max-w-sm w-full">
                            <Trophy className="w-20 h-20 text-indigo-400 mx-auto drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">REGEX_MASTER</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">All test suites passed with 100% code coverage.</p>
                            <div className="space-y-4 pt-4">
                                <ShareButtons gameTitle="RegEx Golf" result="benchmarked at senior engineer level" score={`${score + 25} XP`} />
                                <button onClick={initGame} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl transition-all">NEW REPO</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
