import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Moon, Sun, Zap, Check, Copy, AlertCircle, ChevronRight, Stars, Compass, Target, Info, Globe, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CelestialBody {
    planet: string;
    sign: string;
    house: string;
    meaning: string;
}

interface AstrologyData {
    sunSign: string;
    moonSign: string;
    risingSign: string;
    celestialPlacements: CelestialBody[];
    corePersonality: string;
    destinyPath: string;
    cosmicWarning: string;
    compatibilityInsight: string;
}

export default function NatalChartAI() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [birthLocation, setBirthLocation] = useState('');

    const [outputData, setOutputData] = useState<AstrologyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!birthDate || !birthLocation) {
            setError('Please provide at least your birth date and birth location.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Master Astrologer and Cosmic Consultant specializing in Natal Charts and Archetypal Psychology.
            
            Birth Date: "${birthDate}"
            Birth Time: "${birthTime || 'Unknown'}"
            Birth Location: "${birthLocation}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "sunSign": "Zodiac Sign",
                "moonSign": "Zodiac Sign",
                "risingSign": "Zodiac Sign (Ascendant)",
                "celestialPlacements": [
                    { "planet": "Mercury", "sign": "...", "house": "3rd House", "meaning": "How you communicate..." }
                ],
                "corePersonality": "A deep psychological profile based on the signs.",
                "destinyPath": "Observations on North Node or general career/life trajectory.",
                "cosmicWarning": "A specific challenge or Saturnian lesson for this individual.",
                "compatibilityInsight": "The type of energy this person naturally harmonizes with."
            }
            
            Provide deep, poetic, yet psychologically grounded insights.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `NATAL CHART READING:\nDate: ${birthDate}\nTime: ${birthTime}\nLocation: ${birthLocation}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'astrology-reading'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as AstrologyData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Cosmic Failure: Failed to generate chart. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyReading = () => {
        if (outputData) {
            const content = `NATAL CHART: Sun ${outputData.sunSign}, Moon ${outputData.moonSign}, Rising ${outputData.risingSign}\n\nPROFILE: ${outputData.corePersonality}`;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                        <Sun className="w-4 h-4 text-amber-500" />
                                        Birth Date
                                    </label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                        <Moon className="w-4 h-4 text-indigo-400" />
                                        Birth Time
                                    </label>
                                    <input
                                        type="time"
                                        value={birthTime}
                                        onChange={(e) => setBirthTime(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-sky-400" />
                                    Birth Location (City, Country)
                                </label>
                                <input
                                    type="text"
                                    value={birthLocation}
                                    onChange={(e) => setBirthLocation(e.target.value)}
                                    placeholder="e.g. New York, USA"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
                                    "Your Natal Chart is a snapshot of the celestial mechanics at the precise moment of your instantiation. Our AI decodes these alignments into actionable psychological archetypes."
                                </p>
                            </div>
                            <div className="flex items-center gap-4 p-4 border border-white/5 rounded-xl bg-slate-950/50">
                                <Compass className="w-5 h-5 text-amber-500/50 shrink-0" />
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Precise ASC Elevation calculated on server-side.</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !birthDate || !birthLocation}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-700 to-violet-800 hover:from-indigo-600 hover:to-violet-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Stars className="w-6 h-6" />}
                            {isLoading ? 'Decrypting Celestial Positions...' : 'Generate Natal Chart'}
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                                    <Atom className="w-20 h-20 text-indigo-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Aligning Ephemeris Data Points</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Calculating house cusps and planetary aspects via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Cosmic Sidebar */}
                                <div className="w-full lg:w-96 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                                                <div className="text-[9px] font-black text-slate-500 uppercase">Sun</div>
                                                <div className="text-xs font-black text-white">{outputData.sunSign}</div>
                                            </div>
                                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                <Moon className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                                <div className="text-[9px] font-black text-slate-500 uppercase">Moon</div>
                                                <div className="text-xs font-black text-white">{outputData.moonSign}</div>
                                            </div>
                                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                <Compass className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                                <div className="text-[9px] font-black text-slate-500 uppercase">Rising</div>
                                                <div className="text-xs font-black text-white">{outputData.risingSign}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-indigo-400" /> Karmic Warning
                                            </div>
                                            <p className="text-xs text-rose-300 leading-relaxed font-bold italic bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                                                "{outputData.cosmicWarning}"
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-sky-400" /> Resonance Logic</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                {outputData.compatibilityInsight}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyReading}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Reading Copied' : 'Export Natal Profile'}
                                        </button>
                                    </div>
                                </div>

                                {/* Reading View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-16">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                Celestial Mapping Algorithm
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter uppercase italic">
                                                {outputData.destinyPath}
                                            </h2>
                                        </div>

                                        <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden">
                                            <div className="space-y-4">
                                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Core Psychic Disposition:</div>
                                                <p className="text-xl sm:text-2xl text-slate-300 font-bold leading-relaxed tracking-tight italic">
                                                    "{outputData.corePersonality}"
                                                </p>
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.05] blur-[40px] pointer-events-none rounded-full" />
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3 underline decoration-indigo-500/30 underline-offset-8">
                                                <Stars className="w-6 h-6 text-indigo-400" />
                                                Planetary Governance
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {outputData.celestialPlacements.map((p, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/50 border border-white/5 rounded-2xl p-6 hover:bg-slate-900 transition-all flex gap-4"
                                                    >
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-white text-md shrink-0 group-hover:border-indigo-500 transition-colors">
                                                            {p.planet.charAt(0)}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-black text-white uppercase">{p.planet} in {p.sign}</h4>
                                                                <span className="text-[8px] font-black text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">{p.house}</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">{p.meaning}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Natal Chart (AI Tool)"
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
