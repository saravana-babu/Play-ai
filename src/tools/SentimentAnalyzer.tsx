import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, HeartPulse, Sparkles, MessageSquare, BarChart3, AlertCircle, Smile, Frown, Meh, Flame, Zap, Droplets } from 'lucide-react';
import { motion } from 'motion/react';

interface SentimentData {
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
    primaryEmotion: string;
    score: number; // 1 to 100
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    explanation: string;
    keyTriggers: string[];
}

export default function SentimentAnalyzer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [textInput, setTextInput] = useState('');
    const [outputData, setOutputData] = useState<SentimentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!textInput.trim()) {
            setError('Please provide some text to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are an expert psychological AI language model trained in deep sentiment analysis and emotional intelligence.
            
            The user will provide a block of text.
            Analyze the emotional tone, sentiment, primary emotion, and urgency.
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "sentiment": "Positive" | "Neutral" | "Negative" | "Mixed",
                "primaryEmotion": "Joy", "Anger", "Sadness", "Frustration", "Excitement", "Fear", "Calm", etc. (Choose the most accurate single word),
                "score": number between 1 and 100 (where 100 is extreme intensity of that emotion),
                "urgency": "Low" | "Medium" | "High" | "Critical",
                "explanation": "A detailed 2-3 paragraph markdown analysis of the psychological profile and hidden intent behind the text.",
                "keyTriggers": ["Array of 2-4 short phrases or keywords from the text that drove this emotion"]
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json), or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `TEXT TO ANALYZE:\n"""\n${textInput}\n"""`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            // Clean the response just in case the LLM wrapped it in markdown
            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SentimentData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to run analysis. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getSentimentColors = (sentiment: string) => {
        switch (sentiment) {
            case 'Positive': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
            case 'Negative': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
            case 'Mixed': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            case 'Neutral':
            default: return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'Positive': return <Smile className="w-8 h-8 text-emerald-400" />;
            case 'Negative': return <Frown className="w-8 h-8 text-rose-400" />;
            case 'Mixed': return <Meh className="w-8 h-8 text-amber-400" />;
            case 'Neutral':
            default: return <Meh className="w-8 h-8 text-slate-400" />;
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'Critical': return 'bg-rose-600 text-white shadow-rose-500/50';
            case 'High': return 'bg-orange-500 text-white shadow-orange-500/50';
            case 'Medium': return 'bg-amber-500 text-slate-900 shadow-amber-500/50';
            case 'Low':
            default: return 'bg-slate-600 text-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                            Customer Review / Text Payload
                        </label>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste product reviews, support tickets, tweets, or corporate emails here to analyze the emotional tone and hidden intent..."
                            className="w-full h-40 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-sm text-slate-400 flex items-center gap-2">
                            <HeartPulse className="w-4 h-4" />
                            Powered by Deep Psychological AI Analysis
                        </div>

                        <div className="w-full sm:w-auto flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !textInput.trim()}
                                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Analyzing Emotion...' : 'Deep Analyze Text'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {(outputData || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-emerald-400" />
                            Psychological Analysis Profile
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <HeartPulse className="w-16 h-16 animate-pulse text-emerald-500/50" />
                            <p className="animate-pulse font-medium text-lg">Measuring neuro-linguistic sentiment via {selectedLlm}...</p>
                        </div>
                    ) : outputData ? (
                        <div className="space-y-8">
                            {/* Top Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                    className={`col-span-1 md:col-span-2 p-6 rounded-2xl border flex items-center gap-6 ${getSentimentColors(outputData.sentiment)}`}
                                >
                                    <div className="p-4 bg-black/20 rounded-xl backdrop-blur-sm">
                                        {getSentimentIcon(outputData.sentiment)}
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase font-black tracking-widest opacity-70 mb-1">Overall Tone</div>
                                        <div className="text-3xl font-black">{outputData.sentiment}</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    className="p-6 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col justify-center"
                                >
                                    <div className="text-xs uppercase font-black tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-emerald-400" />
                                        Primary Emotion
                                    </div>
                                    <div className="text-2xl font-bold text-white tracking-wide capitalize truncate">
                                        {outputData.primaryEmotion}
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${outputData.score}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className={`h-full ${outputData.score > 75 ? 'bg-rose-500' : outputData.score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                    <div className="text-right text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Intensity: {outputData.score}%</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                    className="p-6 rounded-2xl border border-white/10 bg-slate-950/50 flex flex-col items-start justify-center"
                                >
                                    <div className="text-xs uppercase font-black tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-emerald-400" />
                                        Urgency Level
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest ${getUrgencyColor(outputData.urgency)}`}>
                                        {outputData.urgency}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Key Triggers Array */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                                    <Droplets className="w-4 h-4 text-emerald-400" />
                                    Emotional Triggers Identified
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {outputData.keyTriggers.map((trigger, i) => (
                                        <div key={i} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-sm font-medium">
                                            "{trigger}"
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Detailed Explanation */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-6 border-t border-white/10">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Psychological Breakdown</h4>
                                <div className="text-slate-200 leading-relaxed font-medium prose prose-invert prose-emerald max-w-none">
                                    {outputData.explanation}
                                </div>
                            </motion.div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="Sentiment Analyzer (AI Tool)"
                                    result="won"
                                    penalty={null}
                                />
                            </div>
                        </div>
                    ) : null
                    }
                </div >
            )}
        </div >
    );
}
