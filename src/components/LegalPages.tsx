import React from 'react';
import { Shield, FileText, AlertCircle, Scale, Trash2, Database, Globe, Lock, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface LegalSectionProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

const LegalSection = ({ title, icon: Icon, children }: LegalSectionProps) => (
  <div className="space-y-4 mb-10">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">{title}</h3>
    </div>
    <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium space-y-4">
      {children}
    </div>
  </div>
);

export default function LegalPages({ systemStatus }: { systemStatus?: any }) {
  return (
    <div className="space-y-8 py-4">
      <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex gap-4 items-start mb-8">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Beta Notice</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-500/80 font-medium leading-relaxed">
            Moneyflow is currently in **Public Beta**. Features are subject to change. While we prioritize security, users should not rely solely on beta features for critical financial decisions.
          </p>
        </div>
      </div>

      <LegalSection title="Financial & AI Disclaimer" icon={Scale}>
        <p>
          Moneyflow provides financial tracking and AI-driven insights for informational purposes only. **This is not financial, investment, legal, or tax advice.**
        </p>
        <p>
          Our intelligence engine analyzes your data to identify patterns, but results may be incomplete or inaccurate. You remain 100% responsible for all financial decisions, including investments, transfers, and tax filings.
        </p>
      </LegalSection>

      <LegalSection title="Privacy & Data Processing" icon={Shield}>
        <p>
          We use bank-level encryption for data in transit and at rest. Your connected bank data (via GoCardless) is used solely to generate your wealth dashboard and AI insights.
        </p>
        <p>
          **AI Processing:** To generate insights, sanitized and aggregated data (stripped of IBANs and PII) may be processed by our AI providers (Google Gemini). We never sell your personal financial data to third parties.
        </p>
      </LegalSection>

      <LegalSection title="Your Data Rights" icon={Lock}>
        <p>
          **Revocation:** You can revoke any bank connection at any time via the Integrations Hub. This stops future synchronization immediately.
        </p>
        <p>
          **Data Export:** You have the right to export your entire financial history in a standardized JSON format at any time.
        </p>
        <p>
          **Deletion:** You can request account deletion. Note that while UI-level disconnection is available, full backend data purging is a planned beta feature and is not yet fully automated.
        </p>
      </LegalSection>

      <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">System Diagnostics (Beta)</h3>
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(systemStatus || {}).map(([key, value]) => (
            key !== 'environment' && (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase truncate">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            )
          ))}
        </div>
        
        {!systemStatus && (
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest animate-pulse">Syncing with Neural Backbone...</p>
        )}
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-white/10 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Version 0.9.0-BETA &bull; Last Updated: April 2026
        </p>
      </div>
    </div>
  );
}
