import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  TrendingUp, 
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, Transaction, BankAccount, ConnectedAccount, FinancialGoal } from '../types';
import DataCompletenessScore from './DataCompletenessScore';

interface GuidedSetupProps {
  assets: Asset[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  connectedAccounts: ConnectedAccount[];
  goals: FinancialGoal[];
  onAction: (action: string) => void;
}

export default function GuidedSetupChecklist({
  assets,
  transactions,
  bankAccounts,
  connectedAccounts,
  goals,
  onAction
}: GuidedSetupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const steps = [
    {
      id: 'asset',
      title: 'Add your first asset',
      description: 'Start with one account, investment or property. This establishes your baseline net worth.',
      isDone: assets.length > 0,
      icon: Plus,
      action: 'ADD_ASSET',
      cta: 'Add Asset'
    },
    {
      id: 'bank',
      title: 'Connect a bank',
      description: 'Enable real-time sync for precise, automatic transaction tracking. Cuts manual work by 90%.',
      isDone: bankAccounts.length > 0 || connectedAccounts.length > 0,
      icon: Building2,
      action: 'NAV_SYNC',
      cta: 'Connect Bank'
    },
    {
      id: 'transaction',
      title: 'Add your first transaction',
      description: 'Record an entry manually to see how your cash flow is mapped.',
      isDone: transactions.length > 0,
      icon: ArrowRight,
      action: 'ADD_TX',
      cta: 'Add Entry'
    },
    {
      id: 'insights',
      title: 'Review Insights',
      description: 'Check how AI analyzes your data for risks and opportunities.',
      isDone: false, 
      icon: TrendingUp,
      action: 'NAV_INSIGHTS',
      optional: true,
      cta: 'View Insights'
    },
    {
      id: 'trust',
      title: 'Review your data controls',
      description: 'See how we protect your privacy in the Trust Center.',
      isDone: false,
      icon: ShieldCheck,
      action: 'NAV_SETTINGS',
      optional: true,
      cta: 'Review Controls'
    }
  ];

  const dataQualityContext = {
    assetsCount: assets.length,
    liabilitiesCount: liabilities.length,
    transactionsCount: transactions.length,
    bankAccountsCount: bankAccounts.length,
    connectedAccountsCount: connectedAccounts.length,
    goalsCount: goals.length,
    lastSyncedAt: connectedAccounts.length > 0 ? new Date().toISOString() : null, // Fallback for visibility
  };

  const isMostlyComplete = assets.length > 0 && (bankAccounts.length > 0 || connectedAccounts.length > 0);

  const effectiveCollapsed = isMostlyComplete || isCollapsed;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="glass-card rounded-[2.5rem] p-8 lg:p-10 border border-indigo-500/10 shadow-premium relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-2">
              Set up your financial picture
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
              Complete a few steps so Moneyflow can give you clearer insights.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <DataCompletenessScore context={dataQualityContext} />
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {nextAction && (
              <div className="mb-8 p-6 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-500/10">
                      <nextAction.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Next Best Action</p>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{nextAction.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{nextAction.description}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onAction(nextAction.action)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    {nextAction.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    step.isDone 
                      ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' 
                      : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      step.isDone ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {step.isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </div>
                    {step.optional && !step.isDone && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-md">Optional</span>
                    )}
                  </div>
                  <h4 className={`text-sm font-black tracking-tight ${step.isDone ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {step.title}
                  </h4>
                  {!step.isDone && (
                     <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{step.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

