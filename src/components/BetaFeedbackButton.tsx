import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface BetaFeedbackButtonProps {
  section?: string;
  variant?: 'floating' | 'inline';
}

export default function BetaFeedbackButton({ section, variant = 'inline' }: BetaFeedbackButtonProps) {
  const handleFeedback = () => {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent;
    const subject = encodeURIComponent('Moneyflow Beta Feedback');
    const body = encodeURIComponent(
      `Section: ${section || 'N/A'}\n` +
      `Timestamp: ${timestamp}\n` +
      `Browser: ${userAgent}\n\n` +
      `Feedback details:\n`
    );
    
    window.location.href = `mailto:feedback@moneyflowai.com?subject=${subject}&body=${body}`;
  };

  if (variant === 'floating') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFeedback}
        className="fixed bottom-28 lg:bottom-10 left-6 z-40 w-14 h-14 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-indigo-500/30 rounded-full flex items-center justify-center shadow-2xl group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-600/20 group-hover:opacity-100 opacity-0 transition-opacity" />
        <MessageSquare className="w-6 h-6 text-indigo-500 dark:text-indigo-400 relative z-10" />
      </motion.button>
    );
  }

  return (
    <button 
      onClick={handleFeedback}
      className="w-full p-4 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between group transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">Beta Access</p>
          <p className="text-xs font-bold text-slate-700 dark:text-white">Found something confusing? Send beta feedback.</p>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
}
