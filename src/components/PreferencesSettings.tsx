import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ShieldCheck, Download, Trash2, AlertTriangle, X, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';
import LegalPages from './LegalPages.js';

import { prepareExportBundle } from '../utils/dataExport';

interface PreferencesSettingsProps {
  exportData?: {
    userProfile: any;
    assets: any[];
    liabilities: any[];
    transactions: any[];
    bankAccounts: any[];
    goals: any[];
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
  const [purgeInput, setPurgeInput] = useState('');

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
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">AI Context Usage</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Intelligence engines like Palantir utilize your aggregated financial context (assets, liabilities, and transactions) to generate predictive insights and risk models. Your data is analyzed locally within our Neural Core to ensure privacy-first intelligence.
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3">Informational Boundaries</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              All AI-generated outputs, including growth forecasts and probability vectors, are for informational and educational purposes only. These do not constitute financial, legal, or tax advice. AI models may occasionally produce inaccuracies or incomplete estimates based on fluctuating market data.
            </p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-zinc-950/50 rounded-3xl border border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Data Portability</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Download your personal financial archive for your own records.</p>
            </div>
            <button 
              onClick={handleExportData}
              className="px-6 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Archive
            </button>
          </div>

          <div className="p-6 bg-rose-500/5 dark:bg-rose-500/5 rounded-3xl border border-rose-500/10 dark:border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Data Erasure</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Permanently purge all financial records from the Neural Core.</p>
            </div>
            <button 
              onClick={() => setIsPurgeModalOpen(true)}
              className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Purge Financial Data
            </button>
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
                <LegalPages />
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
              onClick={() => setIsPurgeModalOpen(false)}
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
                <button onClick={() => setIsPurgeModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic mb-4">Permanent Purge</h2>
              <div className="space-y-4 text-sm text-slate-500 font-medium leading-relaxed mb-8">
                <p>This action is <span className="text-rose-500 font-bold">irreversible</span>. Once initiated, all indexed assets, transactions, and liability records will be permanently erased from your profile.</p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>Neural insights and historical forecasts will be wiped.</li>
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
                onClick={() => {
                  showNotification('Purge Engine Offline', 'Backend purge routes are currently being secured. Please try again later.', 'info');
                  setIsPurgeModalOpen(false);
                  setPurgeInput('');
                }}
                disabled={purgeInput !== 'DELETE'}
                className="w-full py-4 bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-white/5 text-white disabled:text-slate-400 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all active:scale-[0.98]"
              >
                Erase All Financial Records
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
