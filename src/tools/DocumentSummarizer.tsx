import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, FileText, ListChecks, Zap, Clock, Hash, CheckCircle2, AlertCircle, Copy, Check, BarChart, LayoutDashboard, ChevronRight, Minimize2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SummaryData {
    title: string;
    summary: string;
    keyTakeaways: string[];
    actionItems: string[];
    stats: {
        originalWords: number;
        summaryWords: number;
        reductionPercentage: number;
        timeSaved: string;
    };
    keywords: string[];
}

export default function DocumentSummarizer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [textContent, setTextContent] = useState('');
    const [summaryType, setSummaryType] = useState('Key Takeaways');

    const [outputData, setOutputData] = useState<SummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSummarize = async () => {
        if (!textContent.trim() || textContent.length < 50) {
            setError('Please provide at least 50 characters of text to summarize.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a peak-performance Document Analyst and Executive Assistant.
            
            The user needs a summary of this document.
            Summary Type requested: "${summaryType}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "title": "A professional short title for this document",
                "summary": "A concise master summary paragraph.",
                "keyTakeaways": ["Point 1", "Point 2", "Point 3", "Point 4"],
                "actionItems": ["Action 1", "Action 2"],
                "stats": {
                    "originalWords": number,
                    "summaryWords": number,
                    "reductionPercentage": number (0-100),
                    "timeSaved": "e.g. 12 minutes saved"
                },
                "keywords": ["keyword1", "keyword2", "keyword3"]
            }
            
            Calculate the word counts accurately based on the input text.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `SUMMARIZE THIS TEXT (Type: ${summaryType}):\n\n${textContent.slice(0, 8000)}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'document-summarizer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SummaryData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to summarize document. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySummary = () => {
        if (outputData) {
            const content = `TITLE: ${outputData.title}\n\nSUMMARY:\n${outputData.summary}\n\nKEY TAKEAWAYS:\n${outputData.keyTakeaways.join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <FileText className="w-7 h-7 text-emerald-400" />
                            Document Input
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Paste your long report, article, or legal draft below for instant compression.</p>
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="e.g. Paste a long corporate earnings report, a research paper, or a complex article..."
                            className="w-full h-48 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="w-full sm:w-1/2 space-y-2">
                            <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block">Summary Logic</label>
                            <div className="flex gap-2 flex-wrap">
                                {['Key Takeaways', 'Executive Summary', 'Action Items Only', 'Detailed Abstract'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setSummaryType(t)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${summaryType === t
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end">
                            <button
                                onClick={handleSummarize}
                                disabled={isLoading || textContent.length < 50}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Minimize2 className="w-6 h-6" />}
                                {isLoading ? 'Compressing...' : 'Summarize Now'}
                            </button>
                        </div>
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
                                <motion.div animate={{ scaleY: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Zap className="w-20 h-20 text-emerald-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Extracting Core Intent</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Filtering noise and identifying key entities via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Dashboard Stats Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/10 bg-slate-950/50">
                                    <div className="p-6 border-r border-white/10 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Compression</div>
                                        <div className="text-3xl font-black text-white">{outputData.stats.reductionPercentage}%</div>
                                    </div>
                                    <div className="p-6 md:border-r border-white/10 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Time Saved</div>
                                        <div className="text-3xl font-black text-emerald-400">{outputData.stats.timeSaved.split(' ')[0]} <span className="text-sm">min</span></div>
                                    </div>
                                    <div className="p-6 border-r border-white/10 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Orig. Words</div>
                                        <div className="text-2xl font-black text-slate-400">{outputData.stats.originalWords}</div>
                                    </div>
                                    <div className="p-6 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">New Intent</div>
                                        <div className="text-2xl font-black text-slate-400">{outputData.stats.summaryWords}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Sidebar Content */}
                                    <div className="w-full lg:w-96 p-8 bg-slate-950/30 border-b lg:border-b-0 lg:border-r border-white/10 space-y-10">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <ListChecks className="w-3 h-3 text-emerald-400" /> Key Takeaways
                                            </h4>
                                            <div className="space-y-3">
                                                {outputData.keyTakeaways.map((item, i) => (
                                                    <div key={i} className="flex gap-3 items-start group">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                                                        <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {outputData.actionItems.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-orange-400 flex items-center gap-2">
                                                    <Send className="w-3 h-3" /> Recommended Actions
                                                </h4>
                                                <div className="space-y-3">
                                                    {outputData.actionItems.map((item, i) => (
                                                        <div key={i} className="bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl text-xs text-orange-200/80 leading-relaxed">
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Hash className="w-3 h-3" /> Top Entities
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.keywords.map((word, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-900 border border-white/5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="flex-1 p-6 sm:p-12 bg-slate-900 space-y-10 overflow-y-auto max-h-[800px]">
                                        <div className="max-w-3xl mx-auto space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                                                        {outputData.title}
                                                    </h2>
                                                    <button
                                                        onClick={handleCopySummary}
                                                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all border border-white/5 shadow-inner shrink-0 ml-4"
                                                    >
                                                        {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                                <div className="h-1 w-20 bg-emerald-500 rounded-full" />
                                            </div>

                                            <div className="bg-slate-950/50 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                    <LayoutDashboard className="w-24 h-24" />
                                                </div>
                                                <p className="text-xl text-slate-200 leading-relaxed font-medium relative z-10">
                                                    {outputData.summary}
                                                </p>
                                            </div>

                                            <div className="pt-10 border-t border-white/10">
                                                <ShareButtonsComponent
                                                    gameTitle="AI Document Summarizer (AI Tool)"
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
