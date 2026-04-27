import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Cpu, 
  Activity, 
  ChevronRight, 
  ShieldAlert,
  Loader2,
  RefreshCw,
  Search,
  Info,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  Layers,
  Lock,
  Radio,
  Eye,
  Cloud,
  Brain
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { getGlobalIntelligence, MarketIntelligence, NewsItem, MarketIndex, ProbabilisticScenario } from '../services/geminiService';
import { useNotifications } from '../context/NotificationContext';

function Globe3D() {
  const planetRef = React.useRef<THREE.Mesh>(null);
  const continentsRef = React.useRef<THREE.Group>(null);
  const signalsRef = React.useRef<THREE.Group>(null);
  const atmosphereRef = React.useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.12;
    if (continentsRef.current) continentsRef.current.rotation.y += delta * 0.12;
    if (signalsRef.current) {
      signalsRef.current.rotation.y += delta * 0.18;
      signalsRef.current.position.y = Math.sin(time * 0.5) * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.scale.setScalar(1.06 + Math.sin(time * 2) * 0.01);
    }
  });

  return (
    <group rotation={[0.4, 0, 0.2]} scale={0.38}>
      {/* The Planet Sea - Deep Royal Blue with Fresnel-like effect */}
      <mesh ref={planetRef as any}>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshStandardMaterial 
          color="#1e1b4b" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#312e81"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Floating Data Particle Field */}
      <group ref={signalsRef as any}>
        {[...Array(40)].map((_, i) => {
          const phi = Math.acos(-1 + (2 * i) / 40);
          const theta = Math.sqrt(40 * Math.PI) * phi;
          return (
            <mesh 
              key={i}
              position={[
                2.4 * Math.sin(phi) * Math.cos(theta),
                2.4 * Math.cos(phi),
                2.4 * Math.sin(phi) * Math.sin(theta)
              ]}
            >
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial 
                color={i % 3 === 0 ? "#818cf8" : i % 3 === 1 ? "#34d399" : "#fb7185"} 
                emissive={i % 3 === 0 ? "#818cf8" : i % 3 === 1 ? "#34d399" : "#fb7185"} 
                emissiveIntensity={4} 
              />
            </mesh>
          );
        })}
      </group>

      {/* Detailed Clay Continents */}
      <group ref={continentsRef as any}>
        {/* Americas */}
        <mesh position={[-1.2, 0.4, 1.4]} scale={[0.45, 1.1, 0.4]}>
          <sphereGeometry args={[0.9, 32, 16]} />
          <meshStandardMaterial color="#4f46e5" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Eurasia */}
        <mesh position={[1.2, 0.8, 1.2]} scale={[1.3, 0.7, 0.4]}>
          <sphereGeometry args={[0.9, 32, 16]} />
          <meshStandardMaterial color="#6366f1" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Africa */}
        <mesh position={[1.0, -0.6, 1.5]} scale={[0.75, 0.95, 0.4]}>
          <sphereGeometry args={[0.9, 32, 16]} />
          <meshStandardMaterial color="#4338ca" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Antarctica */}
        <mesh position={[0, -2.1, 0]} scale={[1.4, 0.2, 1.4]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#818cf8" roughness={0.4} />
        </mesh>
      </group>

      {/* Rings of Data */}
      <mesh rotation={[Math.PI / 2, 0.2, 0]}>
        <torusGeometry args={[2.8, 0.005, 16, 100]} />
        <meshStandardMaterial color="#6366f1" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, -0.2, 0.4]}>
        <torusGeometry args={[3.2, 0.003, 16, 100]} />
        <meshStandardMaterial color="#818cf8" transparent opacity={0.2} />
      </mesh>

      {/* Atmosphere Ring Glow */}
      <mesh ref={atmosphereRef as any} scale={1.06}>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshStandardMaterial 
          color="#6366f1" 
          transparent 
          opacity={0.12} 
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function GlobalPulse() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<MarketIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'stream' | 'strategy' | 'radar'>('stream');
  const { showNotification } = useNotifications();

  const categories = [
    { id: 'all', label: 'All Clusters', icon: Globe },
    { id: 'finance', label: 'Macro Finance', icon: BarChart3 },
    { id: 'crypto', label: 'Digital Assets', icon: Zap },
    { id: 'ai', label: 'AI Infrastructure', icon: Cpu },
    { id: 'tech', label: 'DeepTech', icon: Layers },
    { id: 'macro', label: 'Geopolitics', icon: Globe },
    { id: 'energy', label: 'Energy/Minerals', icon: Activity },
  ];

  const mobileTabs = [
    { id: 'stream', label: 'News', icon: Radio },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'radar', label: 'Radar', icon: PieChart },
  ];

  const fetchIntelligence = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const localTime = new Date().toISOString();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await getGlobalIntelligence(localTime, timezone, i18n.language);
      setData(result);
      setLastUpdated(new Date());
      if (!silent) showNotification('Data Updated', 'Market signals refreshed.', 'success', 'Global Pulse');
    } catch (error) {
      console.error(error);
      showNotification('Update Failed', 'Having trouble connecting to market data.', 'error', 'Global Pulse');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(() => fetchIntelligence(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [i18n.language]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'negative': return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
      default: return <Minus className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'finance': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'crypto': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'ai': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'tech': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'energy': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'macro': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const filteredNews = (Array.isArray(data?.news) ? data.news : []).filter(item => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (item.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedNews) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-4xl mx-auto px-4 py-10 space-y-8"
      >
        <button 
          onClick={() => setSelectedNews(null)}
          className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors group"
        >
          <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </div>
          Back to Terminal
        </button>

        <article className="bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="p-8 lg:p-12 space-y-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(selectedNews.category)}`}>
                {selectedNews.category} Cluster
              </span>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
              <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-tighter">Source: {selectedNews.source}</span>
              <div className="ml-auto flex items-center gap-4">
                {getSentimentIcon(selectedNews.sentiment)}
                <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedNews.timestamp}</span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight uppercase italic">
              {selectedNews.title}
            </h1>

            <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] italic text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
              &ldquo;{selectedNews.summary}&rdquo;
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="space-y-6 text-base lg:text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">
                {selectedNews.fullReport}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyst Signature</p>
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic">CORTEX-X Intelligence Unit</p>
              </div>
              <div className="flex items-center gap-4">
                {selectedNews.url && (
                  <a 
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-slate-900 dark:text-white"
                  >
                    Open Original Source
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Generate PDF Report
                </button>
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Execute Strategy
                </button>
              </div>
            </div>
          </div>
        </article>
        
        <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Lock className="w-20 h-20" />
          </div>
          <div className="p-3 bg-white/10 rounded-2xl relative z-10">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Disclosure Oversight</p>
            <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase">
              This intelligence report is generated via real-time AI synthesis. Market participation involves risk. All strategic directives are probabilistic assessments.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] space-y-12 relative overflow-hidden transition-colors duration-500">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]" />

        <div className="relative w-full h-[350px] flex items-center justify-center">
          <Canvas shadows dpr={[1, 2]}>
            <React.Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
              <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
              <Globe3D />
              <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
              <Environment preset="city" />
            </React.Suspense>
          </Canvas>
        </div>

        <div className="flex flex-col items-center text-center space-y-6 px-6 max-w-sm relative z-10">
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
              Your AI Analyst <span className="text-indigo-600 dark:text-indigo-400">is thinking...</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Global Market Data</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 dark:border-white/10 w-full animate-bounce">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
              <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic">Loading Global Data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="p-6 bg-rose-500/10 rounded-[2.5rem] border border-rose-500/20">
          <ShieldAlert className="w-12 h-12 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Connection Lost</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">We couldn't establish a secure link with the Intelligence Layer.</p>
        </div>
        <button 
          onClick={() => fetchIntelligence()}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
        >
          Reconnect to Core
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50/50 dark:bg-transparent min-h-screen">
      
      {/* 🧠 Google Trust Infrastructure Badge */}
      <div className="flex justify-center mb-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-1.5 px-4 py-2 bg-[#050505] rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5 align-middle">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Real-Time Data Streaming Powered By
          </span>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 uppercase tracking-widest border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 rounded-full"><Zap className="w-2.5 h-2.5" /> Google Trends</div>
             <div className="flex items-center gap-1 text-[9px] font-mono text-rose-400 uppercase tracking-widest border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 rounded-full"><Radio className="w-2.5 h-2.5" /> Google News</div>
             <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 uppercase tracking-widest border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 rounded-full"><Target className="w-2.5 h-2.5" /> Google Finance</div>
             <div className="flex items-center gap-1 text-[9px] font-mono text-indigo-400 uppercase tracking-widest border border-indigo-400/20 bg-indigo-400/10 px-2 py-0.5 rounded-full"><Layers className="w-2.5 h-2.5" /> Gemini AI</div>
          </div>
        </motion.div>
      </div>

      {/* Top Banner: Strategic Global Indices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.isArray(data?.globalIndices) && data.globalIndices.slice(0, 8).map((index, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="p-4 md:p-5 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-2xl md:rounded-[2rem] shadow-sm hover:bg-white dark:hover:bg-zinc-800/50 transition-all group flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0 mb-2">
              <span className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-zinc-400 capitalize truncate w-full pr-2">{index.name}</span>
              <div className={`p-1 md:p-1.5 rounded-full md:rounded-lg self-start md:self-auto ${index.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : index.trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {index.trend === 'up' ? <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" /> : index.trend === 'down' ? <ArrowDownRight className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
                <span className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{index.value}</span>
                <span className={`text-[10px] md:text-xs font-semibold ${Number(index.change) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Number(index.change) >= 0 ? '+' : ''}{String(index.change).replace('%', '')}%
                </span>
              </div>
              <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-zinc-500 md:line-clamp-1 mt-1 md:mt-2 font-medium">{index.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Primary Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative z-10">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -inset-2 bg-indigo-500/20 blur-xl rounded-full" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{t('Your AI Market Guide')}</h1>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {t('Live Updates')}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                Aggiornato: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 lg:flex-none">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Filter intelligence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full lg:w-72 transition-all"
            />
          </div>
          <button 
            onClick={() => fetchIntelligence()}
            disabled={isLoading}
            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Clusters Nav */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-3 border ${
              selectedCategory === cat.id 
                ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-xl' 
                : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-indigo-500/20'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mobile Tab Navigation (Fixed Bottom) */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-2 rounded-3xl flex items-center justify-between z-50 shadow-2xl">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMobileTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
              activeMobileTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Intelligence Stream */}
        <div className={`lg:col-span-7 space-y-6 ${activeMobileTab !== 'stream' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
              <Layers className="w-4 h-4" />
              {t('Real-Time News Stream')}
            </h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest text-emerald-500">Live Sync</span>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNews.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                  className="group bg-white dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 hover:shadow-xl hover:border-slate-300 dark:hover:border-white/10 transition-all overflow-hidden relative cursor-pointer"
                  onClick={() => setSelectedNews(item)}
                >
                  <div className="flex flex-col gap-5">
                    {/* Top Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md">{item.category}</span>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800" />
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-zinc-500">{item.source}</span>
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-zinc-600">{item.timestamp}</span>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-[18px] md:text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[14px] text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
                        {item.summary}
                      </p>
                    </div>

                    {/* Bottom Sentiment/Action row */}
                    <div className="mt-2 pt-5 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex items-center justify-center ${
                          item.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          item.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.sentiment === 'positive' ? <TrendingUp className="w-4 h-4" /> : item.sentiment === 'negative' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-500 mb-0.5">Sentiment</span>
                           <span className={`text-[11px] font-bold uppercase tracking-wider ${
                             item.sentiment === 'positive' ? 'text-emerald-600 dark:text-emerald-400' :
                             item.sentiment === 'negative' ? 'text-rose-600 dark:text-rose-400' :
                             'text-slate-600 dark:text-slate-400'
                           }`}>
                             {item.sentiment}
                           </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedNews(item); }}
                          className="px-4 py-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-2"
                        >
                          <Brain className="w-3.5 h-3.5" />
                          {t('AI Summary')}
                        </button>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-2"
                          >
                            {t('Original')} <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Analyst Sidebar */}
        <div className="lg:col-span-12 space-y-6">
          
          {/* Strategy Protocol (The "Brain") */}
          <section className={`bg-gradient-to-br from-indigo-950 via-indigo-900 to-black rounded-[2rem] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden group border border-indigo-500/20 ${activeMobileTab !== 'strategy' ? 'hidden lg:block' : 'block'}`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen scale-[1.5] translate-x-1/4 -translate-y-1/4 group-hover:scale-[1.6] group-hover:rotate-12 transition-all duration-[3000ms] ease-out">
               <Canvas shadows dpr={[1, 2]}>
                <React.Suspense fallback={null}>
                  <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} />
                  <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                  <Globe3D />
                  <Environment preset="city" />
                </React.Suspense>
              </Canvas>
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-300 drop-shadow-md">{t('Strategic Guide')}</h3>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-xs font-bold border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                {t('Confidence')}: {data?.analystConfidence || 0}%
              </div>
            </div>

            <div className="space-y-8 relative z-10 w-full xl:w-4/5 text-center sm:text-left mx-auto sm:mx-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-3 ml-1">{t('What you should do now')}</p>
                <div className="p-6 bg-black/40 border border-indigo-500/20 rounded-2xl font-bold text-lg sm:text-xl leading-relaxed text-indigo-50 shadow-inner">
                  "{data?.strategicAdvice || t('Analyzing strategy...')}"
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-3 ml-1">{t('How the market is feeling')}</p>
                <p className="text-xl sm:text-2xl font-black leading-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                  {data?.marketMood || t('Analyzing global signals...')}
                </p>
              </div>
            </div>
          </section>

          {/* Probabilities radar */}
          <section className={`bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm relative overflow-hidden ${activeMobileTab !== 'radar' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-cyan-400 flex items-center gap-3">
                <PieChart className="w-4 h-4" />
                {t('What Might Happen Next')}
              </h3>
              <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="space-y-5 relative z-10">
              {Array.isArray(data?.probabilisticRadar) && data.probabilisticRadar.length > 0 ? data.probabilisticRadar.map((scenario, i) => (
                <div key={i} className="group relative">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 max-w-[70%]">{scenario.event || 'Unknown Event'}</span>
                    <span className="text-sm font-mono font-medium text-cyan-600 dark:text-cyan-400">{scenario.probability || 0}%</span>
                  </div>
                  
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className="h-full bg-cyan-500 dark:bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${scenario.probability || 0}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        scenario.impact === 'extreme' ? 'text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-400/30 dark:bg-rose-400/10' :
                        scenario.impact === 'high' ? 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-400/30 dark:bg-amber-400/10' :
                        'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400/30 dark:bg-emerald-400/10'
                      }`}>
                        {scenario.impact || 'medium'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 max-w-[60%] justify-end text-slate-500 dark:text-slate-400">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-medium truncate">{scenario.catalyst || 'Unidentified'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs font-medium text-slate-500 py-8 text-center bg-slate-50 dark:bg-zinc-800/50 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Processing Probability Vectors...</div>
              )}
            </div>
          </section>

          {/* Trend & Risk Matrix */}
          <div className={`grid grid-cols-1 gap-6 ${activeMobileTab !== 'radar' ? 'hidden lg:block' : 'block'}`}>
             {/* Risk Analysis Matrix */}
            <div className="p-6 lg:p-8 bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl space-y-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" />
                  {t('Things to Watch Out For')}
                </h3>
                <div className="flex items-center justify-center">
                  <div className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                {Array.isArray(data?.riskAnalysis) && data.riskAnalysis.length > 0 ? data.riskAnalysis.map((risk, i) => (
                  <div key={i} className="group p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-slate-300 dark:hover:border-white/20 transition-all">
                    <div className="flex flex-wrap items-center gap-2 justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{risk.name || 'Systemic Risk'}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize border ${
                        risk.level === 'critical' ? 'text-rose-600 border-rose-200 bg-rose-100 dark:text-rose-400 dark:border-rose-400/50 dark:bg-rose-400/20' : 
                        risk.level === 'high' ? 'text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-400/50 dark:bg-rose-400/10' : 
                        'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-400/50 dark:bg-amber-400/10'
                      }`}>
                        {risk.level || 'high'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {risk.description || 'Monitoring risk vectors.'}
                    </p>
                  </div>
                )) : (
                  <div className="text-xs font-medium text-slate-500 py-8 text-center bg-slate-50 dark:bg-zinc-800/50 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Scanning Environment...</div>
                )}
              </div>
            </div>

            {/* Sector Signals */}
            <div className="p-6 lg:p-8 bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-3 relative z-10">
                <Activity className="w-4 h-4" />
                {t('Trending Up')}
              </h3>
              <div className="grid grid-cols-1 gap-3 relative z-10">
                {Array.isArray(data?.trendRadar) && data.trendRadar.length > 0 ? data.trendRadar.slice(0, 3).map((trend, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col gap-2 group hover:border-slate-300 dark:hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                         <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{trend.trend || 'Emerging Signal'}</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded">{trend.timeframe || 'Active'}</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/60 font-mono tracking-tight leading-relaxed ml-4.5 border-l border-emerald-900 pl-3">
                      {trend.potentialImpact || 'Awaiting deep impact analysis.'}
                    </p>
                  </div>
                )) : (
                   <div className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest py-8 text-center border border-dashed border-emerald-900/40 rounded-xl">Searching for Alpha...</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
