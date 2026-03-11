import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Languages, Globe, Book, MessageCircle, Check, Copy, AlertCircle, ChevronRight, Mic2, Speaker, Target, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhrasePair {
    original: string;
    translated: string;
    phonetic: string;
    usageNote: string;
}

interface LanguageData {
    languageName: string;
    culturalContext: string;
    keyGrammarConcept: string;
    essentialPhrases: PhrasePair[];
    commonMistakes: string[];
    recommendedResources: string[];
    tutorAdvice: string;
}

export default function LanguageTutor() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [targetLanguage, setTargetLanguage] = useState('Japanese');
    const [level, setLevel] = useState('Beginner');
    const [topic, setTopic] = useState('Ordering Food');

    const [outputData, setOutputData] = useState<LanguageData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!targetLanguage.trim()) {
            setError('Please specify the language you want to study.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are an Expert Polyglot and Linguistics Professor.
            
            Target Language: "${targetLanguage}"
            Learner Level: "${level}"
            Focus Topic: "${topic}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "languageName": "Full name of language",
                "culturalContext": "1-sentence on the cultural importance of this topic in that language.",
                "keyGrammarConcept": "One high-level rule relevant to this topic.",
                "essentialPhrases": [
                    { "original": "Phrase in native script", "translated": "English translation", "phonetic": "How to say it (Romaji/IPA)", "usageNote": "When to say this (formal/casual)" }
                ],
                "commonMistakes": ["Mistake 1", "Mistake 2"],
                "recommendedResources": ["Book/App/Site 1", "2"],
                "tutorAdvice": "The single most important tip for mastering this topic."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE LANGUAGE LESSON:\nLanguage: ${targetLanguage}\nLevel: ${level}\nTopic: ${topic}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'language-tutor'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as LanguageData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Linguistic Error: Failed to generate lesson. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLesson = () => {
        if (outputData) {
            const content = `LANGUAGE LESSON: ${outputData.languageName}\n\nPHRASES:\n${outputData.essentialPhrases.map(p => `${p.original} (${p.phonetic}) - ${p.translated}`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-400" />
                                Target Language
                            </label>
                            <input
                                type="text"
                                value={targetLanguage}
                                onChange={(e) => setTargetLanguage(e.target.value)}
                                placeholder="Japanese, French, Swahili..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-400" />
                                Your Level
                            </label>
                            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                <option>Absolute Beginner (A1)</option>
                                <option>Elementary (A2)</option>
                                <option>Intermediate (B1/B2)</option>
                                <option>Advanced (C1+)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-indigo-400" />
                                Context / Situation
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="At a restaurant, Business meeting..."
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !targetLanguage.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Languages className="w-6 h-6" />}
                            {isLoading ? 'Decoding Glyphs...' : 'Initialize Lesson'}
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
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity }}>
                                    <Globe className="w-20 h-20 text-indigo-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Semantic Graphs</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Indexing phonological datasets and grammatical rule-sets via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Cultural Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Info className="w-3 h-3 text-indigo-400" /> Cultural Nuance
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium italic p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                                "{outputData.culturalContext}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Book className="w-3 h-3 text-emerald-400" /> Core Grammar Logic</div>
                                            <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed border border-white/5">
                                                {outputData.keyGrammarConcept}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-400" /> Master Advice</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                                                "{outputData.tutorAdvice}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyLesson}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Lesson Copied' : 'Export Full Blueprint'}
                                        </button>
                                    </div>
                                </div>

                                {/* Phrases & Vocabulary View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                Immersive Language Synthesis
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none italic uppercase tracking-tighter">
                                                {outputData.languageName}
                                            </h2>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-indigo-500/30 underline-offset-8">
                                                <Speaker className="w-6 h-6 text-indigo-400" />
                                                Essential Survival Phrases
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {outputData.essentialPhrases.map((phrase, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/80 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-all space-y-4 relative overflow-hidden"
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-1">
                                                                <h4 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{phrase.original}</h4>
                                                                <p className="text-xs text-slate-500 font-bold italic">{phrase.phonetic}</p>
                                                            </div>
                                                            <Mic2 className="w-5 h-5 text-indigo-500/30 group-hover:text-indigo-500 transition-colors" />
                                                        </div>
                                                        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                                                            <p className="text-md text-slate-300 font-medium italic">"{phrase.translated}"</p>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-relaxed pl-1">{phrase.usageNote}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-12">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <AlertCircle className="w-6 h-6 text-rose-500" />
                                                    Watch Out For:
                                                </h3>
                                                <div className="space-y-2">
                                                    {outputData.commonMistakes.map((m, i) => (
                                                        <div key={i} className="flex gap-3 items-center text-sm text-slate-400 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Book className="w-6 h-6 text-sky-400" />
                                                    Deeper Study:
                                                </h3>
                                                <div className="space-y-2">
                                                    {outputData.recommendedResources.map((r, i) => (
                                                        <div key={i} className="flex gap-3 items-center text-sm text-slate-400 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10 group-hover:bg-slate-900">
                                                            <ChevronRight className="w-3 h-3 text-sky-400 shrink-0" />
                                                            {r}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Language Tutor (AI Tool)"
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
