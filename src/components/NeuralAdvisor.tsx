import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Bot } from 'lucide-react';

interface NeuralAdvisorProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function NeuralAdvisor({ isVisible, onClose, message, actionLabel, onAction }: NeuralAdvisorProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="fixed bottom-24 right-6 z-50 w-72"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 border border-indigo-500/20 rounded-[2.5rem] p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 relative flex items-center justify-center">
                <img src="/assets/ai_assistant.png" alt="Neural Partner" className="w-full h-full object-contain drop-shadow-glow" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Neural Partner</p>
                <p className="text-[10px] font-bold text-slate-900 dark:text-white">Expert Advice</p>
              </div>
            </div>

            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-tight mb-4 pr-4">
              {message}
            </p>

            {actionLabel && (
              <button
                onClick={onAction}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn"
              >
                {actionLabel}
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
