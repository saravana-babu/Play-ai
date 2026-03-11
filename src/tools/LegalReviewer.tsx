import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Scale, ShieldAlert, Zap, Check, Copy, AlertCircle, ChevronRight, FileSearch, Gavel, Target, Info, ShieldCheck, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClauseRisk {
    clauseName: string;
    originalText: string;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    problem: string;
    suggestedFix: string;
}

interface LegalReviewData {
    documentType: string;
    summaryOfRisks: string;
    riskyClauses: ClauseRisk[];
    missingClauses: string[];
    fairnessScore: number;
    legalAdvice: string;
}

export default function LegalReviewer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [contractText, setContractText] = useState('');
    const [auditFocus, setAuditFocus] = useState('General Rights');

    const [outputData, setOutputData] = useState<LegalReviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleReview = async () => {
        if (!contractText.trim()) {
            setError('Please paste the contract or NDA text you want to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Corporate Lawyer and Legal Audit Expert specializing in NDAs, Employment contracts, and SaaS agreements.
            
            Contract Text: "${contractText}"
            Audit Focus: "${auditFocus}"
            
            DISCLAIMER: You must state clearly that this is NOT professional legal advice.
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "documentType": "e.g. Non-Disclosure Agreement",
                "summaryOfRisks": "A high-level summary of the danger points.",
                "riskyClauses": [
                    { "clauseName": "Indemnification", "originalText": "...", "riskLevel": "High", "problem": "...", "suggestedFix": "..." }
                ],
                "missingClauses": ["Standard clause 1 that should be here"],
                "fairnessScore": 75,
                "legalAdvice": "A strategic observation about the document's intent."
            }
            
            Analyze for predatory language, one-sidedness, or extreme liability.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `ANALYZE LEGAL CONTRACT:\nFocus: ${auditFocus}\nContent: ${contractText.substring(0, 2000)}...`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'legal-reviewer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as LegalReviewData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Jurisdiction Error: Failed to analyze contract. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyAudit = () => {
        if (outputData) {
            const content = `LEGAL AUDIT: ${outputData.documentType}\nSCORE: ${outputData.fairnessScore}/100\n\nRISKS:\n${outputData.riskyClauses.map(r => `[${r.riskLevel}] ${r.clauseName}: ${r.problem}`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <FileSearch className="w-4 h-4 text-amber-500" />
                                    Paste Contract Text
                                </label>
                                <textarea
                                    value={contractText}
                                    onChange={(e) => setContractText(e.target.value)}
                                    placeholder="Paste clauses here for analysis..."
                                    className="w-full h-40 bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Gavel className="w-4 h-4 text-amber-500" />
                                    Audit Focus
                                </label>
                                <select value={auditFocus} onChange={(e) => setAuditFocus(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                    <option>Intellectual Property Rights</option>
                                    <option>Liability & Indemnification</option>
                                    <option>Termination Clauses</option>
                                    <option>Financial Obligations</option>
                                    <option>Hidden "Catch-all" Phrases</option>
                                </select>
                            </div>
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                                    <ShieldAlert className="w-3 h-3" /> Professional Warning
                                </div>
                                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                                    This tool uses high-entropy language models to detect anomalies. It is an augmentation tool, NOT a replacement for a qualified attorney.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleReview}
                            disabled={isLoading || !contractText.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                            {isLoading ? 'Hashing Legal Vectors...' : 'Start Legal Audit'}
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
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                    <Scale className="w-20 h-20 text-amber-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Cross-Referencing Statutory Norms</h3>
                                    <p className="animate-pulse font-medium text-amber-300/80">Scanning for predatory liability shifts via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Risk Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-6 text-center">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Document Integrity</div>
                                            <div className="relative inline-block">
                                                <svg className="w-32 h-32 transform -rotate-90">
                                                    <circle className="text-slate-900" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                                                    <circle className="text-amber-500" strokeWidth="8" strokeDasharray={314} strokeDashoffset={314 - (314 * outputData.fairnessScore) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl font-black text-white">{outputData.fairnessScore}</span>
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Fairness</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Fingerprint className="w-3 h-3 text-amber-400" /> Strategic Advice
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed font-bold italic bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                                                "{outputData.legalAdvice}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-sky-400" /> Missing Guardians</div>
                                            <div className="space-y-2">
                                                {outputData.missingClauses.map((c, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-[10px] text-slate-500 font-bold">
                                                        <AlertCircle className="w-3 h-3 text-rose-500" /> {c}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyAudit}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Audit Copied' : 'Export Legal Memo'}
                                        </button>
                                    </div>
                                </div>

                                {/* Clause Review View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                Audit Engine: {outputData.documentType}
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.summaryOfRisks}
                                            </h2>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <ShieldAlert className="w-6 h-6 text-rose-500" />
                                                Dangerous Clause Audit
                                            </h3>

                                            <div className="space-y-6">
                                                {outputData.riskyClauses.map((risk, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className={`bg-slate-950/80 border rounded-[2rem] p-8 space-y-6 relative overflow-hidden transition-all ${risk.riskLevel === 'Critical' || risk.riskLevel === 'High' ? 'border-rose-500/20' : 'border-white/5'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-lg font-black text-white">{risk.clauseName}</h4>
                                                                <div className={`text-[10px] font-black uppercase tracking-widest ${risk.riskLevel === 'Critical' ? 'text-rose-500' :
                                                                        risk.riskLevel === 'High' ? 'text-orange-500' :
                                                                            'text-amber-500'
                                                                    }`}>Risk Level: {risk.riskLevel}</div>
                                                            </div>
                                                            <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                                                                <Scale className={`w-5 h-5 ${risk.riskLevel === 'Critical' ? 'text-rose-500' : 'text-slate-500'}`} />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div>
                                                                <div className="text-[9px] font-black text-slate-600 uppercase mb-2">Literal Language:</div>
                                                                <p className="text-xs text-slate-400 font-mono bg-slate-950 border border-white/5 p-4 rounded-xl leading-relaxed">
                                                                    "{risk.originalText}"
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-rose-500 uppercase mb-2">The Danger:</div>
                                                                <p className="text-sm text-slate-300 font-bold leading-relaxed italic">
                                                                    {risk.problem}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] font-black text-emerald-500 uppercase mb-2">Counter-Proposal:</div>
                                                                <p className="text-xs text-slate-400 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 font-medium">
                                                                    {risk.suggestedFix}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10 text-center">
                                            <p className="text-[10px] text-slate-600 font-medium mb-6 uppercase tracking-widest italic">
                                                This report was procedurally generated. Seek legal counsel before signing any document.
                                            </p>
                                            <ShareButtonsComponent
                                                gameTitle="AI Legal Audit (AI Tool)"
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
