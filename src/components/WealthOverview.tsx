import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  Plus, 
  Wallet,
  Building2,
  Coins,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  Link2,
  FileText,
  Radio,
  Pencil
} from 'lucide-react';
import { Asset, Liability, FinancialGoal, AIInsight, Transaction, BankAccount } from '../types';
import { formatCurrency } from '../utils/format';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { generateFinancialInsights } from '../services/geminiService';
import { Loader2, Landmark, Receipt, CreditCard, ShoppingBag, Coffee, Utensils, Home as HomeIcon, Zap, Activity, Bot } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface WealthOverviewProps {
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  insights: AIInsight[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  onInsightsGenerated: (newInsights: AIInsight[]) => void;
  onConnectBank: () => void;
  onAddGoal: () => void;
  onGenerateReport: () => void;
  theme: 'light' | 'dark';
}

const CATEGORY_ICONS: Record<string, any> = {
  food: Utensils,
  housing: HomeIcon,
  transport: Zap,
  entertainment: Activity,
  shopping: ShoppingBag,
  health: ShieldCheck,
  income: TrendingUp,
  other: Receipt
};

export default function WealthOverview({ 
  assets, 
  liabilities, 
  goals, 
  insights, 
  transactions, 
  bankAccounts,
  onInsightsGenerated, 
  onConnectBank,
  onAddGoal,
  onGenerateReport,
  theme 
}: WealthOverviewProps) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const { showNotification } = useNotifications();

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    showNotification('AI Assistant', 'Analyzing your finances...', 'info', 'Moneyflow');
    try {
      const newInsights = await generateFinancialInsights(assets, liabilities, goals, []);
      onInsightsGenerated(newInsights);
      showNotification('Analysis Complete', 'Insights updated successfully.', 'success', 'Moneyflow');
    } catch (error) {
      console.error(error);
      showNotification('Analysis Failed', "Couldn't reach the AI assistant. Please try again.", 'error', 'Moneyflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinancialReport = () => {
    onGenerateReport();
  };

  const totalBankBalance = bankAccounts ? bankAccounts.reduce((sum, b) => sum + b.balance, 0) : 0;
  
  // Calculate lifetime transaction flow to adjust net worth dynamically
  const totalTransactionFlow = transactions.reduce((sum, tx) => {
    return tx.type === 'income' ? sum + Math.abs(tx.amount) : sum - Math.abs(tx.amount);
  }, 0);

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0) + totalBankBalance;
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
  const netWorth = totalAssets + totalTransactionFlow - totalLiabilities;

  // Calculate monthly flow
  const now = new Date();
  const currentMonthTransactions = transactions.filter(tx => {
    const d = tx.date.toDate();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const monthlyExpenses = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const assetData = useMemo(() => {
    const data: Record<string, number> = {};
    
    // 1. Adjusted Liquidity (Bank Balance + All Transactions)
    const adjustedLiquidity = totalBankBalance + totalTransactionFlow;
    if (adjustedLiquidity > 0) {
      data['Liquidity'] = adjustedLiquidity;
    }

    // 2. Manual Assets
    assets.forEach(asset => {
      const cat = asset.type || 'Other';
      data[cat] = (data[cat] || 0) + asset.value;
    });

    // 3. Liabilities (as a debt sector for sincerity)
    if (totalLiabilities > 0) {
      data['Debt/Liabilities'] = totalLiabilities;
    }

    // Convert to array for Recharts
    const result = Object.entries(data).map(([name, value]) => ({ name, value }));
    
    // Fallback for empty state
    if (result.length === 0) {
      return [{ name: 'Neutral', value: 0.1 }];
    }
    
    return result;
  }, [assets, totalBankBalance, totalTransactionFlow, totalLiabilities]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Wealth Dashboard</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI-Powered Portfolio Insights</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex-1 md:flex-none px-5 py-2.5 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center md:justify-start gap-3 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Status: Secure</span>
           </div>
           
           <button 
             onClick={handleFinancialReport}
             className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 flex-shrink-0"
           >
             <FileText className="w-4 h-4" />
             {t('Get Report')}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:auto-rows-min xl:auto-rows-[180px]">
        {/* HERO CARD: Net Worth (Large 2x2) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 md:row-span-2 relative p-10 rounded-[3rem] bg-brand-dark text-white overflow-hidden shadow-glow group"
        >
          {/* Animated Background Gradients */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-brand-primary/20 rounded-full -mr-20 -mt-20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-brand-secondary/10 rounded-full -ml-20 -mb-20 blur-[100px]" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 group-hover:rotate-12 transition-transform duration-500">
                  <ShieldCheck className="w-6 h-6 text-brand-secondary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">{t('Total Net Worth')}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic leading-none">Verified Assets Hub</span>
                </div>
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display tracking-tighter leading-none truncate w-full drop-shadow-2xl" title={`€${formatCurrency(netWorth)}`}>
                €{formatCurrency(netWorth)}
              </h2>
              <div className="flex items-center gap-3 pt-6">
                <span className="flex items-center gap-2 text-emerald-400 font-black bg-emerald-400/10 px-4 py-2 rounded-2xl text-xs border border-emerald-400/20 shadow-success">
                  <ArrowUpRight className="w-4 h-4" />
                  +2.4% Growth
                </span>
                <div className="h-10 w-[1px] bg-white/10 mx-2 hidden sm:block" />
                <div className="hidden sm:flex flex-col">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Neural Link</span>
                  <span className="text-white text-[10px] font-bold">Active Stream</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10 mt-12 md:mt-auto">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('Total Assets')}</p>
                <p className="text-3xl font-black text-emerald-400 font-display truncate">€{formatCurrency(totalAssets)}</p>
                <div className="h-1 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[75%] rounded-full shadow-success" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('Total Debt')}</p>
                <p className="text-3xl font-black text-rose-500 font-display truncate">€{formatCurrency(totalLiabilities)}</p>
                <div className="h-1 w-full bg-rose-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-[25%] rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Portfolio Analysis Section (Replaces AI Insight Sidebar) */}
        <section className="lg:col-span-2 lg:row-span-2 addictive-gradient rounded-[3rem] p-8 text-white shadow-glow relative overflow-hidden group flex flex-col justify-center cursor-pointer hover:bg-opacity-90 transition-all"
         onClick={() => {
           if (!insights.length && !isGenerating) {
             handleGenerateInsights();
           }
         }}>
          <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <Sparkles className="w-48 h-48" />
          </div>

          {!insights.length && !isGenerating && (
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
              <Bot className="w-16 h-16 mb-6 text-white/80 drop-shadow-xl animate-bounce" />
              <h2 className="text-3xl font-black uppercase tracking-tight">{t('Analisi Portafoglio')}</h2>
              <p className="text-white/80 text-[10px] mt-4 font-black uppercase tracking-[0.3em] bg-white/10 px-4 py-2 rounded-full border border-white/20">
                {t('Tap to Scan')}
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
              <Loader2 className="w-12 h-12 mb-6 animate-spin text-white" />
              <p className="text-white/90 font-black text-sm uppercase tracking-widest">{t('Analyzing Strategy...')}</p>
            </div>
          )}

          {insights.length > 0 && !isGenerating && (
            <div className="relative z-10 h-full flex flex-col pt-2">
               <div className="flex items-center justify-between mb-6 shrink-0">
                 <h2 className="text-sm font-black uppercase tracking-[0.2em]">{t('Quick Scan')}</h2>
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
               </div>
               
               <div className="flex-1 space-y-3 overflow-y-auto pr-2 no-scrollbar mb-4">
                 {insights.map(insight => (
                   <div key={insight.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${insight.type === 'warning' ? 'bg-rose-400' : insight.type === 'opportunity' ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{insight.title}</span>
                     </div>
                     <p className="text-xs text-white/90 leading-relaxed font-medium">{insight.description}</p>
                   </div>
                 ))}
               </div>
               
               <button 
                 onClick={(e) => { e.stopPropagation(); onGenerateReport(); }} 
                 className="shrink-0 w-full py-4 bg-white text-indigo-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
               >
                  <FileText className="w-5 h-5" />
                  {t('Full Analysis')}
               </button>
            </div>
          )}
        </section>

        {/* Tactical Ledger (1x2) */}
        <section className="lg:row-span-2 glass-card rounded-[3rem] p-8 shadow-premium flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Active Flows</h3>
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Receipt className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          
          <div className="flex-1 space-y-6">
            {transactions.slice(0, 4).map(tx => {
              const Icon = CATEGORY_ICONS[tx.category] || Receipt;
              return (
                <div key={tx.id} className="flex items-center gap-4 group/tx">
                  <div className="w-12 h-12 shrink-0 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover/tx:text-indigo-500 transition-colors border border-transparent group-hover/tx:border-indigo-500/20 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate italic leading-tight mb-0.5">{tx.description}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{tx.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-[11px] font-black font-mono ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}€{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Landmark className="w-10 h-10 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Active Flows</p>
              </div>
            )}
          </div>
          <button className="mt-8 w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-indigo-500 transition-all">
            Full Ledger
          </button>
        </section>

        {/* Portfolio DNA (1x2) */}
        <section className="lg:row-span-2 glass-card rounded-[3rem] p-8 shadow-premium flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Sector Weights</h3>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 cursor-help" title="Data fed dynamically from Sync, Ledger & Manual sources.">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" title="API Sync (Open Banking)"><Radio className="w-3 h-3" /></div>
              <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400" title="Ledger Imports"><Receipt className="w-3 h-3" /></div>
              <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400" title="Manual Entry"><Pencil className="w-3 h-3" /></div>
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {assetData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DNA</span>
              <span className="text-sm font-black text-slate-800 dark:text-white">{assetData.length} Slices</span>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            {assetData.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight truncate max-w-[80px]">{item.name}</span>
                </div>
                <span className="font-mono text-[10px] font-black text-slate-900 dark:text-white">
                  {((item.value / totalAssets) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Strategic Target (1x1) */}
        <section className="glass-card rounded-[3rem] p-8 shadow-premium flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Next Goal</h3>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            {goals.length > 0 ? (
              <>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-black text-slate-800 dark:text-white italic uppercase">{goals[0].name}</p>
                  <p className="text-xl font-black text-emerald-500">{Math.round((goals[0].currentAmount / goals[0].targetAmount) * 100)}%</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((goals[0].currentAmount / goals[0].targetAmount) * 100)}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                  />
                </div>
              </>
            ) : (
              <button 
                onClick={onAddGoal}
                className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-all"
              >
                Set Target
              </button>
            )}
          </div>
        </section>

        {/* Wealth Velocity (1x1) */}
        <section className="glass-card rounded-[3rem] p-8 shadow-premium flex flex-col justify-between bg-zinc-900 dark:bg-[#020617] text-white">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Wealth Velocity</h3>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col h-full justify-end">
            {(() => {
               const velocity = monthlyIncome - monthlyExpenses;
               const isPositive = velocity > 0;
               const yearsToMillion = isPositive && netWorth < 1000000 
                  ? ((1000000 - netWorth) / (velocity * 12)).toFixed(1)
                  : null;
               
               return (
                 <>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Monthly Acceleration</p>
                   <p className={`text-3xl font-black font-display tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {isPositive ? '+' : ''}€{formatCurrency(velocity)}<span className="text-sm">/mo</span>
                   </p>
                   {yearsToMillion ? (
                      <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[10px] font-bold text-white/60">
                          At this speed: <strong className="text-white text-xs">{yearsToMillion} years</strong> to €1M.
                        </p>
                      </div>
                   ) : isPositive && netWorth >= 1000000 ? (
                      <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <p className="text-[10px] font-bold text-emerald-400">
                          Milestone achieved. You are a millionaire.
                        </p>
                      </div>
                   ) : (
                      <div className="mt-4 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <p className="text-[10px] font-bold text-rose-400">
                          Velocity negative. Wealth is bleeding.
                        </p>
                      </div>
                   )}
                 </>
               );
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
