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
  PieChart,
  Link2
} from 'lucide-react';
import { Asset, Liability, FinancialGoal, AIInsight, Transaction, BankAccount } from '../types';
import { formatCurrency } from '../utils/format';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { generateFinancialInsights } from '../services/geminiService';
import { Loader2, Landmark, Receipt, CreditCard, ShoppingBag, Coffee, Utensils, Home as HomeIcon, Zap, Activity } from 'lucide-react';

interface WealthOverviewProps {
  assets: Asset[];
  liabilities: Liability[];
  goals: FinancialGoal[];
  insights: AIInsight[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  onInsightsGenerated: (newInsights: AIInsight[]) => void;
  onConnectBank: () => void;
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
  theme 
}: WealthOverviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      const newInsights = await generateFinancialInsights(assets, liabilities, goals, []);
      onInsightsGenerated(newInsights);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Net Worth Section */}
      <section className="relative p-10 rounded-[40px] bg-zinc-900 dark:bg-black text-white overflow-hidden shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Your Total Net Worth</p>
            <h2 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-4">
              €{formatCurrency(netWorth)}
            </h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full text-xs">
                <ArrowUpRight className="w-3 h-3" />
                +2.4% this month
              </span>
              <span className="text-zinc-500 text-xs font-medium">Synced with 4 accounts</span>
            </div>
          </div>
          
          <div className="flex gap-8 border-l border-white/10 pl-8">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">€{formatCurrency(totalAssets)}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Debt</p>
              <p className="text-2xl font-bold text-red-400 font-mono">€{formatCurrency(totalLiabilities)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Asset Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-display">Asset Allocation</h3>
              <p className="text-zinc-500 text-xs mt-1">Diversification across categories</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `€${formatCurrency(value)}`}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {assetData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">
                    {((item.value / totalAssets) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Moneyflow AI Advisor</span>
            </div>
            
            <h3 className="text-2xl font-bold font-display mb-4">Strategic Insight</h3>
            
            <div className="space-y-6">
              <button 
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                className="w-full py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center gap-3 font-bold transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Analyze Portfolio</>}
              </button>

              {insights.length > 0 ? (
                insights.map(insight => (
                  <div key={insight.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0">
                    <p className="font-bold mb-1">{insight.title}</p>
                    <p className="text-indigo-100 text-xs leading-relaxed mb-4">{insight.description}</p>
                    <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors">
                      Execute Recommendation
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-xs text-indigo-100 italic">Analysing your assets for opportunities...</p>
                </div>
              )}
            </div>
            
            <button className="mt-8 flex items-center gap-2 text-indigo-100 text-xs font-bold hover:text-white transition-colors">
              View all AI recommendations <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Goals & Predictions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Transactions List */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-display">Recent Activity</h3>
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Real-time tracking</p>
            </div>
            {bankAccounts.length === 0 ? (
              <button 
                onClick={onConnectBank}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all"
              >
                <Link2 className="w-3 h-3" /> Connect Bank
              </button>
            ) : (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
            )}
          </div>
          
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map(tx => {
                const Icon = CATEGORY_ICONS[tx.category] || Receipt;
                return (
                  <div key={tx.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-all border border-zinc-100 dark:border-zinc-800">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{tx.description}</p>
                        <p className="text-[10px] text-zinc-400 capitalize font-medium">{tx.category} • {tx.type}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {tx.type === 'income' ? '+' : '-'}€{formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-10 px-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                <Landmark className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                <p className="text-sm text-zinc-400 mb-4">No bank accounts linked yet</p>
                <button 
                  onClick={onConnectBank}
                  className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl text-xs font-bold"
                >
                  Link your first bank
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold font-display">Financial Goals</h3>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {goals.map(goal => {
              const current = goal.currentAmount || 0;
              const target = goal.targetAmount || 1; // avoid divide by zero
              const percentage = Math.min((current / target) * 100, 100);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">{goal.name}</span>
                    <span className="font-mono text-zinc-500">€{formatCurrency(current)} / €{formatCurrency(target)}</span>
                  </div>
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold font-display">Future Forecast</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-sm text-zinc-500 mb-2">Based on current monthly savings, your net worth in 5 years will be:</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-display">€{formatCurrency(netWorth * 1.45)}</p>
            <p className="text-[10px] text-zinc-400 mt-2 italic">*Estimating 7% annual ROI and current contribution rate</p>
          </div>
        </section>
      </div>
    </div>
  );
}
