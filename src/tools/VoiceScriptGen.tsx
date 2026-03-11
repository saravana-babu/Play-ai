import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Mic2, Music, Zap, Check, Copy, AlertCircle, ChevronRight, Speaker, Volume2, Target, Info, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceScene {
    time: string;
    description: string;
    emotionNote: string;
    dialogue: string;
}

interface VoiceScriptData {
    scriptTitle: string;
    voiceArchetype: string;
    vocalCharacteristics: string[];
    scenes: VoiceScene[];
    performanceTips: string[];
    technicalSetup: string;
}

export default function VoiceScriptGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [projectType, setProjectType] = useState('Voiceover');
    const [voiceTone, setVoiceTone] = useState('Deep & Smooth');
    const [scriptContext, setScriptContext] = useState('');

    const [outputData, setOutputData] = useState<VoiceScriptData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!scriptContext.trim()) {
            setError('Please describe what the voice script is for (e.g. YouTube intro, AI companion, game character).');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a professional Voice Director and Scriptwriter for high-end AI voice synthesis.
            
            Project Type: "${projectType}"
            Target Voice Tone: "${voiceTone}"
            Context/Concept: "${scriptContext}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "scriptTitle": "Professional project title",
                "voiceArchetype": "Descriptive archetype (e.g. The Wise Guide, The Energetic Hype-man)",
                "vocalCharacteristics": ["Characteristic 1", "Characteristic 2"],
                "scenes": [
                    { "time": "0:00-0:15", "description": "Visual or context context", "emotionNote": "Focus/Energy level", "dialogue": "Exact text to be spoken" }
                ],
                "performanceTips": ["Tip 1", "Tip 2"],
                "technicalSetup": "Recommended TTS (Text-to-Speech) settings (e.g. stability, clarity levels)."
            }
            
            Include phonetic cues in parentheses like (pronounced: 'Ai-gee-ee') if needed.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE VOICE SCRIPT:\nContext: ${scriptContext}\nTone: ${voiceTone}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'voice-clone-script'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as VoiceScriptData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Acoustic Error: Failed to generate script. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyScript = () => {
        if (outputData) {
            const content = `TITLE: ${outputData.scriptTitle}\nVOICE: ${outputData.voiceArchetype}\n\nDIALOGUE:\n${outputData.scenes.map(s => `[${s.time}] (${s.emotionNote}): ${s.dialogue}`).join('\n')}`;
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
                                    <Mic2 className="w-4 h-4 text-amber-400" />
                                    Script Context & Messaging
                                </label>
                                <textarea
                                    value={scriptContext}
                                    onChange={(e) => setScriptContext(e.target.value)}
                                    placeholder="e.g. A 30-second ad for a meditation app, or dialogue for a moody space pirate..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Headphones className="w-4 h-4 text-amber-400" />
                                    Project Category
                                </label>
                                <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                    <option>Narrative Voiceover</option>
                                    <option>Game Character</option>
                                    <option>Marketing Ad</option>
                                    <option>AI Assistant Persona</option>
                                    <option>Animated Short</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-amber-400" />
                                    Vocal Texture
                                </label>
                                <input
                                    type="text"
                                    value={voiceTone}
                                    onChange={(e) => setVoiceTone(e.target.value)}
                                    placeholder="e.g. Deep, raspy, energetic, whispering..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !scriptContext.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Music className="w-6 h-6" />}
                            {isLoading ? 'Composing Phonetics...' : 'Generate Voice Script'}
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
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-32 justify-center">
                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <Speaker className="w-20 h-20 text-amber-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Vocal Cadence</h3>
                                    <p className="animate-pulse font-medium text-amber-300/80">Applying prosody mapping and emotional weightings via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Character Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-12 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-amber-400" /> Archetype Profile
                                            </div>
                                            <div className="text-2xl font-black text-white italic underline decoration-amber-500/30 underline-offset-4">
                                                {outputData.voiceArchetype}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Key Textures</div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.vocalCharacteristics.map((c, i) => (
                                                    <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 font-black uppercase tracking-wider">{c}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-sky-400" /> TTS Tech Spec</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-mono">
                                                {outputData.technicalSetup}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Target className="w-3 h-3 text-emerald-400" /> Directing Notes</div>
                                            <div className="space-y-2">
                                                {outputData.performanceTips.map((tip, i) => (
                                                    <div key={i} className="flex gap-2 items-center text-xs text-slate-500 italic">
                                                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                                        {tip}
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

                                {/* Script View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                Project Manifest
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                                                {outputData.scriptTitle}
                                            </h2>
                                        </div>

                                        <div className="space-y-8">
                                            {outputData.scenes.map((scene, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row gap-8 items-start group">
                                                    <div className="w-full sm:w-24 shrink-0 pt-2 border-l-4 border-amber-500 pl-4">
                                                        <div className="text-xs font-black text-white tabular-nums tracking-widest mb-1">{scene.time}</div>
                                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter leading-none">{scene.emotionNote}</div>
                                                    </div>
                                                    <div className="flex-1 bg-slate-950/80 p-10 rounded-[2.5rem] border border-white/5 group-hover:bg-slate-900 transition-all relative overflow-hidden">
                                                        <div className="text-[10px] font-black text-slate-700 uppercase mb-6 tracking-widest flex items-center gap-2">
                                                            <Volume2 className="w-3 h-3" /> Script Line
                                                        </div>
                                                        <p className="text-2xl sm:text-3xl text-white font-serif leading-relaxed tracking-tight group-hover:text-amber-100 transition-colors">
                                                            {scene.dialogue}
                                                        </p>
                                                        <div className="mt-8 text-[11px] text-slate-500 italic bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                                                            Ref: {scene.description}
                                                        </div>
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/0 group-hover:bg-amber-500/[0.03] blur-[40px] pointer-events-none rounded-full" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Voice Script (AI Tool)"
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
