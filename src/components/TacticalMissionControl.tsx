import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, TrendingUp, TrendingDown, Minus, 
  Target, Globe, Zap, Loader2, Info, ArrowRight,
  BarChart3, Activity
} from 'lucide-react';
import { TacticalBrief } from '../types';
import { useFinancial } from '../context/FinancialContext';
import { authenticatedFetch } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';

export default function TacticalMissionControl() {
  const { assets, liabilities, goals, bankAccounts, cryptoWallets } = useFinancial();
  const [brief, setBrief] = useState<TacticalBrief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotifications();

  const fetchBrief = async () => {
    if (assets.length === 0 && bankAccounts.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/gemini/tactical-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets, liabilities, goals, bankAccounts, cryptoWallets })
      });

      if (!response.ok) throw new Error('Oracle unreachable');
      const data = await response.json();
      setBrief(data);
    } catch (error) {
      console.error(error);
      showNotification('Mission Control', 'Failed to synchronize strategic signals.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [assets.length]); // Refresh when core data changes

  if (isLoading && !brief) {
    return (
      <div className="w-full p-8 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/50">Synchronizing Strategic Matrix</p>
      </div>
    );
  }

  if (!brief) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full bg-zinc-950 border border-indigo-500/20 rounded-[3rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Mission Command</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Live Probabilistic Analysis</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Risk Score</p>
              <p className={`text-xl font-black ${brief.riskScore > 70 ? 'text-rose-500' : brief.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {brief.riskScore}
              </p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Sentiment</p>
              <p className={`text-xs font-black uppercase tracking-widest ${brief.marketSentiment === 'bullish' ? 'text-emerald-400' : brief.marketSentiment === 'bearish' ? 'text-rose-400' : 'text-indigo-400'}`}>
                {brief.marketSentiment}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Verdict */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Oracle Statement</h3>
              <p className="text-2xl sm:text-3xl font-black text-white leading-[1.1] tracking-tight">
                "{brief.verdict}"
              </p>
            </div>

            <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem]">
               <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Recommended Action</h4>
               </div>
               <p className="text-sm font-medium text-indigo-100 leading-relaxed">
                 {brief.recommendedAction}
               </p>
            </div>

            {/* Macro Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {brief.macroSignals.map((sig, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[8px] font-black text-zinc-500 uppercase truncate">{sig.label}</p>
                    {sig.impact === 'positive' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : sig.impact === 'negative' ? <TrendingDown className="w-3 h-3 text-rose-500" /> : <Minus className="w-3 h-3 text-indigo-500" />}
                  </div>
                  <p className="text-xs font-black text-white truncate">{sig.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Probabilities */}
          <div className="space-y-6 lg:border-l lg:border-white/10 lg:pl-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Objective Stability</h3>
             <div className="space-y-5">
               {brief.goalProbabilities.map((goal, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-white uppercase">{goal.name}</p>
                      <p className={`text-xs font-black ${goal.probability > 70 ? 'text-emerald-500' : goal.probability > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {goal.probability}%
                      </p>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${goal.probability}%` }}
                        className={`h-full ${goal.probability > 70 ? 'bg-emerald-500' : goal.probability > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      />
                   </div>
                   <p className="text-[9px] text-zinc-500 font-bold leading-tight uppercase italic">{goal.insight}</p>
                 </div>
               ))}
               {brief.goalProbabilities.length === 0 && (
                 <div className="py-10 text-center opacity-30">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase">No goals detected</p>
                 </div>
               )}
             </div>
             
             <button 
              onClick={fetchBrief}
              className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 transition-all flex items-center justify-center gap-2"
             >
                <Globe className="w-3 h-3" /> Refresh Oracle Signals
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
