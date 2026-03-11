import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Utensils, Flame, Clock, Thermometer, ShoppingCart, ListChecks, Check, Copy, AlertCircle, ChevronRight, Scale, Info, Beef, Leaf, Apple, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Ingredient {
    item: string;
    amount: string;
}

interface Step {
    detail: string;
}

interface RecipeData {
    recipeName: string;
    description: string;
    prepTime: string;
    cookTime: string;
    difficulty: 'Easy' | 'Intermediate' | 'Gourmet';
    calories: string;
    ingredients: Ingredient[];
    instructions: Step[];
    chefTips: string[];
    pairingSuggestion: string;
}

export default function RecipeChef() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [ingredients, setIngredients] = useState('');
    const [dietType, setDietType] = useState('Standard');
    const [cuisine, setCuisine] = useState('Any');

    const [outputData, setOutputData] = useState<RecipeData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCook = async () => {
        if (!ingredients.trim()) {
            setError('Please list the ingredients you have available.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a 3-star Michelin Executive Chef and Nutritionist.
            
            Ingredients Available: "${ingredients}"
            Dietary Preference: "${dietType}"
            Desired Cuisine: "${cuisine}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "recipeName": "A creative, gourmet name for the dish",
                "description": "A short, mouth-watering description.",
                "prepTime": "e.g. 15 mins",
                "cookTime": "e.g. 30 mins",
                "difficulty": "Easy/Intermediate/Gourmet",
                "calories": "Estimated per serving",
                "ingredients": [
                    { "item": "Name", "amount": "Exact quantity" }
                ],
                "instructions": [
                    { "detail": "Specific step description" }
                ],
                "chefTips": ["Tip 1", "Tip 2"],
                "pairingSuggestion": "A drink or side dish that pairs well."
            }
            
            Strictly prioritize using the user's provided ingredients.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `CREATE RECIPE FROM:\n${ingredients}\nDiet: ${dietType}\nCuisine: ${cuisine}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'recipe-chef'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as RecipeData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Chef's error: Failed to generate recipe. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyRecipe = () => {
        if (outputData) {
            const content = `RECIPE: ${outputData.recipeName}\n\n${outputData.description}\n\nINGREDIENTS:\n${outputData.ingredients.map(i => `- ${i.amount} ${i.item}`).join('\n')}\n\nINSTRUCTIONS:\n${outputData.instructions.map((s, idx) => `${idx + 1}. ${s.detail}`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <ChefHat className="w-7 h-7 text-orange-400" />
                            What's in your Kitchen?
                        </label>
                        <p className="text-slate-400 text-sm mb-4">List your ingredients—even the unusual ones—and I'll craft a gourmet dish.</p>
                        <textarea
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder="e.g. Salmon, spinach, some heavy cream, half an onion, old white wine..."
                            className="w-full h-32 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-orange-500 transition-colors resize-none placeholder:text-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="flex gap-4 flex-wrap">
                            <div className="space-y-2 min-w-[140px]">
                                <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Dietary</label>
                                <select
                                    value={dietType}
                                    onChange={(e) => setDietType(e.target.value)}
                                    className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                                >
                                    <option>Standard</option>
                                    <option>Vegetarian</option>
                                    <option>Vegan</option>
                                    <option>Keto</option>
                                    <option>Gluten-Free</option>
                                </select>
                            </div>
                            <div className="space-y-2 min-w-[140px]">
                                <label className="text-slate-300 font-bold text-[10px] uppercase tracking-widest block">Style</label>
                                <select
                                    value={cuisine}
                                    onChange={(e) => setCuisine(e.target.value)}
                                    className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500"
                                >
                                    <option>Any</option>
                                    <option>Italian</option>
                                    <option>Japanese</option>
                                    <option>French</option>
                                    <option>Mexican</option>
                                    <option>Indian</option>
                                </select>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end">
                            <button
                                onClick={handleCook}
                                disabled={isLoading || !ingredients.trim()}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Flame className="w-6 h-6" />}
                                {isLoading ? 'Simmering...' : 'Craft Recipe'}
                            </button>
                        </div>
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
                                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Utensils className="w-20 h-20 text-orange-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Curating Flavors</h3>
                                    <p className="animate-pulse font-medium text-orange-300/80">Balancing acidity and aromatics via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Pantry Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <ShoppingCart className="w-3 h-3" /> Ingredients
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.ingredients.map((ing, i) => (
                                                    <div key={i} className="flex justify-between items-center gap-4 text-xs">
                                                        <span className="text-slate-200 font-medium">{ing.item}</span>
                                                        <span className="text-orange-400 font-bold whitespace-nowrap">{ing.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                                                <div className="text-[9px] uppercase font-black text-slate-500">Prep</div>
                                                <div className="text-xs text-white font-bold">{outputData.prepTime}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                                                <div className="text-[9px] uppercase font-black text-slate-500">Cook</div>
                                                <div className="text-xs text-white font-bold">{outputData.cookTime}</div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center">
                                            <div className="text-[9px] uppercase font-black text-orange-400 mb-1">Calories Profile</div>
                                            <div className="text-lg text-white font-black">{outputData.calories}</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyRecipe}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Recipe Copied' : 'Copy Recipe'}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Recipe Area */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                                    Executive Chef Output
                                                </div>
                                                <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                                    {outputData.difficulty}
                                                </div>
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tight">
                                                {outputData.recipeName}
                                            </h2>
                                            <p className="text-xl text-slate-300 leading-relaxed font-serif italic">
                                                "{outputData.description}"
                                            </p>
                                        </div>

                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <ListChecks className="w-6 h-6 text-orange-400" />
                                                Chef's Instructions
                                            </h3>
                                            <div className="space-y-6">
                                                {outputData.instructions.map((step, idx) => (
                                                    <div key={idx} className="flex gap-6 items-start group">
                                                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center shrink-0 font-black text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-lg">
                                                            {idx + 1}
                                                        </div>
                                                        <p className="text-lg text-slate-300 leading-relaxed pt-1.5 underline-offset-8 decoration-orange-500/20 hover:decoration-orange-500 transition-all">
                                                            {step.detail}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl space-y-4">
                                                <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4" /> Pro Tips
                                                </h4>
                                                <ul className="space-y-2">
                                                    {outputData.chefTips.map((tip, i) => (
                                                        <li key={i} className="text-sm text-slate-400 flex gap-2">
                                                            <span className="text-orange-500 opacity-50">•</span> {tip}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-6 rounded-3xl space-y-4">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    <Scale className="w-4 h-4" /> Sommelier Notes
                                                </h4>
                                                <p className="text-sm text-orange-100/80 font-medium leading-relaxed italic">
                                                    {outputData.pairingSuggestion}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Gourmet Chef (AI Tool)"
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

// Fixed missing import
function Lightbulb(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.1.7.9 1.2 1.7 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
        </svg>
    )
}
