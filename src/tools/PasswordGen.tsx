import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, ShieldCheck, Lock, Key, Copy, Check, AlertCircle, RefreshCw, Eye, EyeOff, Hash, Info, ShieldAlert, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordOption {
    password: string;
    narrative: string;
    strengthScore: number;
}

interface PasswordData {
    options: PasswordOption[];
    securityAnalysis: string;
    crackingEstimate: string;
    storageAdvice: string;
}

export default function PasswordGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [keywords, setKeywords] = useState('');
    const [theme, setTheme] = useState('Epic Fantasy');
    const [complexity, setComplexity] = useState('High (16+ chars)');

    const [outputData, setOutputData] = useState<PasswordData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopiedIndex(null);

        try {
            const systemPrompt = `You are a Cryptographic Linguistics Expert and Cybersecurity Consultant.
            
            Keywords provided: "${keywords}"
            Desired Theme: "${theme}"
            Complexity: "${complexity}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "options": [
                    { "password": "TheNarrative88!Password", "narrative": "A short story or sentence to help remember it.", "strengthScore": 95 }
                ],
                "securityAnalysis": "Brief analysis of the entropy and patterns.",
                "crackingEstimate": "How long it would take to brute force (Estimated).",
                "storageAdvice": "1-sentence advice on password managers."
            }
            
            Generate 3 unique options. The passwords must be cryptographically robust (mixture of upper, lower, numbers, symbols) but follow a linguistic narrative pattern.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE MEMORABLE PASSWORDS:\nKeywords: ${keywords}\nTheme: ${theme}\nComplexity: ${complexity}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'password-gen'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as PasswordData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Security Breach: Failed to generate passwords. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (pwd: string, index: number) => {
        navigator.clipboard.writeText(pwd);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Book className="w-4 h-4 text-emerald-400" />
                                    Seed Keywords (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="e.g. Blue sky, cat, 1995 (Used for narrative, not literal password)"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Narrative Theme</label>
                                    <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none">
                                        <option>Epic Fantasy</option>
                                        <option>Sci-Fi Cyberpunk</option>
                                        <option>Historical Fiction</option>
                                        <option>Abstract Poetry</option>
                                        <option>Corporate Buzzwords</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Complexity Level</label>
                                    <select value={complexity} onChange={(e) => setComplexity(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none">
                                        <option>Standard (12 chars)</option>
                                        <option>High (16+ chars)</option>
                                        <option>Extreme (24+ chars)</option>
                                        <option>Maximum (32+ chars)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lock className="w-6 h-6" />}
                                {isLoading ? 'Securing Portal...' : 'Generate Vault Keys'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm font-medium">
                            <ShieldAlert className="w-5 h-5 shrink-0" />
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
                                <motion.div animate={{ rotateY: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                    <Key className="w-20 h-20 text-emerald-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Salting Entropy Pools</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Mapping phonetic narratives to cryptographic clusters via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Trust Dashboard Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/10 bg-slate-950/50 p-8 gap-8">
                                    <div className="flex items-start gap-4">
                                        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase text-slate-500">Security Analysis</div>
                                            <p className="text-xs text-slate-300 leading-relaxed">{outputData.securityAnalysis}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-8 pt-8 md:pt-0">
                                        <RefreshCw className="w-6 h-6 text-sky-400 shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase text-slate-500">Brute Force Resistance</div>
                                            <div className="text-lg font-black text-white">{outputData.crackingEstimate}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-8 pt-8 md:pt-0">
                                        <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase text-slate-500">Vault Best Practice</div>
                                            <p className="text-xs text-slate-400">{outputData.storageAdvice}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 sm:p-12 space-y-10">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                            <ShieldCheck className="w-7 h-7 text-emerald-400" />
                                            Generated Narrative Keys
                                        </h3>
                                        <button
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            {showPasswords ? 'Hide Secret Values' : 'Reveal Secret Values'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {outputData.options.map((opt, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                                                key={idx}
                                                className="group bg-slate-950/80 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center relative"
                                            >
                                                <div className="flex-1 space-y-3 w-full">
                                                    <div className="bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between group-hover:bg-slate-800 transition-colors shadow-inner">
                                                        <div className={`font-mono text-xl tracking-wider ${showPasswords ? 'text-emerald-400' : 'text-slate-700 blur-[6px] select-none hover:blur-none transition-all'}`}>
                                                            {opt.password}
                                                        </div>
                                                        <button
                                                            onClick={() => handleCopy(opt.password, idx)}
                                                            className="p-2 bg-slate-950 rounded-xl hover:bg-emerald-600 transition-all text-slate-400 hover:text-white"
                                                        >
                                                            {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-4 items-center pl-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">Entropy: {opt.strengthScore}%</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-600 italic font-serif">"{opt.narrative}"</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="pt-10 border-t border-white/10">
                                        <ShareButtonsComponent
                                            gameTitle="AI Memorable Password Gen (AI Tool)"
                                            result="won"
                                            penalty={null}
                                        />
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
