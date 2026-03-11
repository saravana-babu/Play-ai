import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, BookOpen, Search, PieChart, Target, Check, Copy, AlertCircle, ChevronRight, FileText, Info, BarChart3, Database, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyDatum {
    label: string;
    value: string;
    description: string;
}

interface ResearchData {
    topic: string;
    executiveSummary: string;
    keyFindings: string[];
    dataPoints: KeyDatum[];
    methodologyInsight: string;
    potentialBiases: string[];
    futureImplications: string;
}

export default function ResearchAnalyzer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [rawText, setRawText] = useState('');
    const [focus, setFocus] = useState('Extract Insights');
    const [depth, setDepth] = useState('High-level');

    const [outputData, setOutputData] = useState<ResearchData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!rawText.trim()) {
            setError('Please paste the research paper, article, or raw data you want to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Research Analyst and Academic Synthesis Expert.
            
            Focus: "${focus}"
            Required Depth: "${depth}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "topic": "The primary research theme",
                "executiveSummary": "1-2 sentence high-level synthesis of the material.",
                "keyFindings": ["Finding 1", "Finding 2"],
                "dataPoints": [
                    { "label": "e.g. Percentage increase", "value": "20%", "description": "Context of the number" }
                ],
                "methodologyInsight": "1-sentence critique or summary of how the study was conducted.",
                "potentialBiases": ["Bias 1", "Gap in data"],
                "futureImplications": "What this means for the field in the long term."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `ANALYZE RESEARCH MATERIAL:\nFocus: ${focus}\nDepth: ${depth}\nInput: ${rawText.substring(0, 10000)}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'research-analyzer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as ResearchData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Synthesis Error: Failed to analyze material. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyResearch = () => {
        if (outputData) {
            const content = `TOPIC: ${outputData.topic}\n\nSUMMARY: ${outputData.executiveSummary}\n\nFINDINGS:\n${outputData.keyFindings.join('\n')}`;
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
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <BookOpen className="w-7 h-7 text-sky-400" />
                            Academic Intelligence
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Paste complex research, whitepapers, or long-form articles for rapid synthesis.</p>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Paste research text here..."
                            className="w-full h-48 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white text-md focus:outline-none focus:border-sky-500 transition-colors resize-none shadow-inner placeholder:text-slate-800"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/20 p-4 rounded-2xl border border-white/5">
                        <div className="flex gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Analysis Focus</label>
                                <select value={focus} onChange={(e) => setFocus(e.target.value)} className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-4 py-2 outline-none">
                                    <option>Extract Insights</option>
                                    <option>Fact Checker</option>
                                    <option>Methodology Audit</option>
                                    <option>Data Extraction</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Thematic Depth</label>
                                <select value={depth} onChange={(e) => setDepth(e.target.value)} className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-4 py-2 outline-none">
                                    <option>Executive Summary</option>
                                    <option>Standard Review</option>
                                    <option>Granular Analysis</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !rawText.trim()}
                            className="px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                            {isLoading ? 'Synthesizing...' : 'Run Analysis'}
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
                                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <Database className="w-20 h-20 text-sky-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Cross-Referencing Citations</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Applying inductive reasoning and pattern matching via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Insights Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-sky-400" /> Research Abstract
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium p-6 bg-sky-500/5 rounded-2xl border border-sky-500/10 italic">
                                                "{outputData.executiveSummary}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3 text-emerald-400" /> Statistical Anchors
                                            </div>
                                            <div className="space-y-3">
                                                {outputData.dataPoints.map((dp, i) => (
                                                    <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase">{dp.label}</span>
                                                            <span className="text-sm font-black text-emerald-400">{dp.value}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 leading-tight">{dp.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyResearch}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Insights Copied' : 'Export Synthesis'}
                                        </button>
                                    </div>
                                </div>

                                {/* Findings View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Deep Analytic Processing
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                                                {outputData.topic}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-sky-500/30 underline-offset-8">
                                                <Lightbulb className="w-6 h-6 text-amber-500" />
                                                High-Impact Findings
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {outputData.keyFindings.map((finding, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-2xl p-6 hover:bg-slate-900 transition-all relative overflow-hidden"
                                                    >
                                                        <p className="text-md text-slate-300 font-medium leading-relaxed relative z-10">{finding}</p>
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 blur-[20px] pointer-events-none rounded-full" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-12">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] uppercase font-black text-sky-400 tracking-widest">Scientific implications</h4>
                                                <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                                                    "{outputData.futureImplications}"
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] uppercase font-black text-rose-400 tracking-widest">Methodology & Biases</h4>
                                                <div className="space-y-2">
                                                    {outputData.potentialBiases.map((bias, i) => (
                                                        <div key={i} className="flex gap-2 items-center text-xs text-slate-500">
                                                            <div className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                            {bias}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Research Analyzer (AI Tool)"
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
