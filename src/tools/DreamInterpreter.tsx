import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Moon, Sun, Ghost, Eye, Heart, Compass, Search, Flame, Cloud, Info, Split, Palette, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DreamSymbol {
    symbol: string;
    interpretation: string;
}

interface PsychologicalNote {
    school: string;
    perspective: string;
}

interface DreamData {
    title: string;
    summary: string;
    dominantEmotion: string;
    emotionalIntensity: number; // 1-100
    symbols: DreamSymbol[];
    psychologicalAnalysis: PsychologicalNote[];
    reflectionQuestion: string;
    moodColor: string; // CSS gradient string
}

export default function DreamInterpreter() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [dreamText, setDreamText] = useState('');
    const [isVivid, setIsVivid] = useState(false);

    const [outputData, setOutputData] = useState<DreamData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInterpret = async () => {
        if (!dreamText.trim()) {
            setError('Please describe your dream to receive an interpretation.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are an expert Dream Analyst and Analytical Psychologist specialized in Jungian and Freudian symbolism.
            
            The user just had a dream: "${dreamText}"
            Dream Vividness: "${isVivid ? 'High' : 'Normal'}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "title": "A poetic title for this dream",
                "summary": "A 1-paragraph synthesis of the dream's core subconscious meaning.",
                "dominantEmotion": "The primary underlying feeling (e.g. Anxiety, Freedom, Nostalgia)",
                "emotionalIntensity": number (1 to 100),
                "symbols": [
                    { "symbol": "Object/Action", "interpretation": "Subconscious meaning" }
                ],
                "psychologicalAnalysis": [
                    { "school": "e.g. Jungian", "perspective": "Perspective text..." },
                    { "school": "e.g. Freudian", "perspective": "Perspective text..." }
                ],
                "reflectionQuestion": "A deep question for the user to contemplate today.",
                "moodColor": "A CSS linear-gradient string that visually represents the dream's mood (e.g. linear-gradient(to right, #4a148c, #004d40))"
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `INTERPRET DREAM:\n"${dreamText}"`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'dream-interpreter'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as DreamData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to interpret dream. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <Moon className="w-7 h-7 text-indigo-400" />
                            Recall Your Dream
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Describe the places, people, and feelings you experienced while asleep.</p>
                        <textarea
                            value={dreamText}
                            onChange={(e) => setDreamText(e.target.value)}
                            placeholder="e.g. I was walking through a library where all the books were made of water, and then I saw a giant clock counting backwards..."
                            className="w-full h-40 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsVivid(!isVivid)}
                                className="flex items-center gap-2 group transition-colors"
                            >
                                <div className={`w-10 h-6 rounded-full transition-colors relative ${isVivid ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isVivid ? 'left-5' : 'left-1'}`} />
                                </div>
                                <span className={`text-sm font-bold uppercase tracking-widest ${isVivid ? 'text-white' : 'text-slate-500'}`}>Extremely Vivid</span>
                            </button>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end">
                            <button
                                onClick={handleInterpret}
                                disabled={isLoading || !dreamText.trim()}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Eye className="w-6 h-6" />}
                                {isLoading ? 'Analyzing Psyche...' : 'Interpret Subconscious'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm font-medium">
                            <Ghost className="w-5 h-5 shrink-0" />
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                                    <Compass className="w-20 h-20 text-indigo-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Navigating Liminal Space</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Mapping archetypal icons and somatic patterns via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Subconscious Dashboard Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10">
                                    <div className="space-y-6">
                                        <div className="text-center space-y-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center justify-center gap-2">
                                                <Heart className="w-3 h-3 text-rose-500" /> Primary Emotion
                                            </div>
                                            <div className="text-3xl font-black text-white">
                                                {outputData.dominantEmotion}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Emotional Intensity</span>
                                                <span className="text-indigo-400">{outputData.emotionalIntensity}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${outputData.emotionalIntensity}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subconscious Symbols</div>
                                            <div className="space-y-3">
                                                {outputData.symbols.map((s, i) => (
                                                    <div key={i} className="bg-slate-900/80 border border-white/5 p-3 rounded-xl">
                                                        <div className="text-xs font-black text-indigo-300 uppercase mb-1">{s.symbol}</div>
                                                        <div className="text-xs text-slate-400 leading-snug">{s.interpretation}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="p-4 rounded-2xl border border-white/5 bg-slate-900 group">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                                <Palette className="w-3 h-3" /> Dream Mood
                                            </div>
                                            <div
                                                className="w-full h-12 rounded-xl border border-white/10 shadow-lg"
                                                style={{ background: outputData.moodColor }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Analysis Content Area */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-6">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                Dream Interpretation
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tight">
                                                "{outputData.title}"
                                            </h2>
                                            <p className="text-xl text-slate-300 leading-relaxed font-serif">
                                                {outputData.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {outputData.psychologicalAnalysis.map((note, idx) => (
                                                <div key={idx} className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Search className="w-16 h-16" />
                                                    </div>
                                                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Split className="w-3.5 h-3.5" /> {note.school} Framework
                                                    </h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed">
                                                        {note.perspective}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20 p-8 rounded-3xl text-center space-y-4 relative">
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                                                Daily Reflection
                                            </div>
                                            <MessageCircle className="w-8 h-8 text-indigo-400 mx-auto opacity-50" />
                                            <p className="text-2xl font-black text-white leading-tight">
                                                {outputData.reflectionQuestion}
                                            </p>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Dream Interpreter (AI Tool)"
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
