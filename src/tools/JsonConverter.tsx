import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Braces, FileJson, Sparkles, Copy, Check, FileText } from 'lucide-react';

export default function JsonConverter() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [unstructuredText, setUnstructuredText] = useState('');
    const [schemaRequirements, setSchemaRequirements] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleConvert = async () => {
        if (!unstructuredText.trim()) {
            setError('Please provide some unstructured text to convert.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutput('');

        try {
            const systemPrompt = `You are an expert AI data engineer specialized in parsing unstructured text strictly into valid JSON format.
            
            The user will provide messy or unstructured text. Your ONLY job is to extract the relevant data and return it as a pure JSON object or array.
            ${schemaRequirements.trim() ? `\nThe user has requested the following schema or keys for the JSON: "${schemaRequirements}"\nEnsure the JSON strictly adheres to these keys or structure if possible.` : ''}
            
            IMPORTANT RULES:
            - Return ONLY valid JSON wrapped in a markdown block (e.g. \`\`\`json ... \`\`\`).
            - Do NOT include any conversational text, explanations, or filler.
            - Ensure keys are properly formatted in camelCase or snake_case as appropriate, unless the user specified exactly otherwise.
            `;

            const aiResponse = await getLlmResponse(
                `UNSTRUCTURED TEXT TO CONVERT:\n${unstructuredText}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id
            );

            setOutput(aiResponse);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to convert data: ${err.message || 'The AI encountered an error processing your text.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        // extract json from markdown blocks if present
        let textToCopy = output;
        const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
            textToCopy = jsonMatch[1].trim();
        }

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            Unstructured Data / Text
                        </label>
                        <textarea
                            value={unstructuredText}
                            onChange={(e) => setUnstructuredText(e.target.value)}
                            placeholder="Paste your messy emails, notes, transcripts, or mixed data here..."
                            className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-slate-600 font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Braces className="w-5 h-5 text-emerald-400" />
                            Target JSON Schema / Keys (Optional)
                        </label>
                        <input
                            type="text"
                            value={schemaRequirements}
                            onChange={(e) => setSchemaRequirements(e.target.value)}
                            placeholder="e.g. 'Extract name, age, email, and array of skills' or '{ name: string, email: string }'"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 font-mono text-sm"
                        />
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleConvert}
                            disabled={isLoading || !unstructuredText.trim()}
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {isLoading ? 'Converting to JSON...' : 'Convert to JSON'}
                        </button>
                    </div>
                </div>
            </div>

            {(output || isLoading) && (
                <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl min-h-[300px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <label className="text-white font-bold text-xl flex items-center gap-2">
                            <FileJson className="w-6 h-6 text-emerald-400" />
                            JSON Output
                        </label>
                        {output && (
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 border border-white/5 shadow-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                <span className="text-xs font-bold uppercase tracking-wider">{copied ? 'Copied Valid JSON' : 'Copy JSON'}</span>
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Braces className="w-12 h-12 animate-pulse text-emerald-500/50" />
                            <p className="animate-pulse font-medium text-lg">Structuring exact schemas with {selectedLlm}...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner prose-pre:p-4 prose-p:hidden">
                                {output}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="Unstructured to JSON (AI Tool)"
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
