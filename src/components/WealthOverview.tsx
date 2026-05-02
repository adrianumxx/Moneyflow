import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  Wallet,
  ArrowUpRight,
  Sparkles,
  Link2,
  FileText,
  Radio,
  Pencil,
  ArrowRight,
  Loader2, 
  Landmark, 
  Receipt, 
  Zap, 
  Bot, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { Asset, Liability, FinancialGoal, AIInsight, Transaction, BankAccount, UserProfile } from '../types';
import { useFinancial } from '../context/FinancialContext';
import { formatMoney } from '../utils/format';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { generateFinancialInsights } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';
import { assessGoalProgress } from '../utils/goalInsights';
import { 
  calculateTotalAssets, 
  calculateTotalLiabilities, 
  calculateNetWorth, 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses,
  calculateCashFlow,
  calculateInflationDrag,
  calculateFinancialRunway,
  calculateSavingsRate
} from '../utils/financialCalculations';
import { FEATURES, isFeatureVisible } from '../config/featureFlags';
import TacticalMissionControl from './TacticalMissionControl';
import PaywallGuard from './PaywallGuard';

interface WealthOverviewProps {
  onInsightsGenerated: (newInsights: AIInsight[]) => void;
  onConnectBank: () => void;
  onConnectCrypto?: () => void;
  onAddGoal: () => void;
  onAddAsset: () => void;
  onGenerateReport: () => void;
  theme: 'light' | 'dark';
}

const CATEGORY_ICONS: Record<string, any> = {
  food: Receipt,
  housing: Landmark,
  transport: Zap,
  entertainment: Activity,
  shopping: Receipt,
  health: ShieldCheck,
  income: TrendingUp,
  other: Receipt
};

function Activity(props: any) { return <Zap {...props} /> }

export default function WealthOverview({ 
  onInsightsGenerated, 
  onConnectBank,
  onConnectCrypto,
  onAddGoal,
  onAddAsset,
  onGenerateReport,
  theme 
}: WealthOverviewProps) {
  const { 
    assets, 
    liabilities, 
    goals, 
    insights, 
    transactions, 
    bankAccounts, 
    cryptoWallets,
    investmentAccounts,
    userProfile,
    isCondensed
  } = useFinancial();

  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { showNotification } = useNotifications();

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    showNotification('Neural Core', 'Synthesizing global signals...', 'info', 'Moneyflow');
    try {
      const newInsights = await generateFinancialInsights(assets, liabilities, goals, []);
      onInsightsGenerated(newInsights);
      showNotification('Mission Brief Ready', 'Strategic insights updated.', 'success', 'Moneyflow');
    } catch (error) {
      console.error(error);
      showNotification('Sync Interrupted', "Couldn't reach the oracle. Try again.", 'error', 'Moneyflow');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0 && insights.length === 0 && !isGenerating) {
      handleGenerateInsights();
    }
  }, [assets.length, insights.length]);

  // Core Financial Logic
  const totalAssets = calculateTotalAssets(assets, bankAccounts, cryptoWallets, investmentAccounts);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(assets, bankAccounts, liabilities, cryptoWallets, investmentAccounts);
  const monthlyIncome = calculateMonthlyIncome(transactions);
  const monthlyExpenses = calculateMonthlyExpenses(transactions, liabilities);
  const totalCashFlow = calculateCashFlow(transactions);
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const assetData = useMemo(() => {
    const data: Record<string, number> = {};
    const bankSum = bankAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    if (bankSum > 0) data['Cash & Bank'] = bankSum;
    const cryptoSum = cryptoWallets.reduce((sum, w) => sum + (w.nativeBalance || 0), 0);
    if (cryptoSum > 0) data['Crypto'] = cryptoSum;
    assets.forEach(a => { data[a.type || 'Other'] = (data[a.type || 'Other'] || 0) + a.value; });
    const result = Object.entries(data).map(([name, value]) => ({ name, value }));
    return result.length === 0 ? [{ name: 'Neutral', value: 0.1 }] : result;
  }, [assets, bankAccounts, cryptoWallets]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className={`space-y-6 sm:space-y-8 pb-10 ${isCondensed ? 'px-0' : ''}`}>
      {/* 0. Strategic Mission Control */}
      <PaywallGuard feature="TACTICAL_BRIEF">
        <TacticalMissionControl />
      </PaywallGuard>

      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2 ${isCondensed ? 'mb-4' : 'mb-8'}`}>
        <div className="flex flex-col gap-1">
          <h2 className={`${isCondensed ? 'text-xl' : 'text-2xl sm:text-3xl'} font-black text-slate-900 dark:text-white tracking-tighter uppercase italic transition-all`}>Your Financial Overview</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wealth Intel Core</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
           {onConnectCrypto && (
             <button onClick={onConnectCrypto} className={`flex-1 md:flex-none ${isCondensed ? 'px-3 py-1.5' : 'px-4 py-2.5'} bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 shadow-sm hover:border-indigo-500/50 transition-all group`}>
               <Link2 className="w-4 h-4 text-indigo-500 group-hover:rotate-12 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connect Crypto</span>
             </button>
           )}
           <button onClick={onGenerateReport} className={`flex-1 md:flex-none ${isCondensed ? 'px-3 py-1.5' : 'px-4 py-2.5'} bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all`}>
             <FileText className="w-4 h-4" /> Get Report
           </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${isCondensed ? 'gap-3' : 'gap-4 sm:gap-6'} lg:auto-rows-min`}>
        {/* HERO CARD: Net Worth */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className={`md:col-span-2 md:row-span-2 relative ${isCondensed ? 'p-5 sm:p-6 rounded-[2rem]' : 'p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem]'} bg-zinc-950 text-white overflow-hidden shadow-glow group ${isCondensed ? 'min-h-[250px]' : 'min-h-[350px] md:min-h-[420px]'} flex flex-col justify-between transition-all`}
        >
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-indigo-500/20 rounded-full -mr-20 -mt-20 blur-[100px] animate-pulse" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-white/10 rounded-xl border border-white/10 group-hover:rotate-12 transition-all duration-500`}>
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">Fiscal Awareness</span>
              </div>
              <div className="flex gap-2">
                <div className={`${isCondensed ? 'p-1.5 px-3' : 'p-2.5 px-4'} bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center`}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Surplus</p>
                  <p className={`${isCondensed ? 'text-xs' : 'text-sm sm:text-base'} font-black text-white`}>{formatMoney(monthlySurplus)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Net Worth Live</p>
               <h2 className={`${isCondensed ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl lg:text-7xl xl:text-8xl'} font-black font-display tracking-tighter leading-none truncate transition-all`}>{formatMoney(netWorth)}</h2>
            </div>

            <div className="flex flex-wrap gap-2">
               <div className="px-3 py-1.5 bg-emerald-400/10 rounded-full border border-emerald-400/20 flex items-center gap-2">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase text-emerald-400">+2.4% Pace</span>
               </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
             <div className="space-y-1">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Total Assets</p>
                <p className={`${isCondensed ? 'text-lg' : 'text-2xl'} font-black text-white`}>{formatMoney(totalAssets)}</p>
             </div>
             <div className="space-y-1">
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Total Debt</p>
                <p className={`${isCondensed ? 'text-lg' : 'text-2xl'} font-black text-rose-500`}>{formatMoney(totalLiabilities)}</p>
             </div>
          </div>
        </motion.section>

        {/* Intelligence Insight Section */}
        <section className={`lg:col-span-2 lg:row-span-2 addictive-gradient ${isCondensed ? 'p-6 rounded-[2rem]' : 'p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem]'} text-white shadow-glow relative overflow-hidden group flex flex-col justify-center cursor-pointer transition-all`}
         onClick={() => !insights.length && !isGenerating && handleGenerateInsights()}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Sparkles className="w-48 h-48" />
          </div>

          {isGenerating ? (
            <div className="relative z-10 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 mb-4 animate-spin" />
              <p className="text-sm font-black uppercase tracking-widest animate-pulse">Consulting the Oracle...</p>
            </div>
          ) : insights.length > 0 ? (
            <div className="relative z-10 h-full flex flex-col">
               <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Daily Briefing</h3>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
               </div>
               <div className={`flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar`}>
                  {insights.slice(0, 3).map(insight => (
                    <div key={insight.id} className={`${isCondensed ? 'p-3' : 'p-4'} bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md`}>
                       <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-indigo-300">{insight.title}</p>
                       <p className={`${isCondensed ? 'text-[10px]' : 'text-xs'} font-medium leading-relaxed opacity-90`}>{insight.description}</p>
                    </div>
                  ))}
               </div>
               <button onClick={(e) => { e.stopPropagation(); onGenerateReport(); }} className={`mt-6 w-full ${isCondensed ? 'py-3' : 'py-4'} bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2`}>
                  <FileText className="w-4 h-4" /> Full Audit
               </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <Bot className="w-16 h-16 mb-6 animate-bounce" />
              <h3 className="text-xl font-black uppercase italic tracking-tight">Prime the Engine</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-4 leading-relaxed">Connect accounts to activate your personal orientation intelligence.</p>
              <button onClick={(e) => { e.stopPropagation(); onAddAsset(); }} className="mt-8 px-6 py-3 bg-white/10 border border-white/20 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-white/20 transition-all">Add First Asset</button>
            </div>
          )}
        </section>

        {/* Level 3: Capital Physics */}
        <section className={`${isCondensed ? 'p-5 rounded-[2rem]' : 'p-6 rounded-[2rem] sm:rounded-[3.5rem]'} bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-premium flex flex-col justify-between transition-all`}>
           <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Zap className="w-4 h-4" /></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Capital Physics</span>
           </div>
           <div className={`${isCondensed ? 'space-y-2' : 'space-y-4'}`}>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Inflation Drag</p>
                 <p className={`${isCondensed ? 'text-base' : 'text-lg'} font-black text-rose-500 italic`}>-{formatMoney(calculateInflationDrag(totalAssets))}/mo</p>
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Financial Autonomy</p>
                 <p className={`${isCondensed ? 'text-base' : 'text-lg'} font-black text-indigo-500 tracking-tighter uppercase`}>{calculateFinancialRunway(totalAssets, monthlyExpenses).toFixed(1)} Months</p>
              </div>
           </div>
        </section>

        {/* Allocation */}
        <section className={`lg:row-span-2 ${isCondensed ? 'p-6 rounded-[2rem]' : 'p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem]'} bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-premium flex flex-col transition-all`}>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 italic">Allocation DNA</h3>
           <div className={`flex-1 ${isCondensed ? 'min-h-[140px]' : 'min-h-[180px]'} relative`}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={assetData} cx="50%" cy="50%" innerRadius={isCondensed ? 45 : 55} outerRadius={isCondensed ? 65 : 75} paddingAngle={8} dataKey="value" stroke="none">
                    {assetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[8px] font-black text-slate-400 uppercase">Diversity</span>
                 <span className="text-sm font-black dark:text-white">{assetData.length} Units</span>
              </div>
           </div>
           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 flex justify-around text-center">
              <div><p className="text-[7px] font-black text-slate-400 uppercase">Runway</p><p className="text-xs font-black text-indigo-500">{calculateFinancialRunway(totalAssets, monthlyExpenses).toFixed(0)}m</p></div>
              <div><p className="text-[7px] font-black text-slate-400 uppercase">Savings</p><p className="text-xs font-black text-emerald-500">{calculateSavingsRate(monthlyIncome, monthlyExpenses).toFixed(0)}%</p></div>
           </div>
        </section>

        {/* Goals & Activity */}
        <section className={`${isCondensed ? 'p-5 rounded-[2rem]' : 'p-6 rounded-[2rem] sm:rounded-[3.5rem]'} bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-premium flex flex-col justify-between transition-all`}>
           <div className="flex items-center justify-between mb-4"><div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Target className="w-4 h-4" /></div><span className="text-[9px] font-black uppercase text-slate-400">Main Objective</span></div>
           {goals.length > 0 ? (
             <div className="space-y-2">
                <div className="flex justify-between items-end"><p className="text-xs font-black uppercase truncate max-w-[100px]">{goals[0].name}</p><p className={`${isCondensed ? 'text-sm' : 'text-base'} font-black text-indigo-500`}>{assessGoalProgress(goals[0]).progress}%</p></div>
                <div className="h-1 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${assessGoalProgress(goals[0]).progress}%` }} /></div>
             </div>
           ) : <button onClick={onAddGoal} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-[9px] font-black uppercase text-slate-400">Set Target</button>}
        </section>
        
        <section className={`lg:col-span-1 ${isCondensed ? 'p-5 rounded-[2rem]' : 'p-6 rounded-[2rem] sm:rounded-[3.5rem]'} bg-zinc-900 text-white shadow-premium flex flex-col justify-between transition-all`}>
           <div className="flex items-center justify-between"><div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><TrendingUp className="w-4 h-4" /></div><span className="text-[9px] font-black uppercase text-zinc-500">Capital Flow</span></div>
           <div className="mt-4"><p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Monthly Delta</p><p className={`${isCondensed ? 'text-xl' : 'text-2xl'} font-black ${monthlySurplus > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{monthlySurplus > 0 ? '+' : ''}{formatMoney(monthlySurplus)}</p></div>
        </section>

      </div>
    </div>
  );
}
