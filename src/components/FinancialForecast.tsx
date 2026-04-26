import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Activity,
  Calculator,
  AlertCircle,
  PiggyBank,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { Asset, Liability, Transaction, BankAccount, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';

interface FinancialForecastProps {
  assets: Asset[];
  liabilities: Liability[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  userProfile?: UserProfile;
}

export default function FinancialForecast({ 
  assets, 
  liabilities, 
  transactions, 
  bankAccounts,
  userProfile 
}: FinancialForecastProps) {
  const [projectionYears, setProjectionYears] = useState(5);
  const [simulatedMonthlyIncome, setSimulatedMonthlyIncome] = useState<number | null>(null);
  const [growthRate, setGrowthRate] = useState(5); // Annual growth rate in %

  // Calculate base monthly variables
  const analysis = useMemo(() => {
    // 1. Current Liquidity (Cash & Bank)
    const totalCash = bankAccounts.reduce((sum, b) => sum + b.balance, 0) +
                     assets.filter(a => a.type === 'cash' || a.type === 'savings').reduce((sum, a) => sum + a.value, 0);

    // 2. Net Worth
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabs = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
    const currentNetWorth = totalAssets - totalLiabs;

    // 3. Monthly Income (Real vs Manual)
    // Filter transactions from the last 30 days to estimate income/expense
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentIncomeTxs = transactions.filter(t => t.type === 'income' && t.date.toDate() > thirtyDaysAgo);
    const realMonthlyIncome = recentIncomeTxs.reduce((sum, t) => sum + t.amount, 0);

    const effectiveIncome = simulatedMonthlyIncome !== null ? simulatedMonthlyIncome : (realMonthlyIncome || userProfile?.monthlyIncomeTarget || 0);

    // 4. Monthly Expenses
    const recentExpenseTxs = transactions.filter(t => t.type === 'expense' && t.date.toDate() > thirtyDaysAgo);
    const realMonthlyExpenses = recentExpenseTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Add monthly liability payments
    const monthlyDebtPayments = liabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);
    const totalMonthlyExpenses = realMonthlyExpenses + monthlyDebtPayments;

    const monthlySurplus = effectiveIncome - totalMonthlyExpenses;

    return {
      totalCash,
      currentNetWorth,
      effectiveIncome,
      totalMonthlyExpenses,
      monthlySurplus,
      realMonthlyIncome,
      totalAssets,
      totalLiabs,
      monthlyDebtPayments
    };
  }, [assets, liabilities, transactions, bankAccounts, userProfile, simulatedMonthlyIncome]);

  // Generate Projection Data
  const projectionData = useMemo(() => {
    const data = [];
    let projectedCash = analysis.totalCash;
    let projectedNetWorth = analysis.currentNetWorth;
    
    // Starting point (Month 0)
    data.push({
      monthName: 'Now',
      monthIndex: 0,
      cash: projectedCash,
      netWorth: projectedNetWorth
    });

    const totalMonths = projectionYears * 12;
    const monthlyGrowth = 1 + (growthRate / 100 / 12);

    for (let i = 1; i <= totalMonths; i++) {
      // Net Worth grows by surplus + asset appreciation (simulated)
      // We assume investment assets grow, but liabilities stay flat or decrease
      // For simplicity in this High-IQ simulation:
      // NW_new = NW_old + Surplus + (Investments * monthlyGrowth)
      
      const investmentValue = assets.filter(a => ['investment', 'crypto', 'real_estate'].includes(a.type)).reduce((sum, a) => sum + a.value, 0);
      const appreciation = investmentValue * (monthlyGrowth - 1);
      
      projectedCash += analysis.monthlySurplus;
      projectedNetWorth += analysis.monthlySurplus + appreciation;

      // Only add data points for every 6 months to keep chart clean
      if (i % 6 === 0) {
        data.push({
          monthName: `Yr ${Math.floor(i/12)}${i%12 === 0 ? '' : '.5'}`,
          monthIndex: i,
          cash: Math.max(0, projectedCash),
          netWorth: Math.max(0, projectedNetWorth)
        });
      }
    }

    return data;
  }, [analysis, projectionYears, growthRate, assets]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-10 rounded-[3rem] shadow-premium">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 addictive-gradient rounded-xl shadow-lg shadow-indigo-500/20">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Forecast Engine</p>
          </div>
          <h2 className="text-4xl font-black font-display tracking-tight text-slate-800 dark:text-white">
            Wealth Trajectory
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md font-medium">
            Advanced algorithmic simulation of your future capital based on multi-variable flows.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Time Horizon</span>
            <select 
              value={projectionYears} 
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              className="px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl text-sm font-black border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-700 dark:text-white"
            >
              <option value={1}>1 Year Horizon</option>
              <option value={3}>3 Year Stated</option>
              <option value={5}>5 Year Strategic</option>
              <option value={10}>10 Year Vision</option>
              <option value={20}>20 Year Legacy</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Yield expectation</span>
            <div className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <input 
                type="number" 
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-12 bg-transparent border-none text-sm font-black focus:ring-0 text-slate-900 dark:text-white"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase">% APR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SimulationCard 
          title="Monthly Income" 
          value={analysis.effectiveIncome}
          isEditable
          onSimulate={(val) => setSimulatedMonthlyIncome(val)}
          originalValue={analysis.realMonthlyIncome}
          icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
        />
        <AnalysisCard 
          title="Burn Rate" 
          value={analysis.totalMonthlyExpenses} 
          subtitle={`${formatCurrency(analysis.monthlyDebtPayments)} recurring debt`}
          icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          color="rose"
        />
        <AnalysisCard 
          title="Capital Surplus" 
          value={analysis.monthlySurplus} 
          subtitle={`${((analysis.monthlySurplus / (analysis.effectiveIncome || 1)) * 100).toFixed(1)}% efficiency`}
          icon={<PiggyBank className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <AnalysisCard 
          title="Current Base" 
          value={analysis.currentNetWorth} 
          subtitle={`${assets.length} active positions`}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          color="blue"
        />
      </div>

      {/* Main Chart */}
      <div className="glass-card p-10 rounded-[3rem] shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Growth Simulation</h3>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Compound growth visualization over {projectionYears} years</p>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Net Worth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Liquid Cash</span>
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis 
                dataKey="monthName" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                dy={15}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(val) => `€${val > 999 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  padding: '20px'
                }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}
                labelStyle={{ color: '#6366f1', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '8px' }}
                formatter={(val: number) => [`€${formatCurrency(val)}`, 'Position']}
              />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorNetWorth)" 
                animationDuration={2500}
                activeDot={{ r: 8, stroke: '#fff', strokeWidth: 4, fill: '#6366f1' }}
              />
              <Area 
                type="monotone" 
                dataKey="cash" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCash)" 
                strokeDasharray="8 8"
                animationDuration={3000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-8 addictive-gradient rounded-3xl text-white shadow-glow flex gap-6 items-center"
        >
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-sm">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Algorithmic Forecast Summary</p>
            <p className="font-medium text-lg tracking-tight leading-relaxed">
              Based on your momentum, your net worth is trajectorying towards <span className="font-black text-white underline decoration-white/30 underline-offset-4">{formatCurrency(projectionData[projectionData.length-1].netWorth)}</span> by the end of this period.
            </p>
          </div>
        </motion.div>
      </div>
    </div>

  );
}

function AnalysisCard({ title, value, subtitle, icon, color }: { title: string, value: number, subtitle: string, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.indigo}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
          {formatCurrency(value)}
        </p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function SimulationCard({ title, value, isEditable, onSimulate, originalValue, icon }: { title: string, value: number, isEditable?: boolean, onSimulate: (val: number | null) => void, originalValue: number, icon: React.ReactNode }) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleApply = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      onSimulate(val);
    } else {
      onSimulate(null);
    }
    setIsEditing(false);
  };

  const reset = () => {
    onSimulate(null);
    setInputValue(originalValue.toString());
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-md ring-1 ring-indigo-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        {value !== originalValue && (
          <button 
            onClick={reset}
            className="text-[10px] uppercase tracking-wider font-bold text-rose-500 hover:underline"
          >
            Reset
          </button>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          {title} 
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 px-1 rounded text-indigo-600">SIMULATED</span>
        </p>
        
        {isEditing ? (
          <div className="flex items-center mt-1 gap-2">
            <input 
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-1 text-lg font-bold"
              autoFocus
            />
            <button onClick={handleApply} className="p-1 bg-indigo-500 text-white rounded"><ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : (
          <p 
            className="text-xl font-bold text-slate-900 dark:text-white mt-1 cursor-pointer hover:text-indigo-500 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {formatCurrency(value)}
          </p>
        )}
        
        <p className="text-xs text-slate-500 mt-1">Real: {formatCurrency(originalValue)}</p>
      </div>
    </div>
  );
}
