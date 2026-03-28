import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Code, Monitor, Download, ExternalLink, Info, Send, Rocket, Share2, Link as LinkIcon, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';

// Code preview component
const GamePreview = ({ code, isSubscribed }: { code: string, isSubscribed: boolean }) => {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [code]);

  if (!blobUrl) return null;

  return (
    <div className="relative w-full h-[600px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl">
      <iframe
        src={blobUrl}
        className="w-full h-full border-none"
        title="App Preview"
        sandbox="allow-scripts allow-same-origin allow-modals"
      />
      {!isSubscribed && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
          <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
            <p className="text-[10px] font-black text-white uppercase tracking-widest text-center">
              Powered by Play-AI.in - Subscribe for Full Access
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Generator() {
  const { user, isSubscribed, generationsCount, setGenerationsCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = location.state?.prompt || '';
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedAppId, setGeneratedAppId] = useState<number | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  React.useEffect(() => {
    if (initialPrompt && !generatedCode && !isGenerating) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isSubscribed && generationsCount >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/generate-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate app');
      }

      const data = await response.json();
      setGeneratedCode(data.code);
      setGeneratedAppId(data.id);
      setShareSlug(null); // Reset slug for new generation
      setGenerationsCount(generationsCount + 1);
      toast.success('App generated successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!isSubscribed) {
      setShowUpgradeModal(true);
      return;
    }
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `play-ai-app-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!isSubscribed) {
      setShowUpgradeModal(true);
      return;
    }
    if (!generatedAppId) return;

    setIsPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/publish-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ gameId: generatedAppId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish app');
      }

      const data = await response.json();
      setShareSlug(data.slug);
      toast.success('App published successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Editor & Controls */}
        <div className="lg:w-1/2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">AI App Engine</h1>
            <p className="text-slate-400 font-medium">Refining your prompt for professional-grade PWA apps.</p>
            <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              BYOK Enabled: Using your local API keys from Settings.
            </div>
          </div>

          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your game or tool idea..."
              className="w-full h-40 bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 pr-24 focus:outline-none focus:border-indigo-500/50 transition-all text-white font-medium resize-none shadow-2xl"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="absolute bottom-6 right-6 p-5 bg-indigo-600 text-white rounded-[1.5rem] font-black transition-all hover:scale-110 active:scale-90 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-indigo-600/30 group/btn"
            >
              {isGenerating ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              )}
            </button>
          </div>

          {!isSubscribed && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 px-4 py-2 rounded-full w-fit">
              <Info className="w-4 h-4" />
              <span>Generations remaining: {1 - generationsCount}</span>
            </div>
          )}

          {generatedCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest">
                  <Code className="w-4 h-4 text-indigo-400" />
                  Source Code
                </div>
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .HTML
                </button>
              </div>
              <div className="h-[400px] rounded-[2rem] border border-white/10 bg-slate-950/80 overflow-hidden relative group font-mono text-[10px] leading-relaxed">
                <pre className="p-8 text-slate-400 overflow-auto h-full no-scrollbar select-all">
                  {generatedCode}
                </pre>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:w-1/2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Live Deployment Preview
            </div>
            {isGenerating && (
              <span className="text-[10px] font-black text-indigo-400 animate-pulse uppercase tracking-[0.2em]">Deploying to Sandbox...</span>
            )}
          </div>
          
          {generatedCode ? (
            <div className="space-y-6">
              <GamePreview code={generatedCode} isSubscribed={isSubscribed} />
              
              <div className="space-y-4">
                {shareSlug ? (
                  <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm uppercase italic">App Published!</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Your PWA is live and shareable.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-emerald-400 truncate flex items-center">
                        {window.location.origin}/p/{shareSlug}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/p/${shareSlug}`);
                          toast.success('Link copied to clipboard!');
                        }}
                        className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <a 
                        href={`/p/${shareSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button 
                      onClick={handlePublish}
                      disabled={isPublishing || !generatedAppId}
                      className="flex-1 min-w-[200px] px-8 py-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <div className="w-5 h-5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                      ) : (
                        <Rocket className="w-5 h-5" />
                      )}
                      {isPublishing ? 'Publishing...' : 'Publish & Get URL'}
                    </button>
                    {!isSubscribed && (
                      <button 
                        onClick={handleSubscribe}
                        className="flex-1 min-w-[200px] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        Unlock Unlimited
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[600px] rounded-[2.5rem] border border-white/5 bg-slate-900/30 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <Sparkles className="w-10 h-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-600 uppercase italic tracking-tight">Awaiting Prompt...</h3>
              <p className="text-slate-600 text-sm max-w-xs font-medium">Describe your idea on the left to initialize the AI generation engine.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl text-center space-y-8"
          >
            <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto border border-indigo-600/20 text-indigo-400">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Limit Reached</h3>
              <p className="text-slate-400 font-medium leading-relaxed">You've reached your free generation limit. Upgrade to Premium for infinite possibilities.</p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleSubscribe}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/40 hover:scale-105 transition-all"
              >
                Get Unlimited Access
              </button>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Close Engine
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
