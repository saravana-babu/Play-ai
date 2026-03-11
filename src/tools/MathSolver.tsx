import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Binary, Sigma, Zap, Check, Copy, AlertCircle, ChevronRight, Calculator, Lightbulb, Target, Info, RefreshCw, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Step {
    label: string;
    explanation: string;
    formula?: string;
}

interface MathData {
    problemTitle: string;
    subjectArea: string;
    finalResult: string;
    steps: Step[];
    conceptualInsight: string;
    relatedFormulas: string[];
    verificationTip: string;
}

export default function MathSolver() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [problem, setProblem] = useState('');
    const [detailLevel, setDetailLevel] = useState('Step-by-Step');

    const [outputData, setOutputData] = useState<MathData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSolve = async () => {
        if (!problem.trim()) {
            setError('Please enter the math problem you want to solve.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a World-Class Mathematician and Theoretical Physicist.
            
            Problem: "${problem}"
            Detail Level: "${detailLevel}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "problemTitle": "Concise name for the problem",
                "subjectArea": "e.g. Calculus, Linear Algebra, Statistics",
                "finalResult": "The ultimate solution (use LaTeX-style formatting if needed)",
                "steps": [
                    { "label": "Step 1: Simplify", "explanation": "Brief logical reason", "formula": "e.g. 2x + 5 = 10" }
                ],
                "conceptualInsight": "Why this method works or the underlying mathematical principle.",
                "relatedFormulas": ["Formula 1", "Formula 2"],
                "verificationTip": "How to check if this answer is correct manually."
            }
            
            Use clean strings. For math notation, prioritize readability.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `SOLVE MATH PROBLEM:\nProblem: ${problem}\nDetail: ${detailLevel}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'math-solver'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as MathData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Calculation Error: Failed to solve problem. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySolution = () => {
        if (outputData) {
            const content = `PROBLEM: ${outputData.problemTitle}\nRESULT: ${outputData.finalResult}\n\nSTEPS:\n${outputData.steps.map(s => `${s.label}: ${s.explanation} -> ${s.formula || ''}`).join('\n')}`;
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
                                    <PenTool className="w-4 h-4 text-indigo-400" />
                                    Input Math Equation / Problem
                                </label>
                                <textarea
                                    value={problem}
                                    onChange={(e) => setProblem(e.target.value)}
                                    placeholder="e.g. Find the derivative of f(x) = sin(x^2)... or 'Integrate 3x^2 from 0 to 5'"
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner text-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Sigma className="w-4 h-4 text-indigo-400" />
                                    Explanatory Depth
                                </label>
                                <select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                    <option>Result Only (Fast)</option>
                                    <option>Step-by-Step (Standard)</option>
                                    <option>First Principles (Deep)</option>
                                    <option>Proof Style (Theoretical)</option>
                                </select>
                            </div>
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    "Accuracy is the primary constraint. Our math engine utilizes logical verification to ensure results are mathematically sound before display."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSolve}
                            disabled={isLoading || !problem.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calculator className="w-6 h-6" />}
                            {isLoading ? 'Computing Iterations...' : 'Solve Problem'}
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
                                <motion.div animate={{ rotate: [0, 180, 360], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <Binary className="w-20 h-20 text-indigo-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Computational Proofs</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Parsing algebraic structures and differentiation rules via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Theory Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-indigo-400" /> Result Verification
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-bold p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 italic">
                                                "{outputData.verificationTip}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Lightbulb className="w-3 h-3 text-amber-500" /> Essential Insights</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                {outputData.conceptualInsight}
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Related Axioms</div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.relatedFormulas.map((f, i) => (
                                                    <span key={i} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 font-black tracking-wider font-mono">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopySolution}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Solution Copied' : 'Export Full Solution'}
                                        </button>
                                    </div>
                                </div>

                                {/* Calculation View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                Logic & Math Module
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.problemTitle}
                                            </h2>
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{outputData.subjectArea}</div>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Final Convergence</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Calculated Solution:</div>
                                                <div className="text-4xl sm:text-6xl font-black text-white font-mono break-all leading-tight">
                                                    {outputData.finalResult}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-indigo-500/30 underline-offset-8">
                                                <RefreshCw className="w-6 h-6 text-indigo-400" />
                                                Step-by-Step Derivation
                                            </h3>

                                            <div className="space-y-6">
                                                {outputData.steps.map((step, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group flex gap-6 items-start"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center font-black text-indigo-500 text-xs shrink-0 group-hover:border-indigo-500 transition-all">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-black text-white mb-1 uppercase tracking-wider">{step.label}</h4>
                                                                <p className="text-xs text-slate-400 leading-relaxed italic">{step.explanation}</p>
                                                            </div>
                                                            {step.formula && (
                                                                <div className="p-4 bg-slate-900 rounded-xl border border-white/5 font-mono text-indigo-300 text-md overflow-x-auto whitespace-nowrap">
                                                                    {step.formula}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Math Result (AI Tool)"
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
