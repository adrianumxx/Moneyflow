import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, CreditCard, Home, Car, Landmark, Calendar, Loader2, MinusCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LiabilityType, UserProfile } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { getCurrencySymbol } from '../utils/format';

interface AddLiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDemoAdd?: (liability: any) => void;
  userProfile?: UserProfile;
}

const LIABILITY_TYPES: { type: LiabilityType; label: string; icon: any }[] = [
  { type: 'mortgage', label: 'Mortgage', icon: Home },
  { type: 'loan', icon: Car, label: 'Personal Loan' },
  { type: 'credit_card', icon: CreditCard, label: 'Credit Card' },
  { type: 'other', icon: MinusCircle, label: 'Other Debt' },
];

export default function AddLiabilityModal({ isOpen, onClose, userId, onDemoAdd, userProfile }: AddLiabilityModalProps) {
  const [name, setName] = useState('');
  const { showNotification } = useNotifications();
  const [type, setType] = useState<LiabilityType>('mortgage');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !remainingAmount) return;

    setIsSaving(true);
    try {
      const liabilityData = {
        name,
        type,
        totalAmount: parseFloat(totalAmount || remainingAmount),
        remainingAmount: parseFloat(remainingAmount),
        monthlyPayment: parseFloat(monthlyPayment || '0'),
        interestRate: interestRate ? parseFloat(interestRate) : 0,
        currency: userProfile?.baseCurrency || 'EUR',
      };

      if (userId.startsWith('demo-')) {
        // Simulate creation for demo user
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (onDemoAdd) {
          onDemoAdd({
            ...liabilityData,
            id: `demo-${Date.now()}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        onClose();
        setName('');
        setType('mortgage');
        setTotalAmount('');
        setRemainingAmount('');
        setMonthlyPayment('');
        setInterestRate('');
        setIsSaving(false);
        return;
      }
      await addDoc(collection(db, 'users', userId, 'liabilities'), {
        ...liabilityData,
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showNotification('Liability Logged', `New debt obligation identified and added: ${name}`, 'info');
      onClose();
      // Reset form
      setName('');
      setType('mortgage');
      setTotalAmount('');
      setRemainingAmount('');
      setMonthlyPayment('');
    } catch (error) {
      console.error("Error adding liability:", error);
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
            <h3 className="text-2xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Add Liability</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {LIABILITY_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      type === item.type 
                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-500 hover:border-red-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Liability Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Home Mortgage, Car Loan"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Remaining Amount ({getCurrencySymbol(userProfile?.baseCurrency)})</label>
                <input
                  type="number"
                  step="0.01"
                  value={remainingAmount}
                  onChange={(e) => setRemainingAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white font-mono font-bold"
                  required
                />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Monthly Payment ({getCurrencySymbol(userProfile?.baseCurrency)})</label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-500/20 active:scale-98 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-5 h-5" /> Add Liability</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
