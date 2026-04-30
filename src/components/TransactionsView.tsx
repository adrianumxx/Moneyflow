import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  ShoppingBag, 
  Coffee, 
  Utensils, 
  ShieldCheck, 
  Home as HomeIcon, 
  Zap, 
  Activity,
  Trash2,
  Calendar,
  Pencil
} from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction, UserProfile } from '../types';
import { formatMoney } from '../utils/format';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface TransactionsViewProps {
  transactions: Transaction[];
  userId: string;
  onAddTransaction: () => void;
  onDeleteTransaction?: (id: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  userProfile?: UserProfile;
}

const CATEGORY_ICONS: Record<string, any> = {
  food: Utensils,
  housing: HomeIcon,
  transport: Zap,
  entertainment: Activity,
  shopping: ShoppingBag,
  health: ShieldCheck,
  income: ArrowUpRight,
  other: Receipt
};

export default function TransactionsView({ 
  transactions, 
  userId, 
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction,
  userProfile
}: TransactionsViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesCat = catFilter === 'all' || tx.category === catFilter;
      return matchesSearch && matchesFilter && matchesCat;
    })
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      if (userId.startsWith('demo-')) {
        if (onDeleteTransaction) onDeleteTransaction(id);
        return;
      }
      await deleteDoc(doc(db, 'users', userId, 'transactions', id));
    } catch (error) {
      console.error("Delete transaction failed:", error);
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/transactions/${id}`);
    }
  };

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tighter text-slate-900 dark:text-white leading-none mb-4">Transactions</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">Searchable history of all your transactions. Precise control over your cash flow.</p>
        </div>
        <button 
          onClick={onAddTransaction}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-sm font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" /> Add Transaction
        </button>
      </div>

      <div className="glass-card rounded-[2.5rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-premium">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search descriptions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
            />
          </div>
          <div className="flex flex-wrap gap-4">
             <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl font-bold appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[140px] dark:text-white cursor-pointer"
            >
              <option value="all">All Transactions</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select 
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl font-bold appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[140px] dark:text-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="space-y-4">
            {filteredTransactions.map((tx, idx) => {
              const Icon = CATEGORY_ICONS[tx.category] || Receipt;
              return (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 sm:p-6 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-all ${
                      tx.type === 'income' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600' 
                        : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500'
                    }`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-white tracking-tight text-base sm:text-lg leading-tight truncate pr-2" title={tx.description}>
                            {tx.description}
                          </p>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 shrink-0">
                              <Calendar className="w-3.5 h-3.5" /> 
                              {tx.date.toDate().toLocaleDateString()}
                            </span>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span className="bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-lg shrink-0">
                              {tx.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0">
                          <span className={`font-mono font-black text-lg sm:text-xl tracking-tighter shrink-0 ${
                            tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{formatMoney(Math.abs(tx.amount), tx.currency || userProfile?.baseCurrency)}
                          </span>
                          
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                              onClick={() => onEditTransaction?.(tx)}
                              className="p-2 sm:p-3 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(tx.id)}
                              className="p-2 sm:p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredTransactions.length === 0 && (
              <div className="text-center py-20">
                <Receipt className="w-20 h-20 text-slate-100 dark:text-white/5 mx-auto mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No relevant entries found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
