/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, signIn, signUpWithEmail, logInWithEmail, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc,
  getDocs,
  deleteDoc,
  collectionGroup,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  Plus, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Settings, 
  ChevronRight,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  MoreVertical,
  Menu,
  X,
  Sun,
  Moon,
  MinusCircle,
  Activity,
  Zap,
  MessageSquare,
  Bug,
  Briefcase,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Group, UserProfile, Asset, Liability, FinancialGoal, AIInsight, Transaction, BankAccount, Expense } from './types';
import { handleFirestoreError, OperationType } from './utils/errorHandling';
import { getEnv, isDev } from './utils/env';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateCFOReportData } from './services/geminiService';

// Components
import Dashboard from './components/Dashboard';
import GroupView from './components/GroupView';
import CreateGroupModal from './components/CreateGroupModal';
import WealthOverview from './components/WealthOverview';
import FinancialForecast from './components/FinancialForecast';
import AddAssetModal from './components/AddAssetModal';
import AddLiabilityModal from './components/AddLiabilityModal';
import ConnectBankModal from './components/ConnectBankModal';
import AddTransactionModal from './components/AddTransactionModal';
import TransactionsView from './components/TransactionsView';
import AddGoalModal from './components/AddGoalModal';
import CFOReportModal from './components/CFOReportModal';
import SubscriptionSettings from './components/SubscriptionSettings';
import PreferencesSettings from './components/PreferencesSettings';
import FeedbackModal from './components/FeedbackModal';
import GlobalPulse from './components/GlobalPulse';
import NeuralAdvisor from './components/NeuralAdvisor';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<Record<string, Expense[]>>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'wealth' | 'groups' | 'forecast' | 'ledger' | 'pulse' | 'settings'>('wealth');
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddLiabilityModalOpen, setIsAddLiabilityModalOpen] = useState(false);
  const [isCFOReportOpen, setIsCFOReportOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  
  // Auth state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isEmailAuth, setIsEmailAuth] = useState(false);
  const [isEmailView, setIsEmailView] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isConnectBankOpen, setIsConnectBankOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dataDeletedPopup, setDataDeletedPopup] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(authEmail, authPassword);
      } else {
        await logInWithEmail(authEmail, authPassword);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email is already registered. Please log in.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please try again or create an account.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    (window as any).openCreateGroupModal = () => setIsCreateModalOpen(true);
    return () => {
      delete (window as any).openCreateGroupModal;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.uid.startsWith('demo-')) {
        // Fetch User Profile
        const profileRef = doc(db, 'users', currentUser.uid);
        onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`));

        // Only fetch from Firestore if it's a real user (not demo)
        // Fetch Assets
        const assetsQuery = query(
          collection(db, 'users', currentUser.uid, 'assets'),
          where('ownerId', '==', currentUser.uid)
        );
        onSnapshot(assetsQuery, (snap) => {
          setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/assets`));

        // Fetch Liabilities
        const liabilitiesQuery = query(
          collection(db, 'users', currentUser.uid, 'liabilities'),
          where('ownerId', '==', currentUser.uid)
        );
        onSnapshot(liabilitiesQuery, (snap) => {
          setLiabilities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Liability)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/liabilities`));

        // Fetch Goals
        const goalsQuery = query(
          collection(db, 'users', currentUser.uid, 'goals'),
          where('ownerId', '==', currentUser.uid)
        );
        onSnapshot(goalsQuery, (snap) => {
          setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as FinancialGoal)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/goals`));

        // Fetch Insights
        const insightsQuery = query(
          collection(db, 'users', currentUser.uid, 'insights'), 
          where('ownerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'), 
          limit(5)
        );
        onSnapshot(insightsQuery, (snap) => {
          setInsights(snap.docs.map(d => ({ id: d.id, ...d.data() } as AIInsight)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/insights`));

        // Fetch Transactions
        const txsQuery = query(
          collection(db, 'users', currentUser.uid, 'transactions'), 
          where('ownerId', '==', currentUser.uid),
          orderBy('date', 'desc'), 
          limit(20)
        );
        onSnapshot(txsQuery, (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/transactions`));

        // Fetch Bank Accounts
        const banksQuery = query(
          collection(db, 'users', currentUser.uid, 'bankAccounts'),
          where('ownerId', '==', currentUser.uid)
        );
        onSnapshot(banksQuery, (snap) => {
          setBankAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccount)));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/bankAccounts`));

        // Check if user has seen welcome popup
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${currentUser.uid}`);
        if (!hasSeenWelcome) {
          setShowWelcomePopup(true);
        }

        // Ensure user profile exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          try {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
            });

            // Initial data injection removed - starting from zero as requested
          } catch (error) {
            console.error("Error creating user profile:", error);
          }
        } else {
          const data = userSnap.data();
          const createdAt = data.createdAt?.toDate();
          if (createdAt && (Date.now() - createdAt.getTime() > 24 * 60 * 60 * 1000)) {
            try {
              // Delete all groups created by this user
              console.log("Checking for demo data reset...");
              const groupsQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', currentUser.uid));
              const groupsSnap = await getDocs(groupsQuery);
              console.log(`Found ${groupsSnap.docs.length} groups for user ${currentUser.uid}`);
              for (const groupDoc of groupsSnap.docs) {
                if (groupDoc.data().createdBy === currentUser.uid) {
                  console.log(`Deleting group ${groupDoc.id} due to demo reset`);
                  await deleteDoc(doc(db, 'groups', groupDoc.id));
                }
              }
              // Reset their createdAt
              await setDoc(userRef, {
                ...data,
                createdAt: serverTimestamp(),
              });
              // Show popup
              setDataDeletedPopup(true);
            } catch (error) {
              console.error("Error resetting demo data:", error);
            }
          }
        }

        // Test connection
        try {
          const { getDocFromServer } = await import('firebase/firestore');
          await getDocFromServer(doc(db, 'users', currentUser.uid));
          console.log("Firestore connection successful");
        } catch (error) {
          if (error instanceof Error && error.message.includes('offline')) {
            console.error("Firestore connection failed: client is offline");
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.uid.startsWith('demo-')) {
      if (!user) setGroups([]);
      return;
    }

    // Query groups where the user is a member using the memberIds array
    const groupsQuery = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      console.log(`Groups snapshot received: ${snapshot.docs.length} groups`);
      setLastError(null);
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group));
      setGroups(fetchedGroups);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setLastError(error.message);
      if (error.message.includes('Missing or insufficient permissions')) {
        console.warn("Permission denied for groups query. Check firestore.rules.");
        return;
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedGroupId && !groups.find(g => g.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [groups, selectedGroupId]);

  const handleConnectBank = (institutionName: string) => {
    // In a real app, this would receive data from a Plaid/Finicity webhook
    // We simulate a successful new connection
    const newAccount: BankAccount = {
      id: `acc-${Date.now()}`,
      institutionName: institutionName,
      accountName: 'Direct Connection',
      balance: Math.floor(Math.random() * 5000) + 1500,
      currency: 'EUR',
      lastSynced: Timestamp.now()
    };
    
    setBankAccounts(prev => [...prev, newAccount]);
    
    // Add a small notification or just rely on the UI update
    console.log(`Successfully connected to ${institutionName}`);
  };

  const handleDemoUpdate = (type: 'assets' | 'liabilities' | 'goals' | 'transactions' | 'groups' | 'groupExpense', item: any, extraId?: string) => {
    if (!user || !user.uid.startsWith('demo-')) return;
    
    const formattedItem = {
      ...item,
      id: item.id || `demo-${Date.now()}`,
      updatedAt: Timestamp.now(),
      createdAt: item.createdAt || Timestamp.now(),
      date: item.date instanceof Timestamp ? item.date : Timestamp.fromDate(item.date instanceof Date ? item.date : new Date(item.date || Date.now()))
    };

    switch (type) {
      case 'assets': setAssets(prev => {
        const exists = prev.find(a => a.id === formattedItem.id);
        return exists ? prev.map(a => a.id === formattedItem.id ? (formattedItem as Asset) : a) : [formattedItem as Asset, ...prev];
      }); break;
      case 'liabilities': setLiabilities(prev => {
        const exists = prev.find(l => l.id === formattedItem.id);
        return exists ? prev.map(l => l.id === formattedItem.id ? (formattedItem as Liability) : l) : [formattedItem as Liability, ...prev];
      }); break;
      case 'goals': setGoals(prev => {
        const exists = prev.find(g => g.id === formattedItem.id);
        return exists ? prev.map(g => g.id === formattedItem.id ? (formattedItem as FinancialGoal) : g) : [formattedItem as FinancialGoal, ...prev];
      }); break;
      case 'transactions': setTransactions(prev => {
        const exists = prev.find(t => t.id === formattedItem.id);
        return exists ? prev.map(t => t.id === formattedItem.id ? (formattedItem as Transaction) : t) : [formattedItem as Transaction, ...prev];
      }); break;
      case 'groups': setGroups(prev => {
        const exists = prev.find(g => g.id === formattedItem.id);
        return exists ? prev.map(g => g.id === formattedItem.id ? (formattedItem as Group) : g) : [formattedItem as Group, ...prev];
      }); break;
      case 'groupExpense': 
        if (extraId) {
          setGroupExpenses(prev => {
            const current = prev[extraId] || [];
            const exists = current.find(e => e.id === formattedItem.id);
            if (exists) {
              return {
                ...prev,
                [extraId]: current.map(e => e.id === formattedItem.id ? (formattedItem as Expense) : e)
              };
            }
            return {
              ...prev,
              [extraId]: [formattedItem as Expense, ...current]
            };
          });
        }
        break;
    }
  };

  const handleDemoDelete = (type: 'assets' | 'liabilities' | 'goals' | 'transactions' | 'groups', id: string) => {
    if (!user || !user.uid.startsWith('demo-')) return;
    switch (type) {
      case 'assets': setAssets(prev => prev.filter(item => item.id !== id)); break;
      case 'liabilities': setLiabilities(prev => prev.filter(item => item.id !== id)); break;
      case 'goals': setGoals(prev => prev.filter(item => item.id !== id)); break;
      case 'transactions': setTransactions(prev => prev.filter(item => item.id !== id)); break;
      case 'groups': setGroups(prev => prev.filter(item => item.id !== id)); break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617] p-4 text-center relative overflow-hidden transition-colors duration-300">
        {/* Advanced Mesh Gradient Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-fuchsia-500/10 dark:bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card p-10 sm:p-14 rounded-[3.5rem] shadow-premium relative z-10"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-glow rotate-3">
            <motion.div
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white font-display">
            Money<span className="text-indigo-600 dark:text-indigo-400">flow</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed text-lg font-medium">
            The next-generation Wealth OS for global citizens. Secure, AI-powered, and beautiful.
          </p>

          <div className="space-y-6">
            {!isEmailView ? (
              <div className="space-y-3">
                <button
                  onClick={signIn}
                  className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 text-xl outline-none focus:ring-4 focus:ring-indigo-500/40 group"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5 shadow-sm group-hover:rotate-12 transition-transform">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-full h-full" />
                  </div>
                  Get Started for Free
                </button>
                
                <button
                  onClick={() => setIsEmailView(true)}
                  className="w-full py-4 bg-white dark:bg-white/10 text-slate-600 dark:text-white rounded-[2rem] font-bold border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500 transition-all text-sm"
                >
                  Continue with Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold">
                    {authError}
                  </div>
                )}
                
                <div className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-4">Email</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all font-medium"
                      placeholder="you@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 ml-4">Password</label>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-4 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 text-lg disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {authLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEmailView(false)}
                      className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Back to Google Login
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Or try it out</span>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>
            
            <button
              onClick={() => {
                const demoUser = {
                  uid: 'demo-user',
                  displayName: 'Demo User',
                  email: 'guest@moneyflow.ai',
                  photoURL: `https://ui-avatars.com/api/?name=Guest&background=6366f1&color=fff`,
                } as any;
                setUser(demoUser);
                
                // Set initial mock data for demo
                setAssets([
                  { id: '1', name: 'Main Savings', type: 'savings', value: 12500, institution: 'Moneyflow Savings', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                  { id: '2', name: 'Apple Stock', type: 'investment', value: 4200, institution: 'Trading212', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                  { id: '3', name: 'Bitcoin', type: 'crypto', value: 8750, institution: 'Coinbase', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                ]);
                setLiabilities([
                  { id: '1', name: 'Student Loan', type: 'loan', totalAmount: 15000, remainingAmount: 8400, monthlyPayment: 250, interestRate: 3.5, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                ]);
                setTransactions([
                  { id: '1', amount: 3500, category: 'income', date: Timestamp.now(), description: 'Monthly Salary', type: 'income', isRecurring: true, createdAt: Timestamp.now() },
                  { id: '2', amount: -1200, category: 'housing', date: Timestamp.now(), description: 'Apartment Rent', type: 'expense', isRecurring: true, createdAt: Timestamp.now() },
                  { id: '3', amount: -150, category: 'food', date: Timestamp.now(), description: 'Grocery Store', type: 'expense', isRecurring: false, createdAt: Timestamp.now() }
                ]);
                setBankAccounts([
                  { id: '1', institutionName: 'Moneyflow Bank', accountName: 'Main Checking', balance: 12500, currency: 'EUR', lastSynced: Timestamp.now() }
                ]);

                setLoading(false);
              }}
              className="group flex items-center justify-center gap-2 mx-auto text-zinc-500 dark:text-zinc-500 hover:text-indigo-500 transition-colors py-2 px-4 rounded-xl hover:bg-indigo-500/5"
            >
              <Zap className="w-4 h-4 group-hover:fill-indigo-500" />
              <span className="font-bold text-xs uppercase tracking-widest">Enter in Guest Mode</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen mesh-gradient font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <NeuralAdvisor 
        assets={assets}
        liabilities={liabilities}
        goals={goals}
        transactions={transactions}
        userDisplayName={user.displayName || 'User'}
      />

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-3xl border-r border-white/20 dark:border-white/5 flex flex-col z-50 lg:z-10 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Vibrant background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10 dark:opacity-20">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -right-32 w-64 h-64 bg-fuchsia-600 rounded-full blur-[100px]" />
        </div>

        <div className="p-8 relative z-10 shrink-0">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-display">Moneyflow</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => {
                setActiveTab('wealth');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'wealth' && !selectedGroupId ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <PieChart className="w-5 h-5" />
              <span className="font-bold">{t('Wealth Overview')}</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('groups');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'groups' && !selectedGroupId ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span className="font-bold">{t('Budget Groups')}</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('forecast');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'forecast' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-bold">{t('Forecast AI')}</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('pulse');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'pulse' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Zap className={`w-5 h-5 ${activeTab === 'pulse' ? 'fill-white' : ''}`} />
              <span className="font-bold">{t('Global Pulse')}</span>
              {activeTab !== 'pulse' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
            </button>
            <button 
              onClick={() => {
                setActiveTab('ledger');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Receipt className="w-5 h-5" />
              <span className="font-bold">{t('Global Ledger')}</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('settings');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold">{t('Settings')}</span>
            </button>
            <button 
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-bold"
            >
              <MessageSquare className="w-5 h-5" />
              {t('Feedback')}
            </button>
          </nav>

          <div className="pt-4 border-t border-zinc-100 dark:border-white/5 pb-6">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">App Connector</p>
            <button 
              onClick={() => setIsConnectBankOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <Zap className="w-5 h-5 bg-white/20 rounded-lg p-1" />
              <span className="font-bold">App Integrations</span>
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-white/5">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Wealth Management</p>
            <button 
              onClick={() => { setIsAddAssetModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold"
            >
              <Plus className="w-5 h-5 text-indigo-500" />
              Add Manual Asset
            </button>
            <button 
              onClick={() => { setIsAddLiabilityModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold"
            >
              <MinusCircle className="w-5 h-5 text-red-500" />
              Add Liability
            </button>
            <button 
              onClick={() => { setIsAddTransactionModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold"
            >
              <Receipt className="w-5 h-5 text-zinc-400" />
              Add Manual Entry
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 relative z-10 custom-scrollbar min-h-[200px]">
          <div className="flex items-center justify-between px-4 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Your Groups</span>
            <button 
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsSidebarOpen(false);
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${group.type === 'personal' ? 'bg-blue-400' : group.type === 'household' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                  <span className="truncate text-sm font-medium">{group.name}</span>
                </div>
                {selectedGroupId === group.id && <ChevronRight className="w-4 h-4 opacity-70" />}
              </button>
            ))}
            {groups.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No groups yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 mt-auto relative z-10 shrink-0">
          <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 mb-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt="" className="w-10 h-10 rounded-xl shadow-sm border border-zinc-200 dark:border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-[10px] text-zinc-500 truncate font-mono">{user.email}</p>
              </div>
            </div>
            
            {user.uid.startsWith('demo-') && (
              <button
                onClick={signIn}
                className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Save Progress & Sign Up
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (user.uid.startsWith('demo-')) {
                  setUser(null);
                } else {
                  logOut();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-white/5 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white font-display tracking-tight">Moneyflow</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {selectedGroupId ? (
            <motion.div
              key={selectedGroupId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <GroupView 
                groupId={selectedGroupId} 
                user={user} 
                onBack={() => setSelectedGroupId(null)} 
                theme={theme}
                demoExpenses={groupExpenses[selectedGroupId] || []}
                onDemoExpenseAdd={(exp) => handleDemoUpdate('groupExpense', exp, selectedGroupId)}
                allGroups={groups}
              />
            </motion.div>
          ) : activeTab === 'wealth' ? (
            <motion.div
              key="wealth"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <WealthOverview 
                assets={assets}
                liabilities={liabilities}
                goals={goals}
                insights={insights}
                transactions={transactions}
                bankAccounts={bankAccounts}
                onInsightsGenerated={async (newInsights) => {
                  setInsights(newInsights);
                  if (!user.uid.startsWith('demo-')) {
                    // Save to firestore for persistence
                    for (const insight of newInsights) {
                       await addDoc(collection(db, 'users', user!.uid, 'insights'), {
                         ...insight,
                         ownerId: user!.uid,
                         createdAt: serverTimestamp(),
                         updatedAt: serverTimestamp(),
                       });
                    }
                  }
                }}
                onConnectBank={() => setIsConnectBankOpen(true)}
                onAddGoal={() => setIsAddGoalModalOpen(true)}
                onGenerateReport={() => {
                  setIsCFOReportOpen(true);
                }}
                theme={theme}
              />
            </motion.div>
          ) : activeTab === 'groups' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <Dashboard 
                groups={groups} 
                onSelectGroup={setSelectedGroupId}
                user={user}
                onAddGroup={() => setIsCreateModalOpen(true)}
                theme={theme}
                transactions={transactions}
                onNavigateToLedger={() => setActiveTab('ledger')}
              />
            </motion.div>
          ) : activeTab === 'forecast' ? (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <FinancialForecast
                assets={assets}
                liabilities={liabilities}
                transactions={transactions}
                bankAccounts={bankAccounts}
              />
            </motion.div>
          ) : activeTab === 'pulse' ? (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-0 sm:p-4 lg:p-6"
            >
              <GlobalPulse />
            </motion.div>
          ) : activeTab === 'ledger' ? (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <TransactionsView 
                transactions={transactions}
                userId={user.uid}
                onAddTransaction={() => setIsAddTransactionModalOpen(true)}
                onDeleteTransaction={(id) => handleDemoDelete('transactions', id)}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setIsAddTransactionModalOpen(true);
                }}
              />
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto"
            >
              <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white mb-2">{t('Account Settings')}</h1>
                  <p className="text-slate-500">{t('Manage your profile, preferences, and premium subscription.')}</p>
                </div>
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-200 dark:shadow-black/20"
                >
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  {t('Suggest a Feature')}
                </button>
              </div>
              <SubscriptionSettings 
                userProfile={userProfile}
                userId={user.uid}
                userEmail={user.email}
              />
              <PreferencesSettings />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh] text-slate-400 font-bold uppercase tracking-widest text-[10px]"
            >
              Intelligence Core Initializing...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-white/5 px-6 py-3 pb-6 z-40 transition-colors">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={() => {
                setActiveTab('groups');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'groups' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Users className={`w-6 h-6 ${(activeTab === 'groups' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Circles</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('wealth');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'wealth' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Briefcase className={`w-6 h-6 ${(activeTab === 'wealth' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Wealth</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('pulse');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'pulse' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className={`w-6 h-6 ${(activeTab === 'pulse' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Pulse</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ledger');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'ledger' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Receipt className={`w-6 h-6 ${(activeTab === 'ledger' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">Ledger</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {dataDeletedPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setDataDeletedPopup(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                <Settings className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 font-display">Demo Data Reset</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-sm">
                Your data has been wiped because 24 hours have passed since your session began. 
                <br /><br />
                To keep your wealth data permanent, please <span className="font-bold text-indigo-600 dark:text-indigo-400">Remix</span> this Moneyflow instance.
              </p>
              <button
                onClick={() => setDataDeletedPopup(false)}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg shadow-zinc-200 dark:shadow-black/20 active:scale-95"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        user={user}
        onDemoAdd={(group) => handleDemoUpdate('groups', group)}
        onSuccess={(groupId) => setSelectedGroupId(groupId)}
      />

      <CFOReportModal 
        isOpen={isCFOReportOpen}
        onClose={() => setIsCFOReportOpen(false)}
        onSend={async (email) => {
          
          const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
          const totalLiabilities = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0);
          const netWorth = totalAssets - totalLiabilities;

          // Call Gemini for the CFO Data
          const cfoData = await generateCFOReportData(assets, liabilities, insights, i18n.language);

          const doc = new jsPDF();
          
          // Header
          doc.setFontSize(22);
          doc.setTextColor(30, 41, 59);
          doc.text('STRATEGIC FINANCIAL AUDIT 2024', 14, 22);
          
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`PREPARED FOR: ${email.toUpperCase()}`, 14, 32);
          doc.text(`DATE: ${new Date().toLocaleDateString()}`, 14, 37);
          
          // 1. Executive Summary
          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('1. EXECUTIVE SUMMARY', 14, 50);
          
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(doc.splitTextToSize(cfoData.executiveSummary, 180), 14, 60);

          let currentY = 60 + doc.splitTextToSize(cfoData.executiveSummary, 180).length * 5 + 10;
          
          // 2. Asset Breakdown
          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('2. ASSET INFRASTRUCTURE', 14, currentY);
          
          const assetRows = assets.map(a => [a.name, a.type.toUpperCase(), `€${a.value.toLocaleString()}`, `${((a.value/totalAssets)*100).toFixed(1)}%`]);
          autoTable(doc, {
            startY: currentY + 5,
            head: [['Asset Name', 'Sector', 'Valuation', 'Weight']],
            body: assetRows,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
          });
          
          // 3. Liabilities
          currentY = (doc as any).lastAutoTable.finalY + 15;
          if (currentY > 250) { doc.addPage(); currentY = 20; }

          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('3. LIABILITY & DEBT STRUCTURE', 14, currentY);
          
          const liabilityRows = liabilities.map(l => [l.name, l.type.toUpperCase(), `€${l.remainingAmount.toLocaleString()}`, `€${l.monthlyPayment.toLocaleString()}/mo`]);
          autoTable(doc, {
            startY: currentY + 5,
            head: [['Creditor', 'Structure', 'Remaining', 'Service Cost']],
            body: liabilityRows,
            theme: 'striped',
            headStyles: { fillColor: [244, 63, 94] }
          });
          
          // 4. Quick Scan Extended Analysis
          currentY = (doc as any).lastAutoTable.finalY + 15;
          if (currentY > 250) { doc.addPage(); currentY = 20; }

          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('4. DEEP CONTEXT ANALYSIS (QUICK SCAN EXPANDED)', 14, currentY);
          
          currentY += 10;
          cfoData.quickScanAnalysis.forEach(item => {
             if (currentY > 270) { doc.addPage(); currentY = 20; }
             doc.setFontSize(11);
             doc.setTextColor(15, 23, 42);
             doc.text(`• ${item.title.toUpperCase()}`, 14, currentY);
             currentY += 6;
             doc.setFontSize(9);
             doc.setTextColor(71, 85, 105);
             const lines = doc.splitTextToSize(item.content, 180);
             doc.text(lines, 14, currentY);
             currentY += lines.length * 5 + 5;
          });

          // 5. Strategic Recommendations
          if (currentY > 240) { doc.addPage(); currentY = 20; } else { currentY += 5; }

          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('5. STRATEGIC OUTLOOK & RECOMMENDATIONS', 14, currentY);
          
          currentY += 10;
          cfoData.strategicRecommendations.forEach(item => {
             if (currentY > 270) { doc.addPage(); currentY = 20; }
             doc.setFontSize(11);
             doc.setTextColor(15, 23, 42);
             doc.text(`• ${item.title.toUpperCase()}`, 14, currentY);
             currentY += 6;
             doc.setFontSize(9);
             doc.setTextColor(71, 85, 105);
             const lines = doc.splitTextToSize(item.content, 180);
             doc.text(lines, 14, currentY);
             currentY += lines.length * 5 + 5;
          });

          // 6. Risk Assessment
          if (currentY > 250) { doc.addPage(); currentY = 20; } else { currentY += 5; }

          doc.setFontSize(14);
          doc.setTextColor(30, 41, 59);
          doc.text('6. RISK METRICS', 14, currentY);
          currentY += 8;
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(doc.splitTextToSize(cfoData.riskAssessment, 180), 14, currentY);
          
          const blob = doc.output('blob');
          
          // Sending email notification with PDF attachment via FormSubmit
          const formData = new FormData();
          formData.append('_subject', "Moneyflow CFO: Your Strategic Audit Report");
          formData.append('email', email);
          formData.append('net_worth', `€${netWorth.toLocaleString()}`);
          formData.append('report_file', blob, 'moneyflow_cfo_audit.pdf');
          formData.append('_captcha', "false");
          formData.append('message', `Hello, your strategic CFO report is attached. Patrimonio Netto: €${netWorth.toLocaleString()}. Assets: €${totalAssets.toLocaleString()}. Liabilities: €${totalLiabilities.toLocaleString()}.`);

          try {
            await fetch("https://formsubmit.co/ajax/adrianomelilloXX@gmail.com", {
              method: "POST",
              body: formData
            });
          } catch (e) {
            console.error("Email report notification failed", e);
          }

          const url = URL.createObjectURL(blob);
          console.log(`Professional CFO report generated and sent to ${email}`);
          return url;
        }}
      />

      <AddGoalModal 
        isOpen={isAddGoalModalOpen} 
        onClose={() => setIsAddGoalModalOpen(false)} 
        userId={user.uid}
        onDemoAdd={(goal) => handleDemoUpdate('goals', goal)}
      />

      <AddAssetModal 
        isOpen={isAddAssetModalOpen} 
        onClose={() => setIsAddAssetModalOpen(false)} 
        userId={user.uid}
        onDemoAdd={(asset) => handleDemoUpdate('assets', asset)}
      />

      <AddLiabilityModal 
        isOpen={isAddLiabilityModalOpen} 
        onClose={() => setIsAddLiabilityModalOpen(false)} 
        userId={user.uid}
        onDemoAdd={(liability) => handleDemoUpdate('liabilities', liability)}
      />

      <ConnectBankModal 
        isOpen={isConnectBankOpen}
        onClose={() => setIsConnectBankOpen(false)}
        userId={user.uid}
      />

      <AddTransactionModal 
        isOpen={isAddTransactionModalOpen} 
        onClose={() => {
          setIsAddTransactionModalOpen(false);
          setEditingTransaction(null);
        }} 
        userId={user.uid}
        onDemoAdd={(tx) => handleDemoUpdate('transactions', tx)}
        initialTransaction={editingTransaction}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        userEmail={user.email || undefined} 
      />

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowWelcomePopup(false);
                localStorage.setItem(`hasSeenWelcome_${user.uid}`, 'true');
              }}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] shadow-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                <LayoutDashboard className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4 font-display">Welcome to the Demo!</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed text-sm">
                This is a demo application. To keep the demo fresh, <span className="font-bold text-zinc-900 dark:text-white">all data is automatically deleted every 24 hours</span>.
                <br /><br />
                If you want to create your own permanent version, click the <span className="font-bold text-zinc-900 dark:text-white">Remix</span> button in the top right!
              </p>
              <button
                onClick={() => {
                  setShowWelcomePopup(false);
                  localStorage.setItem(`hasSeenWelcome_${user.uid}`, 'true');
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                Got it, let's go!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
