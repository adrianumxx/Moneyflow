import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Loader2, ShieldCheck, Link2 } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';

interface AddCryptoWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AddCryptoWalletModal({ isOpen, onClose, userId }: AddCryptoWalletModalProps) {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [label, setLabel] = useState('My Cold Wallet');
  const [isSyncing, setIsSyncing] = useState(false);
  const { showNotification } = useNotifications();

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.startsWith('0x') || address.length !== 42) {
      showNotification('Invalid Address', 'Please enter a valid EVM public address (starts with 0x).', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await authenticatedFetch('/api/crypto/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain, label })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to sync wallet');
      }

      showNotification('Wallet Connected', 'Live balance retrieved successfully from blockchain.', 'success');
      onClose();
    } catch (error: any) {
      showNotification('Sync Failed', error.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black font-display tracking-tight text-slate-900 dark:text-white">Add Crypto Wallet</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700/50">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Read-Only Connection</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">We only need your public address. Moneyflow cannot access or move your funds.</p>
            </div>
          </div>

          <form onSubmit={handleSync} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Network</label>
              <select 
                value={chain} 
                onChange={e => setChain(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-white"
              >
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="polygon">Polygon (MATIC)</option>
                <option value="arbitrum">Arbitrum (ETH)</option>
                <option value="optimism">Optimism (ETH)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Public Address (0x...)</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)}
                placeholder="0x1234...abcd"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm text-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Wallet Label</label>
              <input 
                type="text" 
                value={label} 
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Ledger Nano S"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 dark:text-white"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Syncing Blockchain...</>
                ) : (
                  <><Link2 className="w-5 h-5" /> Connect Wallet</>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
