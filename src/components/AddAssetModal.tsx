import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Wallet, Building2, Coins, Landmark, Calendar, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AssetType } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDemoAdd?: (asset: any) => void;
}

const ASSET_TYPES: { type: AssetType; label: string; icon: any }[] = [
  { type: 'savings', label: 'Savings Account', icon: Wallet },
  { type: 'real_estate', label: 'Real Estate', icon: Building2 },
  { type: 'investment', label: 'Stocks/Funds', icon: Landmark },
  { type: 'crypto', label: 'Crypto', icon: Coins },
  { type: 'retirement', label: 'Pension/Retirement', icon: Calendar },
  { type: 'other', label: 'Other Asset', icon: Plus },
];

export default function AddAssetModal({ isOpen, onClose, userId, onDemoAdd }: AddAssetModalProps) {
  const [name, setName] = useState('');
  const { showNotification } = useNotifications();
  const [type, setType] = useState<AssetType>('savings');
  const [value, setValue] = useState('');
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');
  const [annualReturn, setAnnualReturn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    setIsSaving(true);
    try {
      const assetData = {
        name,
        type,
        value: parseFloat(value),
        institution: institution || 'Manual',
        annualReturn: annualReturn ? parseFloat(annualReturn) : 0,
        notes,
      };

      if (userId.startsWith('demo-')) {
        // Simulate creation for demo user
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (onDemoAdd) {
          onDemoAdd({
            ...assetData,
            id: `demo-${Date.now()}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        onClose();
        setName('');
        setType('savings');
        setValue('');
        setInstitution('');
        setNotes('');
        setAnnualReturn('');
        setIsSaving(false);
        return;
      }
      await addDoc(collection(db, 'users', userId, 'assets'), {
        ...assetData,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showNotification('Asset Added', `${name} has been integrated into your portfolio.`, 'success');
      onClose();
      // Reset form
      setName('');
      setType('savings');
      setValue('');
      setInstitution('');
      setNotes('');
    } catch (error) {
      console.error("Error adding asset:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Add New Asset</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ASSET_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      type === item.type 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-500 hover:border-indigo-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Asset Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Milan Apartment, BTC Wallet"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Current Value (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Institution / Platform</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Binance, Intesa, Private"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Exp. Annual Return (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Short description..."
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-98 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-5 h-5" /> Add Asset to Portfolio</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
