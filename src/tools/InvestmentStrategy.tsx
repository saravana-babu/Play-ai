import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, TrendingUp, BarChart3, Zap, Check, Copy, AlertCircle, ChevronRight, PieChart, LineChart, Target, Info, Landmark, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Allocation {
    assetClass: string;
    percentage: number;
    description: string;
}

interface InvestmentData {
    strategyName: string;
    riskProfile: string;
    recommendedAllocations: Allocation[];
    diversificationRationale: string;
    marketOutlook: string;
    rebalancingAdvice: string;
    suggestedInstruments: string[];
}

export default function InvestmentStrategy() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [capital, setCapital] = useState('');
    const [riskAppetite, setRiskAppetite] = useState('Moderate');
    const [timeHorizon, setTimeHorizon] = useState('5-10 Years');

    const [outputData, setOutputData] = useState<InvestmentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!capital.trim()) {
            setError('Please enter your investable capital or financial goals.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Quantitative Investment Strategist and Wealth Manager.
            
            Capital/Goal: "${capital}"
            Risk Profile: "${riskAppetite}"
            Time Horizon: "${timeHorizon}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "strategyName": "Professional Strategy Name",
                "riskProfile": "Deep analysis of the risk/reward ratio.",
                "recommendedAllocations": [
                    { "assetClass": "Equities", "percentage": 60, "description": "High growth potential..." }
                ],
                "diversificationRationale": "Why this specific split was chosen.",
                "marketOutlook": "General macroeconomic assumptions used for this plan.",
                "rebalancingAdvice": "How and when to adjust these holdings.",
                "suggestedInstruments": ["ETF 1", "Index 2", "Asset 3"]
            }
            
            Focus on modern portfolio theory and risk-adjusted returns.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE INVESTMENT STRATEGY:\nCapital: ${capital}\nRisk: ${riskAppetite}\nHorizon: ${timeHorizon}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'investment-strategy'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as InvestmentData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Financial Error: Failed to generate strategy. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPlan = () => {
        if (outputData) {
            const content = `STRATEGY: ${outputData.strategyName}\nRISK: ${outputData.riskProfile}\n\nALLOCATIONS:\n${outputData.recommendedAllocations.map(a => `${a.assetClass}: ${a.percentage}%`).join('\n')}`;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-emerald-400" />
                                    Investable Capital / Financial Goal
                                </label>
                                <textarea
                                    value={capital}
                                    onChange={(e) => setCapital(e.target.value)}
                                    placeholder="e.g. $50,000 to invest for long-term growth, or 'I want to reach $1M in 20 years'..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Risk Appetite</label>
                                    <select value={riskAppetite} onChange={(e) => setRiskAppetite(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Conservative</option>
                                        <option>Moderate</option>
                                        <option>Aggressive / Growth</option>
                                        <option>Speculative / High-Risk</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Time Horizon</label>
                                    <select value={timeHorizon} onChange={(e) => setTimeHorizon(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Less than 1 Year</option>
                                        <option>1-3 Years</option>
                                        <option>5-10 Years</option>
                                        <option>20+ Years</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Portfolio optimization requires balancing systemic risk with yield potential. Our AI utilizes alpha-beta separation models to suggest modern allocations."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !capital.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-6 h-6" />}
                            {isLoading ? 'Running Monte Carlo Simulations...' : 'Optimize Portfolio'}
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
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <PieChart className="w-20 h-20 text-emerald-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Calculating Correlation Matrices</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Adjusting Sharpe Ratios and yield projections via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Strategic Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3 text-emerald-400" /> Allocation Breakdown
                                            </div>
                                            <div className="space-y-3">
                                                {outputData.recommendedAllocations.map((a, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-white">
                                                            <span>{a.assetClass}</span>
                                                            <span className="text-emerald-400">{a.percentage}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.percentage}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Target className="w-3 h-3 text-sky-400" /> Market Intelligence</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium italic p-4 bg-slate-900 rounded-xl border border-white/5">
                                                "{outputData.marketOutlook}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Suggested Vehicles</div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.suggestedInstruments.map((inst, i) => (
                                                    <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-black tracking-wider uppercase">{inst}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyPlan}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Strategy Copied' : 'Export Strategy Log'}
                                        </button>
                                    </div>
                                </div>

                                {/* Detailed View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4 text-center sm:text-left">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                AI Portfolio Synthesis
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.strategyName}
                                            </h2>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{outputData.riskProfile}</p>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-emerald-500/30 underline-offset-8">
                                                <Landmark className="w-6 h-6 text-emerald-400" />
                                                Core Diversification Rationale
                                            </h3>
                                            <p className="text-lg text-slate-300 font-bold leading-relaxed italic border-l-4 border-emerald-500 pl-8">
                                                "{outputData.diversificationRationale}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {outputData.recommendedAllocations.map((a, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-all flex flex-col justify-between"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{a.assetClass}</div>
                                                            <div className="text-xl font-black text-white">{a.percentage}%</div>
                                                        </div>
                                                        <p className="text-xs text-slate-400 leading-relaxed italic">{a.description}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-l-8 border-l-sky-600">
                                            <div className="space-y-4">
                                                <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest italic">Governance & Maintenance:</div>
                                                <p className="text-xl sm:text-2xl text-white font-black leading-tight tracking-tight italic">
                                                    "{outputData.rebalancingAdvice}"
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-sky-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Investment Strategy (AI Tool)"
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
