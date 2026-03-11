import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Music, Music2, Zap, Check, Copy, AlertCircle, ChevronRight, Speaker, Volume2, Target, Info, Headphones, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MusicPromptData {
    trackTitle: string;
    stylePrompt: string;
    lyricsPrompt: string;
    instrumentation: string[];
    vibeTags: string[];
    arrangementNotes: string;
    expertGuidance: string;
}

export default function SunoPrompter() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [mood, setMood] = useState('');
    const [genre, setGenre] = useState('Electronic');
    const [vocalType, setVocalType] = useState('Female');

    const [outputData, setOutputData] = useState<MusicPromptData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!mood.trim()) {
            setError('Please describe the mood or theme for your AI music prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Professional Audio Engineer and AI Music Prompt Engineer specialist for Suno, Udio, and Magenta.
            
            Mood/Theme: "${mood}"
            Genre: "${genre}"
            Vocal Preferences: "${vocalType}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "trackTitle": "Atmospheric track name",
                "stylePrompt": "Concentrated style prompt (tags only, e.g. '80s synthwave, heavy reverb, melodic, cinematic')",
                "lyricsPrompt": "Short set of lyrics (1 verse, 1 chorus) if applicable, or mood description for instrumental.",
                "instrumentation": ["Instrument 1", "Instrument 2"],
                "vibeTags": ["Vibe 1", "Vibe 2"],
                "arrangementNotes": "Instructions on build-ups, drops, or fades.",
                "expertGuidance": "The secret trick to making this prompt sound premium in AI music tools."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE MUSIC PROMPT:\nMood: ${mood}\nGenre: ${genre}\nVocals: ${vocalType}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'music-prompt'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as MusicPromptData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Acoustic Failure: Failed to generate prompt. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPrompt = () => {
        if (outputData) {
            const content = `TITLE: ${outputData.trackTitle}\nSTYLE: ${outputData.stylePrompt}\n\nLYRICS/MINDSET:\n${outputData.lyricsPrompt}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Headphones className="w-4 h-4 text-violet-400" />
                                    Emotional Mood / Story
                                </label>
                                <textarea
                                    value={mood}
                                    onChange={(e) => setMood(e.target.value)}
                                    placeholder="e.g. A cyberpunk rain scene with a lonely detective feeling nostalgic..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Primary Genre</label>
                                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Electronic / EDM</option>
                                        <option>Lo-Fi Hip Hop</option>
                                        <option>Cinematic / Orchestral</option>
                                        <option>Heavy Metal / Rock</option>
                                        <option>Synthwave / Retro</option>
                                        <option>Pop / RnB</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Vocal Delivery</label>
                                    <select value={vocalType} onChange={(e) => setVocalType(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>None (Instrumental)</option>
                                        <option>Female (Ethereal)</option>
                                        <option>Male (Gravely)</option>
                                        <option>Choir / Group</option>
                                        <option>AI Post-processed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "AI music models respond best to specific instrument clusters and 'era-specific' descriptors. Suno Prompter injects these automatically."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !mood.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Music2 className="w-6 h-6" />}
                            {isLoading ? 'Calibrating Frequencies...' : 'Engineer Prompt'}
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
                                <motion.div animate={{ y: [0, -15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                    <Volume2 className="w-20 h-20 text-violet-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Sonic Textures</h3>
                                    <p className="animate-pulse font-medium text-violet-300/80">Mapping timbre profiles and rhythmic patterns via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Acoustic Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-violet-400" /> Sound Signature
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.vibeTags.map((tag, i) => (
                                                    <span key={i} className="text-[10px] bg-violet-500/10 text-violet-400 px-3 py-1.5 rounded-lg border border-violet-500/20 font-black uppercase tracking-wider">{tag}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Sliders className="w-3 h-3 text-emerald-400" /> Arrangement Intel</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium italic p-4 bg-slate-900 rounded-xl border border-white/5">
                                                "{outputData.arrangementNotes}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500" /> Prompting Secret</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                                                "{outputData.expertGuidance}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Instrument Stack</div>
                                            <div className="space-y-2">
                                                {outputData.instrumentation.map((inst, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-xs text-slate-500 uppercase font-black tracking-tighter">
                                                        <Check className="w-3 h-3 text-violet-500 shrink-0" />
                                                        {inst}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyPrompt}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Prompt Copied' : 'Export Full Spec'}
                                        </button>
                                    </div>
                                </div>

                                {/* Prompt View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-500/20">
                                                Deep Audio Synthesis
                                            </div>
                                            <h2 className="text-4xl sm:text-7xl font-black text-white leading-none italic uppercase tracking-tighter">
                                                {outputData.trackTitle}
                                            </h2>
                                        </div>

                                        <div className="bg-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden border-l-8 border-l-violet-600">
                                            <div className="absolute top-0 right-0 p-8">
                                                <Speaker className="w-8 h-8 text-violet-500/20 group-hover:text-violet-500/40 transition-colors" />
                                            </div>
                                            <div className="space-y-6">
                                                <div className="text-[10px] font-black text-violet-500 uppercase tracking-widest italic">Optimized Style Prompt (Copy this to Suno/Udio)</div>
                                                <p className="text-2xl sm:text-3xl text-white font-black leading-tight tracking-tight selection:bg-violet-500">
                                                    {outputData.stylePrompt}
                                                </p>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-violet-500/30 underline-offset-8">
                                                <Music className="w-6 h-6 text-violet-400" />
                                                Lyrical Core / Mood Map
                                            </h3>

                                            <div className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/5 relative">
                                                <pre className="text-sm sm:text-md text-slate-300 font-mono leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
                                                    {outputData.lyricsPrompt}
                                                </pre>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Music Prompt (AI Tool)"
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
