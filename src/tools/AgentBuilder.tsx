import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, Bot, Wrench, FileCode2, Cpu, Check, AlertCircle, Copy, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ToolDef {
    name: string;
    description: string;
    parameters: string;
}

interface AgentData {
    agentName: string;
    primaryPersona: string;
    systemPrompt: string;
    recommendedTools: ToolDef[];
    executionFlow: string;
}

export default function AgentBuilder() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [taskDescription, setTaskDescription] = useState('');
    const [agentTone, setAgentTone] = useState('Professional & Strict');

    const [outputData, setOutputData] = useState<AgentData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleBuild = async () => {
        if (!taskDescription.trim()) {
            setError('Please describe the specific engineering task your agent needs to perform.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a Principal AI Architect specializing in autonomous agent design.
            
            The user wants to build a custom AI agent to perform a specific engineering task.
            Task Description: "${taskDescription}"
            Requested Tone/Personality: "${agentTone}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "agentName": "A catchy, relevant name for this agent (e.g. SecuriBot, CodeRefactor Prime)",
                "primaryPersona": "A 1-sentence description of the agent's core identity and role.",
                "systemPrompt": "A highly detailed, robust System Prompt (2-3 paragraphs) that can be directly pasted into an LLM configuration to make it adopt this persona and ruleset.",
                "recommendedTools": [
                    {
                        "name": "tool_name_snake_case",
                        "description": "What this tool does",
                        "parameters": "Brief JSON schema or list of arguments needed"
                    }
                ],
                "executionFlow": "A markdown string describing the step-by-step logic loop the agent should take when triggered."
            }
            
            Provide exactly 2 to 4 recommended tools.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `DESIGN AGENT FOR:\n"${taskDescription}"`,
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

            const parsedData = JSON.parse(cleanedResponse) as AgentData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to build Agent Architecture. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPrompt = () => {
        if (outputData) {
            navigator.clipboard.writeText(outputData.systemPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-cyan-400" />
                            Agent Purpose & Task
                        </label>
                        <textarea
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="e.g. 'An autonomous bot that integrates with GitHub, automatically reviews all React PRs, checks for dependency vulnerabilities, and leaves comments line-by-line...'"
                            className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none placeholder:text-slate-600"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="w-full sm:w-1/3">
                            <label className="text-slate-300 font-medium text-sm mb-2 block">Agent Tone & Constraints</label>
                            <input
                                type="text"
                                value={agentTone}
                                onChange={(e) => setAgentTone(e.target.value)}
                                placeholder="e.g. Professional & Strict, Helpful Mentor"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 text-sm"
                            />
                        </div>

                        <div className="w-full sm:w-auto flex justify-end pt-6 sm:pt-0">
                            <button
                                onClick={handleBuild}
                                disabled={isLoading || !taskDescription.trim()}
                                className="w-full sm:w-auto px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isLoading ? 'Compiling Agent...' : 'Generate Agent Specs'}
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
                            <Cpu className="w-6 h-6 text-cyan-400" />
                            Compiled Agent Architecture
                        </label>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400 py-16 justify-center">
                            <Bot className="w-16 h-16 animate-pulse text-cyan-500/50" />
                            <p className="animate-pulse font-medium text-lg">Designing logic circuits and functional personas via {selectedLlm}...</p>
                        </div>
                    ) : outputData ? (
                        <div className="space-y-8">

                            {/* Hero Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="text-center space-y-3"
                            >
                                <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-black uppercase tracking-widest border border-cyan-500/20">
                                    Autonomous Agent Built
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-black text-white">{outputData.agentName}</h3>
                                <p className="text-slate-400 font-medium max-w-2xl mx-auto">{outputData.primaryPersona}</p>
                            </motion.div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* System Prompt Box */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                            <FileCode2 className="w-4 h-4" /> Core System Prompt
                                        </h4>
                                        <button
                                            onClick={handleCopyPrompt}
                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-2 border border-white/5"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Copy Prompt</span>
                                        </button>
                                    </div>
                                    <div className="bg-slate-950/80 border border-emerald-500/20 p-5 rounded-2xl shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
                                        <p className="text-emerald-100/90 whitespace-pre-wrap leading-relaxed text-sm">
                                            {outputData.systemPrompt}
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Tools Required */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4 flex flex-col h-full">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-sky-400 flex items-center gap-2">
                                        <Wrench className="w-4 h-4" /> Required Functional Tools
                                    </h4>
                                    <div className="bg-slate-950/80 border border-sky-500/20 p-5 rounded-2xl shadow-inner flex-1 flex flex-col gap-4 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 rounded-l-2xl" />
                                        {outputData.recommendedTools.map((tool, index) => (
                                            <div key={index} className="bg-slate-900/80 p-3 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sky-400 font-mono text-xs font-bold">{tool.name}()</span>
                                                </div>
                                                <p className="text-slate-400 text-xs mb-2 leading-relaxed">{tool.description}</p>
                                                <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-500 font-mono break-words">
                                                    Params: {tool.parameters}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Execution Flow Markdown Area */}
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-6 border-t border-white/10">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Execution Logic Flow
                                </h4>
                                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert prose-cyan max-w-none">
                                    {outputData.executionFlow}
                                </div>
                            </motion.div>


                            <div className="mt-8 pt-6 border-t border-white/10">
                                <ShareButtonsComponent
                                    gameTitle="AI Agent Builder (AI Tool)"
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
