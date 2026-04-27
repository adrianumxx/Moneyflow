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
  Globe,
  History,
  TrendingUp,
  Settings as SettingsIcon,
  Link
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
import MagicOnboarding from './components/MagicOnboarding';
import Sidebar from './components/Sidebar';
import Ledger from './components/Ledger';
import SettingsView from './components/Settings';
import Palantir from './components/Palantir';
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
import IntegrationsHub from './components/IntegrationsHub';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t, i18n } = useTranslation();
  const navigationItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'groups', icon: Users, label: 'Groups' },
    { id: 'palantir', icon: Globe, label: 'Palantir' },
    { id: 'sync', icon: Link, label: 'Sync Hub' },
    { id: 'ledger', icon: History, label: 'Ledger' },
    { id: 'forecast', icon: TrendingUp, label: 'Forecast' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ];
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
  const [activeTab, setActiveTab] = useState<'wealth' | 'groups' | 'forecast' | 'ledger' | 'pulse' | 'settings' | 'palantir' | 'dashboard' | 'sync'>('dashboard');
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
  const [advisorState, setAdvisorState] = useState<{ visible: boolean; message: string; actionLabel?: string }>({
    visible: false,
    message: ''
  });
  // Manual Neural Advisor Trigger
  const triggerAdvice = () => {
    const messages = [
      "I've analyzed your latest flows: Your savings rate is up by 2% this week. Keep it up!",
      "Neural Sync is active. Connect your primary bank to enable deep liquidity flows.",
      "Pattern detected: Your housing expenses are stable. Would you like to see a 12-month forecast?",
      "Opportunity: Based on your liquidity, you could reach your next goal 2 months faster with a minor adjustment."
    ];
    setAdvisorState({
      visible: true,
      message: messages[Math.floor(Math.random() * messages.length)],
      actionLabel: "View Insights"
    });
  };
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

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signIn();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setAuthError(err.message || 'Could not connect to Google. Please check your connection.');
      setAuthLoading(false);
    }
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
    console.log("Auth Guard: Initializing...");
    // No more getRedirectResult needed as we are back to Popup
    (window as any).openCreateGroupModal = () => setIsCreateModalOpen(true);
    return () => {
      delete (window as any).openCreateGroupModal;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth State Changed:", currentUser ? `User: ${currentUser.uid}` : "No user");
      setUser(currentUser);
      
      if (!currentUser) {
        console.log("Auth: Setting loading false (No user)");
        setLoading(false);
        return;
      }

      if (!currentUser.uid.startsWith('demo-')) {
        console.log("Auth: Fetching profile for", currentUser.uid);
        const profileRef = doc(db, 'users', currentUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) {
            console.log("Auth: Creating new profile...");
            // FIRST LOGIN: Create the user document so onboarding can trigger
            // Automatically start a 7-day Palantir trial + 15-day base trial
            await setDoc(profileRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName || null,
              email: currentUser.email || null,
              photoURL: currentUser.photoURL || null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              hasCompletedOnboarding: false,
              plan: 'free',
              subscriptionStatus: 'trialing',
              trialStartDate: new Date().toISOString(),
              trialDays: 15,
              palantirTrialDays: 7,
            });
            console.log('New user profile created with 15-day trial (Palantir: 7 days)');
          }
        } catch (err: any) {
          console.error('Error ensuring user profile exists:', err);
          setAuthError(`Firestore Error: ${err.message}`);
          // If this fails, we might be stuck. Let's alert the user if it's a permission issue.
          if (err.code === 'permission-denied') {
            window.alert("Firestore Permission Denied. Please check your Firestore Rules and ensure the database is created.");
          }
        }

        // Fetch User Profile (real-time listener)
        onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          }
          setLoading(false); // SUCCESS: Profile loaded
        }, (err) => {
          console.error("Firestore Profile Error:", err);
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          setLoading(false); // ERROR: But stop loading so we can see the app or error
        });

        // Safety: Stop loading after 5 seconds anyway to prevent infinite loop
        setTimeout(() => setLoading(false), 5000);

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

  const isProfileLoading = user && !user.uid.startsWith('demo-') && !userProfile && loading;

  // Emergency reset if stuck in loading
  const handleEmergencyLogout = async () => {
    await logOut();
    window.location.reload();
  };

  if (loading || (user && !user.uid.startsWith('demo-') && !userProfile && loading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] transition-colors duration-300">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.2)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/5">
                <LayoutDashboard className="w-6 h-6 text-indigo-500" />
             </div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <h2 className="text-white font-black tracking-[0.3em] uppercase text-[10px] mb-2">Moneyflow OS</h2>
          <p className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase animate-pulse">
            {user && !userProfile ? 'Syncing Neural Profile...' : 'Intelligence Core Initializing...'}
          </p>
        </motion.div>
        
        {/* Emergency Button after 3 seconds */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
          onClick={handleEmergencyLogout}
          className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
        >
          Stuck? Click to Reset Session
        </motion.button>
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
                {authError && !isEmailView && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold mb-4 animate-shake">
                    {authError}
                  </div>
                )}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 text-xl outline-none focus:ring-4 focus:ring-indigo-500/40 group disabled:opacity-70"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5 shadow-sm group-hover:rotate-12 transition-transform">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-full h-full" />
                  </div>
                  {authLoading ? 'Connecting...' : 'Get Started for Free'}
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
            
            <div className="pt-2">
              <button
                onClick={() => {
                  const archetypes = [
                    {
                      name: 'The Executive',
                      goal: 'Legacy Building',
                      exp: 'Expert',
                      assets: [
                        { id: '1', name: 'Private Equity', type: 'investment', value: 450000, institution: 'JP Morgan', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                        { id: '2', name: 'Swiss Estate', type: 'real_estate', value: 1200000, institution: 'Personal', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                      ],
                      liabilities: [{ id: '1', name: 'Lombard Loan', type: 'loan', totalAmount: 200000, remainingAmount: 150000, monthlyPayment: 2000, interestRate: 2.1, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }],
                      income: 25000
                    },
                    {
                      name: 'Crypto Whale',
                      goal: 'Moon Mission',
                      exp: 'Intermediate',
                      assets: [
                        { id: '1', name: 'Cold Wallet (BTC)', type: 'crypto', value: 850000, institution: 'Ledger', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                        { id: '2', name: 'Solana Ecosystem', type: 'crypto', value: 120000, institution: 'Phantom', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                      ],
                      liabilities: [],
                      income: 5000
                    },
                    {
                      name: 'Debt Trapped',
                      goal: 'Financial Freedom',
                      exp: 'Beginner',
                      assets: [{ id: '1', name: 'Savings', type: 'savings', value: 1200, institution: 'Local Bank', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }],
                      liabilities: [
                        { id: '1', name: 'Credit Card', type: 'debt', totalAmount: 15000, remainingAmount: 12500, monthlyPayment: 450, interestRate: 19.9, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                        { id: '2', name: 'Car Loan', type: 'loan', totalAmount: 25000, remainingAmount: 22000, monthlyPayment: 350, interestRate: 7.5, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                      ],
                      income: 2100
                    },
                    {
                      name: 'Family Saver',
                      goal: 'Retirement',
                      exp: 'Intermediate',
                      assets: [
                        { id: '1', name: 'Index Funds', type: 'investment', value: 85000, institution: 'Vanguard', createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
                        { id: '2', name: 'Home Equity', type: 'real_estate', value: 350000, institution: 'Main Home', createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
                      ],
                      liabilities: [{ id: '1', name: 'Mortgage', type: 'mortgage', totalAmount: 300000, remainingAmount: 245000, monthlyPayment: 1400, interestRate: 3.2, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }],
                      income: 4800
                    }
                  ];

                  const arc = archetypes[Math.floor(Math.random() * archetypes.length)];
                  
                  const demoUser = {
                    uid: 'demo-' + arc.name.toLowerCase().replace(' ', '-'),
                    displayName: arc.name,
                    email: 'guest@moneyflow.ai',
                    photoURL: `https://ui-avatars.com/api/?name=${arc.name}&background=6366f1&color=fff`,
                  } as any;
                  setUser(demoUser);
                  
                  setUserProfile({
                    uid: demoUser.uid,
                    displayName: arc.name,
                    primaryGoal: arc.goal,
                    experienceLevel: arc.exp,
                    hasCompletedOnboarding: true,
                    plan: 'free',
                    subscriptionStatus: 'trialing',
                    trialStartDate: new Date().toISOString(),
                    palantirTrialDays: 7,
                  } as any);
                  
                  setAssets(arc.assets as any);
                  setLiabilities(arc.liabilities as any);
                  setTransactions([
                    { id: '1', amount: arc.income, category: 'income', date: Timestamp.now(), description: 'Monthly Income', type: 'income', isRecurring: true, createdAt: Timestamp.now() },
                    { id: '2', amount: -(arc.income * 0.4), category: 'housing', date: Timestamp.now(), description: 'Living Expenses', type: 'expense', isRecurring: true, createdAt: Timestamp.now() }
                  ]);
                  setLoading(false);
                }}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-200 dark:shadow-black/20 text-sm group"
              >
                <Zap className="w-5 h-5 text-indigo-500 group-hover:animate-pulse" />
                <span>Inject Neural Archetype (7-Day Trial)</span>
              </button>
              <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Random Identity Simulation</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen mesh-gradient font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden transition-colors duration-300">
      {/* Magic Onboarding Overlay */}
      {user && !user.uid.startsWith('demo-') && userProfile && !userProfile.hasCompletedOnboarding && (
        <MagicOnboarding 
          userId={user.uid} 
          onComplete={() => {
            // The onSnapshot in App.tsx will pick up the firestore change
            console.log('Onboarding complete!');
          }} 
        />
      )}
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
            {navigationItems.map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSelectedGroupId(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold">{t(item.label)}</span>
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-zinc-100 dark:border-white/5 pb-6">
            <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Wealth Management</p>
            <button 
              onClick={() => { setIsAddAssetModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group"
            >
              <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              Add Manual Asset
            </button>
            <button 
              onClick={() => { setIsAddLiabilityModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group"
            >
              <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                <MinusCircle className="w-4 h-4" />
              </div>
              Add Liability
            </button>
            <button 
              onClick={() => { setIsAddTransactionModalOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-all font-bold group"
            >
              <div className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg group-hover:bg-slate-900 dark:group-hover:bg-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
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
        {/* Global Neural Pulse */}
        <div className="sticky top-0 z-40">
          <GlobalPulse />
        </div>

        {/* Neural Floating Trigger */}
        <button 
          onClick={triggerAdvice}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-fuchsia-600/10 group-hover:opacity-100 opacity-0 transition-opacity" />
          <img 
            src="/assets/neural_brain.png" 
            alt="AI" 
            className="w-8 h-8 object-contain drop-shadow-sm" 
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </button>

        {/* Neural Advisor Assistant */}
        <NeuralAdvisor 
          isVisible={advisorState.visible}
          message={advisorState.message}
          actionLabel={advisorState.actionLabel}
          onClose={() => setAdvisorState(prev => ({ ...prev, visible: false }))}
          onAction={() => {
            if (activeTab === 'dashboard') setActiveTab('palantir');
            if (activeTab === 'sync') setIsConnectBankOpen(true);
            setAdvisorState(prev => ({ ...prev, visible: false }));
          }}
        />

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
          ) : activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
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
              key="groups"
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
          ) : activeTab === 'palantir' ? (
            <motion.div
              key="palantir"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-0 sm:p-4 lg:p-6"
            >
              <Palantir assets={assets} liabilities={liabilities} goals={goals} userProfile={userProfile} />
            </motion.div>
          ) : activeTab === 'sync' ? (
            <motion.div
              key="sync"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-0 sm:p-4 lg:p-6"
            >
              <IntegrationsHub />
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
              <span className="text-[11px] font-black uppercase tracking-widest">Circles</span>
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
              <span className="text-[11px] font-black uppercase tracking-widest">Wealth</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('palantir');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'palantir' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Globe className={`w-6 h-6 ${(activeTab === 'palantir' && !selectedGroupId) ? 'fill-indigo-500/10' : ''}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">Palantir</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sync');
                setSelectedGroupId(null);
                setIsSidebarOpen(false);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'sync' && !selectedGroupId
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <Link className={`w-6 h-6 ${(activeTab === 'sync' && !selectedGroupId) ? 'stroke-indigo-500' : ''}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">Sync</span>
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
              <span className="text-[11px] font-black uppercase tracking-widest">Ledger</span>
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

      {/* Welcome Popup - Only for DEMO users */}
      <AnimatePresence>
        {showWelcomePopup && user.uid.startsWith('demo-') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowWelcomePopup(false);
                localStorage.setItem(`hasSeenWelcome_${user.uid}`, 'true');
              }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card p-10 rounded-[3rem] text-center shadow-premium overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 addictive-gradient" />
              
              <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <LayoutDashboard className="w-10 h-10 text-indigo-500" />
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Neural Exploration</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                You are currently exploring a <span className="text-indigo-500 font-bold">Neural Archetype</span>. This is a sandbox environment with simulated data to demonstrate the Palantir's reasoning capabilities.
              </p>
              
              <button
                onClick={() => {
                  setShowWelcomePopup(false);
                  localStorage.setItem(`hasSeenWelcome_${user.uid}`, 'true');
                }}
                className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 text-lg"
              >
                Enter Neural Interface
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
