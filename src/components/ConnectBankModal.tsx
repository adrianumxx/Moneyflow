import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Landmark, ShieldCheck, Zap, ArrowRight, Loader2, Link2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';

interface ConnectBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const POPULAR_BANKS = [
  { id: 'intesa', name: 'Intesa Sanpaolo', color: '#00543c' },
  { id: 'unicredit', name: 'UniCredit', color: '#e2001a' },
  { id: 'revolut', name: 'Revolut', color: '#000000' },
  { id: 'n26', name: 'N26', color: '#00aab5' },
  { id: 'fineco', name: 'Fineco Bank', color: '#003056' },
  { id: 'poste', name: 'Poste Italiane', color: '#ffcc00', textColor: '#000' },
];

export default function ConnectBankModal({ isOpen, onClose, userId }: ConnectBankModalProps) {
  const [step, setStep] = useState<'select' | 'auth' | 'success'>('select');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBankSelect = (bank: any) => {
    setSelectedBank(bank);
    setStep('auth');
  };

  const simulateConnection = async () => {
    setIsLoading(true);
    // Simulate real OAUTH flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Add fake bank account for demo
      const bankRef = doc(collection(db, 'users', userId, 'bankAccounts'));
      await setDoc(bankRef, {
        institutionName: selectedBank.name,
        accountName: 'Main Checking Account',
        balance: 2450.75,
        currency: 'EUR',
        lastSynced: serverTimestamp(),
      });

      // Add a few test transactions
      const txs = [
        { amount: -45.50, description: 'Esselunga Supermarket', category: 'food', type: 'expense', date: serverTimestamp() },
        { amount: -12.99, description: 'Netflix Subscription', category: 'entertainment', type: 'expense', date: serverTimestamp() },
        { amount: 1850.00, description: 'Moneyflow Salary Payment', category: 'income', type: 'income', date: serverTimestamp() },
      ];

      for (const tx of txs) {
        await addDoc(collection(db, 'users', userId, 'transactions'), {
          ...tx,
          bankAccountId: bankRef.id,
          isRecurring: tx.description.includes('Netflix')
        });
      }

      setStep('success');
    } catch (error) {
      console.error("Error connecting bank:", error);
    } finally {
      setIsLoading(false);
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
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold font-display">Connect Account</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          {step === 'select' && (
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search your bank..."
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {POPULAR_BANKS.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleBankSelect(bank)}
                    className="flex flex-col items-center gap-3 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500 transition-all group"
                  >
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ backgroundColor: bank.color, color: bank.textColor || '#fff' }}
                    >
                      {bank.name[0]}
                    </div>
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">{bank.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <p className="text-[10px] text-zinc-500">Security guaranteed by 256-bit encryption. We never see your login credentials.</p>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="text-center py-10">
              <div 
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: selectedBank.color, color: selectedBank.textColor || '#fff' }}
              >
                <Landmark className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold mb-2">Connecting to {selectedBank.name}</h4>
              <p className="text-sm text-zinc-500 mb-8 px-10">You're being redirected to your bank's secure page to authorize Moneyflow.</p>
              
              <button
                onClick={simulateConnection}
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-3xl font-bold hover:scale-105 transition-all shadow-xl shadow-indigo-500/20"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Authorize Connection <ArrowRight className="w-5 h-5" /></>}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold mb-2">Account Synced!</h4>
              <p className="text-sm text-zinc-500 mb-8">We've successfully linked your {selectedBank.name} account. Your transactions are being categorized by Moneyflow AI.</p>
              
              <button
                onClick={onClose}
                className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-3xl font-bold"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
