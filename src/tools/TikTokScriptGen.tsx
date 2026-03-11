import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Video, PlayCircle, Zap, Check, Copy, AlertCircle, ChevronRight, MessageSquare, Flame, Target, Info, Clock, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScriptScene {
    timestamp: string;
    visualAction: string;
    audioText: string;
    overlayText?: string;
}

interface ViralScriptData {
    hookTitle: string;
    targetTrend: string;
    estimatedLength: string;
    scenes: ScriptScene[];
    engagementTriggers: string[];
    captionIdeas: string[];
    musicVibe: string;
}

export default function TikTokScriptGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [videoConcept, setVideoConcept] = useState('');
    const [pacing, setPacing] = useState('High-Energy');
    const [targetAudience, setTargetAudience] = useState('');

    const [outputData, setOutputData] = useState<ViralScriptData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!videoConcept.trim()) {
            setError('Please describe your video concept or the goal of the TikTok/Reel.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Top-Tier Short Form Content Strategist and Viral Growth Expert for TikTok, Reels, and Shorts.
            
            Concept: "${videoConcept}"
            Pacing: "${pacing}"
            Target Audience: "${targetAudience}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "hookTitle": "Killer Hook (First 3 seconds)",
                "targetTrend": "Relevant trend or format (e.g. POV, Storytime, Tutorial)",
                "estimatedLength": "e.g. 15s or 45s",
                "scenes": [
                    { "timestamp": "0:00-0:03", "visualAction": "What we see", "audioText": "What is spoken or text-to-speech", "overlayText": "Text on screen" }
                ],
                "engagementTriggers": ["Reason to comment 1", "Reason to share 1"],
                "captionIdeas": ["Caption option 1", "2"],
                "musicVibe": "Description of the sound/audio type."
            }
            
            Focus on retention, loopability, and "the hook".
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE VIRAL SCRIPT:\nConcept: ${videoConcept}\nPacing: ${pacing}\nAudience: ${targetAudience}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'video-script'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as ViralScriptData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Production Failure: Failed to generate script. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyScript = () => {
        if (outputData) {
            const content = `VIDEO SCRIPT: ${outputData.hookTitle}\n\nSCENES:\n${outputData.scenes.map(s => `[${s.timestamp}] ${s.audioText} (Visual: ${s.visualAction})`).join('\n')}`;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-rose-500" />
                                    Video Concept / Trend Idea
                                </label>
                                <textarea
                                    value={videoConcept}
                                    onChange={(e) => setVideoConcept(e.target.value)}
                                    placeholder="e.g. A life-hack for cleaning sneakers, or a joke about being a programmer..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-rose-500" />
                                    Target Audience
                                </label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="e.g. Busy parents, Gen-Z techies, fitness beginners..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-rose-500" />
                                    Production Pacing
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['High-Energy', 'Cinematic', 'Lofi/Chill'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPacing(p)}
                                            className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${pacing === p
                                                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                    : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !videoConcept.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlayCircle className="w-6 h-6" />}
                            {isLoading ? 'Processing Algorithm Data...' : 'Generate Viral Script'}
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
                                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
                                    <Video className="w-20 h-20 text-rose-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Retention Loops</h3>
                                    <p className="animate-pulse font-medium text-rose-300/80">Calculating drop-off points and engagement peaks via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Strategy Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Video Format</div>
                                            <div className="text-xl font-black text-rose-400 italic italic">{outputData.targetTrend}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" /> Targeted Duration: {outputData.estimatedLength}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Flame className="w-3 h-3 text-orange-400" /> Viral Anchors
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.engagementTriggers.map((t, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-[10px] text-slate-400 font-bold bg-white/5 p-3 rounded-xl border border-white/5 italic">
                                                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                                        {t}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><MessageSquare className="w-3 h-3 text-sky-400" /> Caption Hooks</div>
                                            <div className="space-y-2">
                                                {outputData.captionIdeas.map((c, i) => (
                                                    <div key={i} className="p-3 bg-slate-900 rounded-lg text-[9px] text-slate-400 font-medium border border-white/5 italic">
                                                        "{c}"
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyScript}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Script Copied' : 'Export Full Script'}
                                        </button>
                                    </div>
                                </div>

                                {/* Script Review View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                    Generation Viral-1
                                                </div>
                                                <Zap className="w-4 h-4 text-rose-400" />
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight italic uppercase tracking-tighter">
                                                HOOK: {outputData.hookTitle}
                                            </h2>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                Recommended Sound: <span className="text-sky-400 font-bold">{outputData.musicVibe}</span>
                                            </p>
                                        </div>

                                        <div className="space-y-8">
                                            {outputData.scenes.map((scene, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/80 border border-white/5 rounded-[2rem] p-8 hover:bg-slate-900 shadow-xl transition-all relative overflow-hidden"
                                                >
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="md:w-32 shrink-0 space-y-2 border-r border-white/5 pr-4">
                                                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{scene.timestamp}</div>
                                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Visual Plan:</div>
                                                            <p className="text-[11px] text-slate-400 leading-tight italic">{scene.visualAction}</p>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="space-y-1">
                                                                <div className="text-[8px] font-black text-sky-500 uppercase tracking-tighter">Audio Line / TTS:</div>
                                                                <p className="text-xl sm:text-2xl text-white font-black leading-tight italic tracking-tight">
                                                                    "{scene.audioText}"
                                                                </p>
                                                            </div>
                                                            {scene.overlayText && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase tracking-tighter">Text Overlay</div>
                                                                    <span className="text-xs text-slate-500 font-mono">[{scene.overlayText}]</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/0 group-hover:bg-rose-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Viral Script (AI Tool)"
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
