import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Flame, Coins, Zap, Check, Copy, AlertCircle, ChevronRight, Calculator, Landmark, Target, Info, Calendar, Rocket, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FireMilestone {
    age: number;
    netWorth: string;
    status: string;
}

interface FireData {
    fireNumber: string;
    safeWithdrawalAmount: string;
    yearsToIndependence: number;
    milestones: FireMilestone[];
    lifestyleStrategy: string;
    investmentProfile: string;
    earlyRetirementAdvice: string;
    riskMitigation: string;
}

export default function FirePlanner() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [currentAge, setCurrentAge] = useState('30');
    const [monthlySavings, setMonthlySavings] = useState('');
    const [currentNetWorth, setCurrentNetWorth] = useState('');
    const [desiredLifestyle, setDesiredLifestyle] = useState('Moderate');

    const [outputData, setOutputData] = useState<FireData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!monthlySavings || !currentNetWorth) {
            setError('Please provide your monthly savings and current net worth.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Lead Financial Independence Strategist and Actuary AI (specializing in the FIRE movement).
            
            Current Age: "${currentAge}"
            Monthly Savings: "${monthlySavings}"
            Current Net Worth: "${currentNetWorth}"
            Lifestyle Goal: "${desiredLifestyle}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "fireNumber": "$1,250,000",
                "safeWithdrawalAmount": "$50,000/year",
                "yearsToIndependence": 15,
                "milestones": [
                    { "age": 35, "netWorth": "$250k", "status": "Coast FIRE reached" }
                ],
                "lifestyleStrategy": "Focus on geo-arbitrage and lean living.",
                "investmentProfile": "Aggressive VTSAX-centric growth.",
                "earlyRetirementAdvice": "How to handle health insurance and withdrawal sequencing.",
                "riskMitigation": "How to handle sequence of returns risk."
            }
            
            Assume a 7% average market return unless adjusted by context.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `FIRE PLAN:\nAge: ${currentAge}\nSavings: ${monthlySavings}\nNW: ${currentNetWorth}\nLifestyle: ${desiredLifestyle}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'fire-planner'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as FireData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Actuarial Failure: Failed to calculate FIRE path. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPlan = () => {
        if (outputData) {
            const content = `FIRE TARGET: ${outputData.fireNumber}\nYEARS LEFT: ${outputData.yearsToIndependence}\n\nSTRATEGY: ${outputData.lifestyleStrategy}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-400" />
                                        Current Age
                                    </label>
                                    <input
                                        type="number"
                                        value={currentAge}
                                        onChange={(e) => setCurrentAge(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-emerald-400" />
                                        Monthly Savings
                                    </label>
                                    <input
                                        type="text"
                                        value={monthlySavings}
                                        onChange={(e) => setMonthlySavings(e.target.value)}
                                        placeholder="e.g. $2,000"
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-sky-400" />
                                    Current Investable Net Worth
                                </label>
                                <input
                                    type="text"
                                    value={currentNetWorth}
                                    onChange={(e) => setCurrentNetWorth(e.target.value)}
                                    placeholder="e.g. $50,000"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    Desired FIRE Lifestyle
                                </label>
                                <select value={desiredLifestyle} onChange={(e) => setDesiredLifestyle(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                    <option>Lean FIRE (Minimalist / Geo-arbitrage)</option>
                                    <option>Coast FIRE (Partial work / Slow accumulation)</option>
                                    <option>Standard FIRE (Upper-middle class living)</option>
                                    <option>Fat FIRE (Luxury / High expense retirement)</option>
                                </select>
                            </div>
                            <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-start gap-4">
                                <ShieldCheck className="w-6 h-6 text-orange-500 shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Financial Independence is achieved when your Safe Withdrawal Rate (SWR) exceeds your annual expenses. Our AI calculates the compounding nexus for your specific targets."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !monthlySavings || !currentNetWorth}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
                            {isLoading ? 'Projecting Compound Growth...' : 'Ignite FIRE Plan'}
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                    <Flame className="w-20 h-20 text-orange-500/40" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Modeling Actuarial Survival Probabilities</h3>
                                    <p className="animate-pulse font-medium text-orange-300/80">Simulating inflation-adjusted withdrawal sequences via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Metrics Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">The Magic Number</div>
                                            <div className="text-4xl font-black text-orange-400 tracking-tighter leading-none">
                                                {outputData.fireNumber}
                                            </div>
                                            <div className="pt-2 text-[9px] font-black text-slate-600 uppercase">Invested Capital Required</div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-emerald-400" /> Independence Window
                                            </div>
                                            <div className="text-2xl font-black text-white italic">
                                                {outputData.yearsToIndependence} Years
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.max(10, 100 - (outputData.yearsToIndependence * 3))}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-sky-400" /> SWR Assessment</div>
                                            <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
                                                <div className="text-xl font-black text-sky-400">{outputData.safeWithdrawalAmount}</div>
                                                <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Annual Sustained Budget</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyPlan}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'FIRE Path Copied' : 'Export FIRE Roadmap'}
                                        </button>
                                    </div>
                                </div>

                                {/* Roadmap View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4 text-center sm:text-left">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                                Financial Independence Path
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.lifestyleStrategy}
                                            </h2>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-orange-500/30 underline-offset-8">
                                                <Calculator className="w-6 h-6 text-orange-400" />
                                                Compounding Milestones
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {outputData.milestones.map((m, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-3 hover:border-orange-500/30 transition-all"
                                                    >
                                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                                                            <span>Age {m.age}</span>
                                                            <span className="text-emerald-400">{m.netWorth}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-white uppercase italic">{m.status}</h4>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4 p-8 bg-slate-950/50 rounded-3xl border border-white/5">
                                                <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Early Exit Strategy:</div>
                                                <p className="text-sm text-slate-300 font-bold leading-relaxed italic">"{outputData.earlyRetirementAdvice}"</p>
                                            </div>
                                            <div className="space-y-4 p-8 bg-slate-950/50 rounded-3xl border border-white/5">
                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Risk Mitigation:</div>
                                                <p className="text-sm text-slate-300 font-bold leading-relaxed italic">"{outputData.riskMitigation}"</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-b-8 border-b-orange-600">
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="p-4 bg-orange-600/10 rounded-2xl border border-orange-600/20">
                                                    <Rocket className="w-8 h-8 text-orange-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Investment Profile Suggestion:</div>
                                                    <p className="text-xl font-black text-white italic">{outputData.investmentProfile}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI FIRE Planner (AI Tool)"
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
