import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, LayoutDashboard, History, Zap, ArrowRight } from 'lucide-react';

interface FirstInsightProps {
  onReviewOverview: () => void;
  onOpenInsights: () => void;
}

export default function FirstInsightMoment({ onReviewOverview, onOpenInsights }: FirstInsightProps) {
  const cards = [
    {
      title: 'Your current picture',
      body: 'Assets, liabilities and balances in one place.',
      icon: LayoutDashboard,
      color: 'text-indigo-500'
    },
    {
      title: 'What changed',
      body: 'Recent activity helps reveal spending patterns.',
      icon: History,
      color: 'text-emerald-500'
    },
    {
      title: 'What to review',
      body: 'Insights highlight the next areas worth checking.',
      icon: Zap,
      color: 'text-amber-500'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-10 glass-card rounded-[3rem] p-8 lg:p-12 border border-indigo-500/20 shadow-premium relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
        <Sparkles className="w-64 h-64 text-indigo-500" />
      </div>

      <div className="relative z-10">
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">
              Milestone Reached
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-4">
            Your first financial picture is ready
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Moneyflow can now show your net worth, spending pace and the next areas to review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cards.map((card, idx) => (
            <div key={idx} className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10">
              <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{card.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onReviewOverview}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Review overview <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onOpenInsights}
            className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center justify-center"
          >
            Open Insights
          </button>
        </div>
      </div>
    </motion.div>
  );
}
