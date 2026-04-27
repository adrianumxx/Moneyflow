import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Wallet, Landmark, Globe, Plus, ShieldCheck, 
  ArrowRight, CheckCircle2, QrCode, Smartphone, ExternalLink,
  Lock, Zap, Info, Bitcoin, TrendingUp
} from 'lucide-react';

interface ConnectorProvider {
  id: string;
  name: string;
  type: 'bank' | 'crypto' | 'broker';
  logo: string;
  color: string;
  description: string;
}

const PROVIDERS: (ConnectorProvider & { fallbackIcon: any })[] = [
  { id: 'revolut', name: 'Revolut', type: 'bank', logo: 'https://logo.clearbit.com/revolut.com', color: 'bg-zinc-800', description: 'Instant multi-currency sync', fallbackIcon: Building2 },
  { id: 'n26', name: 'N26', type: 'bank', logo: 'https://logo.clearbit.com/n26.com', color: 'bg-emerald-600', description: 'European digital banking', fallbackIcon: Landmark },
  { id: 'etoro', name: 'eToro', type: 'broker', logo: 'https://logo.clearbit.com/etoro.com', color: 'bg-green-600', description: 'Stock & Copy Trading', fallbackIcon: TrendingUp },
  { id: 'binance', name: 'Binance', type: 'crypto', logo: 'https://logo.clearbit.com/binance.com', color: 'bg-amber-400', description: 'Global crypto exchange', fallbackIcon: Bitcoin },
  { id: 'coinbase', name: 'Coinbase', type: 'crypto', logo: 'https://logo.clearbit.com/coinbase.com', color: 'bg-blue-600', description: 'Institutional crypto vault', fallbackIcon: Bitcoin },
  { id: 'degiro', name: 'DEGIRO', type: 'broker', logo: 'https://logo.clearbit.com/degiro.com', color: 'bg-rose-700', description: 'Low-cost European broker', fallbackIcon: Landmark },
];

export default function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState<'all' | 'banks' | 'crypto' | 'brokers'>('all');
  const [connectingProvider, setConnectingProvider] = useState<ConnectorProvider | null>(null);
  const [connectionStep, setConnectionStep] = useState<'intro' | 'qr' | 'success'>('intro');

  const tabToType: Record<string, string> = { banks: 'bank', crypto: 'crypto', brokers: 'broker' };
  const filteredProviders = PROVIDERS.filter(p => activeTab === 'all' || p.type === tabToType[activeTab]);

  const handleConnect = (provider: ConnectorProvider) => {
    setConnectingProvider(provider);
    setConnectionStep('intro');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 pb-24 lg:pb-12 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-indigo-500/30">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">Neural Connector</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm font-medium">
            Synchronize your global assets in seconds. Real-time encryption with bank-grade protocol security.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
           <div className="p-2 bg-indigo-500/10 rounded-lg">
             <ShieldCheck className="w-5 h-5 text-indigo-500" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Standard</p>
             <p className="text-xs font-bold text-slate-900 dark:text-slate-200">256-bit AES Encryption</p>
           </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-10 pb-2">
        {['all', 'banks', 'crypto', 'brokers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' 
                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* PROVIDER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <motion.div
            layoutId={provider.id}
            key={provider.id}
            onClick={() => handleConnect(provider)}
            className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer hover:shadow-premium dark:hover:bg-white/[0.08] transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${provider.color} opacity-0 group-hover:opacity-10 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-white/10 p-2 border border-slate-200 dark:border-white/20 shadow-sm overflow-hidden flex items-center justify-center">
                <img 
                  src={provider.logo} 
                  alt={provider.name} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>`;
                    }
                  }}
                />
              </div>
              <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:translate-x-1 transition-transform">{provider.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{provider.description}</p>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Connect</span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* CONNECTION MODAL OVERLAY */}
      <AnimatePresence>
        {connectingProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setConnectingProvider(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            
            <motion.div
              layoutId={connectingProvider.id}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="flex flex-col items-center text-center">
                {connectionStep === 'intro' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                      <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                        <img src={connectingProvider.logo} alt={connectingProvider.name} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Connect {connectingProvider.name}</h2>
                      <p className="text-slate-500 text-sm font-medium">To synchronize your assets, we recommend using our <span className="text-indigo-600 dark:text-indigo-400">Magic Link</span> for mobile handover.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setConnectionStep('qr')}
                        className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:border-indigo-500/50 transition-all group"
                      >
                        <Smartphone className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Mobile App</span>
                      </button>
                      <button className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:border-indigo-500/50 transition-all group opacity-50 cursor-not-allowed">
                        <ExternalLink className="w-8 h-8 text-slate-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Desktop Sync</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-emerald-500">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                  </motion.div>
                )}

                {connectionStep === 'qr' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                    <div className="w-56 h-56 bg-white p-4 rounded-[2rem] mx-auto shadow-xl border-4 border-slate-100 relative overflow-hidden group">
                      <QrCode className="w-full h-full text-slate-900" />
                      <div className="absolute inset-0 bg-indigo-600/5 animate-pulse pointer-events-none" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Scan for Magic Handover</h3>
                      <p className="text-slate-500 text-xs font-medium px-4">Open your phone camera to securely authorize {connectingProvider.name} within our mobile encrypted sandbox.</p>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-left">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-tight">
                        IMPORTANT: Do not close this browser window until the authorization on your phone is confirmed.
                      </p>
                    </div>

                    <button 
                      onClick={() => setConnectionStep('success')}
                      className="text-xs font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600"
                    >
                      Wait for confirmation...
                    </button>
                  </motion.div>
                )}

                {connectionStep === 'success' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic">Connection Verified</h2>
                      <p className="text-slate-500 text-sm font-medium">Your {connectingProvider.name} assets are now streaming to the Neural Core.</p>
                    </div>

                    <button 
                      onClick={() => setConnectingProvider(null)}
                      className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                    >
                      Return to Hub
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
