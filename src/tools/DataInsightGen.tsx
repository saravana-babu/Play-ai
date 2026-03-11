import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { Loader2, UploadCloud, FileText, Send, Sparkles, TrendingUp, Presentation, Database } from 'lucide-react';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';

export default function DataInsightGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [csvData, setCsvData] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [query, setQuery] = useState('');
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                const rows = text.split('\n').filter(r => r.trim() !== '');
                const preview = rows.slice(0, 10).join('\n') + (rows.length > 10 ? '\n... (truncated for context)' : '');
                setCsvData(`Number of Rows: ${rows.length}\n\nFirst 10 Rows:\n${preview}`);
            }
        };
        reader.onerror = () => {
            setError("Failed to read the file. Please try a valid CSV.");
        };
        reader.readAsText(file);
    };

    const generateInsight = async () => {
        if (!csvData) {
            setError("Please upload a CSV file first.");
            return;
        }
        if (!query) {
            setError("Please tell the AI what you want to extract or analyze.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setInsight('');

        try {
            const prompt = `Dataset Overview:\n${csvData}\n\nUser Query:\n${query}\n\nPlease analyze the provided snapshot of the data and provide comprehensive, actionable insights in markdown format based on the user's query. Format neatly. Do not write filler strings.`;

            const response = await getLlmResponse(
                prompt,
                apiKeys,
                selectedLlm,
                "You are an expert Data Scientist. You excel in reading tabular data and synthesizing deep statistical and business insights.",
                id
            );

            setInsight(response);
        } catch (err) {
            setError("An error occurred while generating insights. Ensure your API keys are valid.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
                <label className="text-white font-bold text-lg mb-4 flex items-center gap-2 block">
                    <Database className="w-5 h-5 text-emerald-400" />
                    1. Upload your CSV Data
                </label>

                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800/50 hover:border-emerald-500/50 transition-colors relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {fileName ? (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <p className="text-emerald-400 font-medium">{fileName}</p>
                            <p className="text-xs text-slate-500 mt-1">Click or drag to replace file</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                <UploadCloud className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-300 font-medium">Click or Drag to Upload CSV</p>
                            <p className="text-xs text-slate-500 mt-1">Up to 5MB supported directly in browser</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <label className="text-white font-bold text-lg mb-2 flex items-center gap-2 block">
                    <Presentation className="w-5 h-5 text-emerald-400" />
                    2. Ask for Insights
                </label>
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'Summarize the highest performing regions and identify what correlates with their success' or 'Find outliers in the pricing data'."
                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={generateInsight}
                        disabled={isLoading || !csvData || !query.trim()}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isLoading ? 'Processing Data...' : 'Generate Insights'}
                    </button>
                </div>
            </div>

            {(insight || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl min-h-[300px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                            Data Insights
                        </label>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                            <p className="animate-pulse font-medium">Crunching the numbers with {selectedLlm}...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                                {insight}
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="Data Insight Gen (AI Tool)"
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
