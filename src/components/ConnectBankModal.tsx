import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, ShieldCheck, Zap, ArrowRight, Loader2, Search, Cpu, Globe, CreditCard, TrendingUp, Bitcoin, ChevronRight, Lock, Wallet, Smartphone, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { useNotifications } from '../context/NotificationContext';

interface ConnectBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

type Category = 'ALL' | 'BANK' | 'INVESTMENT' | 'CRYPTO';

const INSTITUTIONS = [
  { id: 'revolut', name: 'Revolut', category: 'BANK', color: '#ffffff', logo: 'https://logo.clearbit.com/revolut.com' },
  { id: 'binance', name: 'Binance', category: 'CRYPTO', color: '#F3BA2F', logo: 'https://logo.clearbit.com/binance.com' },
  { id: 'coinbase', name: 'Coinbase', category: 'CRYPTO', color: '#0052FF', logo: 'https://logo.clearbit.com/coinbase.com' },
  { id: 'n26', name: 'N26', category: 'BANK', color: '#00aab5', logo: 'https://logo.clearbit.com/n26.com' },
  { id: 'etoro', name: 'eToro', category: 'INVESTMENT', color: '#7CC242', logo: 'https://logo.clearbit.com/etoro.com' },
  { id: 'degiro', name: 'DEGIRO', category: 'INVESTMENT', color: '#00263E', logo: 'https://logo.clearbit.com/degiro.com' },
  { id: 'wise', name: 'Wise', category: 'BANK', color: '#00B9FF', logo: 'https://logo.clearbit.com/wise.com' },
  { id: 'ibkr', name: 'Interactive Brokers', category: 'INVESTMENT', color: '#B31920', logo: 'https://logo.clearbit.com/interactivebrokers.com' },
  { id: 'ing-be', name: 'ING Belgium', category: 'BANK', color: '#FF6200', logo: 'https://logo.clearbit.com/ing.com' },
  { id: 'kraken', name: 'Kraken', category: 'CRYPTO', color: '#5841D8', logo: 'https://logo.clearbit.com/kraken.com' },
  { id: 'ledger', name: 'Ledger', category: 'CRYPTO', color: '#000000', logo: 'https://logo.clearbit.com/ledger.com' },
  { id: 'metamask', name: 'MetaMask', category: 'CRYPTO', color: '#E2761B', logo: 'https://logo.clearbit.com/metamask.io' }
];

export default function ConnectBankModal({ isOpen, onClose, userId }: ConnectBankModalProps) {
  const [step, setStep] = useState<'select' | 'consent' | 'auth' | 'handshake' | 'selection' | 'success'>('select');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['checking']);

  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS.filter(inst => {
      const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || inst.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleBankSelect = (bank: any) => {
    setSelectedBank(bank);
    setStep('consent');
  };

  const { showNotification } = useNotifications();

  const simulateConnection = async () => {
    setIsLoading(true);
    showNotification('Secure Link Initiated', `Opening encrypted tunnel to ${selectedBank.name}...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('handshake');
    setIsLoading(false);
    showNotification('Handshake Required', 'Please confirm the identity request on your mobile device.', 'push', selectedBank.name);
  };

  const completeHandshake = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setStep('selection');
    setIsLoading(false);
    showNotification('Identity Verified', 'Credentials confirmed via OIDC Handshake.', 'success', 'Security Core');
  };

  const finalizeConnection = async () => {
    setIsLoading(true);
    showNotification('Parsing Ledger', 'Extracting and categorizing transaction data...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const mockAccounts = [
        { id: 'checking', name: 'Premium Checking', balance: 12450.00, category: 'bank' },
        { id: 'savings', name: 'Global Savings', balance: 5000.00, category: 'savings' },
        { id: 'trading', name: 'Active Trading', balance: 24500.00, category: 'investment' }
      ];

      for (const accountId of selectedAccounts) {
        const accountInfo = mockAccounts.find(a => a.id === accountId);
        if (!accountInfo) continue;

        const bankRef = doc(collection(db, 'users', userId, 'bankAccounts'));
        await setDoc(bankRef, {
          institutionName: selectedBank.name,
          accountName: accountInfo.name,
          balance: accountInfo.balance,
          currency: 'EUR',
          ownerId: userId,
          lastSynced: serverTimestamp(),
          category: accountInfo.category || selectedBank.category.toLowerCase()
        });

        // Add specific transactions for each account to make it look active
        const txs = [
          { amount: -250.00, description: `Provision: ${accountInfo.name} Sync`, category: 'system', type: 'expense', date: serverTimestamp() },
          { amount: accountInfo.balance * 0.1, description: 'Initial Capital Injection', category: 'income', type: 'income', date: serverTimestamp() },
        ];

        for (const tx of txs) {
          await addDoc(collection(db, 'users', userId, 'transactions'), {
            ...tx,
            ownerId: userId,
            bankAccountId: bankRef.id,
            updatedAt: serverTimestamp(),
          });
        }
      }

      showNotification('Ledger Synced', `Successfully linked ${selectedAccounts.length} accounts.`, 'success', 'Wealth OS');
      setStep('success');
    } catch (error) {
      console.error("Error connecting bank:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-[620px] bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(79,70,229,0.1)] overflow-hidden"
      >
        {/* Glowing Background Accent */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Institutional Access</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black tracking-tight text-white font-display">
                  Moneyflow <span className="text-zinc-500">Connect</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium">Sync your financial DNA across 15,000+ institutions.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
              <X className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search for your bank, broker or exchange..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-zinc-900/50 border border-white/5 rounded-3xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all font-medium"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {(['ALL', 'BANK', 'INVESTMENT', 'CRYPTO'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                        activeCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Institutions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
                  {filteredInstitutions.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => handleBankSelect(inst)}
                      className="aspect-square relative group"
                    >
                      <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-[2rem] transition-all group-hover:bg-zinc-900 group-hover:border-indigo-500/50 group-hover:-translate-y-1" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <div className="w-12 h-12 bg-zinc-900 p-2 rounded-2xl mb-3 shadow-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img src={inst.logo} alt={inst.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-bold text-center text-zinc-500 group-hover:text-white transition-colors">{inst.name}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bottom Footer */}
                <div className="mt-8 bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-[1px] rounded-[2rem]">
                  <div className="bg-zinc-950 rounded-[2rem] p-6 flex items-center justify-between group cursor-pointer hover:bg-zinc-900/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Security Core Verified</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">Your actual credentials are never stored. Zero-Knowledge Proof protocol.</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'consent' && (
              <motion.div
                key="consent-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
                  <div className="w-16 h-16 bg-zinc-900 rounded-3xl p-3 shadow-xl">
                    <img src={selectedBank.logo} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-10 h-[2px] bg-zinc-800 relative">
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 fill-indigo-500" />
                  </div>
                  <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white tracking-tight">Sync Authorization Required</h4>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed">
                    To provide real-time wealth intelligence, Moneyflow needs your permission to securely access the following data from <span className="text-white font-bold">{selectedBank.name}</span>:
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: CreditCard, title: 'Balances & Holdings', desc: 'Current value of checking, savings, and portfolios' },
                    { icon: TrendingUp, title: '12-Month History', desc: 'Inflow and outflow patterns for AI categorization' },
                    { icon: ShieldCheck, title: 'Identity Verification', desc: 'Legal name and account ownership confirmation' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                        <item.icon className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{item.title}</h5>
                        <p className="text-[11px] text-zinc-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('select')}
                    className="flex-1 py-5 bg-white/5 text-zinc-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Cancel Request
                  </button>
                  <button 
                    onClick={() => setStep('auth')}
                    className="flex-[2] py-5 addictive-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20"
                  >
                    Authorize via {selectedBank.name}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'auth' && (
              <motion.div
                key="auth-step"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-12 space-y-12 text-center"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 bg-zinc-900 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl p-4">
                    <img src={selectedBank.logo} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <h4 className="text-2xl font-black text-white tracking-tight">Authenticating Handshake</h4>
                  <p className="text-zinc-500 font-medium">We're opening a secure encrypted bridge (AES-256) to your institution. Please wait while we establish a Zero-Knowledge connection.</p>
                </div>

                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                  <button
                    onClick={simulateConnection}
                    disabled={isLoading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> 
                        Performing Handshake...
                      </>
                    ) : (
                      <>
                        Proceed to Login Portal <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-6 text-zinc-700">
                  <Lock className="w-4 h-4" />
                  <div className="w-[1px] h-4 bg-zinc-800" />
                  <Cpu className="w-4 h-4" />
                  <div className="w-[1px] h-4 bg-zinc-800" />
                  <Globe className="w-4 h-4" />
                </div>
              </motion.div>
            )}

            {step === 'handshake' && (
              <motion.div
                key="handshake-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-8 space-y-10 text-center"
              >
                <div className="space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-[2.5rem]" />
                    <motion.div 
                      className="absolute inset-0 border-4 border-indigo-500 rounded-[2.5rem] border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Smartphone className="w-12 h-12 text-indigo-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-white tracking-tight uppercase">Check your phone</h4>
                    <p className="text-zinc-500 text-xs font-medium tracking-wide">CONFIRM THE ACCESS REQUEST IN THE {selectedBank.name.toUpperCase()} APP</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-4 max-w-sm mx-auto">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Verify code: 8A4F</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Match this code in your banking app for a verified link.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={completeHandshake}
                    disabled={isLoading}
                    className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "I've confirmed on my phone"}
                  </button>
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em] animate-pulse">Waiting for handshake... (3DES Layer 4 active)</p>
                </div>
              </motion.div>
            )}

            {step === 'selection' && (
              <motion.div
                key="selection-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-white tracking-tight">Select Portfolios to Sync</h4>
                  <p className="text-zinc-500 font-medium text-sm">We found multiple accounts associated with your credentials.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'checking', name: 'Premium Checking', balance: '12,450.00', number: '•••• 4209' },
                    { id: 'savings', name: 'Global Savings', balance: '5,000.00', number: '•••• 8812' },
                    { id: 'trading', name: 'Active Trading', balance: '24,500.00', number: '•••• 1156' }
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccounts(prev => 
                          prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                        );
                      }}
                      className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] border transition-all ${
                        selectedAccounts.includes(acc.id)
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-600/10'
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          selectedAccounts.includes(acc.id) ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-500'
                        }`}>
                          <Landmark className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-black text-white uppercase tracking-wider text-xs">{acc.name}</h5>
                          <p className="text-[10px] text-zinc-500 font-mono">{acc.number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg ${selectedAccounts.includes(acc.id) ? 'text-white' : 'text-zinc-400'}`}>€{acc.balance}</p>
                        {selectedAccounts.includes(acc.id) && <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected</p>}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={finalizeConnection}
                  disabled={isLoading || selectedAccounts.length === 0}
                  className="w-full py-6 addictive-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalize Syncing {selectedAccounts.length} Accounts <ArrowRight className="w-5 h-5" /></>}
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-12 text-center space-y-10"
              >
                <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-4xl font-black text-white tracking-tight">Sync Complete</h4>
                  <p className="text-zinc-500 font-medium max-w-sm mx-auto">
                    Your {selectedBank.name} accounts are now fueling your Wealth OS. Our AI is parsing your transaction history and building your financial profile.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 max-w-sm mx-auto space-y-4">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Accounts Synced</span>
                    <span className="text-white">{selectedAccounts.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Total Value</span>
                    <span className="text-emerald-500">€41,950.00</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Handshake Status</span>
                    <span className="text-indigo-400">Encrypted / Active</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full max-w-sm py-6 bg-white text-zinc-950 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  View My Strategic Wealth Overview
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
