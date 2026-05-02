import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ShieldCheck, Download, Trash2, AlertTriangle, X, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { logOut } from '../firebase';
import { useNotifications } from '../context/NotificationContext';
import LegalPages from './LegalPages.js';
import BetaFeedbackButton from './BetaFeedbackButton';
import { getSystemStatus } from '../services/systemService.js';
import { getPurgeDryRun, purgeUserData, PurgeDryRunResponse } from '../services/userService';

import { prepareExportBundle } from '../utils/dataExport';

interface PreferencesSettingsProps {
  exportData?: {
    userProfile: any;
    assets: any[];
    liabilities: any[];
    transactions: any[];
    bankAccounts: any[];
    goals: any[];
    insights: any[];
    groups: any[];
    connectedInstitutions: any[];
    connectedAccounts: any[];
    cryptoWallets: any[];
  };
}

export default function PreferencesSettings({ exportData }: PreferencesSettingsProps) {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotifications();
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [purgeInput, setPurgeInput] = useState('');
  const [dryRunData, setDryRunData] = useState<PurgeDryRunResponse | null>(null);
  const [isDryRunLoading, setIsDryRunLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const fetchDiagnostics = async () => {
    setIsDiagnosticsLoading(true);
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (e) {
      showNotification('Diagnostics Failed', 'Could not reach backbone services.', 'error');
    } finally {
      setIsDiagnosticsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isLegalModalOpen && !systemStatus) {
      fetchDiagnostics();
    }
  }, [isLegalModalOpen]);

  const handleExportData = () => {
    const exportBundle = prepareExportBundle(exportData);
    if (!exportBundle) return;

    const dataStr = JSON.stringify(exportBundle, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = `moneyflow-data-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    URL.revokeObjectURL(url);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('appLanguage', lng);
  };

  const handleDryRun = async () => {
    setIsDryRunLoading(true);
    try {
      const data = await getPurgeDryRun();
      setDryRunData(data);
    } catch (e: any) {
      showNotification('Audit Failed', e.message, 'error');
    } finally {
      setIsDryRunLoading(false);
    }
  };

  const handlePurge = async () => {
    if (purgeInput !== 'DELETE') return;
    setIsPurging(true);
    try {
      await purgeUserData(purgeInput);
      showNotification('Account Deleted', 'Your data has been successfully erased. Redirecting...', 'success');
      
      // Atomic cleanup: log out and reload
      await logOut();
      window.location.href = '/';
    } catch (e: any) {
      showNotification('Erasure Failed', e.message, 'error');
      setIsPurging(false);
    }
  };

  const closePurgeModal = () => {
    setIsPurgeModalOpen(false);
    setPurgeInput('');
    setDryRunData(null);
  };

  return (
    <div className="mt-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t('Language')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{t('Interface Language')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[{ code: 'en', label: 'English' }, { code: 'it', label: 'Italiano' }, { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' }, { code: 'de', label: 'Deutsch' }, { code: 'ar', label: 'العربية' }, { code: 'zh', label: '中文' }, { code: 'nl', label: 'Nederlands' }, { code: 'pt', label: 'Português' }, { code: 'ru', label: 'Русский' }, { code: 'hi', label: 'हिन्दी' }].map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
              i18n.language === lang.code
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Trust & AI Transparency</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Understanding our commitment to data and intelligence integrity.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">AI Data Usage & Privacy</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Moneyflow AI utilizes a sanitized subset of your financial data (redacted of PII like names, IDs, or account numbers) to generate insights. No raw credentials or banking tokens are ever shared with AI models. You can review our <button onClick={() => setIsLegalModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-500/30 font-bold">Privacy Policy</button> for more details.
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3">Beta Disclaimers</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Insights and forecasts are for informational purposes only and do not constitute professional financial advice. During the private beta, data sync may be based on sandbox/demo environments and should be manually verified.
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Data Portability</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Download your personal data archive in JSON format.</p>
            </div>
            <button 
              onClick={handleExportData}
              className="px-6 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Archive
            </button>
          </div>

          <div className="p-6 bg-rose-500/5 dark:bg-rose-500/5 rounded-3xl border border-rose-500/10 dark:border-rose-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Delete Account Data</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Permanently remove your financial records and profile from Moneyflow.</p>
              </div>
              <button 
                onClick={() => setIsPurgeModalOpen(true)}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete My Data
              </button>
            </div>
            <div className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              <p>
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tighter mr-1">Shared Groups:</span> 
                In shared groups, your personal profile is removed or anonymized. Some historical group expense records may remain so other members’ balances stay accurate.
              </p>
              <p>
                <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tighter mr-1">Billing & Stripe:</span> 
                This removes your personal Moneyflow data. Some billing records are managed by Stripe and may be retained where required for payment, tax, fraud prevention, or legal obligations.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Legal & Privacy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Review our beta terms, disclaimers, and data policies.</p>
            </div>
            <button 
              onClick={() => setIsLegalModalOpen(true)}
              className="px-6 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" /> View Legal Docs
            </button>
          </div>

          <BetaFeedbackButton section="Trust Center" />

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Data Integrity</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Data synchronized via connected institutions, demo accounts, or sandboxes may contain estimated values or latency-driven differences compared to your live provider dashboard. Always perform independent verification before making capital allocation decisions.
            </p>
          </div>
        </div>
      </div>

      {/* LEGAL MODAL */}
      <AnimatePresence>
        {isLegalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLegalModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Trust Center</h2>
                </div>
                <button onClick={() => setIsLegalModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <LegalPages systemStatus={systemStatus} />
              </div>

              <button 
                onClick={() => setIsLegalModalOpen(false)}
                className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PURGE MODAL */}
      <AnimatePresence>
        {isPurgeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePurgeModal}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-rose-500/20"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <button onClick={closePurgeModal} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic mb-4">Delete Account Data</h2>
              <div className="space-y-4 text-sm text-slate-500 font-medium leading-relaxed mb-6">
                <p>This action is <span className="text-rose-500 font-bold uppercase italic tracking-tighter">permanent</span>. All personal assets, transactions, and liability records will be removed from your Moneyflow profile.</p>
                
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 space-y-3">
                  <p className="text-[10px] leading-relaxed">
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tighter mr-1">Retention Note:</span> 
                    Shared group records are anonymized but remain for accounting integrity. Billing records are managed by Stripe and may be retained where legally required for tax or fraud prevention.
                  </p>
                </div>
                
                {!dryRunData && !isDryRunLoading && (
                  <button 
                    onClick={handleDryRun}
                    className="w-full py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:border-indigo-500 transition-all"
                  >
                    Review what will be deleted
                  </button>
                )}

                {isDryRunLoading && (
                  <div className="py-4 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Auditing paths...</p>
                  </div>
                )}

                {dryRunData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Account Data Audit</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold">
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                        <span className="text-slate-400 uppercase">Profile</span>
                        <span className="text-slate-900 dark:text-white">{dryRunData.profileExists ? '1' : '0'}</span>
                      </div>
                      {Object.entries(dryRunData.collectionCounts).map(([key, count]) => (
                        <div key={key} className="flex justify-between border-b border-indigo-500/10 pb-1">
                          <span className="text-slate-400 uppercase truncate pr-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-slate-900 dark:text-white">{count}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                        <span className="text-slate-400 uppercase">Owned Groups</span>
                        <span className="text-slate-900 dark:text-white">{dryRunData.groupsImpactSummary.ownedGroupsCount}</span>
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-indigo-500/70 font-bold italic">
                      Note: Shared groups will remain; you will be removed as a member. This preview does not delete anything.
                    </p>
                  </motion.div>
                )}

                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>Strategic insights and historical forecasts will be wiped.</li>
                  <li>Connected institutions must be revoked manually in the Sync Hub.</li>
                  <li>We recommend downloading your data archive before proceeding.</li>
                </ul>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type <span className="text-slate-900 dark:text-white">DELETE</span> to confirm</p>
                <input 
                  type="text" 
                  value={purgeInput}
                  onChange={(e) => setPurgeInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:border-rose-500 transition-all outline-none dark:text-white"
                />
              </div>

              <button 
                onClick={handlePurge}
                disabled={purgeInput !== 'DELETE' || isPurging}
                className="w-full py-4 bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-white/5 text-white disabled:text-slate-400 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPurging ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Erasing Data...
                  </>
                ) : (
                  'Delete All Financial Records'
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
