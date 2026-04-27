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
  Cloud
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
  const { i18n } = useTranslation();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(data?.globalIndices) && data.globalIndices.slice(0, 6).map((index, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="p-5 bg-white dark:bg-[#0f172a] border border-slate-200/60 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{index.name}</span>
              <div className={`p-1.5 rounded-lg ${index.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : index.trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {index.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : index.trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-slate-800 dark:text-white">{index.value}</span>
              <span className={`text-xs font-bold ${Number(index.change) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {Number(index.change) >= 0 ? '+' : ''}{String(index.change).replace('%', '')}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 line-clamp-1 mt-2 font-medium italic">{index.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Primary Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-6 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative z-10">
              <Radio className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div className="absolute -inset-2 bg-indigo-500/20 blur-xl rounded-full" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Gemini Alpha Engine</h1>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Telemetry
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Last DeepMind Sync: {lastUpdated.toLocaleTimeString()}
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
            <h3 className="text-xs font-black text-slate-800 dark:text-cyan-400 uppercase tracking-[0.25em] flex items-center gap-3 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
              <Layers className="w-4 h-4" />
              Global Telemetry Stream
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
                  onClick={() => setSelectedNews(item)}
                  className="group bg-white dark:bg-[#050505] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 lg:p-8 hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] overflow-hidden relative cursor-pointer"
                >
                  {/* Hover scanline effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-scanline pointer-events-none"></div>

                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:text-cyan-400 border border-transparent hover:border-cyan-500/30">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
                    <span className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      item.category === 'macro' ? 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10 shadow-[0_0_5px_rgba(129,140,248,0.3)]' :
                      item.category === 'tech' ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_5px_rgba(34,211,238,0.3)]' :
                      item.category === 'crypto' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_5px_rgba(16,185,129,0.3)]' :
                      item.category === 'energy' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10 shadow-[0_0_5px_rgba(251,191,36,0.3)]' :
                      item.category === 'ai' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10 shadow-[0_0_5px_rgba(244,63,94,0.3)]' :
                      'text-slate-400 border-slate-400/30 bg-slate-400/10'
                    }`}>
                      {item.category}
                    </span>
                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.source}</span>
                    <div className="ml-auto flex items-center gap-4">
                      {getSentimentIcon(item.sentiment)}
                      <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded">{item.timestamp}</span>
                    </div>
                  </div>

                  <h4 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight mb-4 group-hover:text-cyan-400 transition-colors uppercase relative z-10">
                    {item.title}
                  </h4>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium relative z-10 border-l-2 border-slate-200 dark:border-white/10 pl-4">
                    {item.summary}
                  </p>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-6 h-6 rounded border border-white dark:border-[#050505] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-cyan-500/20" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Institutional Consensus Tracking</span>
                    </div>
                    <button className="flex items-center gap-2 text-[9px] font-black font-mono text-cyan-500 uppercase tracking-widest hover:gap-3 transition-all group/btn">
                      Decrypt Intelligence <ChevronRight className="w-3 h-3 group-hover/btn:text-cyan-300" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Analyst Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          
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
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 shadow-indigo-500/50 drop-shadow-md">Alpha Strategy</h3>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-indigo-500/20 text-[10px] font-mono font-black border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                CONF: {data?.analystConfidence || 0}%
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-3 ml-1">Strategic Imperative</p>
                <div className="p-6 bg-black/40 border border-indigo-500/20 rounded-[1.5rem] font-bold text-[15px] leading-relaxed tracking-tight text-indigo-50 shadow-inner">
                  "{data?.strategicAdvice || 'Awaiting structural strategy'}"
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mb-3 ml-1">Market State</p>
                <p className="text-2xl font-black tracking-tighter leading-tight uppercase pr-8 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
                  {data?.marketMood || 'Analyzing macro vibration'}
                </p>
              </div>
            </div>
          </section>

          {/* Probabilities radar */}
          <section className={`bg-[#050505] border border-white/10 rounded-[2rem] p-8 lg:p-10 space-y-8 shadow-2xl relative overflow-hidden ${activeMobileTab !== 'radar' ? 'hidden lg:block' : 'block'}`}>
            {/* Cyber grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-xs font-black text-cyan-400 border-l-2 border-cyan-400 pl-3 uppercase tracking-[0.25em] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                Predictive Models
              </h3>
              <Info className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-6 relative z-10">
              {Array.isArray(data?.probabilisticRadar) && data.probabilisticRadar.length > 0 ? data.probabilisticRadar.map((scenario, i) => (
                <div key={i} className="group relative">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight max-w-[70%]">{scenario.event || 'Unknown Event'}</span>
                    <span className="text-lg font-mono font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{scenario.probability || 0}%</span>
                  </div>
                  
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      className="h-full bg-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,1)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${scenario.probability || 0}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Impact</span>
                       <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        scenario.impact === 'extreme' ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' :
                        scenario.impact === 'high' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                        'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                      }`}>
                        {scenario.impact || 'medium'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 max-w-[60%] justify-end">
                      <Zap className="w-3 h-3 text-cyan-500" />
                      <span className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">{scenario.catalyst || 'Unidentified'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest py-8 text-center border border-dashed border-white/10 rounded-xl">Processing Probability Vectors...</div>
              )}
            </div>
          </section>

          {/* Trend & Risk Matrix */}
          <div className={`grid grid-cols-1 gap-6 ${activeMobileTab !== 'radar' ? 'hidden lg:block' : 'block'}`}>
             {/* Risk Analysis Matrix */}
            <div className="p-8 lg:p-10 bg-black rounded-[2rem] border-2 border-rose-900/30 space-y-8 relative overflow-hidden shadow-[0_0_50px_rgba(159,18,57,0.1)]">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-32 h-32 text-rose-500" />
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.25em] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                  <ShieldAlert className="w-4 h-4" />
                  Risk Matrix
                </h3>
                <div className="animate-pulse flex items-center justify-center">
                  <div className="h-2 w-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,1)]"></div>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                {Array.isArray(data?.riskAnalysis) && data.riskAnalysis.length > 0 ? data.riskAnalysis.map((risk, i) => (
                  <div key={i} className="group p-5 bg-rose-950/10 border border-rose-900/20 rounded-2xl hover:bg-rose-900/20 hover:border-rose-500/40 transition-all backdrop-blur-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black text-rose-100 uppercase tracking-tight">{risk.name || 'Systemic Risk'}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        risk.level === 'critical' ? 'text-rose-400 border-rose-400 bg-rose-400/20 animate-pulse' : 
                        risk.level === 'high' ? 'text-rose-400 border-rose-400/50 bg-rose-400/10' : 
                        'text-amber-400 border-amber-400/50 bg-amber-400/10'
                      }`}>
                        {risk.level || 'high'}
                      </span>
                    </div>
                    <p className="text-[10px] text-rose-300/70 font-mono tracking-tight leading-relaxed">
                      {risk.description || 'Monitoring risk vectors.'}
                    </p>
                  </div>
                )) : (
                  <div className="text-[10px] font-mono text-rose-500/50 uppercase tracking-widest py-8 text-center border border-dashed border-rose-900/40 rounded-xl">Scanning Environment...</div>
                )}
              </div>
            </div>

            {/* Sector Signals */}
            <div className="p-8 lg:p-10 bg-[#050505] border border-emerald-900/30 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.05)] space-y-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none"></div>
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.25em] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] relative z-10">
                <Activity className="w-4 h-4" />
                Alpha Signals
              </h3>
              <div className="grid grid-cols-1 gap-4 relative z-10">
                {Array.isArray(data?.trendRadar) && data.trendRadar.length > 0 ? data.trendRadar.slice(0, 3).map((trend, i) => (
                  <div key={i} className="p-5 bg-emerald-950/20 rounded-2xl border border-emerald-900/30 flex flex-col gap-3 group hover:border-emerald-500/40 hover:bg-emerald-900/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                         <span className="text-[11px] font-black text-emerald-50 uppercase tracking-tight">{trend.trend || 'Emerging Signal'}</span>
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
