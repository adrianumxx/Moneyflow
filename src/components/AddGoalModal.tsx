import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Calendar as CalendarIcon, Coins } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onDemoAdd?: (goal: any) => void;
}

export default function AddGoalModal({ isOpen, onClose, userId, onDemoAdd }: AddGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('savings');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (userId.startsWith('demo-')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (onDemoAdd) {
          onDemoAdd({
            name,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount) || 0,
            deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
            category,
            status: 'active',
          });
        }

        onClose();
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setDeadline('');
        setIsSubmitting(false);
        return;
      }
      const goalData = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
        category,
        status: 'active',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'users', userId, 'goals'), goalData);
      onClose();
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white font-display">New Wealth Target</h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Goal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Retirement Fund, New Tesla"
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Target Amount (€)</label>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="50,000"
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Starting Amount (€)</label>
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="5,000"
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Deadline (Optional)</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold appearance-none"
                    >
                      <option value="savings">Savings</option>
                      <option value="investment">Investment</option>
                      <option value="purchase">Purchase</option>
                      <option value="emergency">Emergency Fund</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 addictive-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? 'Establishing Target...' : 'Confirm Target'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
