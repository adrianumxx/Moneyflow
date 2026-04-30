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
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Asset, Liability, Transaction, BankAccount, UserProfile } from '../types';
import { formatMoney, formatCompactMoney } from '../utils/format';
import { 
  calculateTotalAssets, 
  calculateTotalLiabilities, 
  calculateNetWorth, 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses 
} from '../utils/financialCalculations';

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
  
  // Calculate default growth rate from assets
  const defaultGrowthRate = useMemo(() => {
    const totalVal = assets.reduce((sum, a) => sum + a.value, 0);
    if (totalVal <= 0) return 7;
    return assets.reduce((sum, a) => sum + (a.value * (a.annualReturn || 0)), 0) / totalVal;
  }, [assets]);

  const [simulatedGrowthRate, setSimulatedGrowthRate] = useState<number | null>(null);
  const growthRate = simulatedGrowthRate !== null ? simulatedGrowthRate : defaultGrowthRate;

  // Calculate base monthly variables
  const analysis = useMemo(() => {
    // 1. Current Liquidity (Cash & Bank)
    const bankBalancesSum = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
    const manualCashSum = assets.filter(a => a.type === 'cash' || a.type === 'savings').reduce((sum, a) => sum + (a.value || 0), 0);
    const totalCash = bankBalancesSum + manualCashSum;

    // 2. Net Worth & Assets
    const totalAssets = calculateTotalAssets(assets, bankAccounts);
    const totalLiabs = calculateTotalLiabilities(liabilities);
    const currentNetWorth = calculateNetWorth(assets, bankAccounts, liabilities);

    // 3. Monthly Income (Real vs Manual)
    const realMonthlyIncome = calculateMonthlyIncome(transactions);
    const effectiveIncome = simulatedMonthlyIncome !== null ? simulatedMonthlyIncome : (realMonthlyIncome || userProfile?.monthlyIncomeTarget || 0);

    // 4. Monthly Expenses
    const totalMonthlyExpenses = calculateMonthlyExpenses(transactions, liabilities);
    const monthlySurplus = effectiveIncome - totalMonthlyExpenses;

    const monthlyDebtPayments = liabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-premium">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 addictive-gradient rounded-xl shadow-lg shadow-indigo-500/20">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Forecast Engine</p>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black font-display tracking-tight text-slate-800 dark:text-white">
              Future Growth
            </h2>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                Shows possible outcomes, not predictions. Based on your current data and selected rate.
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-1 max-w-md font-medium">
            Projection based on your current spending and savings.
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
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Growth</span>
              <div className="group relative">
                <Info className="w-2.5 h-2.5 text-slate-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Calculated from your current assets and historical data.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <input 
                type="number" 
                step="0.1"
                value={growthRate.toFixed(1)}
                onChange={(e) => setSimulatedGrowthRate(Number(e.target.value))}
                className="w-12 bg-transparent border-none text-sm font-black focus:ring-0 text-slate-900 dark:text-white"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase">% APR</span>
              {simulatedGrowthRate !== null && (
                <button 
                  onClick={() => setSimulatedGrowthRate(null)}
                  className="text-[9px] font-bold text-rose-500 hover:underline"
                >
                  RESET
                </button>
              )}
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
          currency={userProfile?.baseCurrency}
        />
        <AnalysisCard 
          title={
            <div className="flex items-center gap-2">
              <span>Monthly Spending</span>
              <div className="group relative">
                <Info className="w-2.5 h-2.5 text-rose-400/50 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-40 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Your recent spending trend based on available data.
                </div>
              </div>
            </div>
          }
          value={analysis.totalMonthlyExpenses} 
          subtitle={`${formatMoney(analysis.monthlyDebtPayments, userProfile?.baseCurrency)} recurring debt`}
          icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          color="rose"
          currency={userProfile?.baseCurrency}
        />
        <AnalysisCard 
          title="Monthly Surplus" 
          value={analysis.monthlySurplus} 
          subtitle={`${((analysis.monthlySurplus / (analysis.effectiveIncome || 1)) * 100).toFixed(1)}% savings rate`}
          icon={<PiggyBank className="w-5 h-5 text-emerald-500" />}
          color="emerald"
          currency={userProfile?.baseCurrency}
        />
        <AnalysisCard 
          title="Current Base" 
          value={analysis.currentNetWorth} 
          subtitle={`${assets.length} active positions`}
          icon={<Activity className="w-5 h-5 text-blue-500" />}
          color="blue"
          currency={userProfile?.baseCurrency}
        />
      </div>

      {/* Main Chart */}
      <div className="glass-card p-5 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-800 dark:text-white">Projection</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-tight">Compound growth visualization over {projectionYears} years</p>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400">Net Worth</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/20" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400">Liquid Cash</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] sm:h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                dy={10}
                minTickGap={20}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                tickFormatter={(val) => formatCompactMoney(val, userProfile?.baseCurrency)}
                width={35}
              />
              <Tooltip 
                allowEscapeViewBox={{ x: true, y: true }}
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 800, padding: 0 }}
                labelStyle={{ color: '#6366f1', fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em', marginBottom: '4px' }}
                formatter={(val: number) => [formatMoney(val, userProfile?.baseCurrency), 'Value']}
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
          className="mt-8 sm:mt-12 p-5 sm:p-8 addictive-gradient rounded-3xl text-white shadow-glow flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-left"
        >
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-sm">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Forecast Summary</p>
            <p className="font-medium text-base sm:text-lg tracking-tight leading-relaxed">
              Based on your momentum, your net worth is on track towards <span className="font-black text-white underline decoration-white/30 underline-offset-4">{formatMoney(projectionData[projectionData.length-1].netWorth, userProfile?.baseCurrency)}</span> by the end of this period.
            </p>
          </div>
        </motion.div>
      </div>
    </div>

  );
}

function AnalysisCard({ title, value, subtitle, icon, color, currency }: { title: React.ReactNode, value: number, subtitle: string, icon: React.ReactNode, color: string, currency?: string }) {
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
          {formatMoney(value, currency)}
        </p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function SimulationCard({ title, value, isEditable, onSimulate, originalValue, icon, currency }: { title: React.ReactNode, value: number, isEditable?: boolean, onSimulate: (val: number | null) => void, originalValue: number, icon: React.ReactNode, currency?: string }) {
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
            {formatMoney(value, currency)}
          </p>
        )}
        
        <p className="text-xs text-slate-500 mt-1">Real: {formatMoney(originalValue, currency)}</p>
      </div>
    </div>
  );
}
