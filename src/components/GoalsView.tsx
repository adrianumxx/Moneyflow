import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Landmark,
  Wallet
} from 'lucide-react';
import { FinancialGoal, UserProfile } from '../types';
import { formatMoney } from '../utils/format';
import { assessGoalProgress, suggestGoalTemplates } from '../utils/goalInsights';

interface GoalsViewProps {
  goals: FinancialGoal[];
  onAddGoal: () => void;
  userProfile?: UserProfile;
}

const TEMPLATE_ICONS: Record<string, any> = {
  safety: ShieldCheck,
  property: Landmark,
  wealth: TrendingUp,
  lifestyle: Wallet
};

export default function GoalsView({ goals, onAddGoal, userProfile }: GoalsViewProps) {
  const templates = suggestGoalTemplates();

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tighter text-slate-900 dark:text-white leading-none mb-4">Financial Goals</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">Give your money a direction. Track progress toward what matters most.</p>
        </div>
        <button 
          onClick={onAddGoal}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-sm font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" /> Create Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="space-y-12">
          <div className="glass-card rounded-[3rem] p-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Set a goal to give your money a direction.</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
              Whether it's an emergency fund or your dream home, tracking your progress keeps you focused.
            </p>
            <button 
              onClick={onAddGoal}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
            >
              Create your first goal
            </button>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2">Suggested Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((template, idx) => {
                const Icon = TEMPLATE_ICONS[template.category] || Target;
                return (
                  <button 
                    key={idx}
                    onClick={onAddGoal}
                    className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl text-left hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h5 className="font-black text-slate-900 dark:text-white mb-1">{template.title}</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const insight = assessGoalProgress(goal);
            return (
              <motion.div 
                key={goal.id}
                layout
                className="glass-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 hover:border-indigo-500/20 transition-all flex flex-col h-full"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white tracking-tight leading-tight">{goal.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{goal.category}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                    insight.status === 'On track' ? 'bg-emerald-500/10 text-emerald-500' :
                    insight.status === 'Complete' ? 'bg-indigo-500/10 text-indigo-500' :
                    insight.status === 'Needs attention' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {insight.status}
                  </span>
                </div>

                <div className="flex-grow">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {formatMoney(goal.currentAmount, userProfile?.baseCurrency)}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      of {formatMoney(goal.targetAmount, userProfile?.baseCurrency)}
                    </span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-6">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${insight.progress}%` }}
                      className={`h-full ${insight.status === 'Needs attention' ? 'bg-rose-500' : 'bg-indigo-500'} shadow-[0_0_10px_rgba(99,102,241,0.3)]`}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Strategic Next Step</p>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    {insight.status === 'Needs attention' ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                      {insight.nextAction}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
