import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Link2
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

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

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

  const assetData = assets.reduce((acc: any[], asset) => {
    const existing = acc.find(item => item.name === asset.type);
    if (existing) {
      existing.value += asset.value;
    } else {
      acc.push({ name: asset.type, value: asset.value });
    }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Wealth Dashboard</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI-Powered Portfolio Insights</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-3 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Status: Secure</span>
           </div>
           <button 
             onClick={handleFinancialReport}
             className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
           >
             Get Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:auto-rows-min xl:auto-rows-[180px]">
        {/* HERO CARD: Net Worth (Large 2x2) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 md:row-span-2 relative p-10 rounded-[3rem] bg-slate-950 text-white overflow-hidden shadow-glow"
        >
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-indigo-600/20 rounded-full -mr-20 -mt-20 blur-[100px] animate-pulse" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Total Net Worth</span>
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display tracking-tighter leading-none truncate">
                €{formatCurrency(netWorth)}
              </h2>
              <div className="flex items-center gap-3 pt-2">
                <span className="flex items-center gap-1 text-emerald-400 font-black bg-emerald-400/10 px-3 py-1.5 rounded-xl text-[10px] border border-emerald-400/20">
                  <ArrowUpRight className="w-3 h-3" />
                  +2.4% Growth
                </span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Encrypted Asset Sync</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-6 md:pt-8 border-t border-white/10 mt-6 md:mt-auto">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Assets</p>
                <p className="text-2xl font-black text-emerald-400 font-display">€{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Debt</p>
                <p className="text-2xl font-black text-rose-500 font-display">€{formatCurrency(totalLiabilities)}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI Insight Sidebar (1x2) */}
        <section className="lg:col-span-2 lg:row-span-2 addictive-gradient rounded-[3rem] p-8 text-white shadow-glow relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="w-48 h-48" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">AI Advisor</h3>
              </div>
              <button 
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              {insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <motion.div 
                    key={insight.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:bg-white/15 transition-all cursor-pointer group/item hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-400" />
                       <p className="font-black text-xs uppercase tracking-tight">{insight.title}</p>
                    </div>
                    <p className="text-indigo-100/70 text-[11px] leading-relaxed italic">{insight.description}</p>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-[2.5rem]">
                  <Bot className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-xs text-indigo-100/60 italic font-bold">AI Assistant is ready. Click Analyze.</p>
                </div>
              )}
            </div>
          </div>
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
                <div key={tx.id} className="flex items-center justify-between group/tx">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover/tx:text-indigo-500 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate italic">{tx.description}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tx.category}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black font-mono ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}€{formatCurrency(Math.abs(tx.amount))}
                  </span>
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
          <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-slate-800 dark:text-white">Sector Weights</h3>
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

        {/* Predictive Growth (1x1) */}
        <section className="glass-card rounded-[3rem] p-8 shadow-premium flex flex-col justify-between bg-zinc-900 dark:bg-[#020617] text-white">
           <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Growth Estimate</h3>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">5Y Forecast</p>
            {(() => {
               const totalVal = assets.reduce((sum, a) => sum + a.value, 0);
               const weightedReturn = totalVal > 0 
                 ? assets.reduce((sum, a) => sum + (a.value * (a.annualReturn || 0)), 0) / totalVal
                 : 7;
               const futureValue = netWorth * Math.pow(1 + (weightedReturn / 100), 5);
               return (
                 <p className="text-3xl font-black text-indigo-400 font-display tracking-tighter">
                   €{formatCurrency(futureValue)}
                 </p>
               );
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
