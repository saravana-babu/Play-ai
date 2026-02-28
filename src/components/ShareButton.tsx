import React from 'react';
import { Share2, Twitter, Facebook, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareButtonProps {
  gameTitle: string;
  score?: number;
  winner?: string;
  funnyTask?: string | null;
}

export default function ShareButton({ gameTitle, score, winner, funnyTask }: ShareButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const shareText = `I just played ${gameTitle} on NeuroPlay! ${
    winner === 'user' ? `I won with a score of ${score}!` : 
    winner === 'ai' ? `The AI won! My penalty task: "${funnyTask}"` :
    `Check it out!`
  } #NeuroPlay #AIGames`;

  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    { 
      name: 'Twitter', 
      icon: <Twitter className="w-4 h-4" />, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: 'Facebook', 
      icon: <Facebook className="w-4 h-4" />, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share Result</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full mb-2 right-0 z-50 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2"
            >
              <div className="space-y-1">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    {link.icon}
                    {link.name}
                  </a>
                ))}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm text-slate-300 hover:text-white"
                >
                  <LinkIcon className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
