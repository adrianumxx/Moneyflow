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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {isLinking ? (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-indigo-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connecting to {linkingTo}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  Moneyflow is establishing a 256-bit encrypted link via our secure API gateway...
                </p>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600 tracking-wider">SECURE CONNECTION ACTIVE</span>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-8 pb-0 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                      <Globe className="w-8 h-8 text-indigo-500 animate-pulse" />
                      Global Smart Connect
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Sync your entire portfolio in one click.</p>
                  </div>
                  <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:rotate-90 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search & Tabs */}
                <div className="p-8 pt-6">
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search accounts, brokers, crypto..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                    />
                  </div>

                  <div className="flex gap-2 mb-8 overflow-x-auto pb-2 noscroll">
                    {['all', 'bank', 'investment', 'crypto'].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all border ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filtered.map((connector) => (
                      <motion.button
                        key={connector.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleConnect(connector.name)}
                        className="p-4 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center text-center transition-all hover:border-indigo-500/50 hover:shadow-xl group"
                      >
                        <div className="w-14 h-14 rounded-2xl mb-3 flex items-center justify-center p-0.5 overflow-hidden shadow-sm group-hover:shadow-indigo-500/20">
                          <img src={connector.icon} alt={connector.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{connector.name}</span>
                        <Zap className="w-3 h-3 text-amber-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer Benefit */}
                <div className="bg-indigo-600 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">Institutional Trust</p>
                      <p className="text-indigo-100 text-xs">End-to-end AIS-secured protocol</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/50" />
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
