import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Activity, Cpu, ShieldCheck } from 'lucide-react';

const MESSAGES = [
  "Analyzing global market trends...",
  "Synchronizing neural endpoints...",
  "Cross-referencing ledger integrity...",
  "Optimizing wealth trajectory...",
  "Neural core: 100% active",
  "Securing transaction streams...",
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
    <div className="h-10 bg-indigo-600/10 dark:bg-indigo-500/5 backdrop-blur-xl border-b border-indigo-500/10 flex items-center px-6 overflow-hidden">
      <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Cpu className="w-4 h-4 text-indigo-500" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-indigo-500 rounded-full blur-sm -z-10"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Neural Core</span>
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
            <span className="text-[8px] font-black text-indigo-400 uppercase">Bank Grade Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
