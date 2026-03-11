import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { Loader2, Send, Copy, Check } from 'lucide-react';
import { TOOLS } from '../lib/tools';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';

export default function GenericTool() {
    const { id } = useParams<{ id: string }>();
    const toolMeta = TOOLS.find(t => t.id === id);
    const { apiKeys, selectedLlm } = useStore();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!input.trim() || isLoading) return;
        setIsLoading(true);
        setOutput('');

        try {
            const systemPrompt = `You are a specialized AI tool called "${toolMeta?.title}". Category: ${toolMeta?.category}. 
      Your description/purpose: ${toolMeta?.description} 
      Provide the best professional, highly informative, and accurate output for the user's input/request. 
      Format everything beautifully in Markdown. Do not break character. Do not provide conversational filler, just the result.`;

            const response = await getLlmResponse(
                input,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            setOutput(response);
        } catch (error) {
            setOutput("Error generating response. Please check your API keys or connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
                <label className="text-white font-bold text-lg mb-2 block">
                    Input your details
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter the details or prompt for the ${toolMeta?.title}...`}
                    className="w-full h-40 bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : 'Generate Result'}
                    </button>
                </div>
            </div>

            {(output || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl relative shadow-xl min-h-[200px]">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <label className="text-white font-bold text-lg">AI Generated Result</label>
                        {output && (
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                <span className="text-xs font-semibold">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        )}
                    </div>
                    {isLoading && !output ? (
                        <div className="flex flex-col items-center gap-3 text-slate-400 py-10 justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <p className="animate-pulse">Processing your request via {selectedLlm}...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                                {output}
                            </div>

                            <div className="border-t border-white/10 pt-6 mt-6">
                                <h4 className="text-sm font-semibold text-slate-400 mb-4 text-center">Share this tool:</h4>
                                <ShareButtonsComponent
                                    gameTitle={`${toolMeta?.title} (AI Tool)`}
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
