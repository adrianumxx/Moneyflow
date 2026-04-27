import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, X, Bot, MessageCircle } from 'lucide-react';

interface NeuralAdvisorProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function NeuralAdvisor({ isVisible, onClose, message, actionLabel, onAction }: NeuralAdvisorProps) {
  // Use the generated 3D piggy partner path
  const neuralIconPath = "/assets/piggy_partner.png";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="fixed bottom-28 right-6 z-50 w-72"
        >
          <div className="bg-white/90 dark:bg-slate-900/90 border border-indigo-500/20 rounded-[2.5rem] p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-14 h-14 relative flex items-center justify-center"
              >
                <img src={neuralIconPath} alt="Piggy Partner" className="w-full h-full object-contain drop-shadow-glow" />
              </motion.div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Expert Socio</p>
                <p className="text-[10px] font-bold text-slate-900 dark:text-white">Neural Insights</p>
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
