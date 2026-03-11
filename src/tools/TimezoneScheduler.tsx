import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Globe, Clock, Calendar, Check, Copy, AlertCircle, ChevronRight, Users, Map, Info, Zap, LayoutDashboard, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MeetingOption {
    timeUtc: string;
    localTimes: { [city: string]: string };
    suitabilityScore: number;
    suitabilityReason: string;
}

interface SchedulerData {
    selectedCities: string[];
    suggestedSlots: MeetingOption[];
    overlapAnalysis: string;
    proTips: string[];
}

export default function TimezoneScheduler() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [cities, setCities] = useState('');
    const [duration, setDuration] = useState('60 mins');
    const [priority, setPriority] = useState('All Awake');

    const [outputData, setOutputData] = useState<SchedulerData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleSchedule = async () => {
        if (!cities.trim()) {
            setError('Please list at least 2 cities or time zones.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are a Global Operations Logistics Expert and Time Zone Specialist.
            
            Cities/Zones involved: "${cities}"
            Meeting Duration: "${duration}"
            Priority: "${priority}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "selectedCities": ["City A", "City B"],
                "suggestedSlots": [
                    { 
                        "timeUtc": "14:00 UTC", 
                        "localTimes": { "New York": "09:00 AM", "London": "02:00 PM" },
                        "suitabilityScore": 95,
                        "suitabilityReason": "Optimal overlapping business hours."
                    }
                ],
                "overlapAnalysis": "Brief synthesis of the difficulty of this specific global overlap.",
                "proTips": ["Tip 1", "Tip 2"]
            }
            
            Find the 3 best possible meeting windows in a 24-hour cycle.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `SCHEDULE INTERNATIONAL MEETING:\nCities: ${cities}\nDuration: ${duration}\nPriority: ${priority}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'timezone-scheduler'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as SchedulerData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Logistics Error: Failed to calculate windows. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySlot = (slot: MeetingOption, index: number) => {
        const text = `GLOBAL MEETING SLOT: ${slot.timeUtc}\n${Object.entries(slot.localTimes).map(([city, time]) => `- ${city}: ${time}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-sky-400" />
                                Locations / Time Zones
                            </label>
                            <input
                                type="text"
                                value={cities}
                                onChange={(e) => setCities(e.target.value)}
                                placeholder="e.g. San Francisco, London, Tokyo, Mumbai"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-sky-500 transition-colors shadow-inner"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Duration</label>
                                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-3 outline-none">
                                    <option>30 mins</option>
                                    <option>60 mins</option>
                                    <option>90 mins</option>
                                    <option>2 hours</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Scheduling Priority</label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-3 outline-none">
                                    <option>All Awake</option>
                                    <option>Standard 9-5 Mix</option>
                                    <option>Minimize Overtime</option>
                                    <option>Fastest Overlap</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSchedule}
                            disabled={isLoading || !cities.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clock className="w-6 h-6" />}
                            {isLoading ? 'Synchronizing Planet...' : 'Find Global Windows'}
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
                                    <Map className="w-20 h-20 text-sky-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Flattening Longitudinal Deltas</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Calculating circadian overlaps and daylight savings offsets via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Analysis Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Users className="w-3 h-3 text-sky-400" /> Active Nodes
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.selectedCities.map((c, i) => (
                                                    <span key={i} className="text-[10px] bg-slate-900 text-sky-200 px-2.5 py-1.5 rounded-lg border border-white/5 font-bold">{c}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Logistics Analysis</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium bg-slate-950/50 p-4 rounded-xl border border-white/5 italic">
                                                "{outputData.overlapAnalysis}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Global Efficiency Tips</div>
                                            <div className="space-y-2">
                                                {outputData.proTips.map((tip, i) => (
                                                    <div key={i} className="flex gap-2 items-start text-xs text-slate-500">
                                                        <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                                        {tip}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Slots Area */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Optimized Meeting Slots
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                                                International Synchronization Plan
                                            </h2>
                                        </div>

                                        <div className="space-y-6">
                                            {outputData.suggestedSlots.map((slot, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/80 border border-white/5 rounded-3xl p-6 sm:p-8 hover:border-sky-500/30 transition-all flex flex-col gap-8 relative overflow-hidden"
                                                >
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/30">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xl font-black text-white tracking-tight">{slot.timeUtc}</h4>
                                                                <div className="text-[10px] font-black uppercase tracking-widest text-sky-500">{slot.suitabilityReason}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                                            <div className="text-right hidden sm:block">
                                                                <div className="text-[9px] font-black text-slate-600 uppercase">Match Quality</div>
                                                                <div className="text-xl font-black text-emerald-400">{slot.suitabilityScore}%</div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCopySlot(slot, idx)}
                                                                className="flex-1 sm:flex-none py-3 px-6 bg-slate-900 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/5"
                                                            >
                                                                {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                                {copiedIndex === idx ? 'Slot Copied' : 'Copy Invitation'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                                                        {Object.entries(slot.localTimes).map(([city, time]) => (
                                                            <div key={city} className="space-y-1">
                                                                <div className="text-[9px] font-black text-slate-500 uppercase truncate">{city}</div>
                                                                <div className="text-sm font-bold text-white">{time}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[40px] pointer-events-none rounded-full" />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Global Scheduler (AI Tool)"
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
