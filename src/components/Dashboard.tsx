import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Receipt, 
  ArrowRight,
  Plus,
  Wallet,
  Calendar,
  Pencil,
  Trash2,
  Loader2,
  X,
  Activity,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, deleteDoc, Timestamp, where, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { formatMoney, getCurrencySymbol } from '../utils/format';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import GuidedSetupChecklist from './GuidedSetupChecklist';
import FirstInsightMoment from './FirstInsightMoment';
import { Asset, Transaction, BankAccount, ConnectedAccount, FinancialGoal, UserProfile, Liability, Group, Expense, BudgetType, CATEGORIES } from '../types';
import DataCompletenessScore from './DataCompletenessScore';
import WeeklyMoneyBrief from './WeeklyMoneyBrief';

interface DashboardProps {
  user: User;
  groups: Group[];
  transactions: Transaction[];
  demoGroupExpenses?: Record<string, Expense[]>;
  onSelectGroup: (id: string) => void;
  onNavigateToLedger: () => void;
  onUpdateTransaction?: (tx: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddGroup?: () => void;
  onAddAsset?: () => void;
  onAddTransaction?: () => void;
  onConnectBank?: () => void;
  onNavigateToTab?: (tab: any) => void;
  userProfile?: UserProfile;
  theme: 'light' | 'dark';
  assets: Asset[];
  bankAccounts: BankAccount[];
  connectedAccounts: ConnectedAccount[];
  goals: FinancialGoal[];
}

interface Alert {
  id: string;
  message: string;
  type: 'warning' | 'info';
  groupId: string;
}

interface DashboardExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Timestamp;
  paidBy: string;
  groupId?: string;
  type?: 'expense' | 'income';
}

export default function Dashboard({ 
  user, 
  groups, 
  transactions, 
  demoGroupExpenses, 
  onSelectGroup, 
  onNavigateToLedger, 
  onUpdateTransaction,
  onDeleteTransaction,
  onAddGroup,
  onAddAsset,
  onAddTransaction,
  onConnectBank,
  onNavigateToTab,
  userProfile,
  theme,
  assets,
  bankAccounts,
  connectedAccounts,
  goals
}: DashboardProps) {
  const [recentExpenses, setRecentExpenses] = useState<DashboardExpense[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isGroupsListOpen, setIsGroupsListOpen] = useState(false);
  
  // Edit/Delete states
  const [editingExpense, setEditingExpense] = useState<DashboardExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<DashboardExpense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const groupsListModalRef = React.useRef<HTMLDivElement>(null);
  const deleteExpenseModalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGroupsListOpen && groupsListModalRef.current) {
      groupsListModalRef.current.focus();
    }
  }, [isGroupsListOpen]);

  useEffect(() => {
    if (expenseToDelete && deleteExpenseModalRef.current) {
      deleteExpenseModalRef.current.focus();
    }
  }, [expenseToDelete]);

  // Form states for editing
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editingExpense) {
      setEditAmount(editingExpense.amount.toString());
      setEditDescription(editingExpense.description);
      setEditCategory(editingExpense.category);
      setEditDate(editingExpense.date.toDate().toISOString().split('T')[0]);
    }
  }, [editingExpense]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingExpense(null);
        setExpenseToDelete(null);
        setIsGroupsListOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setIsSaving(true);
    try {
      if (user.uid.startsWith('demo-')) {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (onUpdateTransaction) {
          onUpdateTransaction({
            ...editingExpense,
            amount: parseFloat(editAmount),
            description: editDescription,
            category: editCategory,
            date: new Date(editDate),
          });
        }
        setEditingExpense(null);
        return;
      }

      if (editingExpense.groupId) {
        // Group Expense
        const expenseRef = doc(db, 'groups', editingExpense.groupId, 'expenses', editingExpense.id);
        await updateDoc(expenseRef, {
          amount: parseFloat(editAmount),
          description: editDescription,
          category: editCategory,
          date: Timestamp.fromDate(new Date(editDate)),
        });
      } else {
        // Personal Transaction
        const txRef = doc(db, 'users', user.uid, 'transactions', editingExpense.id);
        await updateDoc(txRef, {
          amount: parseFloat(editAmount),
          description: editDescription,
          category: editCategory,
          date: Timestamp.fromDate(new Date(editDate)),
          ownerId: user.uid,
          updatedAt: serverTimestamp(),
        });
      }
      setEditingExpense(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, editingExpense.groupId ? `groups/${editingExpense.groupId}/expenses/${editingExpense.id}` : `users/${user.uid}/transactions/${editingExpense.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      if (user.uid.startsWith('demo-')) {
        await new Promise(resolve => setTimeout(resolve, 600));
        if (onDeleteTransaction) onDeleteTransaction(expenseToDelete.id);
        setExpenseToDelete(null);
        return;
      }

      if (expenseToDelete.groupId) {
        // Group Expense
        const expenseRef = doc(db, 'groups', expenseToDelete.groupId, 'expenses', expenseToDelete.id);
        await deleteDoc(expenseRef);
      } else {
        // Personal Transaction
        const txRef = doc(db, 'users', user.uid, 'transactions', expenseToDelete.id);
        await deleteDoc(txRef);
      }
      setExpenseToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, expenseToDelete.groupId ? `groups/${expenseToDelete.groupId}/expenses/${expenseToDelete.id}` : `users/${user.uid}/transactions/${expenseToDelete.id}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const isDateInCurrentPeriod = (date: Date, type: BudgetType) => {
    const now = new Date();
    if (type === 'total') return true;
    
    if (type === 'monthly') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    
    if (type === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      return date >= startOfWeek && date < endOfWeek;
    }
    
    return true;
  };

  useEffect(() => {
    if (user.uid.startsWith('demo-')) {
      let combined: DashboardExpense[] = [];
      
      // Global transactions
      transactions.forEach(tx => {
        combined.push({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          paidBy: user.uid,
          type: tx.type
        });
      });

      // Group expenses
      if (demoGroupExpenses) {
        Object.entries(demoGroupExpenses).forEach(([groupId, expenses]) => {
          expenses.forEach(exp => {
            combined.push({ ...exp, groupId, type: 'expense' });
          });
        });
      }

      combined.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setRecentExpenses(combined.slice(0, 10));

      // Alerts
      const newAlerts: Alert[] = [];
      groups.forEach(g => {
        if (!g.maxBudget) return;
        const gExpenses = demoGroupExpenses?.[g.id] || [];
        
        const totalSpent = gExpenses.filter(e => 
          isDateInCurrentPeriod(e.date.toDate(), g.budgetType || 'total')
        ).reduce((sum, e) => sum + e.amount, 0);
        
        if (totalSpent > g.maxBudget) {
          newAlerts.push({
            id: `demo-over-${g.id}`,
            message: `Circle "${g.name}" is over its ${g.budgetType} budget`,
            type: 'warning',
            groupId: g.id
          });
        }
      });
      setAlerts(newAlerts);
      return;
    }

    if (groups.length === 0 && transactions.length === 0) {
      setRecentExpenses([]);
      setAlerts([]);
      return;
    }

    const expensesMap = new Map<string, DashboardExpense[]>();
    
    // Initial combination with transactions
    const updateCombined = () => {
      let combined: DashboardExpense[] = [];
      
      // Global transactions from props
      transactions.forEach(tx => {
        combined.push({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          paidBy: user.uid,
          type: tx.type
        });
      });

      // Group expenses from map
      Array.from(expensesMap.values()).flat().forEach(exp => {
        combined.push({ ...exp, type: exp.type || 'expense' });
      });

      combined.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setRecentExpenses(combined.slice(0, 12));

      // Generate alerts
      const newAlerts: Alert[] = [];
      groups.forEach(g => {
        if (!g.maxBudget) return;
        const gExpenses = expensesMap.get(g.id) || [];
        const totalSpent = gExpenses
          .filter(e => isDateInCurrentPeriod(e.date.toDate(), g.budgetType || 'total'))
          .reduce((sum, e) => sum + e.amount, 0);
        
        if (totalSpent > g.maxBudget) {
          newAlerts.push({
            id: `over-budget-${g.id}`,
            message: `Circle "${g.name}" limit exceeded (${formatMoney(totalSpent, userProfile?.baseCurrency)}/${formatMoney(g.maxBudget, userProfile?.baseCurrency)})`,
            type: 'warning',
            groupId: g.id
          });
        }
      });
      setAlerts(newAlerts);
    };

    // Update initially with just transactions
    updateCombined();

    const unsubscribes = groups.map(group => {
      const expensesQuery = query(
        collection(db, 'groups', group.id, 'expenses'),
        where('memberIds', 'array-contains', user.uid),
        orderBy('date', 'desc'),
        limit(20)
      );

      return onSnapshot(expensesQuery, (snapshot) => {
        const fetchedExpenses = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          groupId: group.id,
          ...doc.data() 
        } as DashboardExpense));
        
        expensesMap.set(group.id, fetchedExpenses);
        updateCombined();
      }, (error) => {
        if (!error.message.includes('Missing or insufficient permissions')) {
          console.error(`Snapshot error for group ${group.id}:`, error);
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [groups, transactions, user.uid]);

  const handleSetupAction = (action: string) => {
    switch (action) {
      case 'ADD_ASSET': onAddAsset?.(); break;
      case 'ADD_TX': onAddTransaction?.(); break;
      case 'NAV_SYNC': onConnectBank?.(); break;
      case 'NAV_INSIGHTS': onNavigateToTab?.('palantir'); break;
      case 'NAV_SETTINGS': onNavigateToTab?.('settings'); break;
    }
  };

  const hasAnyData = assets.length > 0 || transactions.length > 0 || bankAccounts.length > 0 || connectedAccounts.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-14">
      {hasAnyData && (
        <FirstInsightMoment 
          onReviewOverview={() => onNavigateToTab?.('wealth')}
          onOpenInsights={() => onNavigateToTab?.('palantir')}
        />
      )}
      
      <GuidedSetupChecklist 
        assets={assets}
        transactions={transactions}
        bankAccounts={bankAccounts}
        connectedAccounts={connectedAccounts}
        goals={goals}
        onAction={handleSetupAction}
      />

      <WeeklyMoneyBrief 
        assets={assets}
        liabilities={liabilities}
        transactions={transactions}
        goals={goals}
        bankAccounts={bankAccounts}
        connectedAccounts={connectedAccounts}
      />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
             <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Moneyflow Overview</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-800 dark:text-white mb-2 sm:mb-4 font-display leading-none">
            Welcome, <span className="text-indigo-600 dark:text-indigo-400">{user.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg tracking-tight">Managing {groups.length} active groups across your portfolio.</p>
        </div>
        <button 
          onClick={() => onAddGroup?.()}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-4 sm:py-5 addictive-gradient text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5 bg-white/20 rounded-lg p-1" />
          {groups.length === 0 ? 'Create your first group' : 'Create Group'}
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <button 
          onClick={() => {
            if (groups.length === 0) return;
            if (groups.length === 1) {
              onSelectGroup(groups[0].id);
            } else {
              setIsGroupsListOpen(true);
            }
          }}
          className={`text-left bg-slate-950 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-glow relative overflow-hidden group transition-all ${groups.length > 0 ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-indigo-500/20 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20 blur-3xl transition-transform group-hover:scale-125" />
          <div className="relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-10 border border-white/10">
              <Users className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2 leading-none">Your Groups</p>
            <p className="text-4xl sm:text-5xl font-black text-white font-display tracking-tighter">{groups.length}</p>
          </div>
        </button>

        <button 
          onClick={() => {
            if (recentExpenses.length === 0) return;
            onSelectGroup(recentExpenses[0].groupId);
          }}
          className={`text-left addictive-gradient p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-premium relative overflow-hidden group transition-all ${recentExpenses.length > 0 ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20 blur-3xl transition-transform group-hover:scale-125" />
          <div className="relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-10 border border-white/10">
              <Receipt className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mb-2 leading-none">Transactions</p>
            <p className="text-4xl sm:text-5xl font-black text-white font-display tracking-tighter">{recentExpenses.length}</p>
          </div>
        </button>

        <button 
          onClick={() => {
            if (alerts.length === 0) return;
            onSelectGroup(alerts[0].groupId);
          }}
          className={`text-left bg-rose-600 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl shadow-rose-500/20 relative overflow-hidden group transition-all sm:col-span-2 lg:col-span-1 ${alerts.length > 0 ? 'hover:scale-[1.02] active:scale-95 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 -mt-16 sm:-mr-20 sm:-mt-20 blur-3xl transition-transform group-hover:scale-125" />
          <div className="relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-10 border border-white/10">
              <TrendingUp className="w-6 sm:w-7 h-6 sm:h-7 text-white" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-black text-rose-100 uppercase tracking-[0.3em] mb-2 leading-none">Notifications</p>
            <p className="text-4xl sm:text-5xl font-black text-white font-display tracking-tighter">{alerts.length}</p>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isGroupsListOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsGroupsListOpen(false)}
            />
            <motion.div 
              ref={groupsListModalRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-white/20 rounded-t-[2.5rem] sm:rounded-[3.5rem] shadow-premium overflow-hidden outline-none p-8 sm:p-10"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-6 sm:mb-8 font-display tracking-tighter">Select Group</h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onSelectGroup(group.id);
                      setIsGroupsListOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 border border-slate-100 dark:border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${group.type === 'personal' ? 'bg-indigo-400' : group.type === 'household' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="font-black text-lg tracking-tight">{group.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white font-display">Recent Activity</h2>
              <button 
                onClick={onNavigateToLedger}
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
              >
                View all transactions
              </button>
            </div>
            <div className="glass-card rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium overflow-hidden">
              {recentExpenses.length === 0 ? (
                <div className="p-12 sm:p-16 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-white/5 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/10 shadow-inner">
                    <Receipt className="w-7 sm:w-8 h-7 sm:h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-bold tracking-tight text-sm">No recent activity detected.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentExpenses.map(expense => (
                    <div key={expense.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between transition-all group hover:bg-slate-50 dark:hover:bg-white/5 gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all border border-slate-200 dark:border-white/10 shrink-0 group-hover:scale-110 shadow-sm">
                          <Receipt className="w-5 sm:w-6 h-5 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-white text-base sm:text-lg truncate tracking-tighter mb-0.5">{expense.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                               expense.type === 'income' 
                                 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                                 : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
                             }`}>
                               {expense.type === 'income' ? 'Income' : expense.category}
                             </span>
                             <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">
                                {expense.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-100 dark:border-white/10 sm:border-0 pt-4 sm:pt-0 shrink-0">
                        <div className="text-left sm:text-right min-w-[100px]">
                          <p 
                            className={`text-xl font-black font-display truncate ${expense.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}
                          >
                            {expense.type === 'income' ? '+' : '-'}{formatMoney(Math.abs(expense.amount), expense.type === 'income' ? undefined : userProfile?.baseCurrency)}
                          </p>
                        </div>
                        {(user.uid.startsWith('demo-') || expense.paidBy === user.uid) && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setEditingExpense(expense)}
                              className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setExpenseToDelete(expense)}
                              className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white font-display">Suggestions</h2>
            </div>
            <div className="space-y-6">
              {alerts.length === 0 ? (
                <div className="p-12 glass-card rounded-[3rem] text-center shadow-premium relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="w-20 h-20" />
                  </div>
                  <div className="w-16 h-16 bg-emerald-400/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-400/10">
                    <TrendingDown className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-slate-800 dark:text-white font-black tracking-tight mb-1">Looking Good</p>
                  <p className="text-slate-400 text-[11px] font-medium px-4">All groups are currently within their budget limits.</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-10 rounded-[3rem] shadow-lg relative overflow-hidden group border ${
                      alert.type === 'warning' 
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' 
                        : 'addictive-gradient border-transparent shadow-glow'
                    }`}
                  >
                    <div className="flex gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                        alert.type === 'warning' ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-200' : 'bg-white/20 border-white/10'
                      }`}>
                        <TrendingUp className={`w-7 h-7 ${alert.type === 'warning' ? 'text-rose-600' : 'text-white'}`} />
                      </div>
                      <div className="space-y-2">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${alert.type === 'warning' ? 'text-rose-400' : 'text-indigo-200'}`}>Notification</p>
                         <p className={`text-sm font-bold leading-relaxed ${alert.type === 'warning' ? 'text-rose-900 dark:text-rose-100' : 'text-white'}`}>{alert.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              
              <div 
                onClick={() => {
                  const householdGroup = groups.find(g => g.name.toLowerCase().includes('household')) || groups[0];
                  if (householdGroup) onSelectGroup(householdGroup.id);
                }}
                className="p-10 bg-slate-900 border border-white/10 rounded-[3rem] text-white overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-all"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Moneyflow AI</span>
                </div>
                <h4 className="text-xl font-black font-display tracking-tight mb-2">Savings Opportunity</h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">Optimization ready for your household group. Potential {formatMoney(420, userProfile?.baseCurrency)} monthly improvement detected.</p>
                <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                  View Suggestion <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>


      {/* Modals */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setEditingExpense(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-expense-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl p-10 outline-none"
              tabIndex={-1}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 id="edit-expense-title" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">Edit Expense</h3>
                <button 
                  onClick={() => setEditingExpense(null)} 
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateExpense} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold">
                      {getCurrencySymbol(editingExpense?.type === 'income' ? undefined : userProfile?.baseCurrency)}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-10 pr-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold dark:text-white"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Description</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium dark:text-white"
                    placeholder="What was this for?"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none dark:text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] mb-2">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium dark:text-white"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {expenseToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setExpenseToDelete(null)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              ref={deleteExpenseModalRef}
              tabIndex={-1}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-expense-title"
              aria-describedby="delete-expense-desc"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl p-10 text-center outline-none"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-600 border border-red-100 dark:border-red-500/20">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 id="delete-expense-title" className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 font-display">Delete Expense?</h3>
              <p id="delete-expense-desc" className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20 active:scale-95"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
