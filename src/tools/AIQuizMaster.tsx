import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Brain, GraduationCap, LayoutPanelLeft, Check, Copy, AlertCircle, ChevronRight, HelpCircle, Trophy, Target, Info, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface QuizData {
    quizTitle: string;
    difficulty: string;
    learningObjectives: string[];
    questions: QuizQuestion[];
    proTip: string;
}

export default function AIQuizMaster() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('Intermediate');

    const [outputData, setOutputData] = useState<QuizData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please provide a topic or material to generate a quiz from.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Senior Instructional Designer and Educational Assessment Expert.
            
            Topic/Source: "${topic}"
            Difficulty: "${difficulty}"
            Desired Question Count: ${numQuestions}
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "quizTitle": "Engaging Quiz Title",
                "difficulty": "Summary of cognitive level",
                "learningObjectives": ["What the user will learn 1", "2"],
                "questions": [
                    { 
                        "question": "Question text here?", 
                        "options": ["Option A", "Option B", "Option C", "Option D"], 
                        "correctIndex": 0, 
                        "explanation": "Why this is correct and others are wrong." 
                    }
                ],
                "proTip": "A concluding strategic study tip."
            }
            
            Ensure high-quality, non-obvious questions. Avoid generic distractor options.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE QUIZ:\nTopic: ${topic}\nCount: ${numQuestions}\nDiff: ${difficulty}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'quiz-generator'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as QuizData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Cognitive Failure: Failed to generate quiz. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyQuiz = () => {
        if (outputData) {
            const content = `QUIZ: ${outputData.quizTitle}\n\nQUESTIONS:\n${outputData.questions.map((q, i) => `${i + 1}. ${q.question}\nOptions: ${q.options.join(', ')}`).join('\n\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-black text-sm mb-2 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                                    Quiz Topic or Paste Content
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Quantum Computing for Beginners, or paste an article to test yourself on..."
                                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Number of Items</label>
                                    <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option value={3}>3 Questions</option>
                                        <option value={5}>5 Questions</option>
                                        <option value={10}>10 Questions</option>
                                        <option value={20}>20 Questions</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest block">Complexity Level</label>
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white text-xs rounded-xl px-4 py-3 outline-none">
                                        <option>Beginner (Rote)</option>
                                        <option>Intermediate (Apply)</option>
                                        <option>Advanced (Analyze)</option>
                                        <option>Expert (Evaluate)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                                    "Retention is 40% higher when you test yourself after learning. Quiz Master extracts the core concepts automatically."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !topic.trim()}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
                            {isLoading ? 'Indexing Synapses...' : 'Initialize Quiz Engine'}
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
                                <motion.div animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <RefreshCw className="w-20 h-20 text-indigo-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Synthesizing Pedagogical Vectors</h3>
                                    <p className="animate-pulse font-medium text-indigo-300/80">Applying Bloom's Taxonomy models via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Insights Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target className="w-3 h-3 text-indigo-400" /> Learning Goals
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.learningObjectives.map((obj, i) => (
                                                    <div key={i} className="flex gap-2 items-start text-xs text-slate-400 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 italic">
                                                        <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                        {obj}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-400" /> Strategic Tip</div>
                                            <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                                                "{outputData.proTip}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={handleCopyQuiz}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                            {copied ? 'Quiz Copied' : 'Export and Print'}
                                        </button>
                                    </div>
                                </div>

                                {/* Questions View */}
                                <div className="flex-1 p-6 sm:p-10 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-4xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                    Assessment Manifest
                                                </div>
                                                <Trophy className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                                                {outputData.quizTitle}
                                            </h2>
                                        </div>

                                        <div className="space-y-12">
                                            {outputData.questions.map((q, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                                                    key={idx}
                                                    className="group bg-slate-950/50 border border-white/5 rounded-3xl p-8 hover:bg-slate-900 transition-all space-y-6"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">Question {idx + 1}</div>
                                                        <h4 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-200 transition-colors">
                                                            {q.question}
                                                        </h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                        {q.options.map((option, oIdx) => (
                                                            <div
                                                                key={oIdx}
                                                                className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-3 transition-all ${oIdx === q.correctIndex
                                                                        ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                                                                        : 'bg-slate-900/50 border-white/5 text-slate-400'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border uppercase font-black text-[10px] ${oIdx === q.correctIndex ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-700 bg-slate-950 text-slate-600'
                                                                    }`}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </div>
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                                                            <Info className="w-3 h-3" /> Expert Feedback
                                                        </div>
                                                        <p className="text-xs text-slate-400 italic leading-relaxed">
                                                            {q.explanation}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Quiz Result (AI Tool)"
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
