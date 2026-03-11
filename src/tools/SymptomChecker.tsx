import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Activity, AlertCircle, Zap, Check, Copy, Heart, ChevronRight, Stethoscope, Thermometer, Target, Info, ShieldAlert, Cross } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PossibleCondition {
    name: string;
    commonality: string;
    description: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Immediate';
}

interface SymptomData {
    primaryConcern: string;
    possibleCauses: PossibleCondition[];
    nonMedicalAdvice: string;
    questionsForDoctor: string[];
    redFlags: string[];
    triageRecommendation: string;
}

export default function SymptomChecker() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [symptoms, setSymptoms] = useState('');
    const [duration, setDuration] = useState('24-48 Hours');
    const [severity, setSeverity] = useState('Mild');

    const [outputData, setOutputData] = useState<SymptomData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCheck = async () => {
        if (!symptoms.trim()) {
            setError('Please describe the symptoms you are experiencing.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are an Advanced AI Health Information Assistant and Triage Advisor.
            
            Symptoms: "${symptoms}"
            Duration: "${duration}"
            Severity: "${severity}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "primaryConcern": "Consise clinical summary of the reported symptoms.",
                "possibleCauses": [
                    { "name": "Condition Name", "commonality": "Common/Rare", "description": "...", "urgency": "High" }
                ],
                "nonMedicalAdvice": "General wellness or comfort measures (e.g. hydration, rest).",
                "questionsForDoctor": ["Question 1", "Question 2"],
                "redFlags": ["Serious symptom that requires ER 1", "2"],
                "triageRecommendation": "Where should the user go (e.g. Primary Care, Urgent Care, ER, Rest at home)?"
            }
            
            DISCLAIMER: This is NOT medical diagnosis. You are providing information based on probability and literature.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `SYMPTOM CHECK:\nSymptoms: ${symptoms}\nDuration: ${duration}\nSeverity: ${severity}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'medical-symptom'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SymptomData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Diagnostic Error: Failed to evaluate symptoms. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyReport = () => {
        if (outputData) {
            const content = `SYMPTOM REPORT: ${outputData.primaryConcern}\nTRIAGE: ${outputData.triageRecommendation}\n\nPOSSIBILITIES:\n${outputData.possibleCauses.map(c => `- ${c.name} (${c.urgency})`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-rose-600/10 border border-rose-600/20 rounded-2xl flex gap-4 items-center">
                        <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest">Medical Disclaimer</h4>
                            <p className="text-[10px] text-slate-400 leading-tight font-medium">
                                If you are experiencing a life-threatening emergency, call emergency services immediately. This tool is for informational purposes only.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-rose-400" />
                                    Describe Symptoms
                                </label>
                                <textarea
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    placeholder="e.g. Sharp pain in the lower abdomen, started after eating..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Duration</label>
                                    <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Just Started</option>
                                        <option>24-48 Hours</option>
                                        <option>3-7 Days</option>
                                        <option>Chronic (Weeks+)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Discomfort Level</label>
                                    <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Mild / Annoying</option>
                                        <option>Moderate / Interfering</option>
                                        <option>Severe / Unbearable</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center gap-3">
                                <Heart className="w-4 h-4 text-rose-500/50" />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Our AI analyzes clinical correlations and urgency metrics to provide actionable triage information."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleCheck}
                            disabled={isLoading || !symptoms.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stethoscope className="w-6 h-6" />}
                            {isLoading ? 'Consulting Medical Knowledge Base...' : 'Analyze Symptoms'}
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
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                                    <Activity className="w-20 h-20 text-rose-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Evaluating Pathological Probabilities</h3>
                                    <p className="animate-pulse font-medium text-rose-300/80">Checking clinical literature and triage rules via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Triage Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-rose-500" /> Triage Result
                                            </div>
                                            <div className={`p-6 rounded-2xl border flex flex-col items-center gap-3 text-center ${outputData.triageRecommendation.toLowerCase().includes('er') || outputData.triageRecommendation.toLowerCase().includes('urgent')
                                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                }`}>
                                                <Cross className="w-8 h-8" />
                                                <div className="text-2xl font-black uppercase tracking-tighter leading-none">{outputData.triageRecommendation}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-rose-500" /> Critical Red Flags</div>
                                            <div className="space-y-2">
                                                {outputData.redFlags.map((flag, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-xs text-rose-400 font-bold bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                                        {flag}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Suggested Questions for Medical Professionals</div>
                                            <div className="space-y-2">
                                                {outputData.questionsForDoctor.map((q, i) => (
                                                    <div key={i} className="p-3 bg-slate-900 rounded-lg text-[10px] text-slate-400 font-medium border border-white/5 italic flex gap-2">
                                                        <ChevronRight className="w-3 h-3 text-slate-600 mt-0.5" />
                                                        "{q}"
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
                                            {copied ? 'Report Copied' : 'Export Symptom Log'}
                                        </button>
                                    </div>
                                </div>

                                {/* Condition View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                AI Triage Protocol v4.0
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.primaryConcern}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <Activity className="w-6 h-6 text-rose-500" />
                                                Probabilistic Differentials
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {outputData.possibleCauses.map((cause, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 shadow-xl transition-all relative overflow-hidden flex flex-col"
                                                    >
                                                        <div className="space-y-4 mb-8">
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{cause.commonality}</div>
                                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${cause.urgency === 'High' || cause.urgency === 'Immediate' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                                                    }`}>{cause.urgency}</div>
                                                            </div>
                                                            <h4 className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">{cause.name}</h4>
                                                            <p className="text-xs text-slate-400 leading-relaxed italic">{cause.description}</p>
                                                        </div>
                                                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/0 group-hover:bg-rose-500/[0.03] blur-[20px] pointer-events-none rounded-full" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-l-8 border-l-rose-600">
                                            <div className="space-y-4">
                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">General Wellness Information:</div>
                                                <p className="text-2xl sm:text-3xl text-white font-black leading-tight tracking-tight italic">
                                                    "{outputData.nonMedicalAdvice}"
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Health Info (AI Tool)"
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
