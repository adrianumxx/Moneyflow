import React, { useState } from 'react';
import { 
  X, 
  Search, 
  CreditCard, 
  BarChart3, 
  Coins, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  Building2,
  Globe,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Connector {
  id: string;
  name: string;
  category: 'bank' | 'investment' | 'crypto' | 'other';
  icon: string;
  color: string;
}

const CONNECTORS: Connector[] = [
  { id: 'revolut', name: 'Revolut', category: 'bank', icon: 'https://logo.clearbit.com/revolut.com', color: 'bg-slate-900' },
  { id: 'binance', name: 'Binance', category: 'crypto', icon: 'https://logo.clearbit.com/binance.com', color: 'bg-zinc-800' },
  { id: 'ibkr', name: 'Interactive Brokers', category: 'investment', icon: 'https://logo.clearbit.com/interactivebrokers.com', color: 'bg-red-600' },
  { id: 'etoro', name: 'eToro', category: 'investment', icon: 'https://logo.clearbit.com/etoro.com', color: 'bg-emerald-600' },
  { id: 'coinbase', name: 'Coinbase', category: 'crypto', icon: 'https://logo.clearbit.com/coinbase.com', color: 'bg-blue-600' },
  { id: 'wise', name: 'Wise', category: 'bank', icon: 'https://logo.clearbit.com/wise.com', color: 'bg-blue-500' },
  { id: 'degiro', name: 'DEGIRO', category: 'investment', icon: 'https://logo.clearbit.com/degiro.com', color: 'bg-amber-600' },
  { id: 'n26', name: 'N26', category: 'bank', icon: 'https://logo.clearbit.com/n26.com', color: 'bg-teal-600' },
];

interface SmartConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (name: string) => void;
}

export default function SmartConnectModal({ isOpen, onClose, onConnected }: SmartConnectModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bank' | 'investment' | 'crypto'>('all');
  const [isLinking, setIsLinking] = useState(false);
  const [linkingTo, setLinkingTo] = useState<string | null>(null);

  const filtered = CONNECTORS.filter(c => 
    (selectedCategory === 'all' || c.category === selectedCategory) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (name: string) => {
    setLinkingTo(name);
    setIsLinking(true);
    // Simulate Plaid/OAuth Flow
    setTimeout(() => {
      setIsLinking(false);
      setLinkingTo(null);
      onConnected(name);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-premium overflow-hidden border border-white/20"
          >
            {isLinking ? (
              <div className="p-16 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 dark:bg-indigo-600/10 animate-pulse" />
                <div className="relative mb-10">
                  <div className="w-32 h-32 rounded-full border-[6px] border-slate-100 dark:border-indigo-900/20 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-14 h-14 text-indigo-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white font-display mb-3">Authenticating Connection</h2>
                <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                  Establishing a secure handshake with <span className="text-indigo-600 font-black">{linkingTo}</span> using military-grade AES-256 encryption.
                </p>
                <div className="mt-10 flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 rounded-2xl shadow-xl shadow-indigo-600/10 border border-indigo-600/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Verified Gateway Active</span>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-12 pb-0 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Institutional Access</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter font-display leading-none">
                      Moneyflow Connect
                    </h2>
                    <p className="text-slate-500 font-medium text-lg tracking-tight">Sync your financial DNA across 15,000+ institutions.</p>
                  </div>
                  <button onClick={onClose} className="p-4 bg-slate-50 dark:bg-white/5 rounded-full hover:rotate-90 transition-all shadow-sm border border-slate-100 dark:border-white/10 group">
                    <X className="w-6 h-6 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white" />
                  </button>
                </div>

                {/* Search & Tabs */}
                <div className="p-12 pt-10">
                  <div className="relative mb-8 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search for your bank, broker or exchange..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-[2rem] py-6 pl-16 pr-6 focus:ring-4 focus:ring-indigo-500/20 outline-none text-xl font-bold tracking-tight text-slate-800 dark:text-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar">
                    {['all', 'bank', 'investment', 'crypto'].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-50/50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-white/5 hover:border-slate-300'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {filtered.map((connector) => (
                      <motion.button
                        key={connector.id}
                        whileHover={{ y: -8, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnect(connector.name)}
                        className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center text-center transition-all hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 group"
                      >
                        <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center p-0.5 overflow-hidden shadow-premium group-hover:rotate-6 transition-transform">
                          <img src={connector.icon} alt={connector.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight">{connector.name}</span>
                        <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-emerald-400" />)}
                        </div>
                      </motion.button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-full py-20 text-center glass-card rounded-[2rem] border-dashed">
                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full w-fit mx-auto mb-4">
                           <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold tracking-tight">No institutions found matching your search</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Benefit */}
                <div className="p-10 addictive-gradient flex items-center justify-between text-white shadow-glow">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black font-display leading-none">Security Core Verified</p>
                      <p className="text-white/70 text-xs font-medium tracking-tight">Your actual credentials are never stored. Zero-Knowledge Proof protocol.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-full">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
