import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, GraduationCap, Calendar, Zap, Check, Copy, AlertCircle, ChevronRight, BookOpen, Target, Layout, Info, Flame, Trophy, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudySession {
    week: number;
    title: string;
    focus: string;
    resources: string[];
    milestone: string;
}

interface StudyPlanData {
    subjectTitle: string;
    masteryPath: string;
    curatedSessions: StudySession[];
    expertTips: string[];
    potentialRoadblocks: string[];
    finalProjectIdea: string;
}

export default function StudyPlanGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [subject, setSubject] = useState('');
    const [timeline, setTimeline] = useState('4 Weeks');
    const [hoursPerWeek, setHoursPerWeek] = useState(10);

    const [outputData, setOutputData] = useState<StudyPlanData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!subject.trim()) {
            setError('Please describe the subject or skill you want to master.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Learning Architect and Curriculum Designer.
            
            Target Skill/Subject: "${subject}"
            Total Timeline: "${timeline}"
            Time Commitment: "${hoursPerWeek} hours/week"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "subjectTitle": "Professional Course Name",
                "masteryPath": "1-sentence philosophy of the learning approach.",
                "curatedSessions": [
                    { "week": 1, "title": "Fundamental Theme", "focus": "Granular topics covered", "resources": ["Key source 1", "Key Source 2"], "milestone": "Measurable outcome" }
                ],
                "expertTips": ["Strategic Tip 1", "Tip 2"],
                "potentialRoadblocks": ["Common pitfall 1", "2"],
                "finalProjectIdea": "A concrete capstone project idea."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE STUDY PLAN:\nSubject: ${subject}\nTimeline: ${timeline}\nCommitment: ${hoursPerWeek}h/w`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'study-plan'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as StudyPlanData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Pedagogical Error: Failed to generate plan. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPlan = () => {
        if (outputData) {
            const content = `STUDY PLAN: ${outputData.subjectTitle}\n\nCURRICULUM:\n${outputData.curatedSessions.map(s => `Week ${s.week}: ${s.title}\nFocus: ${s.focus}`).join('\n\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-sky-400" />
                                    What are you mastering?
                                </label>
                                <textarea
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Full-stack React Development, Ancient Greek History, Machine Learning from scratch..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Goal Timeline</label>
                                    <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>2 Weeks (Sprint)</option>
                                        <option>4 Weeks (Focus)</option>
                                        <option>3 Months (Deep Skill)</option>
                                        <option>6 Months (Mastery)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Hours / Week</label>
                                    <input
                                        type="number"
                                        value={hoursPerWeek}
                                        onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-2.5 outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Knowledge without a structure is just noise. AI Study Plan creates a logical sequence for your cognitive growth."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !subject.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <GraduationCap className="w-6 h-6" />}
                            {isLoading ? 'Plotting Mastery Path...' : 'Initialize Curriculum'}
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
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Layout className="w-20 h-20 text-sky-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Cognitive Hierarchies</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Mapping prerequisite nodes and scaffolded learning paths via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Strategic Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-12 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-sky-400" /> Mastery Philosophy
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-black p-6 bg-sky-500/5 rounded-2xl border border-sky-500/10 italic">
                                                "{outputData.masteryPath}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500"><Zap className="w-3 h-3 inline mr-2 text-amber-400" /> Expert Tips</div>
                                            <div className="space-y-2">
                                                {outputData.expertTips.map((tip, i) => (
                                                    <div key={i} className="flex gap-2 items-start text-xs text-slate-400 font-medium">
                                                        <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                                        {tip}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Trophy className="w-3 h-3 text-amber-500" /> Capstone Project</div>
                                            <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-xs text-slate-400 italic font-medium">
                                                {outputData.finalProjectIdea}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyPlan}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Plan Copied' : 'Export Full Syllabus'}
                                        </button>
                                    </div>
                                </div>

                                {/* Curriculum View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Pedagogical Architecture
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none italic uppercase tracking-tighter">
                                                {outputData.subjectTitle}
                                            </h2>
                                        </div>

                                        <div className="space-y-12">
                                            {outputData.curatedSessions.map((session, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group flex flex-col sm:flex-row gap-8 items-start relative"
                                                >
                                                    <div className="flex flex-col items-center gap-4 shrink-0 sm:w-16">
                                                        <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center font-black text-white text-lg group-hover:border-sky-500 transition-colors shadow-xl">
                                                            {session.week}
                                                        </div>
                                                        <div className="w-px h-full min-h-[40px] bg-slate-800" />
                                                    </div>

                                                    <div className="flex-1 bg-slate-950/80 p-8 rounded-[2rem] border border-white/5 group-hover:bg-slate-900 transition-all space-y-6 relative overflow-hidden">
                                                        <div className="space-y-2 relative z-10">
                                                            <h4 className="text-2xl font-black text-white group-hover:text-sky-300 transition-colors">{session.title}</h4>
                                                            <p className="text-sm text-slate-400 leading-relaxed italic">{session.focus}</p>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                                                            <div className="flex-1 space-y-3">
                                                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-600">Primary Resources</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {session.resources.map((r, i) => (
                                                                        <span key={i} className="text-[10px] bg-slate-900 text-slate-500 px-3 py-1.5 rounded-lg border border-white/5 font-bold hover:text-white transition-colors">{r}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 space-y-3 sm:w-48">
                                                                <div className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Target Outcome</div>
                                                                <p className="text-xs text-slate-300 font-black leading-tight">{session.milestone}</p>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/0 group-hover:bg-sky-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Study Plan (AI Tool)"
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
