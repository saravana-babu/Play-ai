import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Gamepad2, Swords, Zap, Check, Copy, AlertCircle, ChevronRight, Puzzle, Target, Info, MousePointer2, RefreshCw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameLoop {
    stage: string;
    action: string;
    reward: string;
}

interface GameMechanicData {
    mechanicName: string;
    coreConcept: string;
    interactionLoop: GameLoop[];
    playerPsychology: string;
    difficultyScaling: string;
    uniqueTwist: string;
    winningCondition: string;
}

export default function GameMechanicGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [genre, setGenre] = useState('Roguelike');
    const [theme, setTheme] = useState('');
    const [complexity, setComplexity] = useState('Medium');

    const [outputData, setOutputData] = useState<GameMechanicData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!theme.trim()) {
            setError('Please describe the theme or setting for your game mechanic (e.g. Cyberpunk, Medieval, Underwater).');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Legendary Game Designer and Mechanics Specialist.
            
            Genre: "${genre}"
            Theme: "${theme}"
            Complexity: "${complexity}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "mechanicName": "A catchy name for the mechanic",
                "coreConcept": "1-sentence summary of the main hook.",
                "interactionLoop": [
                    { "stage": "Input", "action": "What the player does", "reward": "Immediate feedback/gain" }
                ],
                "playerPsychology": "Why this is addictive or satisfying (e.g. risk/reward, collection, mastery).",
                "difficultyScaling": "How the mechanic evolves as the game progresses.",
                "uniqueTwist": "A specific variation that makes it feel fresh.",
                "winningCondition": "How this mechanic leads to success."
            }
            
            Invent something REVOLUTIONARY, not generic.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `INVENT GAME MECHANIC:\nGenre: ${genre}\nTheme: ${theme}\nComplexity: ${complexity}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'game-mechanic'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as GameMechanicData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Entropy Failure: Failed to invent mechanic. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyMechanic = () => {
        if (outputData) {
            const content = `MECHANIC: ${outputData.mechanicName}\n\nCONCEPT: ${outputData.coreConcept}\n\nLOOP:\n${outputData.interactionLoop.map(l => `${l.stage}: ${l.action} -> ${l.reward}`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-emerald-400" />
                                    Game Industry Theme / Setting
                                </label>
                                <textarea
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="e.g. A futuristic city where memory is used as currency, or a dreamscape where gravity is inverted..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Core Genre</label>
                                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Roguelike</option>
                                        <option>RPG / Soulslike</option>
                                        <option>Puzzle / Logic</option>
                                        <option>Platformer / Metroidvania</option>
                                        <option>Strategy / 4X</option>
                                        <option>Casual / Hypercasual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Loop Complexity</label>
                                    <select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Simple (1 Action)</option>
                                        <option>Medium (Multi-stage)</option>
                                        <option>Deep (Systemic)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "A great mechanic is easy to learn but offers infinite depth. Our AI leverages game theory models to ensure engagement."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !theme.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Swords className="w-6 h-6" />}
                            {isLoading ? 'Simulating Playtests...' : 'Synthesize Mechanic'}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {(outputData || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-32 justify-center">
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 4, repeat: Infinity }}>
                                    <Puzzle className="w-20 h-20 text-emerald-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Generating Logical Interaction Nodes</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Applying Skinner Box reward schedules via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Psychology Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4 text-center">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Mechanic Identifier</div>
                                            <div className="text-2xl font-black text-emerald-400 italic">"{outputData.mechanicName}"</div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-emerald-400" /> Player Psychology
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-bold italic bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                                                {outputData.playerPsychology}
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500" /> The Secret Twist</div>
                                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                {outputData.uniqueTwist}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Trophy className="w-3 h-3 text-sky-400" /> Scaling Strategy</div>
                                            <div className="p-4 bg-slate-900 rounded-xl text-[11px] text-slate-500 italic border border-white/5">
                                                {outputData.difficultyScaling}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyMechanic}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Mechanic Copied' : 'Export Design Doc'}
                                        </button>
                                    </div>
                                </div>

                                {/* Design View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                Game Theory Synthesis
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.coreConcept}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-emerald-500/30 underline-offset-8">
                                                <RefreshCw className="w-6 h-6 text-emerald-400" />
                                                Infinite Interaction Loop
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {outputData.interactionLoop.map((loop, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-all relative overflow-hidden flex flex-col justify-between"
                                                    >
                                                        <div className="space-y-4">
                                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{loop.stage}</div>
                                                            <h4 className="text-xl font-black text-white leading-tight">{loop.action}</h4>
                                                        </div>
                                                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                                            <div className="text-[9px] font-black text-slate-600 uppercase">Response:</div>
                                                            <div className="text-xs font-black text-sky-400 bg-sky-500/5 px-3 py-1.5 rounded-lg border border-sky-500/10 uppercase tracking-wider">{loop.reward}</div>
                                                        </div>
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-[20px] pointer-events-none rounded-full" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-l-8 border-l-emerald-600">
                                            <div className="space-y-4">
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Winning Condition:</div>
                                                <p className="text-2xl sm:text-3xl text-white font-black leading-tight tracking-tight italic">
                                                    "{outputData.winningCondition}"
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Game Mechanic (AI Tool)"
                                                result="won"
                                                penalty={null}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
