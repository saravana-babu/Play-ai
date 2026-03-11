import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, PenTool, Type, Zap, Check, Copy, AlertCircle, ChevronRight, Speaker, Flame, Target, Info, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdCopy {
    hook: string;
    body: string;
    cta: string;
    toneLabel: string;
}

interface CopywriterData {
    brandName: string;
    targetPersona: string;
    options: AdCopy[];
    powerWordsUsed: string[];
    psychologicalTriggers: string[];
}

export default function AIAdCopywriter() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [productInfo, setProductInfo] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState('Persuasive');

    const [outputData, setOutputData] = useState<CopywriterData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleWrite = async () => {
        if (!productInfo.trim()) {
            setError('Please describe what you are selling or promoting.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopiedIndex(null);

        try {
            const systemPrompt = `You are an Elite Direct Response Copywriter and Marketing Psychologist.
            
            Product/Service: "${productInfo}"
            Audience: "${audience}"
            Desired Tone: "${tone}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "brandName": "A catchy brand name if not provided",
                "targetPersona": "Brief description of who needs this most",
                "options": [
                    { "hook": "Attention-grabbing headline", "body": "Short punchy body text (2-3 sentences)", "cta": "Strong call to action", "toneLabel": "Description of why this tone was used" }
                ],
                "powerWordsUsed": ["Word 1", "Word 2"],
                "psychologicalTriggers": ["e.g. Scarcity", "e.g. Social Proof"]
            }
            
            Generate 3 distinct copy options (one Short & Punchy, one Story-driven, one Result-focused).
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `WRITE CONVERTING COPY:\nProduct: ${productInfo}\nAudience: ${audience}\nTone: ${tone}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'copywriter'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as CopywriterData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Creative Block: Failed to generate copy. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyOption = (index: number) => {
        if (outputData) {
            const opt = outputData.options[index];
            const content = `${opt.hook}\n\n${opt.body}\n\n${opt.cta}`;
            navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <PenTool className="w-4 h-4 text-rose-400" />
                                    What are we selling?
                                </label>
                                <textarea
                                    value={productInfo}
                                    onChange={(e) => setProductInfo(e.target.value)}
                                    placeholder="e.g. A lightweight ergonomic office chair for developers..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-400" />
                                    Who's the Ideal Customer?
                                </label>
                                <input
                                    type="text"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    placeholder="e.g. Freelance designers, busy moms, Gen-Z gamers..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Speaker className="w-4 h-4 text-rose-400" />
                                    Voice & Vibe
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Persuasive', 'Friendly', 'Luxury'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${tone === t
                                                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                    : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleWrite}
                            disabled={isLoading || !productInfo.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                            {isLoading ? 'Injecting Power Words...' : 'Craft AD Copy'}
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
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                                    <Type className="w-20 h-20 text-rose-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Conversion Hooks</h3>
                                    <p className="animate-pulse font-medium text-rose-300/80">Indexing psychological bias triggers and semantic anchors via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Psychology Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4 text-center">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Brand Synthesis</div>
                                            <div className="text-2xl font-black text-white italic">{outputData.brandName}</div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-rose-400" /> Target Persona
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed italic bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                                                {outputData.targetPersona}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Power Words Detected</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {outputData.powerWordsUsed.map((w, i) => (
                                                    <span key={i} className="text-[9px] bg-slate-900 text-rose-400 px-2 py-1 rounded border border-rose-500/10 font-black uppercase tracking-wider">{w}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Behavioral Triggers</div>
                                            <div className="space-y-2">
                                                {outputData.psychologicalTriggers.map((t, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-[10px] text-slate-500 font-bold">
                                                        <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                                                        {t}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Creative Options View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                    Generation High-Convert
                                                </div>
                                                <Zap className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <h2 className="text-4xl font-black text-white italic">Elite Copy Options</h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-10">
                                            {outputData.options.map((opt, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/80 border border-white/5 rounded-[2rem] p-10 hover:border-rose-500/30 transition-all space-y-8 relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-6 flex gap-2">
                                                        <span className="text-[9px] font-black text-slate-600 uppercase italic px-3 py-1 rounded-full border border-white/5">{opt.toneLabel}</span>
                                                        <button
                                                            onClick={() => handleCopyOption(idx)}
                                                            className="p-2.5 bg-slate-900 rounded-full text-slate-500 hover:text-white transition-colors border border-white/5 shadow-xl"
                                                        >
                                                            {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-8 relative z-10">
                                                        <h4 className="text-3xl sm:text-4xl font-black text-white leading-tight underline decoration-rose-500/30 underline-offset-8">
                                                            {opt.hook}
                                                        </h4>
                                                        <p className="text-xl text-slate-300 leading-relaxed font-medium italic">
                                                            {opt.body}
                                                        </p>
                                                        <div className="flex items-center gap-4 pt-4">
                                                            <div className="h-px flex-1 bg-white/5" />
                                                            <button className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-full hover:bg-rose-500 hover:text-white transition-all transform hover:scale-105 flex items-center gap-2 group">
                                                                <MousePointer2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                                                {opt.cta}
                                                            </button>
                                                            <div className="h-px flex-1 bg-white/5" />
                                                        </div>
                                                    </div>

                                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/5 blur-[50px] pointer-events-none rounded-full" />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Ad Copy (AI Tool)"
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
