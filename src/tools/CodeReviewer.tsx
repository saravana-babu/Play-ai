import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Code2, Sparkles, BugPlay, ShieldAlert, Cpu, Palette, AlertCircle, FileCode2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ReviewData {
    languageDetected: string;
    overallScore: number;
    bugsCount: number;
    securityCount: number;
    performanceCount: number;
    styleCount: number;
    summary: string;
    detailedFeedback: string;
}

export default function CodeReviewer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [codeBlock, setCodeBlock] = useState('');
    const [language, setLanguage] = useState('');

    const [checkBugs, setCheckBugs] = useState(true);
    const [checkSecurity, setCheckSecurity] = useState(true);
    const [checkPerformance, setCheckPerformance] = useState(false);
    const [checkStyle, setCheckStyle] = useState(false);

    const [outputData, setOutputData] = useState<ReviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReview = async () => {
        if (!codeBlock.trim()) {
            setError('Please provide some code to review.');
            return;
        }

        const selectedChecks = [];
        if (checkBugs) selectedChecks.push('Bugs & Logical Errors');
        if (checkSecurity) selectedChecks.push('Security Vulnerabilities');
        if (checkPerformance) selectedChecks.push('Performance Optimizations');
        if (checkStyle) selectedChecks.push('Style & Best Practices');

        if (selectedChecks.length === 0) {
            setError('Please select at least one review criterion.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are an elite, highly experienced Lead Software Engineer performing a rigorous code review.
            
            The user wants you to review the following code${language ? ` (Hinted Language: ${language})` : ''}.
            Focus heavily on:
            - ${selectedChecks.join('\n- ')}
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "languageDetected": "string (e.g. Python, React, Unknown)",
                "overallScore": number (1 to 100 representing code quality),
                "bugsCount": number (count of critical logical/syntax bugs found),
                "securityCount": number (count of security vulnerabilities found),
                "performanceCount": number (count of inefficient performance bottlenecks),
                "styleCount": number (count of style/linting issues),
                "summary": "A 1-2 sentence high-level summary of the code quality.",
                "detailedFeedback": "A highly detailed markdown string containing in-depth analysis, specific line issues, and fixed code blocks. Use standard markdown."
            }
            
            Do not include conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CODE TO REVIEW:\n"""\n${codeBlock}\n"""`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as ReviewData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to review code. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 70) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-white font-bold text-lg flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-emerald-400" />
                                Code Payload
                            </label>
                            <textarea
                                value={codeBlock}
                                onChange={(e) => setCodeBlock(e.target.value)}
                                placeholder="Paste your script, entire file, or specific function here..."
                                className="w-full h-64 bg-slate-950/80 border border-white/10 rounded-xl p-4 text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-slate-600 font-mono text-sm shadow-inner"
                                spellCheck="false"
                            />
                        </div>

                        <div className="w-full sm:w-64 space-y-6 flex flex-col">
                            <div className="space-y-2">
                                <label className="text-white font-bold text-sm block">Language / Framework (Optional)</label>
                                <input
                                    type="text"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    placeholder="e.g. React, Python, Rust"
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 text-sm"
                                />
                            </div>

                            <div className="space-y-3 flex-1">
                                <label className="text-white font-bold text-sm block">Review Criteria</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setCheckBugs(!checkBugs)}>
                                        <div className={`flex items-center justify-center w-5 h-5 rounded border ${checkBugs ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-white/20 group-hover:border-emerald-500/50'} transition-colors`}>
                                            {checkBugs && <BugPlay className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${checkBugs ? 'text-white' : 'text-slate-400'}`}>Find Bugs</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setCheckSecurity(!checkSecurity)}>
                                        <div className={`flex items-center justify-center w-5 h-5 rounded border ${checkSecurity ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-white/20 group-hover:border-emerald-500/50'} transition-colors`}>
                                            {checkSecurity && <ShieldAlert className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${checkSecurity ? 'text-white' : 'text-slate-400'}`}>Security Check</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setCheckPerformance(!checkPerformance)}>
                                        <div className={`flex items-center justify-center w-5 h-5 rounded border ${checkPerformance ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-white/20 group-hover:border-emerald-500/50'} transition-colors`}>
                                            {checkPerformance && <Cpu className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${checkPerformance ? 'text-white' : 'text-slate-400'}`}>Optimize Speed</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setCheckStyle(!checkStyle)}>
                                        <div className={`flex items-center justify-center w-5 h-5 rounded border ${checkStyle ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-900 border-white/20 group-hover:border-emerald-500/50'} transition-colors`}>
                                            {checkStyle && <Palette className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${checkStyle ? 'text-white' : 'text-slate-400'}`}>Code Style</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleReview}
                                disabled={isLoading || !codeBlock.trim() || !(checkBugs || checkSecurity || checkPerformance || checkStyle)}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20 mt-auto"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Reviewing...' : 'Review Code'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {(outputData || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <BugPlay className="w-6 h-6 text-emerald-400" />
                            Security & Architect Audit
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Code2 className="w-16 h-16 animate-pulse text-emerald-500/50" />
                            <p className="animate-pulse font-medium text-lg">Running static analysis and compiling checks via {selectedLlm}...</p>
                        </div>
                    ) : outputData ? (
                        <div className="space-y-8">

                            {/* Dashboard Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                    className="col-span-2 md:col-span-1 p-4 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col items-center justify-center text-center group hover:bg-slate-900/80 transition-colors"
                                >
                                    <div className="text-xs uppercase font-black tracking-widest text-slate-500 mb-2">Quality Score</div>
                                    <div className={`text-4xl font-black ${getScoreColor(outputData.overallScore)}`}>
                                        {outputData.overallScore}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    className="p-4 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col justify-between group hover:bg-slate-900/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-rose-400">
                                        <BugPlay className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Bugs</span>
                                    </div>
                                    <div className="text-3xl font-bold mt-2 text-white">
                                        {outputData.bugsCount}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                    className="p-4 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col justify-between group hover:bg-slate-900/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Security</span>
                                    </div>
                                    <div className="text-3xl font-bold mt-2 text-white">
                                        {outputData.securityCount}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                    className="p-4 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col justify-between group hover:bg-slate-900/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Cpu className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Performance</span>
                                    </div>
                                    <div className="text-3xl font-bold mt-2 text-white">
                                        {outputData.performanceCount}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                    className="p-4 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col justify-between group hover:bg-slate-900/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Palette className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Style/Lint</span>
                                    </div>
                                    <div className="text-3xl font-bold mt-2 text-white">
                                        {outputData.styleCount}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Language Detect & Summary Banner */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 items-center bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
                                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                                    <FileCode2 className="w-5 h-5" />
                                    <span className="font-bold whitespace-nowrap">{outputData.languageDetected}</span>
                                </div>
                                <div className="text-emerald-200/80 font-medium text-sm leading-relaxed flex-1">
                                    {outputData.summary}
                                </div>
                            </motion.div>

                            {/* High Fidelity Markdown Area */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-6 border-t border-white/10">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    Detailed Feedback & Fixes
                                </h4>
                                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert prose-emerald max-w-none prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-emerald-500/20 prose-pre:shadow-inner prose-pre:p-4">
                                    {outputData.detailedFeedback}
                                </div>
                            </motion.div>


                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="AI Code Reviewer (AI Tool)"
                                    result="won"
                                    penalty={null}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
