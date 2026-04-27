import React, { useState } from 'react';
import { Building2, Wallet, Landmark, Globe, Plus, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import CryptoConnector from './CryptoConnector';

export default function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState<'banks' | 'crypto' | 'brokers'>('banks');
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const handleBankConnect = (providerName: string) => {
    setConnectingProvider(providerName);
    // Simulate OAuth redirect or Plaid Link open
    setTimeout(() => {
      alert(`In a real environment, this would open the ${providerName} OAuth flow or Plaid Link modal. You need API keys for this to work in production.`);
      setConnectingProvider(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 lg:pb-12 pt-6 lg:pt-8 px-4 sm:px-6 max-w-7xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Wealth Synchronization</h1>
        <p className="text-slate-400 max-w-2xl text-sm">
          Connect your bank accounts, crypto wallets, and brokerage platforms to aggregate your net worth in real-time. 
          Secured by bank-grade 256-bit encryption. We never store your credentials.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-slate-800 pb-px">
        <button 
          onClick={() => setActiveTab('banks')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'banks' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Building2 className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Banks
          {activeTab === 'banks' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('crypto')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'crypto' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Wallet className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Crypto
          {activeTab === 'crypto' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('brokers')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'brokers' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Landmark className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Brokers
          {activeTab === 'brokers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full"></span>}
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-8">
        
        {activeTab === 'banks' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                <strong className="text-emerald-400">PSD2 Compliant.</strong> Read-only access. We use GoCardless (EU) and Plaid (US) to securely fetch your transactions. Your bank login details never touch our servers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* GoCardless / EU Banks */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors flex flex-col justify-between h-56 group">
                <div>
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-blue-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">European Banks</h3>
                  <p className="text-xs text-slate-400 font-medium">Powered by GoCardless Open Banking API.</p>
                </div>
                <button 
                  onClick={() => handleBankConnect('GoCardless')}
                  disabled={connectingProvider !== null}
                  className="w-full py-3 bg-slate-950 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-amber-950 transition-colors flex items-center justify-center gap-2 group-hover:border-amber-500/50 border border-transparent"
                >
                  {connectingProvider === 'GoCardless' ? 'Connecting...' : <><Plus className="w-4 h-4" /> Connect EU Bank</>}
                </button>
              </div>

              {/* Plaid / US Banks */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors flex flex-col justify-between h-56 group">
                <div>
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">US & Global Banks</h3>
                  <p className="text-xs text-slate-400 font-medium">Powered by Plaid Secure Link.</p>
                </div>
                <button 
                  onClick={() => handleBankConnect('Plaid')}
                  disabled={connectingProvider !== null}
                  className="w-full py-3 bg-slate-950 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-amber-950 transition-colors flex items-center justify-center gap-2 group-hover:border-amber-500/50 border border-transparent"
                >
                  {connectingProvider === 'Plaid' ? 'Connecting...' : <><Plus className="w-4 h-4" /> Connect via Plaid</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <CryptoConnector />
          </div>
        )}

        {activeTab === 'brokers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-20 flex flex-col items-center justify-center text-center">
            <Landmark className="w-16 h-16 text-slate-800 mb-6" />
            <h3 className="text-2xl font-black text-white mb-2">Brokerage Integration</h3>
            <p className="text-slate-500 max-w-md">Interactive Brokers, Robinhood, eToro, and Degiro connections are currently in closed beta for Executive members.</p>
          </div>
        )}

      </div>
    </div>
  );
}
