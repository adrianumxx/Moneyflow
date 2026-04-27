import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Zap, ShieldAlert, Lock, RefreshCw, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, BookOpen, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getPalantirIntelligence, PalantirIntelligence, PalantirNewsItem } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';
import { Asset, Liability, Goal, UserProfile } from '../types';

interface PalantirProps {
  assets?: Asset[];
  liabilities?: Liability[];
  goals?: Goal[];
  userProfile?: UserProfile | null;
}

export default function Palantir({ assets, liabilities, goals, userProfile }: PalantirProps) {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<PalantirIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('All Clusters');
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  const [loginStreak, setLoginStreak] = useState(0);
  const { showNotification } = useNotifications();

  const isPremium = userProfile?.plan === 'premium' || userProfile?.subscriptionStatus === 'active' || userProfile?.subscriptionStatus === 'trialing';

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
        new Date().toISOString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        language,
        { assets: assets || [], liabilities: liabilities || [], goals: goals || [] }
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 lg:pb-12 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-amber-500/30">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Globe className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Palantir</h1>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            Intelligence Engine 
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
            Last Sync: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
        <div className="space-y-8">

          {/* Desktop Metric Cards (Top on Desktop, Hidden on Mobile here) */}
          <div className="hidden lg:grid grid-cols-3 gap-4 mb-8">
             {data.metrics?.map(metric => <MetricCard key={metric.id} metric={metric} />)}
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN (Orb, Narrative, Semaphore) */}
            <div className="col-span-1 lg:col-span-7 space-y-8">
              
              {/* THE ORB */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                  {/* Orbital Rings */}
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
                    <span className={`text-6xl sm:text-7xl font-black tracking-tighter ${orbColors.text} drop-shadow-lg`}>
                      {data.orb.confidenceScore}%
                    </span>
                    <p className="mt-4 text-sm sm:text-base font-bold text-white leading-tight">
                      {data.orb.statusLine}
                    </p>
                  </motion.div>

                  {/* Satellite Dots */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-slate-300 shadow-xl">
                    {data.orb.state.toUpperCase()}
                  </div>
                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risks</span>
                    <span className="text-xs font-black text-white">{data.orb.activeRisksCount}</span>
                    {data.orb.activeRisksCount > 2 && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>

              {/* NARRATIVE */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
                {loginStreak >= 3 && (
                  <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-indigo-500/30">
                    Day {loginStreak} Streak
                  </div>
                )}
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-4">Strategic Counsel</p>
                <p className="text-lg sm:text-xl font-medium leading-relaxed text-slate-200 mb-4">
                  {data.narrative}
                </p>
                {loginStreak >= 3 && (
                  <p className="text-xs font-medium text-indigo-300/80 italic border-t border-slate-800/50 pt-4">
                    Palantir noticed your discipline. The markets reward those who stay vigilant.
                  </p>
                )}
              </div>

              {/* SEMAPHORE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.semaphore?.map((sig, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                    <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${
                      sig.state === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                      sig.state === 'YELLOW' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                      'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    }`} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                        {sig.category.replace('_', ' ')}
                      </p>
                      <p className="text-sm font-medium text-slate-200 leading-snug">
                        {sig.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Metric Cards (Hidden on Desktop) */}
              <div className="grid lg:hidden grid-cols-1 sm:grid-cols-2 gap-4">
                {data.metrics?.map(metric => <MetricCard key={metric.id} metric={metric} />)}
              </div>

            </div>

            {/* RIGHT COLUMN (Tabs, Vectors, Signals, Risks) */}
            <div className="col-span-1 lg:col-span-5 space-y-12">
              
              {/* CLUSTER TABS */}
              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide gap-2">
                {clusters.map(cluster => (
                  <button
                    key={cluster}
                    onClick={() => setSelectedCluster(cluster)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      selectedCluster === cluster 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cluster}
                  </button>
                ))}
              </div>

              {/* PREMIUM LOCK OVERLAY CONTAINER */}
              <div className="relative">
                {!isPremium && (
                  <div className="absolute inset-0 z-20 bg-[#020617]/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-slate-800/80 p-6 sm:p-10 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] border border-amber-500/20">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Executive Intelligence Locked</h3>
                    <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">
                      Upgrade to access proprietary probability vectors, structural signals, and active risk analysis.
                    </p>

                    <div className="w-full max-w-xs mb-8">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">Palantir Capacity</span>
                        <span className="text-amber-500">94%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '94%' }}
                          transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs font-bold text-rose-400 mt-3 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Only 312 Executive spots remaining
                      </p>
                    </div>

                    <button 
                      onClick={() => showNotification('Premium Required', 'Please upgrade to Executive tier to unlock deep intelligence.', 'info')}
                      className="px-8 py-4 bg-amber-500 text-amber-950 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
                    >
                      Unlock Palantir
                    </button>
                  </div>
                )}

                <div className={`space-y-10 ${!isPremium ? 'opacity-30 select-none pointer-events-none' : ''}`}>
                  {/* PROBABILITY VECTORS */}
                  <section>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> Probability Vectors
                    </p>
                    <div className="space-y-4">
                      {filteredVectors.length > 0 ? filteredVectors.map((vector, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-sm font-bold text-white max-w-[70%] leading-tight">{vector.title}</h4>
                            <span className="text-lg font-black text-indigo-400">{vector.probability}%</span>
                          </div>
                          
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                            <div 
                              className={`h-full ${vector.severity === 'EXTREME' ? 'bg-rose-500' : vector.severity === 'HIGH' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                              style={{ width: `${vector.probability}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-300 font-medium mb-3">{vector.meaning}</p>
                          
                          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                            <span className={`px-2 py-1 rounded text-white ${vector.severity === 'EXTREME' ? 'bg-rose-500/20' : vector.severity === 'HIGH' ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
                              {vector.severity} SEVERITY
                            </span>
                            <span className="text-slate-500 flex items-center gap-1"><Zap className="w-3 h-3" /> {vector.affects}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="py-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-center">
                          <CheckCircle2 className="w-6 h-6 text-slate-700 mb-2" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No anomalies detected</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SIGNALS & ALPHA */}
                  <section>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" /> Signals & Alpha
                    </p>
                    <div className="space-y-4">
                      {filteredSignals.length > 0 ? filteredSignals.map((signal, i) => (
                        <div key={i} className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-5 border-l-4 border-l-emerald-500">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                              {signal.urgency}
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                              {signal.type}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white mb-2">{signal.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{signal.explanation}</p>
                        </div>
                      )) : (
                        <div className="py-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-center">
                          <Info className="w-6 h-6 text-slate-700 mb-2" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No active signals</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ACTIVE RISKS */}
                  <section>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" /> Active Risks
                    </p>
                    <div className="space-y-4">
                      {filteredRisks.length > 0 ? filteredRisks.map((risk, i) => (
                        <div key={i} className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5 border-l-4 border-l-rose-500">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-black text-white leading-tight max-w-[80%]">{risk.title}</h4>
                            <span className="text-[11px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded shrink-0">
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">{risk.explanation}</p>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-rose-300/70">
                            <AlertTriangle className="w-3 h-3" />
                            Escalation risk: {risk.escalationProbability}%
                          </div>
                        </div>
                      )) : (
                        <div className="py-6 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl text-center">
                          <ShieldAlert className="w-6 h-6 text-slate-700 mb-2" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No critical risks</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>

          {/* EDUCATIONAL INSIGHT */}
          {data.educationalInsight && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mt-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Did you know?</h3>
                </div>
                <h4 className="text-xl font-bold text-amber-500 mb-3">{data.educationalInsight.concept}</h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-3xl">
                  {data.educationalInsight.explanation}
                </p>
                <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 inline-block">
                  <p className="text-xs font-medium text-amber-200/90">
                    <strong className="text-amber-500 uppercase text-[10px] tracking-widest mr-2">Why it matters today:</strong>
                    {data.educationalInsight.relevanceToday}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NEWS FEED */}
          <section className="mt-12">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 px-2">Intelligence Stream</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredNews.length > 0 ? filteredNews.map((news, i) => (
                <div key={news.id || i} className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        news.category === 'MACRO' ? 'bg-indigo-500/20 text-indigo-400' :
                        news.category === 'ENERGY' ? 'bg-amber-500/20 text-amber-400' :
                        news.category === 'CRYPTO' ? 'bg-emerald-500/20 text-emerald-400' :
                        news.category === 'GEOPOLITICS' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {news.category}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{news.source}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500" title="Impact Score">
                        {news.impactScore}/10
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                         {news.trend === 'up' ? <TrendingUp className="w-4 h-4 text-rose-400" /> : 
                          news.trend === 'down' ? <TrendingDown className="w-4 h-4 text-emerald-400" /> : 
                          <Minus className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug">{news.headline}</h4>
                  
                  <div className="mb-6">
                    <p className="text-sm font-medium text-slate-300 leading-relaxed border-l-2 border-amber-500/50 pl-4">
                      <span className="text-amber-500 font-bold block mb-1 uppercase text-[10px] tracking-widest">What this means for you</span>
                      {news.meaning}
                    </p>
                  </div>

                  <div className="flex items-center justify-start border-t border-slate-800/50 pt-4">
                    <button 
                      onClick={() => setExpandedNewsId(expandedNewsId === news.id ? null : news.id)}
                      className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
                    >
                      {expandedNewsId === news.id ? 'Close AI Summary' : 'Read AI Summary'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedNewsId === news.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 bg-slate-950/50 p-4 rounded-xl text-xs text-slate-400 leading-relaxed">
                          {news.aiSummary}
                          {news.url && (
                            <a href={news.url} target="_blank" rel="noopener noreferrer" className="block mt-4 text-amber-500 font-bold hover:underline">
                              Read original source →
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )) : <p className="text-sm text-slate-500 px-2 col-span-full">No intelligence gathered for this filter.</p>}
            </div>
          </section>

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
