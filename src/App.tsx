/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, LayoutDashboard, Globe, Target, Users, History, Settings as SettingsIcon } from 'lucide-react';
import { db, logOut, Timestamp, addDoc, collection, serverTimestamp } from './firebase';

// Context & Hooks
import { useAuth } from './context/AuthContext';
import { useFinancial } from './context/FinancialContext';
import { isFeatureVisible } from './config/featureFlags';

// Components
import MarketingLanding from './components/MarketingLanding';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import PaywallGuard from './components/PaywallGuard';
import WealthOverview from './components/WealthOverview';
import Dashboard from './components/Dashboard'; // Social Hub
import Palantir from './components/Palantir';
import TransactionsView from './components/TransactionsView';
import GoalsView from './components/GoalsView';
import GroupView from './components/GroupView';
import FinancialForecast from './components/FinancialForecast';
import SubscriptionSettings from './components/SubscriptionSettings';
import PreferencesSettings from './components/PreferencesSettings';
import MagicOnboarding from './components/MagicOnboarding';
import GlobalPulse from './components/GlobalPulse';
import NeuralAdvisor from './components/NeuralAdvisor';
import BetaFeedbackButton from './components/BetaFeedbackButton';

// Modals
import CreateGroupModal from './components/CreateGroupModal';
import AddAssetModal from './components/AddAssetModal';
import AddLiabilityModal from './components/AddLiabilityModal';
import AddGoalModal from './components/AddGoalModal';
import AddTransactionModal from './components/AddTransactionModal';
import ConnectBankModal from './components/ConnectBankModal';
import AddCryptoWalletModal from './components/AddCryptoWalletModal';
import CFOReportModal from './components/CFOReportModal';

// Utils & Types
import { handleSyncCallback } from './services/syncService';
import { Transaction, BankAccount } from './types';

export default function App() {
  const { t } = useTranslation();
  const { user, userProfile, loading: authLoading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const financialData = useFinancial();

  // Navigation Setup
  const [showAuth, setShowAuth] = useState(false);
  const navigationItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'palantir', icon: Globe, label: 'Intelligence', visible: isFeatureVisible('PALANTIR_LIVE'), beta: true },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'social', icon: Users, label: 'Groups', visible: isFeatureVisible('ADVANCED_GROUPS') },
    { id: 'ledger', icon: History, label: 'Ledger' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ].filter(item => item.visible !== false);

  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'forecast' | 'ledger' | 'settings' | 'palantir' | 'goals'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Modal visibility states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddLiabilityModalOpen, setIsAddLiabilityModalOpen] = useState(false);
  const [isCFOReportOpen, setIsCFOReportOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isConnectBankOpen, setIsConnectBankOpen] = useState(false);
  const [isConnectCryptoOpen, setIsConnectCryptoOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth UI states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isEmailView, setIsEmailView] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLogginIn, setIsLoggingIn] = useState(false);

  const [advisorState, setAdvisorState] = useState<{ visible: boolean; message: string; actionLabel?: string }>({
    visible: false,
    message: ''
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');

  // Effects
  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // GoCardless Callback Detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requisitionId = params.get('requisitionId') || params.get('requisition_id') || params.get('ref');
    
    if (requisitionId && user) {
      const handleCallback = async () => {
        try {
          const response = await handleSyncCallback('gocardless_sandbox', { requisitionId });
          if (response.success) {
            setAdvisorState({
              visible: true,
              message: `Live Data Verified: ${response.status === 'LN' ? 'Linked & Authorized' : 'Authorization pending.'}`,
              actionLabel: "View Accounts"
            });
          }
        } catch (error) {
          console.error('[App] Callback error:', error);
        } finally {
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      handleCallback();
    }
  }, [user]);

  // Derived data based on user type (Demo vs Real)
  const isDemo = user?.uid.startsWith('demo-');
  const groups = isDemo ? [] : financialData.groups;

  const handleEmergencyLogout = async () => {
    await logOut();
    window.location.href = '/'; 
  };

  // Main UI Guards
  if (authLoading || (user && !user.uid.startsWith('demo-') && !userProfile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full" />
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/50">Synchronizing Core Systems</p>
        <button onClick={handleEmergencyLogout} className="mt-12 text-[10px] font-black uppercase tracking-widest text-zinc-500">Stuck? Reset Session</button>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MarketingLanding onStart={() => setShowAuth(true)} onTryDemo={() => window.location.reload()} />
          </motion.div>
        ) : (
          <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AuthPage 
              onGoogleSignIn={handleGoogleSignIn} onEmailAuth={handleEmailAuth}
              authEmail={authEmail} setAuthEmail={setAuthEmail}
              authPassword={authPassword} setAuthPassword={setAuthPassword}
              isEmailView={isEmailView} setIsEmailView={setIsEmailView}
              isSignUp={isSignUp} setIsSignUp={setIsSignUp}
              authError={loginError} authLoading={isLogginIn}
              onTryDemo={() => window.location.reload()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="flex h-screen mesh-gradient font-sans selection:bg-indigo-100 relative overflow-hidden transition-colors duration-300">
      {userProfile && !userProfile.hasCompletedOnboarding && <MagicOnboarding userId={user.uid} onComplete={() => console.log('Ready.')} />}

      <Sidebar 
        navigationItems={navigationItems} activeTab={activeTab} setActiveTab={setActiveTab}
        groups={groups} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId}
        user={user} onLogout={handleEmergencyLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        onAddAsset={() => setIsAddAssetModalOpen(true)} onAddLiability={() => setIsAddLiabilityModalOpen(true)}
        onAddTransaction={() => setIsAddTransactionModalOpen(true)} onCreateGroup={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 overflow-y-auto relative pb-32 lg:pb-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg" /><span className="font-bold dark:text-white">Moneyflow</span></div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu className="w-6 h-6" /></button>
        </header>
        
        <GlobalPulse />
        
        <motion.button onClick={() => setAdvisorState({ visible: true, message: 'How can I help?' })} className="fixed bottom-28 lg:bottom-10 right-6 z-40 w-14 h-14 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white"><Globe className="w-6 h-6" /></motion.button>

        <AnimatePresence mode="wait">
          <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
            {selectedGroupId ? (
              <motion.div key="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GroupView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} theme={theme} /></motion.div>
            ) : activeTab === 'overview' ? (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WealthOverview 
                  onInsightsGenerated={async () => {}} 
                  onConnectBank={() => setIsConnectBankOpen(true)} 
                  onConnectCrypto={() => setIsConnectCryptoOpen(true)}
                  onAddGoal={() => setIsAddGoalModalOpen(true)} 
                  onAddAsset={() => setIsAddAssetModalOpen(true)} 
                  onGenerateReport={() => setIsCFOReportOpen(true)} 
                  theme={theme} 
                />
              </motion.div>
            ) : activeTab === 'social' ? (
              <motion.div key="social" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="ADVANCED_GROUPS">
                  <Dashboard onSelectGroup={setSelectedGroupId} onNavigateToLedger={() => setActiveTab('ledger')} theme={theme} />
                </PaywallGuard>
              </motion.div>
            ) : activeTab === 'palantir' ? (
              <motion.div key="palantir" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="PALANTIR_LIVE">
                  <Palantir onAskAI={(p) => setAdvisorState({ visible: true, message: p })} />
                </PaywallGuard>
              </motion.div>
            ) : activeTab === 'forecast' ? (
              <motion.div key="forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="SCENARIO_ENGINE">
                  <FinancialForecast />
                </PaywallGuard>
              </motion.div>
            ) : activeTab === 'ledger' ? (
              <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TransactionsView onAddTransaction={() => setIsAddTransactionModalOpen(true)} onEditTransaction={(tx) => { setEditingTransaction(tx); setIsAddTransactionModalOpen(true); }} /></motion.div>
            ) : activeTab === 'goals' ? (
              <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GoalsView onAddGoal={() => setIsAddGoalModalOpen(true)} /></motion.div>
            ) : activeTab === 'settings' ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SubscriptionSettings userProfile={userProfile} userId={user.uid} userEmail={user.email} />
                <PreferencesSettings />
              </motion.div>
            ) : null}
          </div>
        </AnimatePresence>
      </main>

      <MobileNav navigationItems={navigationItems} activeTab={activeTab} setActiveTab={setActiveTab} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Modals */}
      {isCreateModalOpen && <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} user={user} />}
      {isAddAssetModalOpen && <AddAssetModal isOpen={isAddAssetModalOpen} onClose={() => setIsAddAssetModalOpen(false)} userId={user.uid} />}
      {isAddLiabilityModalOpen && <AddLiabilityModal isOpen={isAddLiabilityModalOpen} onClose={() => setIsAddLiabilityModalOpen(false)} userId={user.uid} />}
      {isAddGoalModalOpen && <AddGoalModal isOpen={isAddGoalModalOpen} onClose={() => setIsAddGoalModalOpen(false)} userId={user.uid} />}
      {isAddTransactionModalOpen && <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => { setIsAddTransactionModalOpen(false); setEditingTransaction(null); }} userId={user.uid} editingTransaction={editingTransaction} />}
      {isConnectBankOpen && <ConnectBankModal isOpen={isConnectBankOpen} onClose={() => setIsConnectBankOpen(false)} userId={user.uid} />}
      {isConnectCryptoOpen && <AddCryptoWalletModal isOpen={isConnectCryptoOpen} onClose={() => setIsConnectCryptoOpen(false)} userId={user.uid} />}
      {isCFOReportOpen && <CFOReportModal isOpen={isCFOReportOpen} onClose={() => setIsCFOReportOpen(false)} />}
      
      <NeuralAdvisor isVisible={advisorState.visible} initialMessage={advisorState.message} onClose={() => setAdvisorState(prev => ({ ...prev, visible: false }))} />
      <BetaFeedbackButton variant="floating" />
    </div>
  );
}
