import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, LlmProvider } from '../store/useStore';
import { generateNextMove, generateFunnyTask } from '../lib/ai';
import { fetchApi } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, Database, Play, Loader2, Table2, Terminal, BookOpen, AlertCircle } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

interface QueryResult {
    columns: string[];
    rows: any[][];
    error?: string;
    solved?: boolean;
    winnerName?: string;
}

interface QueryLog {
    player: 'User' | 'AI-1' | 'AI-2';
    query: string;
    result: QueryResult;
}

const SCHEMA = `
TABLE person (id INT, name TEXT, license_id INT, address_number INT, address_street_name TEXT, ssn TEXT);
TABLE drivers_license (id INT, age INT, height INT, eye_color TEXT, hair_color TEXT, gender TEXT, plate_number TEXT, car_make TEXT, car_model TEXT);
TABLE crime_scene_report (date INT, type TEXT, description TEXT, city TEXT);
TABLE interview (person_id INT, transcript TEXT);
TABLE get_fit_now_member (id TEXT, person_id INT, name TEXT, membership_status TEXT);
TABLE get_fit_now_check_in (membership_id TEXT, check_in_date INT, check_in_time INT, check_out_time INT);
`;

const INTRO_SCENARIO = "A crime has taken place and the detective needs your help. The crime was a murder that occurred sometime on Jan. 15, 2018 and that it took place in SQL City. Start by querying the crime_scene_report table.";

export default function SqlMystery() {
    const [queryInput, setQueryInput] = useState('SELECT * FROM crime_scene_report WHERE city = "SQL City";');
    const [logs, setLogs] = useState<QueryLog[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw' | null>(null);
    const [penalty, setPenalty] = useState<string | null>(null);

    const [turn, setTurn] = useState<'P1' | 'P2'>('P1'); // P1 = User/AI-1, P2 = AI-2/AI (but in Human vs AI, it's just human until solved, or maybe we race an AI?)
    const [gameStart, setGameStart] = useState(false);

    const { apiKeys, selectedLlm, player1Llm, gameMode, user, gameSessionTokens, resetSessionTokens } = useStore();
    const isMounted = useRef(true);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleEnd = async (result: 'user' | 'ai' | 'ai-1' | 'ai-2' | 'draw') => {
        setGameOver(true);
        setWinner(result);

        let task = null;
        if ((result === 'ai' || result === 'draw') && gameMode !== 'llm-vs-llm') {
            task = await generateFunnyTask(selectedLlm, apiKeys, 'SQL Murder Mystery');
            if (isMounted.current) setPenalty(task);
        }

        if (user && isMounted.current) {
            await fetchApi('/history', {
                method: 'POST',
                body: JSON.stringify({
                    game_id: 'sqlmystery',
                    winner: result,
                    funny_task: task,
                    total_tokens: gameSessionTokens
                })
            });
        }
    };

    const executeQueryVirtual = async (player: 'P1' | 'P2', queryText: string, playerName: 'User' | 'AI-1' | 'AI-2') => {
        setIsAiThinking(true);
        try {
            // The "Game Master" LLM acts as the SQL Database
            const systemPrompt = `You are a virtual SQLite Database engine hosting the famous "SQL Murder Mystery".
      Schema: ${SCHEMA}
      The true murderer is 'Jeremy Bowers'. The scenario clues should lead to him.
      The player passed the following query: "${queryText}"
      
      Act as the database. Generate a plausible, internally consistent JSON response for this query based on the standard SQL Murder Mystery data.
      If it's a syntax error or a non-existent table, return {"error": "SQL Syntax Error: ..."}.
      If the user is querying to find the murderer or specifically queries the name 'Jeremy Bowers' and has enough evidence, or uses a GUESS command like "GUESS: Jeremy Bowers", return {"solved": true, "winnerName": "${playerName}"}.
      Otherwise, return the mocked rows: 
      {
        "columns": ["col1", "col2"],
        "rows": [["val1", "val2"], ["val3", "val4"]]
      }
      Keep results to a maximum of 5 rows to save space.`;

            const response = await generateNextMove(
                selectedLlm, // Use selected as the Game Master Engine
                apiKeys,
                'sqlmystery',
                { query: queryText },
                systemPrompt
            );

            if (!isMounted.current) return;

            const qResult: QueryResult = {
                columns: response?.columns || [],
                rows: response?.rows || [],
                error: response?.error,
                solved: response?.solved,
                winnerName: response?.winnerName
            };

            setLogs(prev => [...prev, { player: playerName, query: queryText, result: qResult }]);

            if (qResult.solved) {
                handleEnd(gameMode === 'llm-vs-llm' ? (player === 'P1' ? 'ai-1' : 'ai-2') : 'user');
            } else {
                // Next turn
                if (gameMode === 'llm-vs-llm') {
                    setTurn(player === 'P1' ? 'P2' : 'P1');
                } else if (gameMode === 'human-vs-ai') {
                    setTurn('P2');
                }
            }

        } catch (e) {
            console.error(e);
            setLogs(prev => [...prev, { player: playerName, query: queryText, result: { error: "Connection to Virtual Database Lost.", columns: [], rows: [] } }]);
            if (gameMode === 'llm-vs-llm') setTurn(player === 'P1' ? 'P2' : 'P1');
            else if (gameMode === 'human-vs-ai') setTurn('P2');
        } finally {
            if (isMounted.current) setIsAiThinking(false);
        }
    };

    // AI Racer logic (AI trying to solve the mystery)
    const makeAiMove = useCallback(async (player: 'P1' | 'P2', llmToUse: LlmProvider, playerName: 'AI-1' | 'AI-2' | 'AI') => {
        if (gameOver || !isMounted.current) return;
        setIsAiThinking(true);

        try {
            const pastLogContext = logs.map(l => `Player ${l.player} ran: ${l.query} \n Got: ${JSON.stringify(l.result)}`).join('\n\n');

            const systemPrompt = `You are playing a race to solve the SQL Murder Mystery. 
      Here is the schema: ${SCHEMA}
      Current game history: ${pastLogContext || 'None yet.'}
      
      You must write ONE valid SQL query to gather clues, or if you know the killer, write "GUESS: [Name]".
      Return ONLY a JSON object: {"query": "SELECT ..."} or {"query": "GUESS: John Doe"}`;

            const response = await generateNextMove(
                llmToUse,
                apiKeys,
                'sqlmystery',
                { turn: player },
                systemPrompt
            );

            if (!isMounted.current) return;

            const queryToRun = response?.query || "SELECT * FROM crime_scene_report LIMIT 5;";
            await executeQueryVirtual(player, queryToRun, playerName as 'User' | 'AI-1' | 'AI-2');

        } catch (e) {
            console.error(e);
            if (isMounted.current && !gameOver) {
                await executeQueryVirtual(player, "SELECT * FROM crime_scene_report LIMIT 1;", playerName as 'User' | 'AI-1' | 'AI-2');
            }
        }
    }, [logs, gameOver, apiKeys]);

    useEffect(() => {
        if (gameOver || !gameStart) return;
        if (gameMode === 'llm-vs-llm') {
            if (turn === 'P1' && !isAiThinking) {
                setTimeout(() => makeAiMove('P1', player1Llm, 'AI-1'), 1500);
            } else if (turn === 'P2' && !isAiThinking) {
                setTimeout(() => makeAiMove('P2', selectedLlm, 'AI-2'), 1500);
            }
        } else if (gameMode === 'human-vs-ai' && turn === 'P2' && !isAiThinking) {
            setTimeout(() => makeAiMove('P2', selectedLlm, 'AI-2'), 1500);
        }
    }, [turn, gameMode, gameOver, isAiThinking, makeAiMove, player1Llm, selectedLlm, gameStart]);

    const handleRunQuery = () => {
        if (!queryInput.trim() || isAiThinking || gameOver || gameMode === 'llm-vs-llm') return;
        executeQueryVirtual('P1', queryInput, 'User');
        setQueryInput('');
    };

    const startGame = () => {
        setGameStart(true);
        setLogs([]);
        setGameOver(false);
        setWinner(null);
        setPenalty(null);
        setTurn('P1');
        resetSessionTokens();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[750px]">

            {/* LEFT COLUMN: Database Schema & Lore */}
            <div className="w-full lg:w-80 flex flex-col gap-4 h-full">
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight">SQL City DB</h3>
                            <p className="text-xs text-slate-400">Connected</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                                <h4 className="text-sm font-bold text-indigo-400">The Mystery</h4>
                            </div>
                            <p className="text-xs text-indigo-200/80 leading-relaxed">
                                {INTRO_SCENARIO}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Database Schema</h4>
                            <div className="space-y-3">
                                {SCHEMA.trim().split('\n').map((line, idx) => {
                                    const match = line.match(/TABLE (\w+) \((.*?)\);/);
                                    if (!match) return null;
                                    const [_, tableName, cols] = match;
                                    return (
                                        <div key={idx} className="bg-slate-950 rounded-lg p-3 border border-white/5">
                                            <div className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
                                                <Table2 className="w-4 h-4" /> {tableName}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono leading-relaxed">
                                                {cols.split(', ').map(c => c.trim()).join(' • ')}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Editor and Logs */}
            <div className="flex-1 flex flex-col gap-4 h-full min-w-0">

                {/* Logs Terminal */}
                <div className="flex-1 bg-slate-950 border border-white/10 rounded-2xl p-4 overflow-y-auto font-mono text-sm relative shadow-inner">
                    {!gameStart ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                            <Database className="w-16 h-16 text-slate-700 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">SQL Murder Mystery Engine</h2>
                            <p className="text-slate-400 max-w-sm mb-6">You will be placed in a virtual database terminal. Write standard SQL queries to uncover the murderer.</p>
                            <button onClick={startGame} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                <Play className="w-5 h-5" /> Initialize Game
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <span className={`font-bold shrink-0 ${log.player.includes('AI') ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {log.player}@sql-city:~$
                                        </span>
                                        <span className="text-blue-300 break-all">{log.query}</span>
                                    </div>

                                    {/* Results */}
                                    <div className="pl-4">
                                        {log.result.solved ? (
                                            <div className="text-yellow-400 font-black flex items-center gap-2 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                                <Trophy className="w-5 h-5 inline" /> {log.result.winnerName} SOLVED THE MYSTERY!
                                            </div>
                                        ) : log.result.error ? (
                                            <div className="text-rose-400 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span className="break-all">{log.result.error}</span>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto bg-slate-900 border border-white/5 rounded-lg">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr>
                                                            {log.result.columns?.map((c, i) => (
                                                                <th key={i} className="p-2 border-b border-white/10 text-slate-400 font-medium text-xs uppercase tracking-wider bg-slate-800/50">{c}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {log.result.rows?.map((row, rIdx) => (
                                                            <tr key={rIdx} className="hover:bg-white/5">
                                                                {row.map((val, cIdx) => (
                                                                    <td key={cIdx} className="p-2 border-b border-white/5 text-slate-300 whitespace-nowrap">{String(val)}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                        {(!log.result.rows || log.result.rows.length === 0) && (
                                                            <tr>
                                                                <td colSpan={log.result.columns?.length || 1} className="p-2 text-slate-500 italic text-center">0 rows returned.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isAiThinking && (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Executing query in virtual engine...</span>
                                </div>
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-x-4 bottom-4 bg-slate-900/95 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center">
                            <Trophy className="w-12 h-12 text-yellow-400 mb-3" />
                            <h3 className="text-xl font-black text-white mb-1">
                                CASE CLOSED!
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">
                                {winner === 'user' ? 'You correctly queried the murderer.' : 'The AI beat you to the answer.'}
                            </p>
                            {penalty && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4 w-full">
                                    <p className="text-[10px] text-rose-400 font-bold uppercase mb-1">Penalty</p>
                                    <p className="text-white text-sm">"{penalty}"</p>
                                </div>
                            )}

                            <ShareButtons
                                gameTitle="SQL Murder Mystery"
                                result={(winner === 'user' || winner === 'ai-1') ? 'solved the mystery' : 'failed the investigation'}
                                penalty={penalty}
                            />

                            <button onClick={startGame} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold mt-4">
                                Play Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-xl shrink-0">
                    <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                        <Terminal className="w-4 h-4" />
                        <span className="font-bold">SQL Terminal</span>
                        {gameMode === 'llm-vs-llm' && <span className="ml-auto text-xs text-blue-400 animate-pulse">Auto-play active...</span>}
                        {gameMode === 'human-vs-ai' && <span className="ml-auto text-xs text-rose-400">Racing vs AI {turn === 'P2' && '(AI Turn)'}</span>}
                    </div>
                    <div className="flex gap-3">
                        <textarea
                            value={queryInput}
                            onChange={e => setQueryInput(e.target.value)}
                            disabled={!gameStart || gameOver || isAiThinking || gameMode === 'llm-vs-llm' || turn === 'P2'}
                            placeholder="SELECT * FROM crime_scene_report LIMIT 5;"
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                        />
                        <button
                            onClick={handleRunQuery}
                            disabled={!gameStart || gameOver || isAiThinking || !queryInput.trim() || gameMode === 'llm-vs-llm' || turn === 'P2'}
                            className="px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <Play className="w-6 h-6" />
                            <span className="text-xs">RUN</span>
                        </button>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">
                        Tip: You can use "GUESS: Firstname Lastname" in the terminal when you are absolutely sure.
                    </div>
                </div>

            </div>
        </div>
    );
}
