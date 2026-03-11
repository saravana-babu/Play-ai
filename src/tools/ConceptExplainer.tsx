import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, HelpCircle, Lightbulb, BookOpen, Brain, Microscope, GraduationCap, Baby, Users, Target, Zap, ChevronRight, BookMarked, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface keyConcept {
    term: string;
    definition: string;
}

interface ExplainerData {
    topicName: string;
    explanation: string;
    analogy: string;
    keyConcepts: keyConcept[];
    difficultyScore: number;
    estimatedReadTime: string;
    relatedTopics: string[];
}

export default function ConceptExplainer() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Explain like I\'m 5 (ELI5)');

    const [outputData, setOutputData] = useState<ExplainerData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExplain = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic you want explained.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);

        try {
            const systemPrompt = `You are a legendary educator known for making the most complex concepts incredibly simple.
            
            Topic: "${topic}"
            Target Complexity Level: "${level}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "topicName": "Formal name of the concept",
                "explanation": "The main explanation text. Match the requested complexity level precisely.",
                "analogy": "A brilliant real-world analogy to make it click.",
                "keyConcepts": [
                    { "term": "Technical Term", "definition": "Simple definition" }
                ],
                "difficultyScore": number (1 to 10),
                "estimatedReadTime": "e.g. 3 min read",
                "relatedTopics": ["Topic A", "Topic B", "Topic C"]
            }
            
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `EXPLAIN CONCEPT:\n"${topic}" at level "${level}"`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'concept-explainer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as ExplainerData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to explain concept. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getLevelIcon = () => {
        if (level.includes('5')) return <Baby className="w-5 h-5 text-pink-400" />;
        if (level.includes('Teen')) return <Users className="w-5 h-5 text-sky-400" />;
        if (level.includes('Undergrad')) return <GraduationCap className="w-5 h-5 text-indigo-400" />;
        return <Microscope className="w-5 h-5 text-violet-400" />;
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-violet-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <Brain className="w-7 h-7 text-violet-400" />
                            What should we simplify?
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Enter any complex topic—from Quantum Physics to how a Credit Card works.</p>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                            placeholder="e.g. Schrödinger's Cat, Blockchain, Photosynthesis..."
                            className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:outline-none focus:border-violet-500 transition-colors placeholder:text-slate-600 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="w-full sm:w-1/2 space-y-2">
                            <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block flex items-center gap-2">
                                <Target className="w-3 h-3" /> Target Audience Level
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['Explain like I\'m 5 (ELI5)', 'Explain to a Teenager', 'College Undergraduate', 'Expert / Ph.D Level'].map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLevel(l)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${level === l
                                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                                            }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end pt-2 sm:pt-0">
                            <button
                                onClick={handleExplain}
                                disabled={isLoading || !topic.trim()}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                                {isLoading ? 'Simplifying...' : 'Teach Me'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm font-medium">
                            <HelpCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {(outputData || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl min-h-[400px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-24 justify-center">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <Lightbulb className="w-20 h-20 text-amber-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Logic</h3>
                                    <p className="animate-pulse font-medium text-violet-300/80">Refining analogies and stripping jargon via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="space-y-12 max-w-5xl mx-auto">

                                {/* Header / Stats */}
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-white/10 pb-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-500/20">
                                                Knowledge Explainer
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                                {getLevelIcon()}
                                                {level}
                                            </div>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                            {outputData.topicName}
                                        </h2>
                                    </div>

                                    <div className="flex gap-4 shrink-0">
                                        <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-inner">
                                            <Layers className="w-5 h-5 text-fuchsia-400 mb-2" />
                                            <span className="text-2xl font-black text-white">{outputData.difficultyScore}/10</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Complexity</span>
                                        </div>
                                        <div className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-inner">
                                            <BookOpen className="w-5 h-5 text-sky-400 mb-2" />
                                            <span className="text-2xl font-black text-white">{outputData.estimatedReadTime}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Read Time</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                                    {/* Main Explanation Column */}
                                    <div className="lg:col-span-12 space-y-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <BookMarked className="w-6 h-6 text-violet-400" />
                                                    The Breakdown
                                                </h3>
                                                <p className="text-lg text-slate-300 leading-relaxed font-medium">
                                                    {outputData.explanation}
                                                </p>
                                            </div>

                                            <div className="bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/20 rounded-3xl p-8 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Lightbulb className="w-32 h-32 text-amber-400" />
                                                </div>
                                                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                                    The Analogy
                                                </h3>
                                                <p className="text-lg text-amber-100/90 italic leading-relaxed font-serif">
                                                    "{outputData.analogy}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5 w-full" />

                                        {/* Concepts Grid */}
                                        <div className="space-y-8">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <GraduationCap className="w-6 h-6 text-indigo-400" />
                                                Key Concepts to Remember
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {outputData.keyConcepts.map((concept, idx) => (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                                                        key={idx}
                                                        className="bg-slate-950/50 border border-white/5 p-5 rounded-2xl hover:bg-slate-800 transition-colors group"
                                                    >
                                                        <div className="text-sky-400 font-black text-sm uppercase tracking-wider mb-2 group-hover:text-sky-300 transition-colors">
                                                            {concept.term}
                                                        </div>
                                                        <p className="text-sm text-slate-400 leading-relaxed">
                                                            {concept.definition}
                                                        </p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Related Topics Cloud */}
                                        <div className="bg-slate-950/30 rounded-2xl p-6 border border-white/5">
                                            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4">Deepen Your Knowledge</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {outputData.relatedTopics.map((topic, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs font-bold border border-white/5 hover:border-violet-500/30 hover:text-white transition-all cursor-pointer">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <ShareButtonsComponent
                                        gameTitle="ELI5 Knowledge Explainer (AI Tool)"
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
