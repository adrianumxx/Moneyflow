import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Receipt, Landmark, Calendar, Loader2, Pencil } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc } from 'firebase/firestore';
import { Transaction, TransactionCategory } from '../types';
import { categorizeTransaction } from '../services/geminiService';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDemoAdd?: (transaction: any) => void;
  initialTransaction?: Transaction | null;
}

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'housing', label: 'Housing' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transportation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'income', label: 'Income' },
  { value: 'other', label: 'Other' },
];

export default function AddTransactionModal({ isOpen, onClose, userId, onDemoAdd, initialTransaction }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  React.useEffect(() => {
    if (initialTransaction) {
      setDescription(initialTransaction.description);
      setAmount(Math.abs(initialTransaction.amount).toString());
      setCategory(initialTransaction.category);
      setType(initialTransaction.type);
      setDate(initialTransaction.date.toDate().toISOString().split('T')[0]);
    } else {
      setDescription('');
      setAmount('');
      setCategory('other');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialTransaction, isOpen]);

  const handleAutoCategorize = async () => {
    if (!description || !amount) return;
    setIsCategorizing(true);
    try {
      const autoCategory = await categorizeTransaction(description, parseFloat(amount));
      setCategory(autoCategory);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setIsSaving(true);
    try {
      if (userId.startsWith('demo-')) {
        // Simulate creation for demo user
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (onDemoAdd) {
          onDemoAdd({
            id: initialTransaction?.id,
            description,
            amount: parseFloat(amount) * (type === 'expense' ? -1 : 1),
            category,
            type,
            date: new Date(date),
            isRecurring: false,
            createdAt: initialTransaction?.createdAt || new Date(),
          });
        }

        onClose();
        setIsSaving(false);
        return;
      }

      const transactionData = {
        description,
        amount: parseFloat(amount) * (type === 'expense' ? -1 : 1),
        category,
        type,
        date: Timestamp.fromDate(new Date(date)),
        isRecurring: false,
        ownerId: userId,
        createdAt: initialTransaction?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (initialTransaction?.id) {
        const docRef = doc(db, 'users', userId, 'transactions', initialTransaction.id);
        await setDoc(docRef, transactionData, { merge: true });
      } else {
        await addDoc(collection(db, 'users', userId, 'transactions'), transactionData);
      }
      onClose();
    } catch (error) {
      console.error("Error adding transaction:", error);
      handleFirestoreError(error, initialTransaction?.id ? OperationType.UPDATE : OperationType.CREATE, `users/${userId}/transactions`);
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
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold font-display tracking-tight">
              {initialTransaction ? 'Edit Entry' : 'Manual Entry'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${type === 'expense' ? 'bg-white dark:bg-zinc-700 shadow-sm text-red-500' : 'text-zinc-500'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${type === 'income' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-500' : 'text-zinc-500'}`}
              >
                Income
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Description</label>
              <div className="relative">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleAutoCategorize}
                  placeholder="e.g. Weekly Groceries"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  required
                />
                {isCategorizing && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Amount (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono font-bold"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-[24px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-98 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : initialTransaction ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isSaving ? 'Processing...' : initialTransaction ? 'Save Changes' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
