import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Network, LayoutTemplate, Database, Server, ShieldCheck, HardDrive, ArrowDown, Activity, ChevronRight, Layers, Box, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TechItem {
    name: string;
    rationale: string;
}

interface ArchLayer {
    layerName: string;
    description: string;
    technologies: TechItem[];
}

interface ArchitectureData {
    projectName: string;
    executiveSummary: string;
    scalabilityScore: number;
    securityScore: number;
    layers: ArchLayer[];
    dataFlow: string[];
}

export default function ArchitecturePlanner() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [projectDescription, setProjectDescription] = useState('');
    const [scaleLevel, setScaleLevel] = useState('Enterprise Load');

    const [outputData, setOutputData] = useState<ArchitectureData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePlan = async () => {
        if (!projectDescription.trim()) {
            setError('Please describe your app or system requirements to generate architecture.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are an elite Cloud Solutions Architect solving complex system designs.
            
            The user needs a full software architecture plan.
            Project Description: "${projectDescription}"
            Target Scale: "${scaleLevel}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "projectName": "A professional name for this architecture plan",
                "executiveSummary": "A 1-2 sentence high-level summary of the architectural approach.",
                "scalabilityScore": number (1 to 100),
                "securityScore": number (1 to 100),
                "layers": [
                    {
                        "layerName": "Name of the tier (e.g., Client / Frontend, API Gateway, Backend Microservices, Database / Storage, Infrastructure / DevOps)",
                        "description": "Short description of what this layer handles",
                        "technologies": [
                            {
                                "name": "Specific tech (e.g., React, PostgreSQL, Redis)",
                                "rationale": "Brief reason why it was chosen"
                            }
                        ]
                    }
                ],
                "dataFlow": [
                    "Step 1 of how data moves from user to db",
                    "Step 2...",
                    "Step 3..."
                ]
            }
            
            Provide exactly 4 to 5 core layers in logical order (from Client down to Database/Infrastructure).
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `PLAN ARCHITECTURE FOR:\n"${projectDescription}"`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'architecture-planner'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as ArchitectureData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate Architecture. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getLayerIcon = (index: number) => {
        switch (index) {
            case 0: return <LayoutTemplate className="w-6 h-6" />;
            case 1: return <Network className="w-6 h-6" />;
            case 2: return <Server className="w-6 h-6" />;
            case 3: return <Database className="w-6 h-6" />;
            default: return <HardDrive className="w-6 h-6" />;
        }
    };

    const getLayerColor = (index: number) => {
        const colors = [
            'from-fuchsia-500 to-pink-500 text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/10',
            'from-violet-500 to-indigo-500 text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
            'from-sky-500 to-cyan-500 text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
            'from-emerald-500 to-teal-500 text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
            'from-amber-500 to-orange-500 text-amber-400 border-amber-500/20 bg-amber-500/10'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <Layers className="w-7 h-7 text-indigo-400" />
                            System Requirements
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Describe the application you want to build. Our AI Architect will design a robust, scaled stack.</p>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            placeholder="e.g. 'A real-time multiplayer chess game with global matchmaking, user accounts, ELO rating updates, and spectating features...'"
                            className="w-full h-32 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-600 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="w-full sm:w-1/3 space-y-2">
                            <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block">Target Scale</label>
                            <select
                                value={scaleLevel}
                                onChange={(e) => setScaleLevel(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="MVP / Startup">MVP / Startup (Fast, Cheap)</option>
                                <option value="Mid-Market">Mid-Market (Reliable, Balanced)</option>
                                <option value="Enterprise Load">Enterprise Load (High Availability, Redundant)</option>
                                <option value="Global Planet-Scale">Global Planet-Scale (Multi-Region, Extreme Scale)</option>
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end pt-2 sm:pt-0">
                            <button
                                onClick={handlePlan}
                                disabled={isLoading || !projectDescription.trim()}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                {isLoading ? 'Architecting...' : 'Generate Blueprint'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm font-medium">
                            <Box className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {(outputData || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl min-h-[400px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-24 justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                    <Network className="w-20 h-20 text-indigo-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Drafting Blueprints</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Evaluating load balancers and database topologies via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="space-y-12">

                                {/* Header / Scores */}
                                <div className="flex flex-col lg:flex-row gap-8 justify-between items-start border-b border-white/10 pb-10">
                                    <div className="space-y-4 max-w-3xl">
                                        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                                            Architecture Master Plan
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-tight">
                                            {outputData.projectName}
                                        </h2>
                                        <p className="text-lg text-slate-300 leading-relaxed font-medium">
                                            {outputData.executiveSummary}
                                        </p>
                                    </div>

                                    <div className="flex gap-4 shrink-0">
                                        <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-inner">
                                            <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                                            <span className="text-3xl font-black text-white">{outputData.scalabilityScore}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Scalability</span>
                                        </div>
                                        <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-inner">
                                            <ShieldCheck className="w-6 h-6 text-sky-400 mb-2" />
                                            <span className="text-3xl font-black text-white">{outputData.securityScore}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Security</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Architecture Diagram Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                                    {/* The Stack Viewer (Visual Vertical Layers) */}
                                    <div className="lg:col-span-7 space-y-4 relative pt-4">
                                        <div className="absolute top-0 bottom-0 left-8 sm:left-12 w-1 bg-slate-800 rounded-full z-0" />

                                        {outputData.layers.map((layer, idx) => {
                                            const colorClasses = getLayerColor(idx);
                                            const bgClass = colorClasses.split(' ').find(c => c.startsWith('bg-'));
                                            const borderClass = colorClasses.split(' ').find(c => c.startsWith('border-'));
                                            const textClass = colorClasses.split(' ').find(c => c.startsWith('text-'));

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="relative z-10 flex gap-4 sm:gap-6"
                                                >
                                                    {/* Layer Icon Node */}
                                                    <div className={`w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-2xl border-2 ${borderClass} ${bgClass} ${textClass} flex flex-col items-center justify-center shadow-lg backdrop-blur-md`}>
                                                        {getLayerIcon(idx)}
                                                        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest mt-1 sm:mt-2 opacity-80 text-center px-1">Tier {idx + 1}</span>
                                                    </div>

                                                    {/* Layer Details Card */}
                                                    <div className="flex-1 bg-slate-950/50 border border-white/5 rounded-2xl p-5 hover:bg-slate-900 transition-colors group">
                                                        <h3 className={`text-lg sm:text-xl font-bold ${textClass} mb-2 flex items-center gap-2`}>
                                                            {layer.layerName}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                                                            {layer.description}
                                                        </p>

                                                        {/* Technologies Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {layer.technologies.map((tech, tIdx) => (
                                                                <div key={tIdx} className="bg-slate-900 border border-white/10 p-3 rounded-xl hover:border-white/20 transition-colors">
                                                                    <div className={`font-black text-sm ${textClass} mb-1.5 flex items-center gap-1.5`}>
                                                                        <Cpu className="w-3.5 h-3.5" />
                                                                        {tech.name}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 leading-snug">
                                                                        {tech.rationale}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {/* Down Arrows connector styling overlay */}
                                        <div className="absolute top-0 bottom-0 left-8 sm:left-12 flex flex-col justify-around py-16 pointer-events-none z-20">
                                            <ArrowDown className="w-6 h-6 text-slate-700 bg-slate-900 rounded-full" />
                                            <ArrowDown className="w-6 h-6 text-slate-700 bg-slate-900 rounded-full" />
                                            <ArrowDown className="w-6 h-6 text-slate-700 bg-slate-900 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Data Flow & Notes Panel */}
                                    <div className="lg:col-span-5 space-y-6">
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 h-full">
                                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                                <Activity className="w-6 h-6 text-indigo-400" />
                                                Data Flow Sequence
                                            </h3>

                                            <div className="space-y-4">
                                                {outputData.dataFlow.map((step, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start group">
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm mt-0.5 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-sm text-slate-300 leading-relaxed font-medium pt-1.5">
                                                            {step}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-10 pt-6 border-t border-indigo-500/20">
                                                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Architect's Note</h4>
                                                    <p className="text-xs text-slate-400 italic">
                                                        This topology is heavily dictated by the requested scale profile ({scaleLevel}). Ensure components are independently deployable to maintain high availability.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <ShareButtonsComponent
                                        gameTitle="AI Architecture Planner (AI Tool)"
                                        result="won"
                                        penalty={null}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
