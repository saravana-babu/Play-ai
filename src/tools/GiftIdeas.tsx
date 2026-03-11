import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Gift, Heart, User, Check, Copy, AlertCircle, ChevronRight, ShoppingBag, Star, Tag, Zap, Info, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GiftItem {
    name: string;
    priceRange: string;
    reasoning: string;
    category: string;
}

interface GiftData {
    recipientPersona: string;
    topRecommendations: GiftItem[];
    experienceGifts: string[];
    personalityTraits: string[];
    wrappingAdvice: string;
}

export default function GiftIdeas() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [recipient, setRecipient] = useState('');
    const [occasion, setOccasion] = useState('Birthday');
    const [interests, setInterests] = useState('');
    const [budget, setBudget] = useState('Moderate');

    const [outputData, setOutputData] = useState<GiftData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleRecommend = async () => {
        if (!recipient.trim() || !interests.trim()) {
            setError('Please describe the recipient and their interests.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Professional Personal Shopper and Gift Curator.
            
            Recipient: "${recipient}"
            Occasion: "${occasion}"
            Interests: "${interests}"
            Budget Range: "${budget}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "recipientPersona": "A short synthesis of the persona you are shopping for",
                "topRecommendations": [
                    { "name": "Exact Product Idea", "priceRange": "$$", "reasoning": "Why it fits their traits", "category": "Physical/Hobby" }
                ],
                "experienceGifts": ["Activity Idea 1", "Activity Idea 2"],
                "personalityTraits": ["Trait 1", "Trait 2"],
                "wrappingAdvice": "A creative way to present or wrap this gift."
            }
            
            Be specific with product types (e.g. "Vintage-style fountain pen" instead of just "Pen").
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GIFT IDEAS FOR:\nWho: ${recipient}\nFor: ${occasion}\nInterests: ${interests}\nBudget: ${budget}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'gift-ideas'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as GiftData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Curation Error: Failed to generate ideas. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyGifts = () => {
        if (outputData) {
            const content = `GIFT IDEAS FOR ${recipient}\n\nRECOMMENDATIONS:\n${outputData.topRecommendations.map(g => `- ${g.name} (${g.priceRange}): ${g.reasoning}`).join('\n')}`;
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
                                    <User className="w-4 h-4 text-rose-400" />
                                    Who are we shopping for?
                                </label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="e.g. My dad, my best friend, my boss..."
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-rose-400" />
                                    What's the Occasion?
                                </label>
                                <select
                                    value={occasion}
                                    onChange={(e) => setOccasion(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                >
                                    <option>Birthday</option>
                                    <option>Anniversary</option>
                                    <option>Wedding</option>
                                    <option>Housewarming</option>
                                    <option>graduation</option>
                                    <option>Just Because</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-rose-400" />
                                    Interests & Personality
                                </label>
                                <textarea
                                    value={interests}
                                    onChange={(e) => setInterests(e.target.value)}
                                    placeholder="e.g. Loves espresso, 70s rock music, plants, and data science..."
                                    className="w-full h-24 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Budget Context</label>
                                <div className="flex gap-2">
                                    {['Budget', 'Moderate', 'Premium', 'Extravagant'].map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => setBudget(b)}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${budget === b
                                                    ? 'bg-rose-600 border-rose-500 text-white'
                                                    : 'bg-slate-950 border-white/10 text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleRecommend}
                            disabled={isLoading || !recipient.trim() || !interests.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gift className="w-6 h-6" />}
                            {isLoading ? 'Curating Boutique...' : 'Find Perfect Gifts'}
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
                                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                                    <Package className="w-20 h-20 text-rose-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Matching Emotional Markers</h3>
                                    <p className="animate-pulse font-medium text-rose-300/80">Parsing trait affinities and product scarcity via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Insights Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Star className="w-3 h-3 text-amber-500" /> Recipient Traits
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.personalityTraits.map((t, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-900 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20 font-black uppercase">{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-sky-400" /> Experience Ideas
                                            </div>
                                            <div className="space-y-3">
                                                {outputData.experienceGifts.map((exp, i) => (
                                                    <div key={i} className="bg-slate-900 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 italic">
                                                        "{exp}"
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 mb-4 group">
                                            <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Presentation Tip</div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">
                                                {outputData.wrappingAdvice}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCopyGifts}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied Ideas' : 'Copy Recommendations'}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Results Area */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                AI Gift Selection
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                                                {outputData.recipientPersona}
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {outputData.topRecommendations.map((gift, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/50 border border-white/5 rounded-3xl p-6 sm:p-8 hover:bg-slate-900 transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden"
                                                >
                                                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                                        <ShoppingBag className="w-8 h-8 text-rose-500" />
                                                    </div>
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-black text-white">{gift.name}</h3>
                                                            <span className="text-xs bg-slate-900 px-2 py-0.5 rounded text-amber-400 font-bold border border-white/5">{gift.priceRange}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{gift.reasoning}</p>
                                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest pt-1">{gift.category}</div>
                                                    </div>
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] pointer-events-none rounded-full" />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Gift Recommender (AI Tool)"
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
