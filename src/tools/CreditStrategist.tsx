import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, ShieldCheck, Gauge, Zap, Check, Copy, AlertCircle, ChevronRight, Calculator, Landmark, Target, Info, CreditCard, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActionStep {
    phase: string;
    action: string;
    impact: string;
}

interface CreditData {
    estimatedScoreRange: string;
    primaryObstacles: string[];
    actionPlan: ActionStep[];
    utilizationTarget: string;
    bureauNegotiationTips: string[];
    longTermMaintenance: string;
    impactSummary: string;
}

export default function CreditStrategist() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [financialContext, setFinancialContext] = useState('');
    const [currentScore, setCurrentScore] = useState('550-600');
    const [improvementGoal, setImprovementGoal] = useState('750+');

    const [outputData, setOutputData] = useState<CreditData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!financialContext.trim()) {
            setError('Please provide some context about your current debts, credit limits, or any recent negative marks.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Credit Analyst and Debt Strategist AI specializing in FICO and VantageScore algorithms.
            
            Current Range: "${currentScore}"
            Goal: "${improvementGoal}"
            Financial Context: "${financialContext}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "estimatedScoreRange": "A realistic current assessment (e.g. 580)",
                "primaryObstacles": ["High utilization", "Missed payments 2023"],
                "actionPlan": [
                    { "phase": "Immediate (0-30 days)", "action": "Pay down $X on card Y", "impact": "+20 points estimated" }
                ],
                "utilizationTarget": "The specific percentage to keep balances under.",
                "bureauNegotiationTips": ["Tip on disputing", "Tip on goodwill letters"],
                "longTermMaintenance": "How to stay in the high range permanently.",
                "impactSummary": "A punchy summary of the strategy's expected success."
            }
            
            Focus on maximizing credit-mix and lowering utilization.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CREDIT STRATEGY:\nCurrent: ${currentScore}\nGoal: ${improvementGoal}\nContext: ${financialContext}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'credit-strategist'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as CreditData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Financial Failure: Failed to generate credit strategy. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyStrategy = () => {
        if (outputData) {
            const content = `CREDIT GOAL: ${improvementGoal}\nSTRATEGY: ${outputData.impactSummary}\n\nPLAN:\n${outputData.actionPlan.map(p => `${p.phase}: ${p.action}`).join('\n')}`;
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
                                    <CreditCard className="w-4 h-4 text-sky-400" />
                                    Current Debt & Account Context
                                </label>
                                <textarea
                                    value={financialContext}
                                    onChange={(e) => setFinancialContext(e.target.value)}
                                    placeholder="e.g. I have 3 cards, $10k limit combined, 80% used. One collections item from 2 years ago..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Current Range</label>
                                    <select value={currentScore} onChange={(e) => setCurrentScore(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Poor (300-579)</option>
                                        <option>Fair (580-669)</option>
                                        <option>Good (670-739)</option>
                                        <option>Excellent (800+)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Target Goal</label>
                                    <select value={improvementGoal} onChange={(e) => setImprovementGoal(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>700+</option>
                                        <option>750+</option>
                                        <option>800+</option>
                                        <option>Perfect (850)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-sky-500/50" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Your credit score is a dynamic risk model. Our AI simulates bureau algorithm behaviors to prioritize the most impactful financial interventions."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !financialContext.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gauge className="w-6 h-6" />}
                            {isLoading ? 'Hashing Score Algorithms...' : 'Generate Recovery Path'}
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
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Calculator className="w-20 h-20 text-sky-500/30" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Aggregating Bureau Probabilities</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Weighting payment history and mix via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Insights Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-6 text-center">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Projected Delta</div>
                                            <div className="text-6xl font-black text-sky-400 tracking-tighter">
                                                {outputData.estimatedScoreRange}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase">Core Valuation</div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3 text-rose-500" /> Primary Obstacles
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.primaryObstacles.map((obs, i) => (
                                                    <div key={i} className="text-[11px] text-slate-400 font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                                                        {obs}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500" /> Bureau Negotiation</div>
                                            {outputData.bureauNegotiationTips.map((tip, i) => (
                                                <p key={i} className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-amber-500 pl-4">
                                                    "{tip}"
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyStrategy}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Strategy Copied' : 'Export Strategy Doc'}
                                        </button>
                                    </div>
                                </div>

                                {/* Plan View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Strategic Recovery Model
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.impactSummary}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <TrendingUp className="w-6 h-6 text-sky-400" />
                                                Milestone Action Plan
                                            </h3>

                                            <div className="space-y-4">
                                                {outputData.actionPlan.map((step, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                                                    >
                                                        <div className="space-y-2 max-w-lg">
                                                            <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{step.phase}</div>
                                                            <h4 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">{step.action}</h4>
                                                        </div>
                                                        <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider shrink-0">
                                                            Impact: {step.impact}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-t-8 border-t-sky-600">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                <div className="space-y-4">
                                                    <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Target Utilization:</div>
                                                    <div className="text-4xl font-black text-white italic">{outputData.utilizationTarget}</div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sustainability Note:</div>
                                                    <p className="text-xs text-slate-400 italic leading-relaxed font-medium">"{outputData.longTermMaintenance}"</p>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.02] to-transparent pointer-events-none" />
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Credit Strategy (AI Tool)"
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
