import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, TrendingUp, ShieldAlert, Zap, Target, Check, Copy, AlertCircle, ChevronRight, BarChart, Lightbulb, Scale, Users, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SwotPoint {
    point: string;
    impact: 'High' | 'Medium' | 'Low';
    reason: string;
}

interface SwotData {
    subjectName: string;
    executiveSummary: string;
    strengths: SwotPoint[];
    weaknesses: SwotPoint[];
    opportunities: SwotPoint[];
    threats: SwotPoint[];
    strategicAdvice: string;
    recommendedPivot?: string;
}

export default function SwotAnalyzer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [subject, setSubject] = useState('');
    const [industry, setIndustry] = useState('Tech');
    const [objective, setObjective] = useState('');

    const [outputData, setOutputData] = useState<SwotData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!subject.trim()) {
            setError('Please define the subject for analysis (company, project, or person).');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Strategy Consultant and Business Analyst.
            
            Subject: "${subject}"
            Industry: "${industry}"
            Primary Objective: "${objective}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "subjectName": "Formal name of the entity",
                "executiveSummary": "1-2 sentence high-level strategic overview.",
                "strengths": [
                    { "point": "Strength 1", "impact": "High/Medium/Low", "reason": "Why it matters" }
                ],
                "weaknesses": [
                    { "point": "Weakness 1", "impact": "High/Medium/Low", "reason": "Potential risk" }
                ],
                "opportunities": [
                    { "point": "Opportunity 1", "impact": "High/Medium/Low", "reason": "Growth vector" }
                ],
                "threats": [
                    { "point": "Threat 1", "impact": "High/Medium/Low", "reason": "Competitive risk" }
                ],
                "strategicAdvice": "The single most important strategic recommendation.",
                "recommendedPivot": "A bold alternative direction if current plan fails."
            }
            
            Be critical, objective, and insightful. Avoid generic business jargon.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `PERFORM SWOT ANALYSIS:\nSubject: ${subject}\nIndustry: ${industry}\nGoal: ${objective}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'swot-analyzer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SwotData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Strategy Error: Failed to perform analysis. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySwot = () => {
        if (outputData) {
            const content = `SWOT ANALYSIS: ${outputData.subjectName}\n\nSTRENGTHS:\n${outputData.strengths.map(s => `- ${s.point}`).join('\n')}\n\nWEAKNESSES:\n${outputData.weaknesses.map(w => `- ${w.point}`).join('\n')}\n\nOPPORTUNITIES:\n${outputData.opportunities.map(o => `- ${o.point}`).join('\n')}\n\nTHREATS:\n${outputData.threats.map(t => `- ${t.point}`).join('\n')}`;
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
                                    <Target className="w-4 h-4 text-sky-400" />
                                    Analysis Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Tesla's 2024 Strategy, My Personal Career, A new AI tool..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <BarChart className="w-4 h-4 text-sky-400" />
                                    Market / Industry
                                </label>
                                <select
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-sky-500"
                                >
                                    <option>Tech & Software</option>
                                    <option>Manufacturing</option>
                                    <option>Personal Branding</option>
                                    <option>Retail & E-commerce</option>
                                    <option>Healthcare</option>
                                    <option>Finance</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-sky-400" />
                                Context / Objective
                            </label>
                            <textarea
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Why are we doing this? (e.g. 'Entering the UK market', 'Deciding whether to quit my job')..."
                                className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !subject.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
                            {isLoading ? 'Crunching Metrics...' : 'Execute Analysis'}
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
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-32 justify-center">
                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <FileText className="w-20 h-20 text-sky-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Market Forces</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Applying Porter's Five Forces and PESTLE frameworks via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Executive Abstract */}
                                <div className="bg-slate-950/50 p-8 sm:p-12 border-b border-white/10 flex flex-col md:flex-row gap-8 items-start justify-between">
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Strategic Executive Summary
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-black text-white">{outputData.subjectName}</h2>
                                        <p className="text-xl text-slate-300 italic leading-relaxed font-serif">
                                            "{outputData.executiveSummary}"
                                        </p>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <button
                                            onClick={handleCopySwot}
                                            className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'SWOT Copied' : 'Copy Full Analysis'}
                                        </button>
                                    </div>
                                </div>

                                {/* SWOT Matrix Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Strengths */}
                                    <div className="p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10 group bg-emerald-500/0 hover:bg-emerald-500/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-emerald-400 uppercase tracking-tighter">Strengths</h3>
                                            <TrendingUp className="w-5 h-5 text-emerald-500/30 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <div className="space-y-4">
                                            {outputData.strengths.map((p, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="text-sm font-bold text-white flex gap-2">
                                                        <span className="text-emerald-500 mt-1.5 w-1 h-1 bg-emerald-500 rounded-full shrink-0" />
                                                        {p.point}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 pl-3 leading-relaxed">{p.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10 group bg-rose-500/0 hover:bg-rose-500/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-rose-400 uppercase tracking-tighter">Weaknesses</h3>
                                            <ShieldAlert className="w-5 h-5 text-rose-500/30 group-hover:text-rose-500 transition-colors" />
                                        </div>
                                        <div className="space-y-4">
                                            {outputData.weaknesses.map((p, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="text-sm font-bold text-white flex gap-2">
                                                        <span className="text-rose-500 mt-1.5 w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                                                        {p.point}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 pl-3 leading-relaxed">{p.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Opportunities */}
                                    <div className="p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-white/10 group bg-sky-500/0 hover:bg-sky-500/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-sky-400 uppercase tracking-tighter">Opportunities</h3>
                                            <Zap className="w-5 h-5 text-sky-500/30 group-hover:text-sky-500 transition-colors" />
                                        </div>
                                        <div className="space-y-4">
                                            {outputData.opportunities.map((p, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="text-sm font-bold text-white flex gap-2">
                                                        <span className="text-sky-500 mt-1.5 w-1 h-1 bg-sky-500 rounded-full shrink-0" />
                                                        {p.point}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 pl-3 leading-relaxed">{p.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Threats */}
                                    <div className="p-8 space-y-6 group bg-amber-500/0 hover:bg-amber-500/[0.02] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-amber-400 uppercase tracking-tighter">Threats</h3>
                                            <Scale className="w-5 h-5 text-amber-500/30 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                        <div className="space-y-4">
                                            {outputData.threats.map((p, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="text-sm font-bold text-white flex gap-2">
                                                        <span className="text-amber-500 mt-1.5 w-1 h-1 bg-amber-500 rounded-full shrink-0" />
                                                        {p.point}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 pl-3 leading-relaxed">{p.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Strategic Advice */}
                                <div className="p-12 bg-slate-950 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Core Strategic Pillar
                                        </h4>
                                        <div className="text-2xl font-black text-white italic leading-snug">
                                            {outputData.strategicAdvice}
                                        </div>
                                    </div>
                                    {outputData.recommendedPivot && (
                                        <div className="space-y-4 border-l md:border-l border-white/5 pl-12">
                                            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Contingency Pivot Path</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                {outputData.recommendedPivot}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-12 pt-0 bg-slate-950">
                                    <div className="pt-10 border-t border-white/10">
                                        <ShareButtonsComponent
                                            gameTitle="AI SWOT Strategy (AI Tool)"
                                            result="won"
                                            penalty={null}
                                        />
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
