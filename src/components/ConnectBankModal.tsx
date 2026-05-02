import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, ShieldCheck, Zap, ArrowRight, Loader2, Search, Cpu, Globe, CreditCard, TrendingUp, Bitcoin, ChevronRight, Lock, Wallet, Smartphone, ShieldAlert, Link2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { authenticatedFetch } from '../utils/api';

interface ConnectBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type Category = 'ALL' | 'BANK' | 'INVESTMENT' | 'CRYPTO';

const INSTITUTIONS = [
  { id: 'tink', name: 'Revolut (EU)', category: 'BANK', logo: 'https://logo.clearbit.com/revolut.com' },
  { id: 'tink', name: 'Intesa Sanpaolo', category: 'BANK', logo: 'https://logo.clearbit.com/intesasanpaolo.com' },
  { id: 'tink', name: 'N26', category: 'BANK', logo: 'https://logo.clearbit.com/n26.com' },
  { id: 'snaptrade', name: 'Binance', category: 'CRYPTO', logo: 'https://logo.clearbit.com/binance.com' },
  { id: 'snaptrade', name: 'Coinbase', category: 'CRYPTO', logo: 'https://logo.clearbit.com/coinbase.com' },
  { id: 'snaptrade', name: 'eToro', category: 'INVESTMENT', logo: 'https://logo.clearbit.com/etoro.com' },
  { id: 'snaptrade', name: 'Interactive Brokers', category: 'INVESTMENT', logo: 'https://logo.clearbit.com/interactivebrokers.com' },
  { id: 'snaptrade', name: 'DEGIRO', category: 'INVESTMENT', logo: 'https://logo.clearbit.com/degiro.com' },
];

export default function ConnectBankModal({ isOpen, onClose, userId }: ConnectBankModalProps) {
  const [step, setStep] = useState<'select' | 'consent' | 'redirecting'>('select');
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const { showNotification } = useNotifications();

  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS.filter(inst => {
      const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || inst.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleStartConnection = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/sync/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: selectedInst.id })
      });

      if (!response.ok) throw new Error('Failed to create secure link');
      const { redirectUrl } = await response.json();
      
      setStep('redirecting');
      showNotification('Secure Redirect', `Transferring to ${selectedInst.name} portal...`, 'info');
      
      // Delay for UX impact
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1500);

    } catch (error: any) {
      showNotification('Connection Error', error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-[620px] bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-Time Ingestion</span>
              </div>
              <h3 className="text-3xl font-black text-white font-display">Link Live <span className="text-zinc-500">Capital</span></h3>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"><X className="w-5 h-5 text-zinc-400" /></button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" placeholder="Search bank, broker or exchange..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-900/50 border border-white/5 rounded-3xl text-white outline-none focus:border-indigo-500/50 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredInstitutions.map(inst => (
                    <button key={inst.name} onClick={() => { setSelectedInst(inst); setStep('consent'); }} className="aspect-square relative group">
                      <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-[2rem] group-hover:border-indigo-500/50 transition-all" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                         <img src={inst.logo} className="w-10 h-10 object-contain mb-3 grayscale group-hover:grayscale-0 transition-all" alt="" />
                         <span className="text-[9px] font-bold text-zinc-500 group-hover:text-white uppercase tracking-widest text-center">{inst.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] flex items-center gap-4">
                   <ShieldCheck className="w-6 h-6 text-indigo-500" />
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">Secure Read-Only Link. Moneyflow cannot access your credentials or move funds.</p>
                </div>
              </motion.div>
            )}

            {step === 'consent' && (
              <motion.div key="consent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-4">
                 <div className="flex items-center justify-center gap-6">
                    <img src={selectedInst.logo} className="w-16 h-16 object-contain" alt="" />
                    <div className="w-12 h-[1px] bg-zinc-800 relative"><Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 fill-indigo-500" /></div>
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl"><Wallet className="w-8 h-8 text-white" /></div>
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-white">Authorize {selectedInst.name}</h4>
                    <p className="text-zinc-500 text-sm font-medium">To provide live intelligence, we need read-only access to your {selectedInst.category.toLowerCase()} data.</p>
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button onClick={() => setStep('select')} className="flex-1 py-5 bg-white/5 text-zinc-500 rounded-full font-black uppercase tracking-widest text-[10px]">Cancel</button>
                    <button onClick={handleStartConnection} disabled={isLoading} className="flex-[2] py-5 bg-white text-zinc-950 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                       {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Secure Link <ArrowRight className="w-4 h-4" /></>}
                    </button>
                 </div>
              </motion.div>
            )}

            {step === 'redirecting' && (
              <motion.div key="redirect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-6">
                 <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Handshake in progress...</h4>
                 <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Redirecting to secure provider portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
