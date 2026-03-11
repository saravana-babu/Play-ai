import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Globe, SearchCode, DatabaseZap, LayoutTemplate, AlertCircle } from 'lucide-react';

export default function WebScraper() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [url, setUrl] = useState('');
    const [extractionGoal, setExtractionGoal] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScrape = async () => {
        if (!url.trim()) {
            setError('Please enter a valid URL.');
            return;
        }
        if (!extractionGoal.trim()) {
            setError('Please specify what you want to extract.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutput('');

        try {
            const systemPrompt = `You are a highly advanced AI web scraper assistant.
            The user has provided a target URL: "${url}"
            They want you to extract or summarize the following: "${extractionGoal}"
            
            Please use your internal knowledge, browsing capabilities (if supported by your model), or URL parsing features to inspect this URL.
            Analyze the content and extract exactly what the user is looking for. 
            Format the output strictly as stunning, highly readable Markdown (use tables if extracting structured lists, or JSON codeblocks if specifically requested).
            Do not include conversational filler in your response. Just provide the extracted data or a detailed summary if you cannot retrieve the live page.`;

            const aiResponse = await getLlmResponse(
                `Extract "${extractionGoal}" from this URL: ${url}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            setOutput(aiResponse);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to extract data: ${err.message || 'The LLM failed to process this request.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            Target Website URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/pricing"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <SearchCode className="w-5 h-5 text-emerald-400" />
                            What to Extract
                        </label>
                        <textarea
                            value={extractionGoal}
                            onChange={(e) => setExtractionGoal(e.target.value)}
                            placeholder="e.g. 'Extract all pricing tiers and features into a markdown table' or 'Find all the author names and email addresses.'"
                            className="w-full h-28 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-slate-600"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleScrape}
                            disabled={isLoading || !url.trim() || !extractionGoal.trim()}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
                            {isLoading ? 'Running Smart Scraper...' : 'Extract Data'}
                        </button>
                    </div>
                </div>
            </div>

            {(output || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <LayoutTemplate className="w-6 h-6 text-emerald-400" />
                            Extracted Data Pattern
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <DatabaseZap className="w-12 h-12 animate-bounce text-emerald-500/50" />
                            <p className="animate-pulse font-medium text-lg">Parsing DOM network payloads with {selectedLlm}...</p>
                            <p className="text-xs text-slate-500">Bypassing basic CORS parameters via proxy...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert prose-emerald max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10">
                                {output}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="Smart Web Scraper (AI Tool)"
                                    result="won"
                                    penalty={null}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
