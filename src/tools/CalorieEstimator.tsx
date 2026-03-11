import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Scale, Beef, Flame, Apple, Pill, Activity, Check, AlertCircle, Info, ChevronRight, BarChart3, PieChart, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Nutrient {
    label: string;
    amount: string;
    percentage: number;
}

interface CalorieData {
    foodName: string;
    totalCalories: number;
    macros: {
        protein: string;
        carbs: string;
        fats: string;
    };
    nutrients: Nutrient[];
    healthScore: number; // 1-100
    expertInsight: string;
    alternatives: string[];
}

export default function CalorieEstimator() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [foodDescription, setFoodDescription] = useState('');

    const [outputData, setOutputData] = useState<CalorieData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEstimate = async () => {
        if (!foodDescription.trim()) {
            setError('Please describe the food or meal you want to estimate.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are a Clinical Nutritionist and Metabolic Specialist.
            
            Meal/Food Description: "${foodDescription}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "foodName": "Standardized name of the meal/food",
                "totalCalories": number,
                "macros": {
                    "protein": "g",
                    "carbs": "g",
                    "fats": "g"
                },
                "nutrients": [
                    { "label": "Vitamin C", "amount": "mg", "percentage": 20 }
                ],
                "healthScore": number (1 to 100),
                "expertInsight": "1-2 sentences on the nutritional quality of this meal.",
                "alternatives": ["Healthier option 1", "Healthier option 2"]
            }
            
            Provide the most accurate scientific estimates possible based on standard database averages.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `ESTIMATE CALORIES FOR:\n"${foodDescription}"`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'calorie-estimator'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as CalorieData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Nutrition Lab Error: Failed to analyze meal. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <UtensilsCrossed className="w-7 h-7 text-orange-400" />
                            Macro Analysis
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Describe any meal in plain English (e.g. "A large bowl of pasta with pesto and pine nuts").</p>
                        <input
                            type="text"
                            value={foodDescription}
                            onChange={(e) => setFoodDescription(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEstimate()}
                            placeholder="e.g. 2 scrambled eggs with avocado toast and a black coffee..."
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:outline-none focus:border-orange-500 transition-colors shadow-inner placeholder:text-slate-700"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleEstimate}
                            disabled={isLoading || !foodDescription.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Scale className="w-6 h-6" />}
                            {isLoading ? 'Estimating Macros...' : 'Analyze Meal'}
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
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                    <Flame className="w-20 h-20 text-orange-500/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Parsing Molecular Density</h3>
                                    <p className="animate-pulse font-medium text-orange-300/80">Cross-referencing metabolic datasets and RDA guidelines via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Macro Dashboard Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="text-center space-y-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Total Calories</div>
                                            <div className="text-6xl font-black text-white">{outputData.totalCalories}</div>
                                            <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Estimated kcal</div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3 text-orange-400" /> Macro Split
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                                                    <span className="text-xs font-bold text-slate-400">Protein</span>
                                                    <span className="text-sm font-black text-sky-400">{outputData.macros.protein}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                                                    <span className="text-xs font-bold text-slate-400">Carbs</span>
                                                    <span className="text-sm font-black text-amber-400">{outputData.macros.carbs}</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                                                    <span className="text-xs font-bold text-slate-400">Fats</span>
                                                    <span className="text-sm font-black text-rose-400">{outputData.macros.fats}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>Health Score</span>
                                                <span className="text-emerald-400">{outputData.healthScore}/100</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${outputData.healthScore}%` }}
                                                    className={`h-full ${outputData.healthScore > 70 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Micro View */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                                Metabolic Assessment
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                                                {outputData.foodName}
                                            </h2>
                                            <p className="text-xl text-slate-300 italic leading-relaxed font-serif">
                                                "{outputData.expertInsight}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <PieChart className="w-6 h-6 text-sky-400" />
                                                    Micros & Minerals
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.nutrients.map((n, i) => (
                                                        <div key={i} className="space-y-1.5">
                                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                                <span>{n.label}</span>
                                                                <span className="text-white">{n.amount} ({n.percentage}%)</span>
                                                            </div>
                                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }} animate={{ width: `${n.percentage}%` }}
                                                                    className="h-full bg-sky-500/50"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                                    Optimization Advice
                                                </h3>
                                                <div className="space-y-3">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Try these alternatives:</div>
                                                    {outputData.alternatives.map((alt, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-slate-950/50 border border-white/5 p-4 rounded-xl group hover:border-emerald-500/30 transition-colors">
                                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span className="text-sm text-slate-300 font-medium">{alt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Calorie Estimator (AI Tool)"
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
