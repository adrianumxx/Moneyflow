/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, Globe, LayoutDashboard, Target, 
  Users, History, Settings as SettingsIcon 
} from 'lucide-react';

// Official Firebase Imports
import { db, logOut } from './firebase';
import { Timestamp, addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
import Dashboard from './components/Dashboard';
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

export default function App() {
  const { t } = useTranslation();
  const { user, userProfile, loading: authLoading, signInWithGoogle, signInWithEmail, signOut } = useAuth();
  const financialData = useFinancial();

  // Navigation Logic
  const [showAuth, setShowAuth] = useState(false);
  const [onboardingLock, setOnboardingLock] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'forecast' | 'ledger' | 'settings' | 'palantir' | 'goals'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Auth UI State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isEmailView, setIsEmailView] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modal Logic
  const [modal, setModal] = useState<string | null>(null);
  const closeModal = () => setModal(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [advisorVisible, setAdvisorVisible] = useState(false);
  const [advisorMsg, setAdvisorMsg] = useState('');

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Derived Navigation Items
  const navigationItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'palantir', icon: Globe, label: 'Intelligence', visible: isFeatureVisible('PALANTIR_LIVE'), beta: true },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'social', icon: Users, label: 'Groups', visible: isFeatureVisible('ADVANCED_GROUPS') },
    { id: 'ledger', icon: History, label: 'Ledger' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' }
  ].filter(item => item.visible !== false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmail(authEmail, authPassword, isSignUp);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmergencyLogout = async () => {
    await logOut();
    window.location.href = '/'; 
  };

  // Main UI Guards
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div key="landing" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MarketingLanding onStart={() => setShowAuth(true)} onTryDemo={() => window.location.reload()} />
          </motion.div>
        ) : (
          <motion.div key="auth" className="w-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AuthPage 
              onGoogleSignIn={handleGoogleSignIn} 
              onEmailAuth={handleEmailAuth}
              authEmail={authEmail} setAuthEmail={setAuthEmail}
              authPassword={authPassword} setAuthPassword={setAuthPassword}
              isEmailView={isEmailView} setIsEmailView={setIsEmailView}
              isSignUp={isSignUp} setIsSignUp={setIsSignUp}
              authError={loginError} authLoading={isLoggingIn}
              onTryDemo={() => window.location.reload()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="flex h-screen mesh-gradient font-sans selection:bg-indigo-100 relative overflow-hidden transition-colors duration-300">
      
      {/* Onboarding Overlay */}
      {userProfile && !userProfile.hasCompletedOnboarding && !onboardingLock && (
        <MagicOnboarding userId={user.uid} onComplete={() => setOnboardingLock(true)} />
      )}

      <Sidebar 
        navigationItems={navigationItems} 
        activeTab={activeTab} setActiveTab={setActiveTab}
        groups={financialData.groups || []} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId}
        user={user} onLogout={handleEmergencyLogout} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        onAddAsset={() => setModal('asset')} onAddLiability={() => setModal('liability')}
        onAddTransaction={() => setModal('transaction')} onCreateGroup={() => setModal('group')}
      />

      <main className="flex-1 overflow-y-auto relative">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <span className="font-bold dark:text-white uppercase tracking-tighter">Moneyflow</span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500"><Menu className="w-6 h-6" /></button>
        </header>

        <AnimatePresence mode="wait">
          <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto pb-32">
            {selectedGroupId ? (
              <motion.div key="group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GroupView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} theme={theme} /></motion.div>
            ) : activeTab === 'overview' ? (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WealthOverview 
                  onInsightsGenerated={()=>{}} onConnectBank={() => setModal('bank')} 
                  onConnectCrypto={() => setModal('crypto')} onAddGoal={() => setModal('goal')}
                  onAddAsset={() => setModal('asset')} onGenerateReport={() => setModal('cfo')} 
                  theme={theme} 
                />
              </motion.div>
            ) : activeTab === 'social' ? (
              <motion.div key="so" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="ADVANCED_GROUPS"><Dashboard onSelectGroup={setSelectedGroupId} onNavigateToLedger={() => setActiveTab('ledger')} theme={theme} /></PaywallGuard>
              </motion.div>
            ) : activeTab === 'palantir' ? (
              <motion.div key="pa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="PALANTIR_LIVE"><Palantir onAskAI={(p) => { setAdvisorMsg(p); setAdvisorVisible(true); }} /></PaywallGuard>
              </motion.div>
            ) : activeTab === 'forecast' ? (
              <motion.div key="fo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PaywallGuard feature="SCENARIO_ENGINE"><FinancialForecast /></PaywallGuard>
              </motion.div>
            ) : activeTab === 'ledger' ? (
              <motion.div key="le" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TransactionsView onAddTransaction={() => setModal('transaction')} /></motion.div>
            ) : activeTab === 'goals' ? (
              <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GoalsView onAddGoal={() => setModal('goal')} /></motion.div>
            ) : activeTab === 'settings' ? (
              <motion.div key="se" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SubscriptionSettings userProfile={userProfile} userId={user.uid} userEmail={user.email} />
                <PreferencesSettings />
              </motion.div>
            ) : null}
          </div>
        </AnimatePresence>
      </main>

      <MobileNav navigationItems={navigationItems} activeTab={activeTab} setActiveTab={setActiveTab} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Modals */}
      {modal === 'group' && <CreateGroupModal isOpen onClose={closeModal} user={user} />}
      {modal === 'asset' && <AddAssetModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'liability' && <AddLiabilityModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'goal' && <AddGoalModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'transaction' && <AddTransactionModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'bank' && <ConnectBankModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'crypto' && <AddCryptoWalletModal isOpen onClose={closeModal} userId={user.uid} />}
      {modal === 'cfo' && <CFOReportModal isOpen onClose={closeModal} />}
      
      <NeuralAdvisor isVisible={advisorVisible} initialMessage={advisorMsg} onClose={() => setAdvisorVisible(false)} />
      <BetaFeedbackButton variant="floating" />
    </div>
  );
}
