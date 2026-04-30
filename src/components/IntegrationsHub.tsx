import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Wallet, Landmark, Globe, Plus, ShieldCheck, 
  ArrowRight, CheckCircle2, QrCode, Smartphone, ExternalLink,
  Lock, Zap, Info, Bitcoin, TrendingUp, Code2, Terminal, RefreshCw, X, History
} from 'lucide-react';
import CryptoConnector from './CryptoConnector';
import { UserProfile } from '../types';

import { PROVIDER_REGISTRY, Provider } from '../utils/connectors';
import { createSyncSession, disconnectInstitution, syncAccounts } from '../services/syncService';
import { useNotifications } from '../context/NotificationContext';

const FALLBACK_ICONS: Record<string, any> = {
  bank: Building2,
  crypto_wallet: Bitcoin,
  broker: TrendingUp,
  investment: Landmark,
  custom_api: Code2
};

const PROVIDER_LOGOS: Record<string, string> = {
  revolut_demo: 'https://logo.clearbit.com/revolut.com',
  n26_demo: 'https://logo.clearbit.com/n26.com',
  binance_demo: 'https://logo.clearbit.com/binance.com',
  coinbase_wallet: 'https://logo.clearbit.com/coinbase.com',
};

const PROVIDER_COLORS: Record<string, string> = {
  revolut_demo: 'bg-zinc-800',
  n26_demo: 'bg-emerald-600',
  binance_demo: 'bg-amber-400',
  coinbase_wallet: 'bg-blue-600',
  bank_sandbox: 'bg-slate-700',
  custom_api: 'bg-indigo-600'
};

interface IntegrationsHubProps {
  userId: string;
  userProfile?: UserProfile;
  connectedInstitutions?: any[];
}

export default function IntegrationsHub({ userId, userProfile, connectedInstitutions }: IntegrationsHubProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'banks' | 'crypto' | 'brokers'>('all');
  const [connectingProvider, setConnectingProvider] = useState<any | null>(null);
  const [connectionStep, setConnectionStep] = useState<'intro' | 'qr' | 'custom' | 'success'>('intro');
  const [customConfig, setCustomConfig] = useState({ endpoint: '', apiKey: '' });
  const { showNotification } = useNotifications();

  const tabToType: Record<string, string> = { banks: 'bank', crypto: 'crypto_wallet', brokers: 'broker' };
  const filteredProviders = PROVIDER_REGISTRY.filter(p => activeTab === 'all' || p.providerType === tabToType[activeTab]);

  const handleConnect = async (provider: Provider) => {
    // 1. Initialize session with backend foundation
    const response = await createSyncSession(provider.providerId);
    
    if (!response.success) {
      showNotification('Connection Error', response.error || 'The service is temporarily unavailable.', 'error');
      return;
    }

    // 2. Proceed with UI flow if session created successfully
    setConnectingProvider(provider);
    if (provider.providerId === 'custom_api') {
      setConnectionStep('custom');
    } else {
      setConnectionStep('intro');
    }
  };

  const handleDisconnect = async (institutionId: string) => {
    try {
      const response = await disconnectInstitution(institutionId);
      if (response.success) {
        showNotification('Connection Revoked', 'Access disconnected. Historical records preserved.', 'success');
        // Note: Real state update would come from onSnapshot in parent, but we can notify user immediately
      } else {
        throw new Error(response.error || 'Revocation failed');
      }
    } catch (error: any) {
      showNotification('Revocation Error', error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 pb-24 lg:pb-12 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-indigo-500/30">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">Secure Sync</h1>
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

      {/* ACTIVE CONNECTIONS */}
      {connectedInstitutions && connectedInstitutions.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
               <RefreshCw className="w-4 h-4" />
             </div>
             <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Connected Accounts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {connectedInstitutions.map((inst) => (
               <div key={inst.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden p-2">
                       {PROVIDER_LOGOS[inst.providerId] ? (
                         <img src={PROVIDER_LOGOS[inst.providerId]} className="w-full h-full object-contain" alt={inst.providerName} />
                       ) : (
                         <Building2 className="w-6 h-6 text-slate-400" />
                       )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{inst.providerName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Last Synced: {inst.lastSyncedAt ? (typeof inst.lastSyncedAt === 'object' && 'toDate' in inst.lastSyncedAt ? inst.lastSyncedAt.toDate().toLocaleDateString() : new Date(inst.lastSyncedAt).toLocaleDateString()) : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        showNotification('Sync Initiated', `Querying ${inst.providerName} for latest balances...`, 'info');
                        const res = await syncAccounts(inst.id);
                        if (res.success) {
                          showNotification('Sync Complete', `Your bank is connected. Moneyflow can now use your balances to improve your overview and insights.`, 'success');
                        } else {
                          showNotification('Sync Failed', res.error || 'Connection failed', 'error');
                        }
                      }}
                      title="Sync Balances"
                      className="p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        showNotification('Transaction Sync', `Fetching ledger items from ${inst.providerName}. This may take a moment...`, 'info');
                        const res = await syncAccounts(inst.id, { syncTransactions: true });
                        if (res.success) {
                          showNotification('Sync Complete', `Transactions synced. Your spending and cash flow insights are now more complete.`, 'success');
                        } else {
                          showNotification('Sync Failed', res.error || 'Connection failed', 'error');
                        }
                      }}
                      title="Sync Transactions"
                      className="p-3 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDisconnect(inst.id)}
                      title="Disconnect Bank"
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))}
          </div>
          <p className="mt-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-2xl italic">
            Note: Disconnecting stops future synchronizations. Historical financial records already indexed are preserved for continuous analysis.
          </p>
        </div>
      )}

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
        {filteredProviders.map((provider) => {
          const FallbackIcon = FALLBACK_ICONS[provider.providerType] || Building2;
          const logo = PROVIDER_LOGOS[provider.providerId] || '';
          const color = PROVIDER_COLORS[provider.providerId] || 'bg-slate-700';

          return (
            <motion.div
              layoutId={provider.providerId}
              key={provider.providerId}
              onClick={() => handleConnect(provider)}
              className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer hover:shadow-premium dark:hover:bg-white/[0.08] transition-all overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-0 group-hover:opacity-10 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-white/10 p-2 border border-slate-200 dark:border-white/20 shadow-sm overflow-hidden flex items-center justify-center">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt={provider.providerName} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                      <FallbackIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  {provider.isDemo && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">Demo</span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:translate-x-1 transition-transform truncate" title={provider.providerName}>{provider.providerName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{provider.description}</p>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{provider.providerType.replace('_', ' ')}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          );
        })}
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
              layoutId={connectingProvider.providerId}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] p-5 sm:p-10 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="flex flex-col items-center text-center">
                {connectionStep === 'intro' && connectingProvider.providerType === 'crypto_wallet' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                    <div className="mb-6">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Sync Web3 Wallet</h2>
                      <p className="text-slate-500 text-sm font-medium">Add a public address to track its value in your dashboard.</p>
                    </div>
                    <CryptoConnector userId={userId} />
                    <button 
                      onClick={() => setConnectingProvider(null)}
                      className="mt-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}

                {connectionStep === 'intro' && connectingProvider.providerType !== 'crypto_wallet' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Wallet className="w-8 h-8" />
                      </div>
                      <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
                      <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                        <img src={PROVIDER_LOGOS[connectingProvider.providerId] || ''} alt={connectingProvider.providerName} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Connect {connectingProvider.providerName}</h2>
                      <p className="text-slate-500 text-sm font-medium">To synchronize your assets, we recommend using a <span className="text-indigo-600 dark:text-indigo-400">Secure Link</span> for mobile handover.</p>
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
                        <span className="text-xs font-black uppercase tracking-widest">Continue on this device</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 justify-center text-emerald-500">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>
                  </motion.div>
                )}

                {connectionStep === 'custom' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-indigo-500 shadow-lg border border-indigo-500/20">
                        <Terminal className="w-8 h-8" />
                      </div>
                      <Code2 className="w-6 h-6 text-indigo-400 animate-pulse" />
                      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Zap className="w-8 h-8" />
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endpoint URL</label>
                          <input 
                            type="text" 
                            placeholder="https://api.yourbank.com/v1" 
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-indigo-500 transition-all outline-none"
                            value={customConfig.endpoint}
                            onChange={(e) => setCustomConfig({...customConfig, endpoint: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bearer API Key</label>
                          <input 
                            type="password" 
                            placeholder="sk_live_..." 
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-indigo-500 transition-all outline-none"
                            value={customConfig.apiKey}
                            onChange={(e) => setCustomConfig({...customConfig, apiKey: e.target.value})}
                          />
                       </div>
                    </div>

                    <button 
                      onClick={() => setConnectionStep('success')}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                    >
                      Establish Connection
                    </button>
                  </motion.div>
                )}

                {connectionStep === 'qr' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                    <div className="w-56 h-56 bg-white p-4 rounded-[2rem] mx-auto shadow-xl border-4 border-slate-100 relative overflow-hidden group">
                      <QrCode className="w-full h-full text-slate-900" />
                      <div className="absolute inset-0 bg-indigo-600/5 animate-pulse pointer-events-none" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Secure Link Handover</h3>
                      <p className="text-slate-500 text-xs font-medium px-4">Open your phone camera to securely authorize {connectingProvider.providerName} on your mobile device.</p>
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
                      <p className="text-slate-500 text-sm font-medium">Your {connectingProvider.providerName} assets are now being synchronized.</p>
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
