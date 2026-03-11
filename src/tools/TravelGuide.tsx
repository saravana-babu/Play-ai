import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, MapPin, Calendar, Clock, Compass, Plane, Hotel, Check, Copy, AlertCircle, ChevronRight, Map, Heart, Sun, Umbrella, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Activity {
    time: string;
    location: string;
    description: string;
}

interface DayPlan {
    day: number;
    theme: string;
    activities: Activity[];
}

interface TravelData {
    destination: string;
    tripDuration: string;
    budgetLevel: string;
    itinerary: DayPlan[];
    travelTips: string[];
    packingEssentials: string[];
    localPhrases?: { phrase: string, meaning: string }[];
}

export default function TravelGuide() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [destination, setDestination] = useState('');
    const [duration, setDuration] = useState('3 Days');
    const [style, setStyle] = useState('Balanced');
    const [budget, setBudget] = useState('Moderate');

    const [outputData, setOutputData] = useState<TravelData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handlePlan = async () => {
        if (!destination.trim()) {
            setError('Please specify a destination for your trip.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a world-class luxury Travel Concierge and Local Expert.
            
            Destination: "${destination}"
            Duration: "${duration}"
            Travel Style: "${style}"
            Budget: "${budget}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "destination": "City, Country",
                "tripDuration": "e.g. 3 Days / 2 Nights",
                "budgetLevel": "Budget/Moderate/Luxury",
                "itinerary": [
                    {
                        "day": 1,
                        "theme": "e.g. Historical Discovery",
                        "activities": [
                            { "time": "09:00", "location": "Place Name", "description": "Short vivid description" }
                        ]
                    }
                ],
                "travelTips": ["Tip 1", "Tip 2"],
                "packingEssentials": ["Item 1", "Item 2"],
                "localPhrases": [
                    { "phrase": "Hello/Thanks", "meaning": "Local language version" }
                ]
            }
            
            Generate a unique, logically routed itinerary.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CREATE TRAVEL PLAN:\nDest: ${destination}\nDur: ${duration}\nStyle: ${style}\nBudget: ${budget}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'travel-guide'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as TravelData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Logistics failure: Failed to generate itinerary. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyItinerary = () => {
        if (outputData) {
            const content = `TRIP TO ${outputData.destination} (${outputData.tripDuration})\n\n${outputData.itinerary.map(day => `DAY ${day.day}: ${day.theme}\n${day.activities.map(a => `${a.time} - ${a.location}: ${a.description}`).join('\n')}`).join('\n\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-pink-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-pink-400" />
                                Destination
                            </label>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="e.g. Kyoto, Japan or Amalfi Coast, Italy"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Duration</label>
                                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none">
                                    <option>2 Days</option>
                                    <option>3 Days</option>
                                    <option>5 Days</option>
                                    <option>7 Days</option>
                                    <option>10+ Days</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Style</label>
                                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none">
                                    <option>Adventure</option>
                                    <option>Relaxation</option>
                                    <option>Cultural</option>
                                    <option>Balanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Budget</label>
                                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-2 py-2 outline-none">
                                    <option>Backpacker</option>
                                    <option>Moderate</option>
                                    <option>Luxury</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handlePlan}
                            disabled={isLoading || !destination.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Compass className="w-6 h-6" />}
                            {isLoading ? 'Plotting Route...' : 'Generate Itinerary'}
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
                                    <Umbrella className="w-20 h-20 text-pink-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Curating Local Experiences</h3>
                                    <p className="animate-pulse font-medium text-pink-300/80">Indexing topography and cultural landmarks via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Logistics Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Plane className="w-3 h-3" /> Trip Stats
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl">
                                                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Duration</div>
                                                    <div className="text-sm text-white font-bold">{outputData.tripDuration}</div>
                                                </div>
                                                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl">
                                                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Budget Flow</div>
                                                    <div className="text-sm text-pink-400 font-black">{outputData.budgetLevel}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Hotel className="w-3 h-3" /> Essentials
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.packingEssentials.map((item, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-white/5 font-bold">{item}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {outputData.localPhrases && (
                                            <div className="space-y-3 pt-4">
                                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Lingo Guide</div>
                                                {outputData.localPhrases.map((p, i) => (
                                                    <div key={i} className="bg-pink-500/5 p-3 rounded-xl border border-pink-500/10">
                                                        <div className="text-xs font-black text-white">{p.phrase}</div>
                                                        <div className="text-[10px] text-slate-400">{p.meaning}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyItinerary}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Itinerary Copied' : 'Copy Full Map'}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Itinerary View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest border border-pink-500/20">
                                                    Concierge Recommended
                                                </div>
                                                <Sun className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                                                {outputData.destination}
                                            </h2>
                                        </div>

                                        <div className="space-y-20">
                                            {outputData.itinerary.map((day, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-4 sm:-left-8 top-0 bottom-0 w-px bg-gradient-to-b from-pink-500 to-transparent opacity-20" />

                                                    <div className="space-y-8 relative">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/30">
                                                                {day.day}
                                                            </div>
                                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{day.theme}</h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-6 ml-2 sm:ml-4">
                                                            {day.activities.map((act, i) => (
                                                                <div key={i} className="flex gap-6 group">
                                                                    <div className="text-xs font-black text-slate-500 pt-1 shrink-0 tabular-nums">{act.time}</div>
                                                                    <div className="space-y-1">
                                                                        <div className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors flex items-center gap-2">
                                                                            {act.location}
                                                                        </div>
                                                                        <p className="text-slate-400 leading-relaxed text-sm">{act.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-950/50 border border-white/5 p-8 rounded-3xl space-y-6">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-sky-400" /> Professional Travel Tips
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {outputData.travelTips.map((tip, i) => (
                                                    <div key={i} className="bg-slate-900 p-4 rounded-xl text-xs text-slate-300 font-medium leading-relaxed border border-white/5">
                                                        {tip}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Travel Itinerary (AI Tool)"
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
