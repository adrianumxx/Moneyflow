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
import { Loader2, Landmark, Receipt, CreditCard, ShoppingBag, Coffee, Utensils, Home as HomeIcon, Zap, Activity } from 'lucide-react';
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
    showNotification('AI Engine Warming', 'Loading financial history into neural context...', 'info', 'Moneyflow AI');
    try {
      const newInsights = await generateFinancialInsights(assets, liabilities, goals, []);
      onInsightsGenerated(newInsights);
      showNotification('Analysis Complete', 'Your strategic wealth DNA has been updated.', 'success', 'Moneyflow AI');
    } catch (error) {
      console.error(error);
      showNotification('AI Analysis Failed', 'Unable to reach the intelligence layer.', 'error', 'Moneyflow AI');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Net Worth Section */}
      <section className="relative p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-slate-950 text-white overflow-hidden shadow-glow">
        <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-500/20 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-500/10 rounded-full -ml-24 -mb-24 sm:-ml-32 sm:-mb-32 blur-[60px] sm:blur-[80px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-12">
          <div className="space-y-1">
            <p className="text-indigo-300 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] mb-2">Global Net Worth Profile</p>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black font-display tracking-tighter mb-2 leading-none">
              €{formatCurrency(netWorth)}
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1.5 rounded-2xl text-[10px] border border-emerald-400/20">
                <ArrowUpRight className="w-3 h-3" />
                +2.4% vs last month
              </span>
              <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">Premium Tier Active</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:border-l lg:border-white/10 lg:pl-8">
            <div className="space-y-0.5">
              <p className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Total Assets</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-display">€{formatCurrency(totalAssets)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Total Debt</p>
              <p className="text-xl sm:text-2xl font-black text-rose-500 font-display">€{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="space-y-0.5 pt-3 sm:pt-4 border-t border-white/5">
              <p className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Monthly Inflow</p>
              <p className="text-lg sm:text-xl font-black text-indigo-400 font-display">€{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="space-y-0.5 pt-3 sm:pt-4 border-t border-white/5">
              <p className="text-slate-500 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-none mb-1">Monthly Outflow</p>
              <p className="text-lg sm:text-xl font-black text-zinc-400 font-display">€{formatCurrency(monthlyExpenses)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Asset Distribution */}
        <div className="lg:col-span-2 glass-card rounded-[3rem] p-6 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Portfolio DNA</h3>
              <p className="text-slate-500 text-xs font-medium">Real-time asset distribution and risk profile</p>
            </div>
            <div className="p-3 addictive-gradient rounded-2xl shadow-lg shadow-indigo-500/20">
              <PieChartIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {assetData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                    formatter={(value: number) => `€${formatCurrency(value)}`}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {assets.length === 0 ? 'Status' : 'Diversified'}
                </span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-200">
                  {assets.length === 0 ? 'Idle' : `${assetData.length} Sectors`}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              {assets.length > 0 ? assetData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 capitalize tracking-tight">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono font-black text-[12px] text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-xl">
                    {((item.value / totalAssets) * 100).toFixed(1)}%
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center space-y-4">
                  <p className="text-slate-400 text-xs font-medium italic">No active assets found in your profile. Connect an account to start tracking.</p>
                  <button 
                    onClick={onConnectBank}
                    className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
                  >
                    Start Secure Sync
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="addictive-gradient rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 text-white shadow-glow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Sparkles className="w-24 sm:w-32 h-24 sm:h-32" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Moneyflow AI Advisor</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black font-display mb-6 tracking-tighter leading-tight">Elite Financial Intelligence</h3>
            
            <div className="space-y-6 flex-1">
              <button 
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="w-full py-4 sm:py-5 bg-white text-indigo-600 rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center gap-3 font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Activity className="w-5 h-5" /> Analyze Wealth DNA</>}
              </button>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                {insights.length > 0 ? (
                  insights.map(insight => (
                    <motion.div 
                      key={insight.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer group/item"
                    >
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                         <p className="font-bold text-sm tracking-tight">{insight.title}</p>
                      </div>
                      <p className="text-indigo-100/80 text-[11px] leading-relaxed line-clamp-4 group-hover/item:line-clamp-none transition-all">{insight.description}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 text-center border-dashed">
                    <p className="text-xs text-indigo-100/60 italic font-medium">Ready to optimize your portfolio. Click analyze to begin.</p>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleFinancialReport}
              className="mt-8 flex items-center justify-center gap-2 text-indigo-100 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors py-2"
            >
              Full Financial Report <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Goals & Predictions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        {/* Transactions List */}
        <section className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-premium group">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Live Ledger</h3>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Transaction Stream</p>
            </div>
            {bankAccounts.length === 0 ? (
              <button 
                onClick={onConnectBank}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 addictive-gradient text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Link2 className="w-4 h-4" /> Sync
              </button>
            ) : (
                <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                  <Landmark className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            )}
          </div>
          
          <div className="space-y-6">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map(tx => {
                const Icon = CATEGORY_ICONS[tx.category] || Receipt;
                return (
                  <div key={tx.id} className="flex items-center justify-between group/tx">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover/tx:bg-indigo-50 dark:group-hover/tx:bg-indigo-500/10 group-hover/tx:text-indigo-500 transition-all border border-slate-100 dark:border-white/5">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tx.category} • {tx.type}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-black text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}€{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2.5rem]">
                <Landmark className="w-12 h-12 text-slate-200 dark:text-white/10 mx-auto mb-6" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">No verified accounts</p>
                <button 
                  onClick={onConnectBank}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Link Vault
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-premium">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Wealth Targets</h3>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Strategic Objectives</p>
            </div>
            <button 
              onClick={onAddGoal}
              className="p-2.5 sm:p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl sm:rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm"
            >
              <Plus className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>
          
          <div className="space-y-8">
            {goals.map(goal => {
              const current = goal.currentAmount || 0;
              const target = goal.targetAmount || 1; 
              const percentage = Math.min((current / target) * 100, 100);
              return (
                <div key={goal.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{goal.name}</span>
                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-emerald-400 rounded-full shadow-lg"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    <span>€{formatCurrency(current)}</span>
                    <span>Target €{formatCurrency(target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-premium relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <TrendingUp className="w-24 sm:w-32 h-24 sm:h-32" />
          </div>
          <div className="flex items-center justify-between mb-8 sm:mb-10 relative">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Future Yield</h3>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Projection Audit</p>
            </div>
            <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl sm:rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
          </div>
          
          <div className="p-6 sm:p-10 bg-slate-50 dark:bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 text-center relative z-10">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 sm:mb-6 leading-relaxed">Multi-Year Growth Prediction (5Y)</p>
            {(() => {
              // Calculate weighted average annual return
              const totalVal = assets.reduce((sum, a) => sum + a.value, 0);
              const weightedReturn = totalVal > 0 
                ? assets.reduce((sum, a) => sum + (a.value * (a.annualReturn || 0)), 0) / totalVal
                : 7; // Default to 7 if no assets
              
              const futureValue = netWorth * Math.pow(1 + (weightedReturn / 100), 5);
              
              return (
                <>
                  <p className="text-5xl font-black text-emerald-500 font-display tracking-tighter leading-none mb-6">
                    €{netWorth === 0 ? '0.00' : formatCurrency(futureValue)}
                  </p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-emerald-500" style={{ width: netWorth === 0 ? '0%' : '70%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                    {netWorth === 0 
                      ? '*Requires active capital stream' 
                      : `*Est. ${weightedReturn.toFixed(1)}% Avg ROI • Compounding Active`}
                  </p>
                </>
              );
            })()}
          </div>
        </section>
      </div>
    </div>
  );
}
