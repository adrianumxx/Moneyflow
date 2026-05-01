import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Zap, ShieldAlert, Lock, RefreshCw, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, BookOpen, AlertCircle, CheckCircle2, Info, ArrowRight, Bot, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPalantirIntelligence, PalantirIntelligence, PalantirNewsItem } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';
import { Asset, Liability, FinancialGoal as Goal, UserProfile, Transaction, BankAccount, ConnectedInstitution, ConnectedAccount, CryptoWallet, InvestmentAccount, Income } from '../types';
import { authenticatedFetch } from '../utils/api';
import { formatMoney } from '../utils/format';
import { assessDataQuality } from '../utils/dataQuality';

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
  const [showIntro, setShowIntro] = useState(false);
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
      showNotification('Intelligence Unavailable', 'Could not sync with global signals.', 'error');
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

    // Check if intro has been dismissed
    const introDismissed = localStorage.getItem('moneyflow_palantir_intro_dismissed');
    if (!introDismissed) {
      setShowIntro(true);
    }

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
  const isActionRequired = data?.orb?.state === 'critical' || (data?.orb?.activeRisksCount && data.orb.activeRisksCount >= 2);
  const pulseDuration = isActionRequired ? 1 : 4;
  const rotateDurationOuter = isActionRequired ? 10 : 40;
  const rotateDurationInner = isActionRequired ? 8 : 30;

  const dataQuality = assessDataQuality({
    assetsCount: assets?.length || 0,
    liabilitiesCount: liabilities?.length || 0,
    transactionsCount: transactions?.length || 0,
    bankAccountsCount: bankAccounts?.length || 0,
    connectedAccountsCount: connectedAccounts?.length || 0,
    goalsCount: goals?.length || 0,
    lastSyncedAt: connectedAccounts?.length && connectedAccounts.length > 0 ? new Date().toISOString() : null
  });
  
  if (isActionRequired) {
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

  const getSourceLabel = (status?: string) => {
    const map: Record<string, string> = {
      connected_data: 'Connected data',
      user_data: 'Manual data',
      estimated_data: 'Estimated insight',
      fallback_data: 'Fallback estimate',
      live_search: 'Market signal',
      model_inference: 'AI estimate',
      cached: 'Cached',
      fallback: 'Fallback'
    };
    return map[status || ''] || status?.replace('_', ' ') || 'Unknown source';
  };

  const StructuredInsightCard = ({ 
    title, 
    why, 
    what, 
    confidence, 
    source, 
    severity,
    icon: Icon
  }: { 
    title: string; 
    why: string; 
    what: string; 
    confidence?: number; 
    source?: string;
    severity?: 'GREEN' | 'YELLOW' | 'RED' | 'IMMEDIATE' | 'THIS WEEK' | 'THIS MONTH' | 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' | 'SAFE' | 'WARNING';
    icon: any;
  }) => {
    const getSeverityColor = (s?: string) => {
      if (!s) return 'text-slate-400';
      if (['RED', 'EXTREME', 'CRITICAL', 'IMMEDIATE'].includes(s)) return 'text-rose-500';
      if (['YELLOW', 'HIGH', 'WARNING', 'THIS WEEK'].includes(s)) return 'text-amber-500';
      return 'text-emerald-500';
    };

    return (
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 group hover:bg-slate-900/60 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center ${getSeverityColor(severity)}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-white leading-tight">{title}</h4>
          </div>
          {confidence !== undefined && (
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-slate-500">Confidence</p>
              <p className="text-[10px] font-black text-indigo-400">{confidence}%</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">What we see</p>
            <p className="text-xs text-slate-300 leading-relaxed">{title}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Why it matters</p>
            <p className="text-xs text-slate-400 leading-relaxed italic">"{why}"</p>
          </div>
          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">What to review</p>
            <p className="text-xs font-bold text-slate-200">{what}</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
            Based on: <span className="text-slate-400">{getSourceLabel(source || data?.sourceStatus)}</span>
          </p>
          {severity && (
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getSeverityColor(severity).replace('text-', 'bg-').replace('-500', '-500/10')}`}>
              {severity}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-40 lg:pb-32 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-amber-500/30">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Globe className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Insights</h1>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-wider">AI Forecast</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Insights System Active • {isLoading ? "Analyzing global news & trends..." : "Market Insights"}
          </p>
          <div className="mt-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full inline-block">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Demo preview — sample insights, not live data</span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            {data?.dataQuality && (
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                data.dataQuality === 'connected_data' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                data.dataQuality === 'user_data' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                {data.dataQuality.replace('_', ' ')}
              </span>
            )}
            {data?.sourceStatus && (
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-white/5 text-slate-500 border border-white/10">
                Source: {data.sourceStatus.replace('_', ' ')}
              </span>
            )}
          </div>
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
          <p className="mt-8 text-xs font-black uppercase tracking-widest text-amber-500/70">Insights are analyzing global data...</p>
        </div>
      ) : data ? (
        <div className="space-y-8 relative">
          
          {/* INTRO CARD */}
          <AnimatePresence>
            {showIntro && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-indigo-600/10 border border-indigo-500/30 rounded-[2.5rem] p-8 mb-8 backdrop-blur-md relative overflow-hidden"
              >
                <button 
                  onClick={() => {
                    setShowIntro(false);
                    localStorage.setItem('moneyflow_palantir_intro_dismissed', 'true');
                  }}
                  className="absolute top-6 right-6 p-2 text-indigo-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="p-4 bg-indigo-500/20 rounded-3xl shrink-0">
                    <BookOpen className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-white mb-3 tracking-tight">How to read Insights</h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 max-w-2xl">
                      Insights help you see how your money may be affected by markets, spending, rates, and global events. 
                      It does not predict the future or replace professional advice. Use it to understand what changed, 
                      what may matter, and what to review next.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Scenarios show possible outcomes</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Confidence shows signal strength</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Data quality shows completeness</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                         <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Actions are review prompts</span>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                       <span>Insight Capacity</span>
                       <span className="text-amber-500">94%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[94%] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>
                    <p className="mt-3 text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       <ShieldAlert className="w-3 h-3" /> Complete your profile to unlock full analysis
                    </p>
                  </div>

                  <button 
                    onClick={handleUpgrade}
                    className="w-full py-5 bg-amber-500 text-slate-950 font-black text-base uppercase tracking-[0.1em] rounded-2xl hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20"
                  >
                    Unlock Insights
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
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Intelligence Summary</h2>
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-5xl font-black tracking-tighter ${orbColors.text} drop-shadow-lg`}>
                        {data.orb.confidenceScore}%
                      </span>
                      <div className="group relative">
                        <Info className="w-3 h-3 text-slate-600 hover:text-slate-400 transition-colors cursor-help" />
                        <div className="absolute left-full ml-2 top-0 w-32 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Confidence score based on data freshness and model alignment.
                        </div>
                      </div>
                    </div>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Market Context</p>
                  <p className="text-lg font-medium leading-relaxed text-slate-200">
                    {data.narrative}
                  </p>
                  
                  {(dataQuality.level === 'low' || dataQuality.level === 'fair') && (
                    <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-amber-500/80 leading-relaxed">
                        Insights are based on limited data. Add transactions or connect a bank to improve reliability.
                      </p>
                    </div>
                  )}
                  
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
                      onClick={() => onAskAI?.(`Yield strategy details: ${data.yieldOptimizer?.actionableStrategy}`)}
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-500/70">Fiscal Protection</span>
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
                      onClick={() => onAskAI?.(`Fiscal optimization: ${data.taxShield?.taxOptimizationAction}`)}
                      className="px-3 py-2 bg-violet-500/20 text-violet-400 rounded-lg text-[10px] font-black uppercase hover:bg-violet-500/30 transition-all"
                    >
                      Analyze Signal
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
                      onClick={() => onAskAI?.(`Negotiation script for ${data.negotiator?.targetExpense}`)}
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
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Resilience</span>
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
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase">Efficiency Gap</p>
                        <div className="group relative">
                          <Info className="w-2.5 h-2.5 text-slate-600 cursor-help" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Shows where your money may not be working as effectively as it could.
                          </div>
                        </div>
                      </div>
                      <p className="text-2xl font-black text-fuchsia-400">+{data.arbitrageFinder.arbitrageSpread}%</p>
                    </div>
                    <button 
                      onClick={() => onAskAI?.(`Arbitrage details: ${data.arbitrageFinder?.action}`)}
                      className="px-3 py-2 bg-fuchsia-500/20 text-fuchsia-400 rounded-lg text-[10px] font-black uppercase hover:bg-fuchsia-500/30 transition-all"
                    >
                      Analyze Impact
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION QUEUE */}
              {data.actionQueue && data.actionQueue.length > 0 && (
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/70">Action Queue</span>
                  </div>
                  {data.actionQueue.slice(0, 3).map((action, idx) => (
                    <StructuredInsightCard 
                      key={idx}
                      title={action.title}
                      why={action.reason || "Context analysis indicates this item requires your attention."}
                      what={action.actionSignal === 'act' ? "Review and take immediate action." : action.actionSignal === 'prepare' ? "Prepare your strategy for this outcome." : "Observe these changes closely."}
                      confidence={action.confidenceScore}
                      source={data.sourceStatus}
                      severity={action.priority?.toUpperCase() as any}
                      icon={Zap}
                    />
                  ))}
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
                    <div className="flex items-center gap-2 mb-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Future Scenarios</p>

                      <div className="group relative">
                        <Info className="w-2.5 h-2.5 text-slate-600 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Possible financial outcomes based on market trends and your data.
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.scenarios.slice(0, 4).map((s, i) => (
                        <StructuredInsightCard 
                          key={i}
                          title={s.title}
                          why={s.rationale || "Statistical modeling suggests this scenario is gaining probability."}
                          what={`Review impact on ${s.affectedAreas?.join(', ') || 'portfolio'}. Signal: ${s.actionSignal || 'observe'}.`}
                          confidence={s.confidenceScore || s.probability}
                          source="model_inference"
                          severity={s.actionSignal?.toUpperCase() as any}
                          icon={TrendingUp}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {data.geopoliticalRings && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">Geopolitical Rings</p>
                      <div className="group relative">
                        <Info className="w-2.5 h-2.5 text-slate-600 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Regional and global risk scores calculated from localized intelligence.
                        </div>
                      </div>
                    </div>
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
                    <div className="flex items-center gap-2 mb-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Risk Resilience</p>
                      <div className="group relative">
                        <Info className="w-2.5 h-2.5 text-slate-600 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          Shows how prepared your finances may be for stress scenarios.
                        </div>
                      </div>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.activeRisks?.slice(0, 2).map((risk, i) => (
                      <StructuredInsightCard 
                        key={i}
                        title={risk.title}
                        why={risk.explanation}
                        what={`Assess risk exposure and prepare mitigation. Escalation: ${risk.escalationProbability}%`}
                        confidence={100 - risk.escalationProbability}
                        source="live_search"
                        severity={risk.severity}
                        icon={AlertTriangle}
                      />
                    ))}
                    {data.probabilityVectors?.slice(0, 2).map((vector, i) => (
                      <StructuredInsightCard 
                        key={i}
                        title={vector.title}
                        why={vector.meaning}
                        what={`Monitor the trend in ${vector.cluster}. Affects: ${vector.affects}.`}
                        confidence={vector.probability}
                        source="model_inference"
                        severity={vector.severity}
                        icon={TrendingUp}
                      />
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
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Intelligence Feed</h2>
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
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase text-indigo-400">{item.category}</span>
                            <div className="group relative">
                              <Info className="w-2 h-2 text-slate-600 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-1 w-40 p-2 bg-slate-900 border border-slate-800 rounded-lg text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                Curated intelligence relevant to your portfolio.
                              </div>
                            </div>
                          </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">Signals & Alpha</span>
                    </div>
                    {data.signalsAndAlpha.slice(0, 3).map((sig, i) => (
                      <StructuredInsightCard 
                        key={i}
                        title={sig.title}
                        why={sig.explanation}
                        what={`Strategy: Review exposure to ${sig.cluster}. Urgency: ${sig.urgency}.`}
                        source="live_search"
                        severity={sig.urgency as any}
                        icon={Bot}
                      />
                    ))}
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
              Insights is an autonomous quantitative intelligence engine, not a licensed fiduciary or financial advisor. All insights, market summaries, and scenario models are mathematical analyses based on current market data and probability models. AI architectures are subject to inaccuracies. Capital is at risk. Execute independent verification before any capital allocation. Moneyflow assumes no liability for financial losses.
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
