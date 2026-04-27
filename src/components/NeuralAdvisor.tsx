import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X, Bot } from 'lucide-react';

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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-8 z-50 w-80"
        >
          <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 rounded-[2rem] p-6 shadow-premium backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Neural Advisor</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Analysis</p>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {message}
            </p>

            {actionLabel && (
              <button
                onClick={onAction}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn"
              >
                {actionLabel}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
