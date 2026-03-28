import React from 'react';
import { motion } from 'motion/react';
import { Download, Monitor, ShieldCheck, Zap, ExternalLink, ChevronRight, Layout, Code, Terminal, Info } from 'lucide-react';

export default function Docs() {
    const steps = [
        {
            title: "Download Library Assets",
            desc: "Download the core extension package from our repository to your local drive.",
            link: "https://github.com/saravana-babu/Play-ai/archive/refs/heads/main.zip",
            icon: <Download className="w-6 h-6 text-indigo-400" />
        },
        {
            title: "Access Extensions Manager",
            desc: "Enter 'chrome://extensions/' in your browser or click on Manage Extensions.",
            icon: <Terminal className="w-6 h-6 text-emerald-400" />
        },
        {
            title: "Activate Developer Mode",
            desc: "Toggle the Developer Mode switch in the top-right corner to access manual installation.",
            icon: <SettingsIcon className="w-6 h-6 text-amber-400" />
        },
        {
            title: "Load Extension Source",
            desc: "Click 'Load unpacked' and select the 'chrome-extension/public' folder from the unzipped files.",
            icon: <Code className="w-6 h-6 text-rose-400" />
        }
    ];

    return (
        <div className="space-y-16 py-8">
            {/* Docs Header */}
            <header className="text-center space-y-6 max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-[0.2em]"
                >
                    <Info className="w-4 h-4" /> Technical Documentation
                </motion.div>
                <h1 className="text-5xl sm:text-6xl font-black text-white italic uppercase tracking-tighter italic">
                    Installation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-sky-400">Blueprint</span>
                </h1>
                <p className="text-slate-400 text-lg font-medium italic">
                    Follow the precise steps below to integrate the Play AI Web Assistant with your Chrome browsing environment.
                </p>
            </header>

            {/* Core Blueprint (Steps) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group p-8 rounded-[2rem] bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/[0.02] -mr-4 -mt-4 transition-colors group-hover:text-indigo-500/5">
                            0{index + 1}
                        </div>
                        <div className="flex items-start gap-6 relative z-10">
                            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 shadow-2xl">
                                {step.icon}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">{step.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed italic pr-8">{step.desc}</p>
                                {step.link && (
                                    <a 
                                        href={step.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-4 text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                    >
                                        Download Now <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Post-Installation Setup */}
            <section className="p-12 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-white italic uppercase">Post-Installation Setup</h2>
                        <ul className="space-y-4">
                            {[
                                { icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, text: "Setup your API Keys in the Extension Settings." },
                                { icon: <Zap className="w-5 h-5 text-amber-400" />, text: "Pin the extension to your toolbar for quick access." },
                                { icon: <Layout className="w-5 h-5 text-sky-400" />, text: "Use Alt + Shift + Space to toggle the AI panel." }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic">
                                    <div className="mt-1">{item.icon}</div>
                                    <p className="text-slate-400 text-sm font-medium">{item.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative aspect-video rounded-[1.5rem] bg-slate-900 border border-white/10 overflow-hidden shadow-2xl group">
                        <img 
                            src="/extension-insights.png" 
                            alt="Extension Setup" 
                            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">
                                Assistant UI Overview
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer FAQ */}
            <footer className="max-w-3xl mx-auto text-center space-y-4 opacity-40 italic">
                <p className="text-xs text-slate-500 font-medium">
                    Facing issues? Check your browser version or join our GitHub community for support. 
                    The Play AI Web Assistant requires Chrome v110+ or any Chromium-based browser.
                </p>
                <div className="flex justify-center gap-8">
                    <a href="https://github.com/saravana-babu/Play-ai" className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300">GitHub Repo</a>
                    <a href="/" className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300">Back Home</a>
                </div>
            </footer>
        </div>
    );
}

// Minimal missing component for the export
function SettingsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}
