import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, CheckCircle2, ListTodo, Target, Trophy, Flame, Calendar, Info, AlertCircle, Copy, Check, ChevronRight, Zap, Brain, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HabitStrategy {
    title: string;
    description: string;
}

interface RoutineStep {
    time: string;
    activity: string;
}

interface HabitTrackerData {
    habitName: string;
    psychologicalAnalysis: string;
    dailyRoutineModel: RoutineStep[];
    microSteps: string[];
    keystonePotential: string;
    motivationBoosters: string[];
    rewardSystem: string;
}

export default function HabitStrategyTool() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [habit, setHabit] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [context, setContext] = useState('');

    const [outputData, setOutputData] = useState<HabitTrackerData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleDesign = async () => {
        if (!habit.trim()) {
            setError('Please define the habit you want to build or break.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Behavioral Psychologist and Habit Formation Scientist.
            
            Target Habit: "${habit}"
            Assessed Difficulty: "${difficulty}"
            Personal Context: "${context}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "habitName": "A polished name for the habit project",
                "psychologicalAnalysis": "Briefly explain why this habit is hard and the neurological triggers involved.",
                "dailyRoutineModel": [
                    { "time": "e.g. 07:00 AM", "activity": "Action step" }
                ],
                "microSteps": ["Tiny step 1 (2 mins)", "Tiny step 2"],
                "keystonePotential": "Explain if this habit will trigger other positive changes.",
                "motivationBoosters": ["Boost 1", "Boost 2"],
                "rewardSystem": "A specific, sustainable reward mechanism."
            }
            
            Focus on Atomic Habits principles (Cue, Craving, Response, Reward).
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `DESIGN HABIT ARCHITECTURE:\nHabit: ${habit}\nDiff: ${difficulty}\nContext: ${context}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'habit-tracker'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as HabitTrackerData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Behavioral Loop Error: Failed to design strategy. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyStrategy = () => {
        if (outputData) {
            const content = `HABIT STRATEGY: ${outputData.habitName}\n\nPSYCHOLOGY: ${outputData.psychologicalAnalysis}\n\nROUTINE:\n${outputData.dailyRoutineModel.map(r => `${r.time} - ${r.activity}`).join('\n')}\n\nMICRO-STEPS:\n${outputData.microSteps.join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-violet-400" />
                                    What habit are we mastering?
                                </label>
                                <input
                                    type="text"
                                    value={habit}
                                    onChange={(e) => setHabit(e.target.value)}
                                    placeholder="e.g. Morning meditation, daily coding, cold plunging..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-violet-400" />
                                    Current Friction Level
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Low', 'Intermediate', 'Procrastinator'].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${difficulty === d
                                                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                    : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-violet-400" />
                                Your Personal "Why" or Blockers
                            </label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="What usually stops you? Why is this important now? (e.g. 'I'm tired after work', 'Need better focus for my startup')..."
                                className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleDesign}
                            disabled={isLoading || !habit.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                            {isLoading ? 'Rewiring Circuits...' : 'Design Habit Loop'}
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
                                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <Zap className="w-20 h-20 text-violet-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Dopamine Triggers</h3>
                                    <p className="animate-pulse font-medium text-violet-300/80">Indexing cognitive behavioral templates and cue-stacking logic via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Psychology Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-12 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Brain className="w-3 h-3 text-violet-400" /> Executive Analysis
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium italic bg-violet-500/5 p-5 rounded-2xl border border-violet-500/10">
                                                "{outputData.psychologicalAnalysis}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3 text-emerald-400" /> Keystone Potential
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                {outputData.keystonePotential}
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Reward Optimization</div>
                                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                                <div className="text-xs font-black text-emerald-400 uppercase mb-1">Sustainable Prize</div>
                                                <div className="text-sm text-white font-medium">{outputData.rewardSystem}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyStrategy}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Strategy Copied' : 'Copy Full Blueprint'}
                                        </button>
                                    </div>
                                </div>

                                {/* Implementation View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-16">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-500/20">
                                                    Habit Master Plan
                                                </div>
                                                <Flame className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                                                {outputData.habitName}
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Calendar className="w-6 h-6 text-violet-400" />
                                                    The Daily Anchor
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.dailyRoutineModel.map((step, idx) => (
                                                        <div key={idx} className="flex gap-4 group">
                                                            <div className="text-xs font-black text-slate-500 pt-1 shrink-0 tabular-nums w-16">{step.time}</div>
                                                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex-1 group-hover:border-violet-500/30 transition-colors">
                                                                <p className="text-sm text-slate-300 font-medium">{step.activity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <ListTodo className="w-6 h-6 text-emerald-400" />
                                                    Atomic Micro-Steps
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.microSteps.map((step, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-900 transition-all group">
                                                            <div className="w-6 h-6 rounded-full border-2 border-slate-700 group-hover:border-emerald-500 flex items-center justify-center shrink-0 transition-colors">
                                                                <Check className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <span className="text-sm text-slate-300 font-bold">{step}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-6 space-y-4">
                                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Motivational Boosters</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {outputData.motivationBoosters.map((b, i) => (
                                                            <span key={i} className="text-[10px] bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-white/5 font-bold shadow-sm">{b}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Habit Designer (AI Tool)"
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
