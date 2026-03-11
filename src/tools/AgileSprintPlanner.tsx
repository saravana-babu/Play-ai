import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Kanban, Zap, Clock, Users, Check, Copy, AlertCircle, ChevronRight, Layout, ListTodo, Target, Info, Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SprintTicket {
    id: string;
    title: string;
    description: string;
    storyPoints: number;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    category: string;
}

interface SprintData {
    sprintGoal: string;
    duration: string;
    tickets: SprintTicket[];
    risks: string[];
    capacityEstimate: string;
    suggestedCeremonies: string[];
}

export default function AgileSprintPlanner() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [projectGoal, setProjectGoal] = useState('');
    const [teamSize, setTeamSize] = useState('5 People');
    const [sprintDuration, setSprintDuration] = useState('2 Weeks');
    const [backlogItems, setBacklogItems] = useState('');

    const [outputData, setOutputData] = useState<SprintData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handlePlan = async () => {
        if (!projectGoal.trim() || !backlogItems.trim()) {
            setError('Please describe your project goal and list some backlog items.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are an Expert Agile Coach and Scum Master.
            
            Project Goal: "${projectGoal}"
            Team Size: "${teamSize}"
            Duration: "${sprintDuration}"
            Backlog Raw Input: "${backlogItems}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "sprintGoal": "Primary outcome for this sprint",
                "duration": "Sprint length matching input",
                "tickets": [
                    { "id": "SCRUM-1", "title": "Clear Title", "description": "Short user story", "storyPoints": 3, "priority": "High", "category": "Feature/Refactor/Fix" }
                ],
                "risks": ["Risk 1", "Risk 2"],
                "capacityEstimate": "Total story points team can likely handle",
                "suggestedCeremonies": ["Specific focus for daily", "Retro focus"]
            }
            
            Break down the raw items into professional JIRA-style tickets with Fibonnaci story points.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `DESIGN AGILE SPRINT:\nGoal: ${projectGoal}\nTeam: ${teamSize}\nBacklog: ${backlogItems}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'agile-sprint-planner'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SprintData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Agile Failure: Failed to generate sprint plan. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySprint = () => {
        if (outputData) {
            const content = `SPRINT GOAL: ${outputData.sprintGoal}\n\nBACKLOG:\n${outputData.tickets.map(t => `[${t.id}] ${t.title} (${t.storyPoints} pts) - ${t.priority}`).join('\n')}`;
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
                                    <Target className="w-4 h-4 text-indigo-400" />
                                    Sprint / Project Theme
                                </label>
                                <input
                                    type="text"
                                    value={projectGoal}
                                    onChange={(e) => setProjectGoal(e.target.value)}
                                    placeholder="e.g. Launching v2.0 Dashboard, Fixing Auth bugs..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Team Velocity</label>
                                    <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none">
                                        <option>3 People (Small)</option>
                                        <option>5 People (Standard)</option>
                                        <option>8 People (Large)</option>
                                        <option>12+ People (Enterprise)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Cycle length</label>
                                    <select value={sprintDuration} onChange={(e) => setSprintDuration(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none">
                                        <option>1 Week</option>
                                        <option>2 Weeks</option>
                                        <option>3 Weeks</option>
                                        <option>1 Month</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-indigo-400" />
                                Raw Backlog / Ideas
                            </label>
                            <textarea
                                value={backlogItems}
                                onChange={(e) => setBacklogItems(e.target.value)}
                                placeholder="Paste your messy todo list or feature ideas here..."
                                className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handlePlan}
                            disabled={isLoading || !projectGoal.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Kanban className="w-6 h-6" />}
                            {isLoading ? 'Estimating Points...' : 'Initialize Sprint'}
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
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-32 justify-center">
                                <motion.div animate={{ x: [-10, 10, -10] }} transition={{ duration: 1, repeat: Infinity }}>
                                    <Layout className="w-20 h-20 text-indigo-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Shuffling Ticket Stack</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Applying Fibonacci complexity weights and dependency mapping via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Sprint Header Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 border-b border-white/10 bg-slate-950/50">
                                    <div className="p-8 border-r border-white/10 flex flex-col justify-center gap-1 col-span-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Active Sprint Goal</div>
                                        <div className="text-2xl font-black text-white italic">"{outputData.sprintGoal}"</div>
                                    </div>
                                    <div className="p-8 border-r border-white/10 flex flex-col justify-center gap-1 group">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Planned Velocity</div>
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                            <div className="text-3xl font-black text-white">{outputData.capacityEstimate} pts</div>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col justify-center gap-1">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Ceremony Strategy</div>
                                        <div className="flex flex-wrap gap-1">
                                            {outputData.suggestedCeremonies.map((c, i) => (
                                                <span key={i} className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 font-bold">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Risk & Meta Sidebar */}
                                    <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                    <Flame className="w-3 h-3 text-rose-500" /> blocker risks
                                                </div>
                                                <div className="space-y-2">
                                                    {outputData.risks.map((risk, i) => (
                                                        <div key={i} className="flex gap-2 items-start text-xs text-slate-400 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 italic">
                                                            <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                                                            {risk}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                onClick={handleCopySprint}
                                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Sprint Copied' : 'Export to Clipboard'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Kanban/Backlog View */}
                                    <div className="flex-1 p-6 sm:p-10 bg-slate-900 overflow-y-auto max-h-[800px]">
                                        <div className="max-w-4xl mx-auto space-y-12">
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Kanban className="w-6 h-6 text-indigo-400" />
                                                    Sprint Backlog Items
                                                </h3>

                                                <div className="space-y-4">
                                                    {outputData.tickets.map((ticket, idx) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                                                            key={idx}
                                                            className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 group hover:bg-slate-900 transition-all flex flex-col sm:flex-row gap-6 relative"
                                                        >
                                                            <div className="flex flex-col gap-2 shrink-0">
                                                                <span className="text-[10px] font-black text-indigo-500 tracking-widest">{ticket.id}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${ticket.priority === 'Critical' ? 'bg-rose-500 animate-pulse' : ticket.priority === 'High' ? 'bg-orange-500' : 'bg-sky-500'}`} />
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase">{ticket.priority}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 space-y-2">
                                                                <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{ticket.title}</h4>
                                                                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{ticket.description}</p>
                                                            </div>

                                                            <div className="flex sm:flex-col justify-between items-end gap-2 shrink-0">
                                                                <div className="px-3 py-1 bg-slate-900 rounded-lg text-[10px] font-black text-slate-400 border border-white/5">
                                                                    {ticket.category}
                                                                </div>
                                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400 border border-indigo-500/20">
                                                                    {ticket.storyPoints}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-10 border-t border-white/10">
                                                <ShareButtonsComponent
                                                    gameTitle="AI Agile Planner (AI Tool)"
                                                    result="won"
                                                    penalty={null}
                                                />
                                            </div>
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
