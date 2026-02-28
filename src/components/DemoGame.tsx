import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User as UserIcon } from 'lucide-react';

export default function DemoGame() {
  const [step, setStep] = useState(0);

  const steps = [
    { text: "AI plays X in center", board: ['','','','','X','','','',''] },
    { text: "User plays O top-left", board: ['O','','','','X','','','',''] },
    { text: "AI plays X top-right", board: ['O','','X','','X','','','',''] },
    { text: "User plays O bottom-left", board: ['O','','X','','X','','O','',''] },
    { text: "AI plays X bottom-right. AI Wins!", board: ['O','','X','','X','','O','','X'] },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="bg-slate-950/50 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold text-sm">Gemini AI</span>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
          VS
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Player 1</span>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 max-w-[200px] mx-auto">
        {steps[step].board.map((cell, i) => (
          <div
            key={i}
            className="aspect-square bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center text-3xl font-bold"
          >
            <AnimatePresence mode="popLayout">
              {cell && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cell === 'X' ? 'text-indigo-400' : 'text-emerald-400'}
                >
                  {cell}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="text-center h-12 flex items-center justify-center">
        <p className="text-sm text-slate-300 font-medium">
          {steps[step].text}
        </p>
      </div>

      <AnimatePresence>
        {step === steps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center"
          >
            <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">Penalty Task Assigned</p>
            <p className="text-sm font-medium text-rose-200">
              "Do 10 jumping jacks while singing the alphabet backwards!"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
