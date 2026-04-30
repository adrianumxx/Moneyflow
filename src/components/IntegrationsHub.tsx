import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Wallet, Landmark, Globe, Plus, ShieldCheck, 
  ArrowRight, CheckCircle2, QrCode, Smartphone, ExternalLink,
  Lock, Zap, Info, Bitcoin, TrendingUp, Code2, Terminal, RefreshCw, X, History,
  Shield, Check, Search, ChevronRight
} from 'lucide-react';
import CryptoConnector from './CryptoConnector';
import { UserProfile } from '../types';

import { PROVIDER_REGISTRY, Provider } from '../utils/connectors';
import { createSyncSession, disconnectInstitution, syncAccounts } from '../services/syncService';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/format';

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

// State mapping for premium badges
const PROVIDER_STATES: Record<string, { label: string; color: string }> = {
  active: { label: 'Live', color: 'bg-emerald-500/10 text-emerald-500' },
  beta: { label: 'Beta', color: 'bg-amber-500/10 text-amber-500' },
  demo: { label: 'Demo', color: 'bg-indigo-500/10 text-indigo-500' },
  sandbox: { label: 'Sandbox', color: 'bg-slate-500/10 text-slate-500' }
};

interface ProviderIconProps {
  provider: Provider;
  className?: string;
}

const ProviderIcon = ({ provider, className = "" }: ProviderIconProps) => {
  const [error, setError] = useState(false);
  const Icon = FALLBACK_ICONS[provider.providerType] || Building2;
  const logoUrl = PROVIDER_LOGOS[provider.providerId];

  if (!logoUrl || error) {
    const initials = provider.providerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className={`w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 ${className}`}>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{initials}</span>
      </div>
    );
  }

  return (
    <div className={`w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden p-2 border border-slate-200 dark:border-white/10 ${className}`}>
      <img 
        src={logoUrl} 
        alt="" 
        className="w-full h-full object-contain" 
        onError={() => setError(true)}
      />
    </div>
  );
};

interface IntegrationsHubProps {
  userId: string;
  userProfile?: UserProfile;
  connectedInstitutions?: any[];
}

export default function IntegrationsHub({ userId, userProfile, connectedInstitutions }: IntegrationsHubProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'bank' | 'crypto_wallet' | 'broker' | 'custom_api'>('all');
  const [connectingProvider, setConnectingProvider] = useState<any | null>(null);
  const [connectionStep, setConnectionStep] = useState<'intro' | 'qr' | 'custom' | 'success'>('intro');
  const { showNotification } = useNotifications();

  const filteredProviders = PROVIDER_REGISTRY.filter(p => activeTab === 'all' || p.providerType === activeTab);

  const handleConnect = async (provider: Provider) => {
    const response = await createSyncSession(provider.providerId);
    if (!response.success) {
      showNotification('Connection Error', response.error || 'The service is temporarily unavailable.', 'error');
      return;
    }

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
      } else {
        throw new Error(response.error || 'Revocation failed');
      }
    } catch (error: any) {
      showNotification('Revocation Error', error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 pb-24 lg:pb-12 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans selection:bg-indigo-500/30">
      
      {/* HEADER SECTION */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-display">Connect your accounts</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-base font-medium leading-relaxed">
            Bring your balances and transactions into Moneyflow so your overview and insights stay up to date.
          </p>
          
          {/* Trust Strip */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: ShieldCheck, text: "Read-only connection" },
              { icon: Lock, text: "No money movement" },
              { icon: Check, text: "Disconnect anytime" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full">
                <item.icon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm max-w-xs">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Shield className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Read-only access</p>
            <p className="text-[10px] font-bold text-slate-500 leading-tight">Moneyflow can read balances. It cannot move money.</p>
          </div>
        </div>
      </div>

      {/* ACTIVE CONNECTIONS */}
      {connectedInstitutions && connectedInstitutions.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
               <RefreshCw className="w-5 h-5" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Connections</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {connectedInstitutions.map((inst) => {
               const provider = PROVIDER_REGISTRY.find(p => p.providerId === inst.providerId);
               return (
                <div key={inst.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-sm hover:border-indigo-500/20 transition-all group">
                   <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <ProviderIcon provider={provider || { providerId: inst.providerId, providerName: inst.providerName, providerType: 'bank' } as any} />
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{inst.providerName}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            Synced {inst.lastSyncedAt ? formatRelativeTime(typeof inst.lastSyncedAt === 'object' && 'toDate' in inst.lastSyncedAt ? inst.lastSyncedAt.toDate() : inst.lastSyncedAt) : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDisconnect(inst.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Disconnect"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                      <button 
                        onClick={async () => {
                          showNotification('Sync Initiated', `Updating balances...`, 'info');
                          await syncAccounts(inst.id);
                        }}
                        className="flex-1 py-3 bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-500 transition-all rounded-xl"
                      >
                        Sync Balance
                      </button>
                      <button 
                        onClick={async () => {
                          showNotification('Sync Initiated', `Fetching transactions...`, 'info');
                          await syncAccounts(inst.id, { syncTransactions: true });
                        }}
                        className="flex-1 py-3 bg-slate-50 dark:bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-500 transition-all rounded-xl"
                      >
                        Sync Ledger
                      </button>
                   </div>
                </div>
               );
             })}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-10 pb-2 border-b border-slate-200 dark:border-white/5">
        {[
          { id: 'all', label: 'All' },
          { id: 'bank', label: 'Banks' },
          { id: 'crypto_wallet', label: 'Crypto' },
          { id: 'broker', label: 'Brokers' },
          { id: 'custom_api', label: 'Custom' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap relative ${
              activeTab === tab.id 
                ? 'text-indigo-600 dark:text-white' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-4px_12px_rgba(79,70,229,0.3)]" />
            )}
          </button>
        ))}
      </div>

      {/* PROVIDER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-white/10">
            <Search className="w-12 h-12 text-slate-200 dark:text-white/5 mx-auto mb-6" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No connections available in this category yet.</h3>
            <p className="text-slate-500 font-medium">Try another category or check again later.</p>
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const state = provider.isDemo ? PROVIDER_STATES.demo : provider.supportsSandbox ? PROVIDER_STATES.sandbox : PROVIDER_STATES.active;
            const category = provider.providerType === 'bank' ? 'Bank' : provider.providerType === 'crypto_wallet' ? 'Wallet' : provider.providerType === 'broker' ? 'Broker' : 'Custom';
            
            return (
              <motion.div
                key={provider.providerId}
                layout
                className="glass-card rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 hover:border-indigo-500/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-8">
                    <ProviderIcon provider={provider} className="group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${state.color}`}>
                        {state.label}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {category}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {provider.providerName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                    {provider.providerId === 'revolut_demo' ? 'Explore the flow with simulated data.' :
                     provider.providerId === 'n26_demo' ? 'Preview bank sync without connecting a real account.' :
                     provider.providerId === 'bank_sandbox' ? 'Test open banking connection flows safely.' :
                     provider.providerId === 'binance_demo' ? 'Preview exchange sync with simulated balances.' :
                     provider.description}
                  </p>
                </div>

                <button
                  onClick={() => handleConnect(provider)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {provider.isDemo ? 'Try Demo' : provider.providerId === 'custom_api' ? 'Set up' : 'Connect'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-16 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Powered by Moneyflow Sync & GoCardless
        </p>
      </div>
    </div>
  );
}
