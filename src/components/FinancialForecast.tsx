import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend, ReferenceDot
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  Plus, Calendar, Calculator, Info, ShieldCheck, X 
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { formatMoney, formatCompactMoney } from '../utils/format';
import { projectWealthEvolution } from '../utils/financialCalculations';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';
import { FutureEvent } from '../types';

export default function FinancialForecast() {
  const { 
    assets, liabilities, transactions, bankAccounts, cryptoWallets, investmentAccounts 
  } = useFinancial();

  const [projectionYears, setProjectionYears] = useState(10);
  const [scenarios, setScenarios] = useState<FutureEvent[]>([]);
  const [isAddingScenario, setIsAddingScenario] = useState(false);

  // Form State for new scenario
  const [newScenario, setNewScenario] = useState<{
    label: string;
    amount: string;
    type: FutureEvent['type'];
    monthsFromNow: string;
  }>({
    label: 'Home Purchase',
    amount: '50000',
    type: 'one_time_purchase',
    monthsFromNow: '24'
  });

  const netWorth = assets.reduce((s, a) => s + a.value, 0) + 
                   bankAccounts.reduce((s, b) => s + b.balance, 0) +
                   cryptoWallets.reduce((s, w) => s + (w.nativeBalance || 0), 0) -
                   liabilities.reduce((s, l) => s + l.remainingAmount, 0);

  const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const currentSavings = Math.max(0, monthlyIncome - monthlyExpenses);

  const data = useMemo(() => {
    return projectWealthEvolution(netWorth, currentSavings, projectionYears, scenarios);
  }, [netWorth, currentSavings, projectionYears, scenarios]);

  const handleAddScenario = () => {
    const amount = parseFloat(newScenario.amount);
    const months = parseInt(newScenario.monthsFromNow);
    const date = new Date();
    date.setMonth(date.getMonth() + months);

    const event: FutureEvent = {
      id: `sim-${Date.now()}`,
      label: newScenario.label,
      amount: isNaN(amount) ? 0 : amount,
      type: newScenario.type,
      date: Timestamp.fromDate(date)
    };

    setScenarios([...scenarios, event]);
    setIsAddingScenario(false);
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Scenario Engine</h2>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px] mt-1">Predictive Future Matrix • Gemini Optimized</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
          {[5, 10, 20].map(y => (
            <button 
              key={y}
              onClick={() => setProjectionYears(y)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${projectionYears === y ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              {y} Years
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass-card rounded-[3.5rem] p-8 md:p-12 shadow-premium relative overflow-hidden h-[500px]">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Calculator className="w-64 h-64 text-indigo-500" />
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} 
                interval={Math.floor(data.length / 6)}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}}
                tickFormatter={(val) => formatCompactMoney(val)}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2">{d.month}</p>
                        <p className="text-xl font-black text-white">{formatMoney(d.netWorth)}</p>
                        {d.events && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                            {d.events.map((e: string, i: number) => (
                              <p key={i} className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-2.5 h-2.5" /> {e}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorNetWorth)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 shadow-premium">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scenarios</h3>
               <button 
                onClick={() => setIsAddingScenario(true)}
                className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"
               >
                 <Plus className="w-4 h-4" />
               </button>
            </div>

            <div className="space-y-3">
              {scenarios.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group">
                   <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[100px]">{s.label}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{s.date.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black ${s.type.includes('purchase') ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {s.type.includes('purchase') ? '-' : '+'}{formatCompactMoney(s.amount)}
                      </span>
                      <button onClick={() => removeScenario(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                   </div>
                </div>
              ))}
              {scenarios.length === 0 && (
                <div className="py-10 text-center">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No custom events active.<br/>Add a "What-If" to simulate.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="glass-card rounded-[2.5rem] p-8 bg-zinc-900 text-white shadow-premium">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 italic flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-indigo-400" /> Horizon Verdict
             </p>
             <div className="space-y-6">
                <div>
                   <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Savings Velocity</p>
                   <p className="text-2xl font-black text-emerald-400">{formatMoney(currentSavings)}<span className="text-xs">/mo</span></p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Final Net Worth ({projectionYears}y)</p>
                   <p className="text-2xl font-black text-white">{formatMoney(data[data.length - 1].netWorth)}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Add Scenario Modal */}
      <AnimatePresence>
        {isAddingScenario && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingScenario(false)} className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-white/10"
            >
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-8">Add Simulation Event</h3>
               
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-4">Event Label</label>
                    <input 
                      type="text" value={newScenario.label} onChange={e => setNewScenario({...newScenario, label: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-4">Amount</label>
                      <input 
                        type="number" value={newScenario.amount} onChange={e => setNewScenario({...newScenario, amount: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-4">Months from now</label>
                      <input 
                        type="number" value={newScenario.monthsFromNow} onChange={e => setNewScenario({...newScenario, monthsFromNow: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-4">Type</label>
                    <select 
                      value={newScenario.type} onChange={e => setNewScenario({...newScenario, type: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="one_time_purchase">One-time Purchase (-)</option>
                      <option value="one_time_income">One-time Windfall (+)</option>
                      <option value="recurring_income_change">Recurring Income Change (+)</option>
                      <option value="recurring_expense_change">Recurring Expense Change (-)</option>
                    </select>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleAddScenario}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                    >
                       Inject Into Future <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
