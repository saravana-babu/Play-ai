import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLlmResponse } from '../lib/ai';
import { useParams } from 'react-router-dom';
import ShareButtonsComponent from '../components/ShareButtons';
import { Loader2, Sparkles, ClipboardList, Users, Calendar, Clock, Target, CheckCircle2, AlertCircle, Copy, Check, MessageSquare, History, UserCheck, StickyNote, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Participant {
    name: string;
    role: string;
}

interface ActionItem {
    task: string;
    assignee: string;
    priority: 'High' | 'Medium' | 'Low';
}

interface MeetingData {
    meetingTitle: string;
    summary: string;
    participants: Participant[];
    keyDecisions: string[];
    actionItems: ActionItem[];
    nextSteps: string[];
    tone: string;
}

export default function MeetingNotesExtractor() {
    const { id } = useParams<{ id: string }>();
    const { apiKeys, selectedLlm } = useStore();

    const [transcript, setTranscript] = useState('');
    const [meetingType, setMeetingType] = useState('Standard Sync');

    const [outputData, setOutputData] = useState<MeetingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleExtract = async () => {
        if (!transcript.trim() || transcript.length < 100) {
            setError('Please provide a meaningful meeting transcript (at least 100 characters).');
            return;
        }

        setIsLoading(true);
        setError(null);
        setOutputData(null);
        setCopied(false);

        try {
            const systemPrompt = `You are a professional Executive Meeting Scribe and Project Manager.
            
            The user is providing a meeting transcript.
            Meeting Context: "${meetingType}"
            
            IMPORTANT: You MUST respond ONLY with a strict, valid JSON object following this exact schema:
            {
                "meetingTitle": "A concise, professional title for the meeting",
                "summary": "A high-level executive summary of the discussion.",
                "participants": [
                    { "name": "Name", "role": "Interpreted role based on context" }
                ],
                "keyDecisions": ["Decision 1", "Decision 2"],
                "actionItems": [
                    { "task": "The specific task", "assignee": "Who is responsible", "priority": "High/Medium/Low" }
                ],
                "nextSteps": ["Step 1", "Step 2"],
                "tone": "Brief description of the meeting atmosphere (e.g. Collaborative, Tense, Productive)"
            }
            
            If names aren't explicitly mentioned, use descriptors like "Speaker A", "Project Lead", etc.
            Do not include any conversational filler, markdown formatting blocks (like \`\`\`json) wrapping the output, or anything outside of the pure JSON object. Return raw perfectly valid parseable JSON.`;

            const aiResponse = await getLlmResponse(
                `EXTRACT NOTES FROM TRANSCRIPT:\n\n${transcript.slice(0, 10000)}`,
                apiKeys,
                selectedLlm,
                systemPrompt,
                id || 'meeting-notes-extractor'
            );

            let cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json/i, '');
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```/g, '');
            }
            cleanedResponse = cleanedResponse.trim();

            const parsedData = JSON.parse(cleanedResponse) as MeetingData;
            setOutputData(parsedData);

        } catch (err: any) {
            console.error(err);
            setError(`Failed to extract notes. The AI may not have returned valid JSON. Please try again. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyNotes = () => {
        if (outputData) {
            const content = `MEETING: ${outputData.meetingTitle}\n\nSUMMARY:\n${outputData.summary}\n\nACTION ITEMS:\n${outputData.actionItems.map(a => `- [${a.assignee}] ${a.task} (${a.priority})`).join('\n')}`;
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="text-white font-black text-2xl mb-2 flex items-center gap-3">
                            <MessageSquare className="w-7 h-7 text-sky-400" />
                            Meeting Transcript
                        </label>
                        <p className="text-slate-400 text-sm mb-4">Paste your raw meeting transcript or discussion logs below.</p>
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="e.g. John: I think we should launch Tuesday. Sarah: I agree, but we need the final assets first..."
                            className="w-full h-48 bg-slate-950/80 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none placeholder:text-slate-700 shadow-inner"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="w-full sm:w-1/2 space-y-2">
                            <label className="text-slate-300 font-bold text-xs uppercase tracking-widest block">Meeting Category</label>
                            <div className="flex gap-2 flex-wrap">
                                {['Standard Sync', 'Brainstorming', 'Client Call', 'Post-Mortem', 'Sprint Planning'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setMeetingType(t)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${meetingType === t
                                            ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                            : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex justify-end">
                            <button
                                onClick={handleExtract}
                                disabled={isLoading || transcript.length < 100}
                                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardList className="w-6 h-6" />}
                                {isLoading ? 'Processing...' : 'Extract Minutes'}
                            </button>
                        </div>
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
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px]"
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 text-slate-400 py-32 justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                    <History className="w-20 h-20 text-sky-400/50" />
                                </motion.div>
                                <div className="space-y-2 text-center">
                                    <h3 className="text-xl font-bold text-white">Triangulating Speakers</h3>
                                    <p className="animate-pulse font-medium text-sky-300/80">Parsing sentiment and identifying direct deliverables via {selectedLlm}...</p>
                                </div>
                            </div>
                        ) : outputData ? (
                            <div className="flex flex-col lg:flex-row h-full">
                                {/* Meeting Metadata Sidebar */}
                                <div className="w-full lg:w-80 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col gap-10 shrink-0">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2">
                                                <Users className="w-3 h-3" /> Participants
                                            </div>
                                            <div className="space-y-3">
                                                {outputData.participants.map((p, i) => (
                                                    <div key={i} className="flex flex-col">
                                                        <span className="text-sm text-white font-bold">{p.name}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{p.role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Meeting Tone</div>
                                            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-sky-400 font-bold text-center">
                                                {outputData.tone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleCopyNotes}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5 shadow-inner"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied' : 'Copy Minutes'}
                                        </button>
                                    </div>
                                </div>

                                {/* Main Results Area */}
                                <div className="flex-1 p-6 sm:p-12 bg-slate-900 overflow-y-auto max-h-[800px]">
                                    <div className="max-w-3xl mx-auto space-y-12">
                                        <div className="space-y-4">
                                            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                                Meeting Overview
                                            </div>
                                            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                                                {outputData.meetingTitle}
                                            </h2>
                                            <p className="text-lg text-slate-300 leading-relaxed font-medium">
                                                {outputData.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <Target className="w-6 h-6 text-rose-400" />
                                                    Key Decisions
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.keyDecisions.map((dec, i) => (
                                                        <div key={i} className="flex gap-3 items-start group">
                                                            <div className="w-5 h-5 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                            <p className="text-sm text-slate-300 leading-relaxed italic">"{dec}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                    <UserCheck className="w-6 h-6 text-emerald-400" />
                                                    Action Items
                                                </h3>
                                                <div className="space-y-4">
                                                    {outputData.actionItems.map((item, i) => (
                                                        <div key={i} className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{item.assignee}</span>
                                                                <span className={`text-[9px] font-bold uppercase ${item.priority === 'High' ? 'text-rose-400' : 'text-slate-500'}`}>{item.priority}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-200 font-medium leading-relaxed">{item.task}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/30 rounded-3xl p-8 border border-white/5 space-y-6">
                                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                                <StickyNote className="w-6 h-6 text-sky-400" />
                                                Next Steps Workflow
                                            </h3>
                                            <div className="space-y-3">
                                                {outputData.nextSteps.map((step, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <ChevronRight className="w-4 h-4 text-sky-500" />
                                                        <span className="text-sm text-slate-300">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-white/10">
                                            <ShareButtonsComponent
                                                gameTitle="AI Meeting Notes Extractor (AI Tool)"
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
