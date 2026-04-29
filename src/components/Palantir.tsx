import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Zap, ShieldAlert, Lock, RefreshCw, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, BookOpen, AlertCircle, CheckCircle2, Info, ArrowRight, Bot
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPalantirIntelligence, PalantirIntelligence, PalantirNewsItem } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';
import { Asset, Liability, FinancialGoal as Goal, UserProfile, Transaction, BankAccount, ConnectedInstitution, ConnectedAccount, CryptoWallet, InvestmentAccount, Income } from '../types';
import { authenticatedFetch } from '../utils/api';
import { formatMoney } from '../utils/format';

interface PalantirProps {
  assets?: Asset[];
  liabilities?: Liability[];
  goals?: Goal[];
  transactions?: Transaction[];
  bankAccounts?: BankAccount[];
  connectedInstitutions?: ConnectedInstitution[];
  connectedAccounts?: ConnectedAccount[];
  cryptoWallets?: CryptoWallet[];
  investmentAccounts?: InvestmentAccount[];
  income?: Income[];
  userProfile?: UserProfile | null;
  onAskAI?: (prompt: string) => void;
}

export default function Palantir({ 
  assets, 
  liabilities, 
  goals, 
  transactions,
  bankAccounts,
  connectedInstitutions,
  connectedAccounts,
  cryptoWallets,
  investmentAccounts,
  income,
  userProfile, 
  onAskAI 
}: PalantirProps) {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<PalantirIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('All Clusters');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [loginStreak, setLoginStreak] = useState(0);
  const { showNotification } = useNotifications();

  const isPremium = true; // TEMPORARY BYPASS: userProfile?.plan === 'premium' || userProfile?.subscriptionStatus === 'active' || userProfile?.subscriptionStatus === 'trialing';

  const clusters = [
    'All Clusters',
    'Macro Finance',
    'Digital Assets',
    'AI Infrastructure',
    'DeepTech',
    'Geopolitics',
    'Energy / Minerals'
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const language = i18n.language || 'en';
      const intel = await getPalantirIntelligence(
        userProfile?.uid || 'demo-user',
        new Date().toISOString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        language,
        { 
          assets: assets || [], 
          liabilities: liabilities || [], 
          goals: goals || [],
          transactions,
          bankAccounts,
          connectedInstitutions,
          connectedAccounts,
          cryptoWallets,
          investmentAccounts,
          income
        },
        userProfile
      );
      setData(intel);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Palantir Error:", error);
      showNotification('Intelligence Offline', 'Could not sync with global signals.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 4 hours
    const interval = setInterval(fetchData, 4 * 60 * 60 * 1000);
    
    // Gamification Login Streak
    const streak = parseInt(localStorage.getItem('palantir_streak') || '0', 10);
    const lastLogin = localStorage.getItem('palantir_last_login');
    const today = new Date().toDateString();
    
    let newStreak = streak;
    if (lastLogin !== today) {
      newStreak = lastLogin === new Date(Date.now() - 86400000).toDateString() ? streak + 1 : 1;
      localStorage.setItem('palantir_last_login', today);
      localStorage.setItem('palantir_streak', newStreak.toString());
    }
    setLoginStreak(newStreak < 3 ? 3 : newStreak); // Force 3 minimum for demo showcase!

    return () => clearInterval(interval);
  }, [i18n.language]);

  // Filter logic
  const filteredVectors = useMemo(() => {
    if (!data?.probabilityVectors) return [];
    return data.probabilityVectors.filter(v => 
      (selectedCluster === 'All Clusters' || v.cluster === selectedCluster) &&
      (v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, selectedCluster, searchQuery]);

  const filteredSignals = useMemo(() => {
    if (!data?.signalsAndAlpha) return [];
    return data.signalsAndAlpha.filter(s => 
      (selectedCluster === 'All Clusters' || s.cluster === selectedCluster) &&
      (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.explanation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, selectedCluster, searchQuery]);

  const filteredRisks = useMemo(() => {
    if (!data?.activeRisks) return [];
    return data.activeRisks.filter(r => 
      (selectedCluster === 'All Clusters' || r.cluster === selectedCluster) &&
      (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.explanation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, selectedCluster, searchQuery]);

  const filteredNews = useMemo(() => {
    if (!data?.newsFeed) return [];
    return data.newsFeed.filter(n => 
      n.headline.toLowerCase().includes(searchQuery.toLowerCase()) || n.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);


  const getOrbColors = (state?: 'stable' | 'caution' | 'critical') => {
    switch(state) {
      case 'stable': return { text: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' };
      case 'critical': return { text: 'text-rose-500', glow: 'shadow-rose-500/30', border: 'border-rose-500/40', bg: 'bg-rose-500/10' };
      case 'caution':
      default: return { text: 'text-amber-500', glow: 'shadow-amber-500/20', border: 'border-amber-500/30', bg: 'bg-amber-500/5' };
    }
  };

  const orbColors = getOrbColors(data?.orb?.state);
  const isDefcon1 = data?.orb?.state === 'critical' || (data?.orb?.activeRisksCount && data.orb.activeRisksCount >= 2);
  const pulseDuration = isDefcon1 ? 1 : 4;
  const rotateDurationOuter = isDefcon1 ? 10 : 40;
  const rotateDurationInner = isDefcon1 ? 8 : 30;
  
  if (isDefcon1) {
    orbColors.glow = 'shadow-[0_0_80px_rgba(225,29,72,0.8)]';
    orbColors.text = 'text-rose-600 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]';
    orbColors.border = 'border-rose-600/70';
    orbColors.bg = 'bg-rose-950/40';
  }

  const handleUpgrade = async () => {
    if (!userProfile?.email) {
      showNotification('Profile Required', 'Please complete your profile to continue.', 'info');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authenticatedFetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.uid,
          userEmail: userProfile.email
        }),
      });
      
      const session = await response.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No session URL received');
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      showNotification('Checkout Error', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-40 lg:pb-32 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-amber-500/30">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Globe className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Palantir</h1>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">AI Simulation</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Neural Intelligence Active • {isLoading ? "Scanning Global News & Trends..." : "Live Data Synthesis"}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Filter intelligence..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-sm rounded-xl px-4 py-2.5 w-full sm:w-64 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-white placeholder-slate-600 font-medium"
          />
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all disabled:opacity-50 group"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative w-32 h-32 flex items-center justify-center">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="absolute inset-0 border-2 border-amber-500/20 rounded-full"
             />
             <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }} 
               transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
               className="absolute inset-4 border-2 border-amber-500/40 rounded-full"
             />
             <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-widest text-amber-500/70">Palantir is analyzing global data...</p>
        </div>
      ) : data ? (
        <div className="space-y-8 relative">

          {/* UPGRADE OVERLAY FOR NON-PREMIUM */}
          {!isPremium && (
            <div className="absolute inset-0 z-40 flex items-start justify-center pt-96">
               <div className="sticky top-[20%] w-full max-w-xl p-8 rounded-[3rem] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] text-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-500" />
                  
                  <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
                    <Lock className="w-10 h-10 text-amber-500" />
                  </div>
                  
                  <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Advanced Analysis Locked</h2>
                  <p className="text-slate-400 font-medium leading-relaxed mb-8">
                    Upgrade to access proprietary probability vectors, structural signals, and active risk analysis. <br/>
                    <span className="text-amber-500 font-bold italic">Start your 7-day free trial today.</span>
                  </p>

                  <div className="mb-10 px-8">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                       <span>Palantir Capacity</span>
                       <span className="text-amber-500">94%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[94%] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>
                    <p className="mt-3 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       <ShieldAlert className="w-3 h-3" /> Only 312 Executive spots remaining
                    </p>
                  </div>

                  <button 
                    onClick={handleUpgrade}
                    className="w-full py-5 bg-amber-500 text-slate-950 font-black text-base uppercase tracking-[0.1em] rounded-2xl hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20"
                  >
                    Unlock Palantir
                  </button>
               </div>
            </div>
          )}          <div className={`space-y-12 ${!isPremium ? 'blur-md select-none pointer-events-none opacity-50' : ''}`}>

          {/* Desktop Metric Cards */}
          <div className="hidden lg:grid grid-cols-6 gap-4">
             {data.metrics?.map(metric => <MetricCard key={metric.id} metric={metric} />)}
          </div>

          {/* 1. STRATEGIC COUNSEL SECTION */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="h-4 w-1 bg-amber-500 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Strategic Pulse</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* THE ORB (Left on Desktop) */}
              <div className="lg:col-span-5 flex items-center justify-center bg-slate-900/30 border border-slate-800/50 rounded-[3rem] p-8 backdrop-blur-sm h-full">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: rotateDurationOuter, ease: "linear" }}
                    className={`absolute inset-0 rounded-full border border-dashed ${orbColors.border} opacity-50`}
                  />
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ repeat: Infinity, duration: rotateDurationInner, ease: "linear" }}
                    className={`absolute inset-4 rounded-full border-t border-r ${orbColors.border} opacity-70`}
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }} 
                    transition={{ repeat: Infinity, duration: pulseDuration, ease: "easeInOut" }}
                    className={`absolute inset-8 rounded-full ${orbColors.bg} backdrop-blur-md shadow-2xl ${orbColors.glow} border ${orbColors.border} flex flex-col items-center justify-center p-6 text-center transition-all duration-1000`}
                  >
                    <span className={`text-5xl font-black tracking-tighter ${orbColors.text} drop-shadow-lg`}>
                      {data.orb.confidenceScore}%
                    </span>
                    <p className="mt-3 text-xs font-bold text-white leading-tight">
                      {data.orb.statusLine}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* NARRATIVE & SEMAPHORE (Right on Desktop) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative h-full">
                  {loginStreak >= 3 && (
                    <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-indigo-500/30">
                      Day {loginStreak} Streak
                    </div>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Strategic Counsel</p>
                  <p className="text-lg font-medium leading-relaxed text-slate-200">
                    {data.narrative}
                  </p>
                  
                  {/* SEMAPHORE (Integrated) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                    {data.semaphore?.map((sig, i) => (
                      <div key={i} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          sig.state === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          sig.state === 'YELLOW' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                          'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        }`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">{sig.category.replace('_', ' ')}</p>
                          <p className="text-xs font-medium text-slate-300">{sig.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. PERSONAL IMPACT SECTION */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="h-4 w-1 bg-indigo-500 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Personal Impact</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* YIELD OPTIMIZER */}
              {data.yieldOptimizer && (
                <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70">Yield Optimizer</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4 flex-grow">{data.yieldOptimizer.detectedInefficiency}</p>
                  <div className="bg-slate-950/40 rounded-xl p-3 mb-4 border border-emerald-900/20">
                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">Strategy</p>
                    <p className="text-xs font-bold text-white">{data.yieldOptimizer.actionableStrategy}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Est. Annual Alpha</p>
                      <p className="text-2xl font-black text-emerald-400">+{formatMoney(data.yieldOptimizer.estimatedAnnualAlpha, userProfile?.baseCurrency)}</p>
                    </div>
                    <button 
                      onClick={() => onAskAI?.(`Dettagli strategia yield: ${data.yieldOptimizer?.actionableStrategy}`)}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500/30 transition-all"
                    >
                      Analyze Impact
                    </button>
                  </div>
                </div>
              )}

              {/* FISCAL AWARENESS */}
              {data.taxShield && (
                <div className="bg-violet-950/10 border border-violet-900/30 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <ShieldAlert className="w-5 h-5 text-violet-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-500/70">Fiscal Awareness</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4 flex-grow">{data.taxShield.description}</p>
                  <div className="bg-slate-950/40 rounded-xl p-3 mb-4 border border-violet-900/20">
                    <p className="text-[10px] font-black uppercase text-violet-500 mb-1">Action</p>
                    <p className="text-xs font-bold text-white">{data.taxShield.taxOptimizationAction}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${data.taxShield.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {data.taxShield.riskLevel}
                    </span>
                    <button 
                      onClick={() => onAskAI?.(`Ottimizzazione fiscale: ${data.taxShield?.taxOptimizationAction}`)}
                      className="px-3 py-2 bg-violet-500/20 text-violet-400 rounded-lg text-[10px] font-black uppercase hover:bg-violet-500/30 transition-all"
                    >
                      Explain Signal
                    </button>
                  </div>
                </div>
              )}

              {/* SILENT NEGOTIATOR */}
              {data.negotiator && (
                <div className="bg-sky-950/10 border border-sky-900/30 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingDown className="w-5 h-5 text-sky-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-500/70">Silent Negotiator</span>
                  </div>
                  <div className="space-y-2 mb-4 flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Target Expense</span>
                      <span className="text-xs font-bold text-white">{data.negotiator.targetExpense}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Market Potential</span>
                      <span className="text-xs font-bold text-sky-400">{data.negotiator.currentMarketRate}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Annual Savings</p>
                      <p className="text-2xl font-black text-sky-400">+{formatMoney(data.negotiator.potentialSavings, userProfile?.baseCurrency)}</p>
                    </div>
                    <button 
                      onClick={() => onAskAI?.(`Script negoziazione per ${data.negotiator?.targetExpense}`)}
                      className="px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-[10px] font-black uppercase hover:bg-sky-500/30 transition-all"
                    >
                      Review Assumption
                    </button>
                  </div>
                </div>
              )}

              {/* BLACK SWAN */}
              {data.blackSwan && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Black Swan Protocol</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-4 flex-grow leading-relaxed">{data.blackSwan.survivalAssessment}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-slate-500">Liquid Runway</span>
                      <span className="text-white">{data.blackSwan.runwayMonths} Months</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${data.blackSwan.runwayMonths < 3 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((data.blackSwan.runwayMonths / 12) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ARBITRAGE */}
              {data.arbitrageFinder && (
                <div className="bg-fuchsia-950/10 border border-fuchsia-900/30 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Globe className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-fuchsia-500/70">Arbitrage Finder</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-4 flex-grow italic">"{data.arbitrageFinder.action}"</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Efficiency Gap</p>
                      <p className="text-2xl font-black text-fuchsia-400">+{data.arbitrageFinder.arbitrageSpread}%</p>
                    </div>
                    <button 
                      onClick={() => onAskAI?.(`Dettagli arbitraggio: ${data.arbitrageFinder?.action}`)}
                      className="px-3 py-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg text-[10px] font-black uppercase hover:bg-fuchsia-500/30 transition-all"
                    >
                      Analyze Impact
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION QUEUE */}
              {data.actionQueue && data.actionQueue.length > 0 && (
                <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-3xl p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/70">Action Queue</span>
                  </div>
                  <div className="space-y-3 flex-grow">
                    {data.actionQueue.slice(0, 2).map((action, idx) => (
                      <div key={idx} className="border-l-2 border-indigo-500/30 pl-3">
                        <p className="text-xs font-bold text-white leading-tight">{action.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{action.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. RISK & SCENARIOS SECTION */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="h-4 w-1 bg-rose-500 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Risk & Scenarios</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SCENARIO ENGINE & RINGS */}
              <div className="space-y-6">
                {data.scenarios && data.scenarios.length > 0 && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-5">Scenario Engine</p>
                    <div className="space-y-4">
                      {data.scenarios.slice(0, 3).map((s, i) => (
                        <div key={i} className="border border-slate-800 rounded-2xl p-4 bg-slate-950/50">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-white">{s.title}</p>
                            <span className="text-[10px] font-black text-indigo-400">{s.probability}%</span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{s.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.geopoliticalRings && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-5">Geopolitical Rings</p>
                    <div className="space-y-3">
                      {['state', 'continent', 'world'].map((key) => {
                        const r = (data.geopoliticalRings as any)[key];
                        if (!r) return null;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <div>
                              <p className="text-[9px] font-black uppercase text-slate-500">{key}</p>
                              <p className="text-xs font-bold text-white">{r.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase text-rose-500">Risk</p>
                              <p className="text-xs font-black text-white">{r.riskScore}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* PROBABILITY VECTORS & ACTIVE RISKS */}
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-5">Active Threats</p>
                  <div className="space-y-4">
                    {data.activeRisks?.slice(0, 2).map((risk, i) => (
                      <div key={i} className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-black text-white">{risk.title}</h4>
                          <span className="text-[9px] font-black uppercase text-rose-400">{risk.severity}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{risk.explanation}</p>
                      </div>
                    ))}
                    {data.probabilityVectors?.slice(0, 2).map((vector, i) => (
                      <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold text-white">{vector.title}</h4>
                          <span className="text-sm font-black text-indigo-400">{vector.probability}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${vector.probability}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. GLOBAL INTELLIGENCE SECTION */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="h-4 w-1 bg-sky-500 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Global Intelligence</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* NEWS FEED & INTELLIGENCE FEED (Main) */}
              <div className="lg:col-span-8 space-y-6">
                {filteredNews.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNews.slice(0, 2).map((news, i) => (
                      <div key={i} className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">{news.category}</span>
                          <span className="text-[9px] font-bold text-slate-500">{news.source}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-3 line-clamp-2">{news.headline}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{news.meaning}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {data.intelligenceFeed && data.intelligenceFeed.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.intelligenceFeed.slice(0, 4).map((item, i) => (
                      <div key={i} className="bg-slate-900/40 border border-slate-800/30 rounded-2xl p-5 group hover:bg-slate-900 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-black uppercase text-indigo-400">{item.category}</span>
                          <span className="text-[9px] font-bold text-slate-600">{item.source}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2 line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              {item.title} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ) : item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{item.relevanceToUser}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SIGNALS & ALPHA + EDUCATION (Side) */}
              <div className="lg:col-span-4 space-y-6">
                {data.signalsAndAlpha && data.signalsAndAlpha.length > 0 && (
                  <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-3xl p-6">
                    <p className="text-[10px] font-black uppercase text-emerald-500 mb-4">Alpha Signals</p>
                    <div className="space-y-4">
                      {data.signalsAndAlpha.slice(0, 2).map((signal, i) => (
                        <div key={i}>
                          <h4 className="text-xs font-black text-white uppercase">{signal.title}</h4>
                          <p className="text-[11px] text-slate-300 mt-1">{signal.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.educationalInsight && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                    <p className="text-[10px] font-black uppercase text-amber-500 mb-3">Education</p>
                    <h4 className="text-sm font-bold text-white mb-2">{data.educationalInsight.concept}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{data.educationalInsight.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* LEGAL & RISK DISCLAIMER */}
          <section className="mt-16 pt-8 border-t border-slate-800/50 text-center px-4">
            <p className="text-[9px] sm:text-[10px] text-slate-600 font-medium uppercase tracking-widest leading-relaxed max-w-3xl mx-auto">
              <strong className="text-slate-500 block mb-2">LEGAL & RISK DISCLAIMER</strong>
              Palantir is an autonomous quantitative intelligence engine, not a licensed fiduciary or financial advisor. All Alpha Generators, Strategic Counsels, and Probability Vectors are mathematical analyses based on current market data and probability models. AI architectures are subject to hallucinations and systemic errors. Capital is at risk. Execute independent verification before any capital allocation. Moneyflow assumes no liability for financial losses.
            </p>
          </section>

          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 py-20 font-bold">Nothing critical right now — markets are breathing normally.</div>
      )}
    </div>
  );
}

// Subcomponent for Metric Cards to keep code clean
function MetricCard({ metric }: { metric: any }) {
  const borderColor = 
    metric.alertState === 'GREEN' ? 'border-l-emerald-500' :
    metric.alertState === 'YELLOW' ? 'border-l-amber-500' :
    'border-l-rose-500';

  const labelStr = metric.id.split('_').join(' ').toUpperCase();

  return (
    <div className={`bg-slate-900 border-y border-r border-slate-800 rounded-2xl p-5 border-l-4 ${borderColor} shadow-lg relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        {metric.id === 'cost_of_money' ? <Minus className="w-12 h-12" /> :
         metric.id === 'purchasing_power' ? <TrendingDown className="w-12 h-12" /> :
         metric.id === 'market_mood' ? <AlertCircle className="w-12 h-12" /> :
         metric.id === 'energy_cost' ? <Zap className="w-12 h-12" /> :
         metric.id === 'safe_harbor' ? <CheckCircle2 className="w-12 h-12" /> :
         <Globe className="w-12 h-12" />}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 relative z-10">{labelStr}</p>
      <div className="flex items-baseline gap-2 mb-2 relative z-10">
        <h3 className="text-2xl font-black text-white tracking-tight">{metric.value}</h3>
        {metric.trend && (
          <span className={`text-sm ${metric.trend === 'up' ? 'text-rose-400' : metric.trend === 'down' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-300 leading-snug relative z-10">{metric.explanation}</p>
    </div>
  );
}
