import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, PenTool, Hash, Layout, Search, CheckCircle2, AlertCircle, Copy, Check, BarChart3, ChevronRight, FileText, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SeoKeyword {
    keyword: string;
    found: boolean;
    density: string;
}

interface BlogData {
    title: string;
    metaDescription: string;
    slug: string;
    seoScore: number;
    keywordsAnalysis: SeoKeyword[];
    content: string;
    readabilityGrade: string;
}

export default function SeoBlogWriter() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('Professional & Informative');
    const [length, setLength] = useState('Medium (~800 words)');

    const [outputData, setOutputData] = useState<BlogData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please provide a topic for your blog post.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a world-class SEO Content Strategist and professional Copywriter.
            
            The user wants to generate a high-ranking blog post.
            Topic: "${topic}"
            Target Keywords: "${keywords}"
            Requested Tone: "${tone}"
            Requested Length: "${length}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "title": "A highly optimized, catchy SEO title (H1)",
                "metaDescription": "A compelling meta description (max 160 chars)",
                "slug": "url-friendly-slug",
                "seoScore": number (1 to 100 based on keyword usage and structure),
                "keywordsAnalysis": [
                    { "keyword": "string", "found": true, "density": "e.g. 1.2%" }
                ],
                "content": "The full blog post in clean Markdown format with H2s, H3s, and bullet points. Ensure it follows the requested length.",
                "readabilityGrade": "e.g. Grade 8, Professional, etc."
            }
            
            Provide an analysis for at least 3-5 keywords from the user's list.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `GENERATE SEO BLOG POST FOR:\nTopic: ${topic}\nKeywords: ${keywords}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'seo-blog-writer'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as BlogData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate SEO Blog. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (outputData) {
            const fullContent = `# ${outputData.title}\n\nMeta Description: ${outputData.metaDescription}\n\n---\n\n${outputData.content}`;
            navigator.clipboard.writeText(fullContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-orange-500/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-orange-400" />
                                    Blog Topic / Main Focus
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. The future of sustainable urban vertical farming in 2026..."
                                    className="w-full h-24 bg-slate-950/80 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none placeholder:text-slate-600 shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-orange-400" />
                                    Target Keywords (Comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="e.g. vertical farming, urban agriculture, sustainability"
                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block">Content Tone</label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option>Professional & Informative</option>
                                        <option>Friendly & Conversational</option>
                                        <option>Urgent & Persuasive</option>
                                        <option>Luxurious & Premium</option>
                                        <option>Technical & Academic</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block">Article Length</label>
                                    <select
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option>Short (~400 words)</option>
                                        <option>Medium (~800 words)</option>
                                        <option>Long (~1500 words)</option>
                                        <option>Epic (~2500+ words)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !topic.trim()}
                                className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20 mt-auto"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <PenTool className="w-6 h-6" />}
                                {isLoading ? 'Strategizing...' : 'Write SEO Article'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
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
                                <Search className="w-16 h-16 animate-bounce text-orange-500/50" />
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Analyzing Search Intent</h3>
                                    <p className="animate-pulse font-medium text-orange-300/80">Mapping semantic keywords and outbound entities via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* SEO Sidebar Dashboard */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-6 flex flex-col gap-8">
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">SEO Optimization Score</div>
                                            <div className={`text-6xl font-black ${outputData.seoScore >= 80 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {outputData.seoScore}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                                                <span>Keywords Density</span>
                                                <BarChart3 className="w-3 h-3" />
                                            </div>
                                            <div className="space-y-2">
                                                {outputData.keywordsAnalysis.map((k, i) => (
                                                    <div key={i} className="bg-slate-900/80 border border-white/5 p-2.5 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            <span className="text-xs text-slate-200 font-medium truncate max-w-[100px]">{k.keyword}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">{k.density}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl space-y-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-orange-400">Readability Grade</div>
                                            <div className="text-sm text-white font-bold">{outputData.readabilityGrade}</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">URL Slug</div>
                                            <div className="text-[11px] text-slate-400 font-mono break-all bg-slate-900 p-2 rounded">/{outputData.slug}</div>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied Post' : 'Copy Full Article'}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Content Preview Area */}
                                <div className="flex-1 p-6 sm:p-10 bg-slate-900 overflow-y-auto max-h-[800px] scrollbar-thin scrollbar-thumb-slate-800">
                                    <div className="max-w-3xl mx-auto space-y-10">
                                        <div className="space-y-6">
                                            <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl relative">
                                                <div className="absolute -top-3 -left-3 p-2 bg-blue-500 rounded-lg shadow-lg">
                                                    <Search className="w-4 h-4 text-white" />
                                                </div>
                                                <h4 className="text-[10px] uppercase font-black tracking-widest text-blue-400 mb-2">SERP Meta Preview</h4>
                                                <h3 className="text-xl text-blue-400 font-medium mb-1 hover:underline cursor-pointer">{outputData.title}</h3>
                                                <p className="text-sm text-slate-400 leading-relaxed font-normal">{outputData.metaDescription}</p>
                                            </div>

                                            <div className="h-px bg-white/10 w-full" />
                                        </div>

                                        <article className="prose prose-invert prose-orange max-w-none prose-h1:text-4xl prose-h1:font-black prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-headings:text-white prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-orange-400">
                                            <h1>{outputData.title}</h1>
                                            <div className="whitespace-pre-wrap">
                                                {outputData.content}
                                            </div>
                                        </article>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI SEO Blog Writer (AI Tool)"
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
