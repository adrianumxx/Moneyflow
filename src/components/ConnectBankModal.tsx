import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, ShieldCheck, Zap, ArrowRight, Loader2, Search, Cpu, Globe, CreditCard, TrendingUp, Bitcoin, ChevronRight, Lock, Wallet, Smartphone, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { useNotifications } from '../context/NotificationContext';
import { buildDemoInstitution, buildDemoAccount } from '../utils/connectors';
import { createSyncSession, handleSyncCallback, listInstitutions } from '../services/syncService';

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
  { id: 'metamask', name: 'MetaMask', category: 'CRYPTO', color: '#E2761B', logo: 'https://logo.clearbit.com/metamask.io' },
  { id: 'gocardless_sandbox', name: 'GoCardless (Sandbox)', category: 'BANK', color: '#ffffff', logo: 'https://logo.clearbit.com/gocardless.com' }
];

export default function ConnectBankModal({ isOpen, onClose, userId }: ConnectBankModalProps) {
  const [step, setStep] = useState<'select' | 'consent' | 'auth' | 'handshake' | 'selection' | 'success' | 'gocardless_list'>('select');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [gocardlessInstitutions, setGocardlessInstitutions] = useState<any[]>([]);
  const [selectedGoCardlessInst, setSelectedGoCardlessInst] = useState<any>(null);
  const [consentLink, setConsentLink] = useState<string | null>(null);
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

  const handleBankSelect = async (bank: any) => {
    setSelectedBank(bank);
    if (bank.id === 'gocardless_sandbox') {
      setStep('gocardless_list');
      await fetchGoCardlessInstitutions();
    } else {
      setStep('consent');
    }
  };

  const fetchGoCardlessInstitutions = async () => {
    setIsLoading(true);
    try {
      const response = await listInstitutions('gocardless_sandbox', 'BE');
      if (response.success) {
        setGocardlessInstitutions(response.institutions);
      } else if (response.status === 'not_configured') {
        showNotification('Provider Error', 'GoCardless is not configured in this environment.', 'error');
      }
    } catch (error) {
      showNotification('Sync Error', 'Failed to fetch bank list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const { showNotification } = useNotifications();

  const simulateConnection = async () => {
    setIsLoading(true);
    showNotification('Secure Link Initiated', `Connecting to ${selectedBank.name}...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('handshake');
    setIsLoading(false);
    showNotification('Confirmation Required', 'Please confirm the request on your mobile device.', 'push', selectedBank.name);
  };

  const completeHandshake = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setStep('selection');
    setIsLoading(false);
    showNotification('Identity Verified', 'Credentials confirmed via secure link.', 'success', 'Security Center');
  };

  const finalizeConnection = async () => {
    setIsLoading(true);
    showNotification('Syncing History', 'Organizing your transaction history...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // 1. Backend Handshake Bridge (Foundation)
      const handshake = await handleSyncCallback(selectedBank.id, 'auth_stub_' + Date.now());
      if (!handshake.success) {
        showNotification('Connection Refused', handshake.error || 'Could not verify the bank connection.', 'error');
        setIsLoading(false);
        return;
      }

      const mockAccounts = [
        { id: 'checking', name: 'Premium Checking', balance: 12450.00, category: 'bank' },
        { id: 'savings', name: 'Global Savings', balance: 5000.00, category: 'savings' },
        { id: 'trading', name: 'Active Trading', balance: 24500.00, category: 'investment' }
      ];

      // 1. Create ConnectedInstitution record
      const instRef = doc(collection(db, 'users', userId, 'connectedInstitutions'));
      const demoInstitution = buildDemoInstitution(userId, selectedBank.id.includes('_demo') ? selectedBank.id : `${selectedBank.id}_demo`);
      await setDoc(instRef, {
        ...demoInstitution,
        id: instRef.id,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      for (const accountId of selectedAccounts) {
        const accountInfo = mockAccounts.find(a => a.id === accountId);
        if (!accountInfo) continue;

        // 2. Create ConnectedAccount record
        const accRef = doc(collection(db, 'users', userId, 'connectedAccounts'));
        const demoAccount = buildDemoAccount(userId, instRef.id, selectedBank.id, 'EUR');
        await setDoc(accRef, {
          ...demoAccount,
          id: accRef.id,
          name: accountInfo.name,
          balance: accountInfo.balance,
          type: accountInfo.category,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });

        // 3. Backward Compatibility: Create legacy bankAccounts record
        const bankRef = doc(collection(db, 'users', userId, 'bankAccounts'));
        await setDoc(bankRef, {
          institutionName: selectedBank.name,
          accountName: accountInfo.name,
          balance: accountInfo.balance,
          currency: 'EUR',
          ownerId: userId,
          lastSynced: serverTimestamp(),
          category: accountInfo.category || selectedBank.category.toLowerCase(),
          institutionId: instRef.id,
          providerId: selectedBank.id,
          isDemo: true
        });

        // 4. Create initial synchronization transactions
        const txs = [
          { amount: -250.00, description: `Provision: ${accountInfo.name} Sync`, category: 'system', type: 'expense', date: serverTimestamp() },
          { amount: accountInfo.balance * 0.1, description: 'Initial Capital Injection', category: 'income', type: 'income', date: serverTimestamp() },
        ];

        for (const tx of txs) {
          await addDoc(collection(db, 'users', userId, 'transactions'), {
            ...tx,
            ownerId: userId,
            bankAccountId: bankRef.id,
            providerId: selectedBank.id,
            updatedAt: serverTimestamp(),
          });
        }
      }

      showNotification('History Synced', `Successfully linked ${selectedAccounts.length} accounts.`, 'success', 'Moneyflow');
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

        <div className="p-5 sm:p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Institutional Access</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display flex items-center gap-3">
                  Moneyflow <span className="text-zinc-500">Sync</span>
                  <span className="hidden sm:inline text-[10px] bg-white/10 text-zinc-400 px-2 py-1 rounded-md tracking-widest uppercase">Sandbox</span>
                </h3>
                <p className="text-zinc-500 text-sm font-medium">Simulate sync with major institutions.</p>
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
                          <img 
                            src={inst.logo} 
                            alt={inst.name} 
                            className="w-full h-full object-contain" 
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const category = inst.category;
                                let icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>';
                                if (category === 'CRYPTO') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bitcoin"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042l-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893l-3.94-.694m5.155-6.2c.348-1.977-1.563-8.864-1.563-8.864m-1.12 8.167L7.36 5.534m5.908 1.042l.348-1.97m-4.296.845l.348-1.97m-3.136 12.443l.348-1.97"/></svg>';
                                if (category === 'INVESTMENT') icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-indigo-500">${icon}</div>`;
                              }
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-center text-zinc-500 group-hover:text-white transition-colors truncate w-full px-1">{inst.name}</span>
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
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Security Verified</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">Your actual credentials are never stored. Secure sandbox environment.</p>
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
                <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5">
                  <div className="w-16 h-16 bg-zinc-900 rounded-3xl p-3 shadow-xl flex items-center justify-center">
                    <img 
                      src={selectedBank.logo} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg></div>`;
                        }
                      }}
                    />
                  </div>
                  <div className="w-10 h-[2px] bg-zinc-800 relative">
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 fill-indigo-500" />
                  </div>
                  <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white tracking-tight">Access Authorization Required</h4>
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

                {selectedBank?.id === 'gocardless_sandbox' && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-400 font-bold leading-tight">
                      Secure connection active. You will be redirected to <span className="text-white">{selectedGoCardlessInst?.name}</span> to authorize the connection.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('select')}
                    className="flex-1 py-5 bg-white/5 text-zinc-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Cancel Request
                  </button>
                  <button 
                    onClick={async () => {
                      if (selectedBank?.id === 'gocardless_sandbox') {
                        setIsLoading(true);
                        try {
                          const response = await createSyncSession('gocardless_sandbox', selectedGoCardlessInst?.id);
                          if (response.success && response.redirectUrl) {
                            window.location.href = response.redirectUrl;
                          } else {
                            showNotification('Handshake Failed', response.message || 'Could not initiate bank consent.', 'error');
                          }
                        } catch (error) {
                          showNotification('Sync Error', 'Failed to start authorization.', 'error');
                        } finally {
                          setIsLoading(false);
                        }
                      } else {
                        setStep('auth');
                      }
                    }}
                    disabled={isLoading}
                    className="flex-[2] py-5 addictive-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Authorize via ${selectedBank?.name}`}
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
                    <img 
                      src={selectedBank.logo} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg></div>`;
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <h4 className="text-2xl font-black text-white tracking-tight">Verifying Connection</h4>
                  <p className="text-zinc-500 font-medium">We're opening a secure demo connection to your institution. Please wait.</p>
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
                        Verifying Connection...
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
                    <h4 className="text-2xl font-black text-white tracking-tight uppercase">Verify Access</h4>
                    <p className="text-zinc-500 text-xs font-medium tracking-wide">CONFIRM THE REQUEST IN THE {selectedBank.name.toUpperCase()} APP</p>
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
                  <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em] animate-pulse">Waiting for confirmation... (Secure SSL Active)</p>
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
                  <h4 className="text-2xl font-black text-white tracking-tight">Select Accounts to Sync</h4>
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
                          <h5 className="font-black text-white uppercase tracking-wider text-xs truncate max-w-[140px] sm:max-w-none">{acc.name}</h5>
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
                  <h4 className="text-4xl font-black text-white tracking-tight">Your bank is connected</h4>
                  <p className="text-zinc-500 font-medium max-w-sm mx-auto">
                    Moneyflow can now use your balances to improve your overview and insights. We are building your financial profile in the background.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 max-w-sm mx-auto space-y-4">
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

                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                   <button
                     onClick={onClose}
                     className="w-full py-6 bg-white text-zinc-950 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                   >
                     Review Wealth Overview
                   </button>
                   <button
                     onClick={() => {
                       onClose();
                     }}
                     className="w-full py-4 bg-white/5 text-zinc-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:text-white transition-all border border-white/5"
                   >
                     Review Insights
                   </button>
                 </div>
              </motion.div>
            )}
            {step === 'gocardless_list' && (
              <motion.div
                key="gocardless-list-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-white tracking-tight">Select your Belgian Bank</h4>
                  <p className="text-zinc-500 font-medium text-sm">Real-time sync via GoCardless Open Banking network.</p>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Querying Banking Network...</p>
                    </div>
                  ) : gocardlessInstitutions.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <ShieldAlert className="w-12 h-12 text-zinc-800 mx-auto" />
                      <p className="text-zinc-500 font-medium">No institutions found or provider not configured.</p>
                    </div>
                  ) : (
                    gocardlessInstitutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => setSelectedGoCardlessInst(inst)}
                        className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all ${
                          selectedGoCardlessInst?.id === inst.id
                          ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-600/10'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden p-2">
                            {inst.logo ? (
                              <img src={inst.logo} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Landmark className="w-6 h-6 text-zinc-500" />
                            )}
                          </div>
                          <div className="text-left">
                            <h5 className="font-black text-white uppercase tracking-wider text-xs truncate max-w-[180px]">{inst.name}</h5>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{inst.bic || 'No BIC'}</p>
                          </div>
                        </div>
                        {selectedGoCardlessInst?.id === inst.id && (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('select')}
                    className="flex-1 py-5 bg-white/5 text-zinc-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Back
                  </button>
                  <button 
                    disabled={!selectedGoCardlessInst || isLoading}
                    onClick={() => setStep('consent')}
                    className="flex-[2] py-5 addictive-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                  >
                    Select {selectedGoCardlessInst?.name || 'Institution'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
