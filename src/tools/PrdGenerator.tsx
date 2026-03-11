import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, FileText, Target, Users, Zap, Check, Copy, AlertCircle, ChevronRight, Layout, ListChecks, ShieldCheck, Bug, Info, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrdFeature {
    title: string;
    description: string;
    priority: 'Must-have' | 'Should-have' | 'Could-have';
    acceptanceCriteria: string[];
}

interface PrdData {
    productName: string;
    visionStatement: string;
    targetAudience: string[];
    userStories: string[];
    features: PrdFeature[];
    technicalConstraints: string[];
    successMetrics: string[];
}

export default function PrdGenerator() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [productIdea, setProductIdea] = useState('');
    const [targetMarket, setTargetMarket] = useState('B2C');
    const [platform, setPlatform] = useState('Web/Mobile');

    const [outputData, setOutputData] = useState<PrdData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!productIdea.trim()) {
            setError('Please describe your product idea or feature set.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Principal Product Manager at a leading Tech Firm.
            
            Product Concept: "${productIdea}"
            Market Focus: "${targetMarket}"
            Platform: "${platform}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "productName": "Professional Product Name",
                "visionStatement": "1-sentence high-level product vision.",
                "targetAudience": ["Persona 1", "Persona 2"],
                "userStories": ["As a [user], I want to [action] so that [value]"],
                "features": [
                    { 
                        "title": "Feature Name", 
                        "description": "High-level feature scope", 
                        "priority": "Must-have/Should-have/Could-have", 
                        "acceptanceCriteria": ["Criterion 1", "Criterion 2"] 
                    }
                ],
                "technicalConstraints": ["Constraint 1", "Constraint 2"],
                "successMetrics": ["Metric 1 (KPI)"]
            }
            
            Focus on creating a structured, professional PRD (Product Requirement Document).
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE PRD FOR:\nIdea: ${productIdea}\nMarket: ${targetMarket}\nPlatform: ${platform}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'prd-gen'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as PrdData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`PM Bureaucracy Error: Failed to generate PRD. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPrd = () => {
        if (outputData) {
            const content = `PRD: ${outputData.productName}\n\nVISION: ${outputData.visionStatement}\n\nFEATURES:\n${outputData.features.map(f => `- ${f.title} (${f.priority}): ${f.description}`).join('\n')}`;
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
                                    <Rocket className="w-4 h-4 text-emerald-400" />
                                    Product Concept & Core Problems
                                </label>
                                <textarea
                                    value={productIdea}
                                    onChange={(e) => setProductIdea(e.target.value)}
                                    placeholder="Describe the product or feature in detail. What problem does it solve? Who is it for?..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Market Focus</label>
                                    <select value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-3 outline-none">
                                        <option>B2C (Consumers)</option>
                                        <option>B2B (Enterprise)</option>
                                        <option>D2C (Direct)</option>
                                        <option>SaaS (Developer)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Primary Platform</label>
                                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-3 outline-none">
                                        <option>iOS & Android</option>
                                        <option>Web Application</option>
                                        <option>Desktop Native</option>
                                        <option>API / Headless</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "A great PRD bridges the gap between 'what we want' and 'what we build'. Be specific about constraints."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !productIdea.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                            {isLoading ? 'Drafting Specifications...' : 'Generate PRD Blueprint'}
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
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Layout className="w-20 h-20 text-emerald-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Requirements</h3>
                                    <p className="animate-pulse font-medium text-emerald-300/80">Defining user flows and edge-case behaviors via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Strategic Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-emerald-400" /> Product Vision
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-black p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                                "{outputData.visionStatement}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Users className="w-3 h-3 text-sky-400" /> Target Segments
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.targetAudience.map((t, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-900 text-slate-400 px-3 py-1.5 rounded-lg border border-white/5 font-bold">{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Success KPI</div>
                                            <div className="space-y-2">
                                                {outputData.successMetrics.map((m, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-xs text-slate-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyPrd}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'PRD Copied' : 'Export Full Spec'}
                                        </button>
                                    </div>
                                </div>

                                {/* Features & Stories View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                Technical Product Specification
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                                                {outputData.productName}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <ListChecks className="w-6 h-6 text-emerald-400" />
                                                Core Feature Set
                                            </h3>

                                            <div className="grid grid-cols-1 gap-6">
                                                {outputData.features.map((feature, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all space-y-6"
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-2xl font-black text-white">{feature.title}</h4>
                                                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.description}</p>
                                                            </div>
                                                            <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${feature.priority === 'Must-have' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                                                }`}>
                                                                {feature.priority}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Acceptance Criteria</div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {feature.acceptanceCriteria.map((ac, i) => (
                                                                    <div key={i} className="flex gap-3 items-center text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                                                                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                        {ac}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Bug className="w-6 h-6 text-amber-500" />
                                                    Constraints & Compliance
                                                </h3>
                                                <ul className="space-y-3">
                                                    {outputData.technicalConstraints.map((c, i) => (
                                                        <li key={i} className="text-sm text-slate-500 flex gap-3">
                                                            <span className="text-amber-500/50 mt-1.5">•</span> {c}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Info className="w-6 h-6 text-sky-400" />
                                                    High-Level User Stories
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.userStories.map((story, i) => (
                                                        <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-xs text-slate-400 leading-relaxed italic">
                                                            "{story}"
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI PRD Generator (AI Tool)"
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
