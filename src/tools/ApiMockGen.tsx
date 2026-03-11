import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Server, Sparkles, Database, FileJson, Copy, Check, AlertCircle, ListTree } from 'lucide-react';
import { motion } from 'motion/react';

interface MockResponse {
    endpoint: string;
    method: string;
    description: string;
    mockData: any;
    openApiSchema: any;
}

export default function ApiMockGen() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [promptText, setPromptText] = useState('');
    const [arrayCount, setArrayCount] = useState(5);

    const [outputData, setOutputData] = useState<MockResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedData, setCopiedData] = useState(false);
    const [copiedSchema, setCopiedSchema] = useState(false);

    const handleGenerate = async () => {
        if (!promptText.trim()) {
            setError('Please describe the entity or data structure you need.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopiedData(false);
        setCopiedSchema(false);

        try {
            const systemPrompt = `You are an expert Backend Systems Architect constructing robust API mocks.
            
            The user needs realistic mock JSON data and an OpenAPI schema for an API endpoint based on their description.
            Generate exactly ${arrayCount} realistic record(s) in the mock array if a list is requested.
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "endpoint": "Suggested RESTful endpoint path (e.g. /api/v1/users)",
                "method": "Suggested HTTP Method (e.g. GET, POST)",
                "description": "Short description of what this mock endpoint returns",
                "mockData": [ ... array of realistic JSON objects ... ],
                "openApiSchema": { ... valid OpenAPI 3.0 configuration object representing this schema ... }
            }
            
            Ensure the "mockData" and "openApiSchema" fields are actual nested JSON objects/arrays, NOT strings.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `API REQUEST REQUIREMENTS:\n"${promptText}"`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as MockResponse;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate API Mock. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (type: 'data' | 'schema') => {
        if (outputData) {
            if (type === 'data') {
                navigator.clipboard.writeText(JSON.stringify(outputData.mockData, null, 2));
                setCopiedData(true);
                setTimeout(() => setCopiedData(false), 2000);
            } else {
                navigator.clipboard.writeText(JSON.stringify(outputData.openApiSchema, null, 2));
                setCopiedSchema(true);
                setTimeout(() => setCopiedSchema(false), 2000);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Server className="w-5 h-5 text-indigo-400" />
                            API Entity Description
                        </label>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="e.g. 'A user profile with id, full name, avatar URL, nested array of address objects, and a generated UUID...'"
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="w-full sm:w-1/3">
                            <label className="text-slate-300 font-medium text-sm mb-2 block">Number of Records (Array Limit)</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={arrayCount}
                                onChange={(e) => setArrayCount(Number(e.target.value))}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 text-sm"
                            />
                        </div>

                        <div className="w-full sm:w-auto flex justify-end pt-6 sm:pt-0">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !promptText.trim()}
                                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Architecting...' : 'Generate API Mock'}
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

            {(outputData || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <Database className="w-6 h-6 text-indigo-400" />
                            Generated Backend Architecture
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Server className="w-16 h-16 animate-pulse text-indigo-500/50" />
                            <p className="animate-pulse font-medium text-lg">Synthesizing relational schemas via {selectedLlm}...</p>
                        </div>
                    ) : outputData ? (
                        <div className="space-y-8">

                            {/* Endpoint Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="bg-slate-950/80 border border-indigo-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 relative shadow-inner"
                            >
                                <div className="px-5 py-2 rounded-lg bg-indigo-500 text-white font-black text-xl tracking-widest shadow-lg shadow-indigo-500/30">
                                    {outputData.method}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="font-mono text-xl sm:text-2xl text-slate-200 tracking-wide font-bold">
                                        {outputData.endpoint}
                                    </div>
                                    <div className="text-slate-400 text-sm mt-1">{outputData.description}</div>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* JSON Mock Data */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                            <FileJson className="w-4 h-4" /> Realistic Mock Data payload
                                        </h4>
                                        <button
                                            onClick={() => handleCopy('data')}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 border border-white/5"
                                        >
                                            {copiedData ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Copy JSON</span>
                                        </button>
                                    </div>
                                    <div className="bg-slate-950/80 border border-white/5 p-4 rounded-xl shadow-inner overflow-x-auto">
                                        <pre className="text-emerald-300 font-mono text-xs sm:text-sm">
                                            {JSON.stringify(outputData.mockData, null, 2)}
                                        </pre>
                                    </div>
                                </motion.div>

                                {/* OpenAPI Schema */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">
                                            <ListTree className="w-4 h-4" /> OpenAPI 3.0 Schema
                                        </h4>
                                        <button
                                            onClick={() => handleCopy('schema')}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 border border-white/5"
                                        >
                                            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Copy Schema</span>
                                        </button>
                                    </div>
                                    <div className="bg-slate-950/80 border border-white/5 p-4 rounded-xl shadow-inner overflow-x-auto">
                                        <pre className="text-sky-300 font-mono text-xs sm:text-sm">
                                            {JSON.stringify(outputData.openApiSchema, null, 2)}
                                        </pre>
                                    </div>
                                </motion.div>
                            </div>


                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="API Mock Generator (AI Tool)"
                                    result="won"
                                    penalty={null}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
