import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, Cpu, ShieldCheck } from 'lucide-react';

const MESSAGES = [
  "Analyzing global market trends...",
  "Synchronizing data endpoints...",
  "Cross-referencing ledger integrity...",
  "Optimizing financial path...",
  "AI Advisor: Active",
  "Securing data streams...",
  "Detecting portfolio opportunities..."
];

export default function GlobalPulse() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 bg-indigo-600/5 dark:bg-indigo-500/5 backdrop-blur-xl border-b border-indigo-500/5 flex items-center px-4 overflow-hidden">
      <div className="flex items-center gap-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500">Live Data</span>
        </div>
        
        <div className="h-4 w-[1px] bg-indigo-500/20" />
        
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[9px] font-bold text-slate-500 dark:text-indigo-300/60 uppercase tracking-widest truncate"
            >
              {MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-[8px] font-black text-emerald-500 uppercase">Live Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span className="text-[8px] font-black text-indigo-400 uppercase">Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
