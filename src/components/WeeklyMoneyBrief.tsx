import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Asset, Liability, Transaction, FinancialGoal, BankAccount, ConnectedAccount } from '../types';
import { generateWeeklyBrief } from '../utils/weeklyBrief';

interface WeeklyBriefProps {
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  goals: FinancialGoal[];
  bankAccounts: BankAccount[];
  connectedAccounts: ConnectedAccount[];
}

export default function WeeklyMoneyBrief({
  assets,
  liabilities,
  transactions,
  goals,
  bankAccounts,
  connectedAccounts
}: WeeklyBriefProps) {
  const brief = generateWeeklyBrief(
    assets,
    liabilities,
    transactions,
    goals,
    bankAccounts,
    connectedAccounts
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Weekly Money Brief</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Observational Summary</p>
          </div>
        </div>
        
        {brief.dataQualityNote && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
              {brief.dataQualityNote}
            </span>
          </div>
        )}
      </div>

      {brief.isSparse ? (
        <div className="py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
            Your weekly brief will become more useful as you add transactions, goals or connected accounts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.bullets.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-6 h-6 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Privacy Verified: Local Analysis Only</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Last 7 Days <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
