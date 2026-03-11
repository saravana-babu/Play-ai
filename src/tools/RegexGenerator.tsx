import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Code2, Sparkles, Wand2, TerminalSquare, Regex, Copy, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface RegexData {
    regex: string;
    flags: string;
    explanation: string;
    matchExamples: string[];
    failExamples: string[];
}

export default function RegexGenerator() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [promptText, setPromptText] = useState('');
    const [languageContext, setLanguageContext] = useState('JavaScript / General');

    const [outputData, setOutputData] = useState<RegexData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!promptText.trim()) {
            setError('Please describe what you want the Regex to match.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a world-class Regex Master and Principal Engineer.
            
            The user will describe a pattern they need to match using Regular Expressions.
            Target Language/Engine Context: ${languageContext}
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "regex": "The raw regex pattern string (do not include the bounding slashes like /pattern/ unless it is part of the syntax, just the pattern itself. Ensure backslashes are properly escaped for JSON)",
                "flags": "Regex flags like 'g', 'i', 'm', or leave empty string if none needed",
                "explanation": "A detailed 2-paragraph markdown explanation of how exactly the regex engine processes this string.",
                "matchExamples": ["example1@test.com", "example2@test.com"],
                "failExamples": ["bad_example.com", "wrong_format@"]
            }
            
            Provide up to 3 valid match strings and 3 strings that correctly fail the pattern.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json), or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `REGEX REQUEST:\n"${promptText}"`,
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

            const parsedData = JSON.parse(cleanedResponse) as RegexData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to generate Regex. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (outputData) {
            const copyString = outputData.flags ? `/${outputData.regex}/${outputData.flags}` : outputData.regex;
            navigator.clipboard.writeText(copyString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-fuchsia-400" />
                            Describe Your Pattern
                        </label>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="e.g. 'Match all valid email addresses that end in @company.com' or 'Find all dates formatted as DD-MM-YYYY'..."
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-fuchsia-500 transition-colors resize-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="w-full sm:w-1/3">
                            <label className="text-slate-300 font-medium text-sm mb-2 block">Target Engine / Language</label>
                            <input
                                type="text"
                                value={languageContext}
                                onChange={(e) => setLanguageContext(e.target.value)}
                                placeholder="e.g. JavaScript, Python, PCRE"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-slate-600 text-sm"
                            />
                        </div>

                        <div className="w-full sm:w-auto flex justify-end pt-6 sm:pt-0">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !promptText.trim()}
                                className="w-full sm:w-auto px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-fuchsia-500/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Generating Spell...' : 'Generate RegEx'}
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
                            <TerminalSquare className="w-6 h-6 text-fuchsia-400" />
                            Generated Expression Pattern
                        </label>
                        {outputData && (
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 border border-white/5 shadow-sm"
                            >
                                {copied ? <Check className="w-4 h-4 text-fuchsia-400" /> : <Copy className="w-4 h-4" />}
                                <span className="text-xs font-bold uppercase tracking-wider">{copied ? 'Copied to Clipboard' : 'Copy RegEx'}</span>
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Regex className="w-16 h-16 animate-pulse text-fuchsia-500/50" />
                            <p className="animate-pulse font-medium text-lg">Weaving complex Regular Expression syntax via {selectedLlm}...</p>
                        </div>
                    ) : outputData ? (
                        <div className="space-y-8">

                            {/* The Main Regex Display */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                                className="bg-slate-950/80 border border-fuchsia-500/30 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group shadow-inner"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500" />
                                <div className="font-mono text-xl sm:text-2xl md:text-3xl text-fuchsia-400 tracking-wider break-all text-center">
                                    <span className="text-slate-600 select-none">/</span>
                                    <span className="font-black text-white">{outputData.regex}</span>
                                    <span className="text-slate-600 select-none">/</span>
                                    <span className="text-indigo-400 font-black">{outputData.flags}</span>
                                </div>
                            </motion.div>

                            {/* Testing Scenarios Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Valid Matches
                                    </h4>
                                    <ul className="space-y-2">
                                        {outputData.matchExamples.map((ex, i) => (
                                            <li key={i} className="font-mono text-sm text-emerald-200/80 bg-emerald-500/10 px-3 py-2 rounded-lg truncate border border-emerald-500/10">
                                                {ex}
                                            </li>
                                        ))}
                                        {outputData.matchExamples.length === 0 && <div className="text-slate-500 text-sm italic">No examples generated.</div>}
                                    </ul>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-4 flex items-center gap-2">
                                        <Copy className="w-4 h-4 rotate-45" /> Avoids / Fails
                                    </h4>
                                    <ul className="space-y-2">
                                        {outputData.failExamples.map((ex, i) => (
                                            <li key={i} className="font-mono text-sm text-rose-200/80 bg-rose-500/10 px-3 py-2 rounded-lg truncate border border-rose-500/10">
                                                {ex}
                                            </li>
                                        ))}
                                        {outputData.failExamples.length === 0 && <div className="text-slate-500 text-sm italic">No examples generated.</div>}
                                    </ul>
                                </motion.div>
                            </div>

                            {/* Detailed Explanation */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-6 border-t border-white/10">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    How this Expression Engine works
                                </h4>
                                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert prose-fuchsia max-w-none">
                                    {outputData.explanation}
                                </div>
                            </motion.div>


                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="AI RegEx Generator (AI Tool)"
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
