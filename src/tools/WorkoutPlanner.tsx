import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Dumbbell, Timer, Flame, Activity, Target, Zap, Check, Copy, AlertCircle, ChevronRight, Heart, Trophy, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Exercise {
    name: string;
    sets: string;
    reps: string;
    rest: string;
    notes: string;
}

interface WorkoutData {
    routineName: string;
    mainGoal: string;
    totalDuration: string;
    difficulty: string;
    estimatedCalories: number;
    warmup: string[];
    exercises: Exercise[];
    cooldown: string[];
    coachAdvice: string;
}

export default function WorkoutPlanner() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [goal, setGoal] = useState('Muscle Building');
    const [equipment, setEquipment] = useState('Full Gym');
    const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
    const [timeAvailable, setTimeAvailable] = useState('45-60 mins');

    const [outputData, setOutputData] = useState<WorkoutData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handlePlan = async () => {
        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are an elite Personal Trainer and Strength Coach.
            
            User Goal: "${goal}"
            Equipment: "${equipment}"
            Fitness Level: "${fitnessLevel}"
            Time Available: "${timeAvailable}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "routineName": "A professional name for this workout",
                "mainGoal": "The specific physiological target",
                "totalDuration": "e.g. 50 mins",
                "difficulty": "Beginner/Intermediate/Advanced",
                "estimatedCalories": number,
                "warmup": ["Step 1", "Step 2"],
                "exercises": [
                    { "name": "Exercise Name", "sets": "number", "reps": "number", "rest": "seconds", "notes": "Form tip" }
                ],
                "cooldown": ["Step 1", "Step 2"],
                "coachAdvice": "1-2 sentences of motivation and form safety."
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CREATE WORKOUT PLAN:\nGoal: ${goal}\nEquip: ${equipment}\nLevel: ${fitnessLevel}\nTime: ${timeAvailable}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'workout-planner'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as WorkoutData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Coach's error: Failed to generate routine. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyWorkout = () => {
        if (outputData) {
            const content = `ROUTINE: ${outputData.routineName}\n\nEXERCISES:\n${outputData.exercises.map(e => `- ${e.name}: ${e.sets}x${e.reps} (Rest: ${e.rest})`).join('\n')}`;
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Main Goal</label>
                            <select
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                            >
                                <option>Muscle Building</option>
                                <option>Fat Loss</option>
                                <option>Strength & Power</option>
                                <option>Endurance</option>
                                <option>Flexibility & Mobility</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Equipment</label>
                            <select
                                value={equipment}
                                onChange={(e) => setEquipment(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                            >
                                <option>Full Gym</option>
                                <option>Dumbbells Only</option>
                                <option>Bodyweight Only</option>
                                <option>Home Gym (Basic)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Level</label>
                            <select
                                value={fitnessLevel}
                                onChange={(e) => setFitnessLevel(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Elite</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Time</label>
                            <select
                                value={timeAvailable}
                                onChange={(e) => setTimeAvailable(e.target.value)}
                                className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
                            >
                                <option>15-30 mins</option>
                                <option>30-45 mins</option>
                                <option>45-60 mins</option>
                                <option>90+ mins</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handlePlan}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Dumbbell className="w-6 h-6" />}
                            {isLoading ? 'Creating Routine...' : 'Generate Workout'}
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
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                    <Heart className="w-20 h-20 text-rose-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Optimizing Intensity</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Calculating rest intervals and metabolic load via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col">
                                {/* Header Dashboard Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/10 bg-slate-950/50">
                                    <div className="p-6 border-r border-white/10 flex flex-col items-center justify-center group">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Duration</div>
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4 text-sky-400" />
                                            <div className="text-2xl font-black text-white">{outputData.totalDuration}</div>
                                        </div>
                                    </div>
                                    <div className="p-6 md:border-r border-white/10 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Level</div>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <div className="text-2xl font-black text-white">{outputData.difficulty}</div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-r border-white/10 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Goal</div>
                                        <div className="text-lg font-black text-indigo-400 text-center uppercase leading-tight line-clamp-1">{outputData.mainGoal}</div>
                                    </div>
                                    <div className="p-6 flex flex-col items-center justify-center">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Est. Burn</div>
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-orange-500" />
                                            <div className="text-2xl font-black text-white">{outputData.estimatedCalories} <span className="text-[10px] text-slate-500 font-bold">CAL</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Routine Index Sidebar */}
                                    <div className="w-full lg:w-96 p-8 bg-slate-950/30 border-b lg:border-b-0 lg:border-r border-white/10 space-y-10 shrink-0">
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                    <Activity className="w-3 h-3 text-emerald-400" /> Dynamic Warmup
                                                </h4>
                                                <div className="space-y-2">
                                                    {outputData.warmup.map((step, i) => (
                                                        <div key={i} className="flex gap-3 items-center text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                            {step}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                    <Activity className="w-3 h-3 text-sky-400" /> Recovery Cooldown
                                                </h4>
                                                <div className="space-y-2">
                                                    {outputData.cooldown.map((step, i) => (
                                                        <div key={i} className="flex gap-3 items-center text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                                            {step}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/20 p-5 rounded-2xl relative">
                                                <Trophy className="absolute top-4 right-4 w-10 h-10 text-indigo-400 opacity-10" />
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-2">Coach's Meta Advice</h4>
                                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                                    "{outputData.coachAdvice}"
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleCopyWorkout}
                                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Routine Copied' : 'Copy Routine'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Exercise View */}
                                    <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                        <div className="max-w-3xl mx-auto space-y-12">
                                            <div className="space-y-2">
                                                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic">
                                                    {outputData.routineName}
                                                </h2>
                                                <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-600 to-sky-600 rounded-full" />
                                            </div>

                                            <div className="space-y-4">
                                                {outputData.exercises.map((ex, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="group bg-slate-950/50 border border-white/5 rounded-3xl p-6 sm:p-8 hover:bg-slate-900 transition-colors relative"
                                                    >
                                                        <div className="absolute top-6 right-8 text-5xl font-black text-white/5 pointer-events-none group-hover:text-indigo-500/10 transition-colors">0{idx + 1}</div>
                                                        <div className="flex flex-col sm:flex-row gap-6 justify-between lg:items-center">
                                                            <div className="space-y-1">
                                                                <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{ex.name}</h3>
                                                                <p className="text-sm text-slate-500 font-medium max-w-sm">{ex.notes}</p>
                                                            </div>
                                                            <div className="flex gap-4 sm:gap-8 items-center bg-slate-900/50 px-6 py-4 rounded-2xl border border-white/5">
                                                                <div className="text-center">
                                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-600">Sets</div>
                                                                    <div className="text-xl font-black text-white">{ex.sets}</div>
                                                                </div>
                                                                <div className="w-px h-8 bg-white/5" />
                                                                <div className="text-center">
                                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-600">Reps</div>
                                                                    <div className="text-xl font-black text-white">{ex.reps}</div>
                                                                </div>
                                                                <div className="w-px h-8 bg-white/5" />
                                                                <div className="text-center">
                                                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-600">Rest</div>
                                                                    <div className="text-xl font-black text-indigo-400">{ex.rest}s</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <div className="pt-10 border-t border-white/10">
                                                <ShareButtonsComponent
                                                    gameTitle="AI Fitness Coach (AI Tool)"
                                                    result="won"
                                                    penalty={null}
                                                />
                                            </div>
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
