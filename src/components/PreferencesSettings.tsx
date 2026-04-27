import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function PreferencesSettings() {
  const { t, i18n } = useTranslation();

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
        {[{ code: 'en', label: 'English' }, { code: 'it', label: 'Italiano' }, { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' }, { code: 'de', label: 'Deutsch' }].map((lang) => (
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
    </div>
  );
}
