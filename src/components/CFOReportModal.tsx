import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, FileText, PieChart, Sparkles, ShieldCheck, Mail, CheckCircle2, Loader2, Download } from 'lucide-react';

interface CFOReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<string | null>; // Returns download URL or null
}

export default function CFOReportModal({ isOpen, onClose, onSend }: CFOReportModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSending) return;

    setIsSending(true);
    try {
      const url = await onSend(email);
      setDownloadUrl(url);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setDownloadUrl(null);
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl glass-card rounded-[3rem] shadow-premium overflow-hidden border border-white/20 dark:border-white/10"
          >
            <div className="absolute top-0 right-0 p-8">
              <button 
                onClick={handleClose}
                className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-12">
              <div className="w-16 h-16 addictive-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-10">
                <FileText className="w-8 h-8 text-white" />
              </div>

              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white mb-4">Audit Finalized</h3>
                  <p className="text-slate-500 font-medium mb-8">Your professional wealth audit has been generated. Due to security protocols in the preview environment, please download the copy below.</p>
                  
                  {downloadUrl && (
                    <a 
                      href={downloadUrl} 
                      download="Wealth_Strategic_Audit_2024.pdf"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-sm font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Download className="w-5 h-5" /> Download CFO Audit
                    </a>
                  )}
                  
                  <button 
                    onClick={handleClose}
                    className="block w-full mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-4 mb-10">
                    <h2 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white font-display leading-[0.9]">CFO Strategic Intelligence Report</h2>
                    <p className="text-slate-500 font-medium text-lg">Generate a high-fidelity audit of your entire wealth structure, including cross-sector risk analysis and yield projections.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                      <PieChart className="w-5 h-5 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep Analytics</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Predictions</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input 
                        type="email"
                        required
                        placeholder="your@vault.email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-lg"
                       />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSending}
                      className="w-full py-6 addictive-gradient text-white rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Preparing Audit...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" />
                          <span>Generate & Send Report</span>
                        </>
                      )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Bank-Grade Data Encryption</span>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
