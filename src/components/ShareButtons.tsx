import React, { useState } from 'react';
import { Twitter, Linkedin, Facebook, Instagram, Copy, Check, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareButtonsProps {
    gameTitle: string;
    result: string;
    penalty?: string | null;
    score?: number | string;
    onPlayAgain?: () => void;
}

export default function ShareButtons({ gameTitle, result, penalty, score, onPlayAgain }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const [isHovered, setIsHovered] = useState<string | null>(null);

    const shareText = `🎮 Play-AI.in | ${gameTitle}\n\n🏆 Result: I just ${result}!\n${score ? `📈 Performance: ${score}\n` : ''}${penalty ? `💀 Penalty: "${penalty}"\n` : ''}\nThink you can beat the AI? Challenge it now at ${window.location.origin}`;

    const shareOnTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareOnLinkedIn = () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareOnFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
    };

    const shareOnInstagram = () => {
        copyToClipboard();
        alert('Instagram sharing: Result and link copied to clipboard! You can now paste this in your story or post.');
    };

    const copyToClipboard = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const platforms = [
        { name: 'X', icon: Twitter, onClick: shareOnTwitter, color: 'hover:bg-black', bg: 'bg-white/5' },
        { name: 'Facebook', icon: Facebook, onClick: shareOnFacebook, color: 'hover:bg-[#1877F2]', bg: 'bg-white/5' },
        { name: 'LinkedIn', icon: Linkedin, onClick: shareOnLinkedIn, color: 'hover:bg-[#0A66C2]', bg: 'bg-white/5' },
        { name: 'Instagram', icon: Instagram, onClick: shareOnInstagram, color: 'hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', bg: 'bg-white/5' },
    ];

    return (
        <div className="flex flex-col items-center w-full mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Action - Play Again */}
            {onPlayAgain && (
                <button
                    onClick={onPlayAgain}
                    className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-lg transition-all duration-300 hover:bg-indigo-50 hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_rgba(99,102,241,0.2)]"
                >
                    <RefreshCw className="w-6 h-6 transition-transform duration-500 group-hover:rotate-180" />
                    <span>Play Again</span>
                    <div className="absolute inset-x-0 -bottom-1 h-1 bg-slate-200 rounded-full scale-x-75 group-hover:scale-x-90 transition-transform" />
                </button>
            )}

            {/* Share Section */}
            <div className="flex flex-col items-center w-full max-w-sm">
                <div className="flex items-center gap-3 mb-6 w-full">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-slate-800" />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">Share Victory</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-slate-800 to-slate-800" />
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3">
                    {platforms.map((platform) => (
                        <div key={platform.name} className="relative">
                            <button
                                onClick={platform.onClick}
                                onMouseEnter={() => setIsHovered(platform.name)}
                                onMouseLeave={() => setIsHovered(null)}
                                className={`p-4 ${platform.bg} ${platform.color} group-hover:text-white rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-1 active:scale-90 text-slate-400`}
                                aria-label={`Share on ${platform.name}`}
                            >
                                <platform.icon className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {isHovered === platform.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg border border-white/10 shadow-2xl z-50 whitespace-nowrap"
                                    >
                                        Share on {platform.name}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Copy Button */}
                    <button
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-5 py-4 rounded-2xl border transition-all duration-300 active:scale-95 ${copied
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/10'}`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>

                {/* Preview Message */}
                <div className="mt-8 w-full group">
                    <div className="relative p-5 bg-slate-900/50 border border-white/5 rounded-3xl backdrop-blur-md transition-colors group-hover:border-white/10">
                        <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                <span>Preview Message</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Auto-generated</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-line text-left">
                            {shareText}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
