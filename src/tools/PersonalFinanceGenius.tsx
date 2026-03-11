import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, TrendingUp, DollarSign, PieChart, Target, Check, Copy, AlertCircle, ChevronRight, BarChart3, Landmark, Wallet, ShieldCheck, Flame, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialInsight {
    title: string;
    description: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
}

interface FinanceData {
    profileName: string;
    netWorthEstimate: string;
    savingsRate: string;
    riskProfile: string;
    insights: FinancialInsight[];
    suggestedAllocations: { label: string; percentage: number }[];
    taxEfficiencyScore: number;
    strategicAdvice: string;
}

export default function PersonalFinanceGenius() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [incomeData, setIncomeData] = useState('');
    const [expensesData, setExpensesData] = useState('');
    const [goals, setGoals] = useState('');

    const [outputData, setOutputData] = useState<FinanceData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleAnalyze = async () => {
        if (!incomeData.trim() || !expensesData.trim()) {
            setError('Please provide at least basic income and expense data.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Certified Financial Planner and Wealth Management Advisor.
            
            Income Data: "${incomeData}"
            Expenses Data: "${expensesData}"
            Goals: "${goals}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "profileName": "A professional name for this financial profile",
                "netWorthEstimate": "Estimated surplus/deficit summary",
                "savingsRate": "Calculated % (approx)",
                "riskProfile": "Aggressive/Moderate/Conservative based on goals",
                "insights": [
                    { "title": "Insight 1", "description": "Short explanation", "impact": "Positive/Negative/Neutral" }
                ],
                "suggestedAllocations": [
                    { "label": "Stocks/ETFs", "percentage": 60 },
                    { "label": "Real Estate", "percentage": 20 }
                ],
                "taxEfficiencyScore": number (1-100),
                "strategicAdvice": "The single most important financial move to make next."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `ANALYZE FINANCES:\nIncome: ${incomeData}\nExpenses: ${expensesData}\nGoals: ${goals}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'finance-analyzer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as FinanceData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Liquidity Error: Failed to analyze finances. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyAdvice = () => {
        if (outputData) {
            const content = `FINANCIAL ADVICE: ${outputData.profileName}\n\nSTRATEGY: ${outputData.strategicAdvice}\n\nALLOCATIONS:\n${outputData.suggestedAllocations.map(a => `- ${a.label}: ${a.percentage}%`).join('\n')}`;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-emerald-400" />
                                    Monthly Income Streams
                                </label>
                                <textarea
                                    value={incomeData}
                                    onChange={(e) => setIncomeData(e.target.value)}
                                    placeholder="e.g. Salary: $5000, Dividends: $200, Rent: $1000..."
                                    className="w-full h-24 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-rose-400" />
                                    Monthly Burn / Expenses
                                </label>
                                <textarea
                                    value={expensesData}
                                    onChange={(e) => setExpensesData(e.target.value)}
                                    placeholder="e.g. Rent: $1500, Food: $600, Netflix: $20, Loan: $400..."
                                    className="w-full h-24 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-sky-400" />
                                    Financial Goals / Timeline
                                </label>
                                <textarea
                                    value={goals}
                                    onChange={(e) => setGoals(e.target.value)}
                                    placeholder="e.g. 'Retire in 10 years', 'Save for a Tesla', 'Pay off debt in 2 years'..."
                                    className="w-full h-56 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !incomeData.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <TrendingUp className="w-6 h-6" />}
                            {isLoading ? 'Decrypting Ledgers...' : 'Optimize Personal Wealth'}
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
                                <motion.div animate={{ scale: [1, 1.1, 1], y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <DollarSign className="w-20 h-20 text-emerald-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Aggregating Global Yield Rates</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Calculating compound interest vectors and tax liability via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Dashboard Top Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 bg-slate-950/50 border-b border-white/10">
                                    <div className="p-8 border-r border-white/10 space-y-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Net Surplus Estimate</div>
                                        <div className="text-2xl font-black text-white">{outputData.netWorthEstimate}</div>
                                    </div>
                                    <div className="p-8 border-r border-white/10 space-y-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Savings Rate</div>
                                        <div className="text-2xl font-black text-emerald-400">{outputData.savingsRate}</div>
                                    </div>
                                    <div className="p-8 border-r border-white/10 space-y-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Risk Appetite</div>
                                        <div className="text-2xl font-black text-sky-400">{outputData.riskProfile}</div>
                                    </div>
                                    <div className="p-8 space-y-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Tax Efficiency</div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl font-black text-white">{outputData.taxEfficiencyScore}%</div>
                                            <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${outputData.taxEfficiencyScore}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Insights Sidebar */}
                                    <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                        <div className="space-y-8">
                                            <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3 text-emerald-400" /> Critical Observations
                                            </h3>
                                            <div className="space-y-4">
                                                {outputData.insights.map((insight, i) => (
                                                    <div key={i} className={`p-4 rounded-2xl border ${insight.impact === 'Positive' ? 'bg-emerald-500/5 border-emerald-500/10' :
                                                            insight.impact === 'Negative' ? 'bg-rose-500/5 border-rose-500/10' :
                                                                'bg-slate-900 border-white/5'
                                                        }`}>
                                                        <div className={`text-[9px] font-black uppercase mb-1 ${insight.impact === 'Positive' ? 'text-emerald-500' :
                                                                insight.impact === 'Negative' ? 'text-rose-500' :
                                                                    'text-slate-500'
                                                            }`}>
                                                            {insight.impact} impact
                                                        </div>
                                                        <div className="text-sm font-black text-white mb-1">{insight.title}</div>
                                                        <p className="text-[11px] text-slate-400 leading-tight italic">{insight.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                onClick={handleCopyAdvice}
                                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                                {copied ? 'Strategy Copied' : 'Export Full Plan'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recommendations View */}
                                    <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                        <div className="max-w-4xl mx-auto space-y-16">
                                            <div className="space-y-4">
                                                <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    Automated Wealth Synthesis
                                                </div>
                                                <h2 className="text-4xl sm:text-6xl font-black text-white leading-none italic uppercase tracking-tighter italic">
                                                    {outputData.profileName}
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-8">
                                                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                        <PieChart className="w-6 h-6 text-emerald-400" />
                                                        Portfolio Allocation
                                                    </h3>
                                                    <div className="space-y-6">
                                                        {outputData.suggestedAllocations.map((a, i) => (
                                                            <div key={i} className="space-y-2">
                                                                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                                                                    <span>{a.label}</span>
                                                                    <span className="text-white text-lg">{a.percentage}%</span>
                                                                </div>
                                                                <div className="h-3 bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }} animate={{ width: `${a.percentage}%` }}
                                                                        className="h-full bg-gradient-to-r from-emerald-600 to-sky-600"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                        <ShieldCheck className="w-6 h-6 text-sky-400" />
                                                        Strategic Master Move
                                                    </h3>
                                                    <div className="bg-slate-950/80 p-10 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden h-full flex flex-col justify-center">
                                                        <div className="text-[10px] font-black text-slate-700 uppercase mb-4 tracking-widest">Priority One</div>
                                                        <p className="text-2xl sm:text-3xl text-emerald-400 font-serif leading-relaxed tracking-tight group-hover:text-white transition-colors">
                                                            "{outputData.strategicAdvice}"
                                                        </p>
                                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[50px] pointer-events-none rounded-full" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-10 border-t border-white/10">
                                                <ShareButtonsComponent
                                                    gameTitle="AI Wealth Manager (AI Tool)"
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
