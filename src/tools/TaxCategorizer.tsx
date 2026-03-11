import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Landmark, Receipt, Zap, Check, Copy, AlertCircle, ChevronRight, FileText, PieChart, Target, Info, ShieldCheck, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseItem {
    description: string;
    amount: string;
    category: string;
    deductibility: 'Fully' | 'Partially' | 'Unlikely';
    reason: string;
}

interface TaxData {
    totalCategorized: number;
    expenseItems: ExpenseItem[];
    taxSavingStrategies: string[];
    potentialAuditRisks: string[];
    filingAdvice: string;
}

export default function TaxCategorizer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [expensesRaw, setExpensesRaw] = useState('');
    const [businessType, setBusinessType] = useState('Solo Freelancer');

    const [outputData, setOutputData] = useState<TaxData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCategorize = async () => {
        if (!expensesRaw.trim()) {
            setError('Please paste your expense descriptions and amounts.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Tax Consultant and CPA AI specializing in small business and freelancer tax code (IRS/HMRC standards).
            
            Business Type: "${businessType}"
            Raw Expenses: "${expensesRaw}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "totalCategorized": 10,
                "expenseItems": [
                    { "description": "Amazon AWS", "amount": "$45.00", "category": "Software/Hosting", "deductibility": "Fully", "reason": "Necessary business ops cost." }
                ],
                "taxSavingStrategies": ["Strategy 1", "Strategy 2"],
                "potentialAuditRisks": ["Risk 1", "Risk 2"],
                "filingAdvice": "General strategic advice for the upcoming tax season."
            }
            
            Focus on maximizing legal deductions.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CATEGORIZE EXPENSES:\nType: ${businessType}\nRaw: ${expensesRaw.substring(0, 2000)}...`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'tax-assistant'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as TaxData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Financial Error: Failed to categorize expenses. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyReport = () => {
        if (outputData) {
            const content = `TAX REPORT: ${outputData.totalCategorized} Items\n\nCATEGORIES:\n${outputData.expenseItems.map(e => `${e.description} -> ${e.category} (${e.deductibility})`).join('\n')}`;
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
                                    <Receipt className="w-4 h-4 text-emerald-400" />
                                    Paste Raw Expenses (Description + Amount)
                                </label>
                                <textarea
                                    value={expensesRaw}
                                    onChange={(e) => setExpensesRaw(e.target.value)}
                                    placeholder="e.g. Starbucks 5.50, Apple App Store 9.99, Flight to London 450.00..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-emerald-400" />
                                    Tax Entity / Business Type
                                </label>
                                <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                    <option>Solo Freelancer (1099)</option>
                                    <option>S-Corp / LLC</option>
                                    <option>Ecommerce Seller</option>
                                    <option>Content Creator / Influencer</option>
                                    <option>Real Estate Investor</option>
                                </select>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-4">
                                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Our AI accountant performs high-fidelity classification to ensure your deductions match regional tax codes based on recent precedence."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleCategorize}
                            disabled={isLoading || !expensesRaw.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                            {isLoading ? 'Batch Processing Ledgers...' : 'Categorize Expenses'}
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
                                    <h3 className="text-xl font-bold text-white">Reconciling Transaction Clusters</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Mapping tax codes and deduction eligibility via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Finance Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="text-emerald-400 w-3 h-3" /> Growth Strategies
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.taxSavingStrategies.map((s, i) => (
                                                    <div key={i} className="flex gap-2 items-start text-xs text-slate-400 font-bold bg-white/5 p-3 rounded-xl border border-white/5 italic">
                                                        <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <ShieldCheck className="w-3 h-3 text-sky-400" /> Filing Oversight
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                                                "{outputData.filingAdvice}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><AlertCircle className="w-3 h-3 text-rose-500" /> Audit Risks</div>
                                            <div className="space-y-2">
                                                {outputData.potentialAuditRisks.map((r, i) => (
                                                    <div key={i} className="p-3 bg-rose-500/5 rounded-lg text-[9px] text-rose-300 font-medium border border-rose-500/10 italic">
                                                        "{r}"
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyReport}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Report Copied' : 'Export Full Ledger'}
                                        </button>
                                    </div>
                                </div>

                                {/* Ledger View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                Automated Tax Categorization
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.totalCategorized} Items Processed
                                            </h2>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-emerald-500/30 underline-offset-8">
                                                <Receipt className="w-6 h-6 text-emerald-400" />
                                                Classified Transactions
                                            </h3>

                                            <div className="space-y-4">
                                                {outputData.expenseItems.map((item, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-2xl p-6 hover:bg-slate-900 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{item.category}</div>
                                                            <h4 className="text-md font-black text-white">{item.description}</h4>
                                                            <p className="text-[10px] text-slate-500 italic">{item.reason}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 shrink-0">
                                                            <div className="text-lg font-black text-white font-mono">{item.amount}</div>
                                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.deductibility === 'Fully' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                    item.deductibility === 'Partially' ? 'bg-amber-500/20 text-amber-400' :
                                                                        'bg-rose-500/20 text-rose-400'
                                                                }`}>
                                                                {item.deductibility} Deductible
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/10 relative overflow-hidden text-center">
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Final Submission Status:</div>
                                                <p className="text-3xl font-black text-white leading-tight underline decoration-emerald-500/50 underline-offset-8">
                                                    READY FOR CPA REVIEW
                                                </p>
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Tax Categorization (AI Tool)"
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
