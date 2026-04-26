import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bug, Lightbulb, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

type FeedbackType = 'feature' | 'bug' | 'general';

export default function FeedbackModal({ isOpen, onClose, userEmail }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('feature');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Using Formsubmit.co - free, no backend required
      const response = await fetch("https://formsubmit.co/ajax/adrianomelilloXX@gmail.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          type: type.toUpperCase(),
          from_email: userEmail || 'anonymous@moneyflow.ai',
          message: message,
          _subject: `Moneyflow Feedback: ${type.toUpperCase()}`,
          _captcha: "false"
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setMessage('');
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white font-display">Feedback & Support</h3>
                  <p className="text-zinc-500 text-sm mt-1">Help us shape the future of Moneyflow.</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 border border-emerald-100 dark:border-emerald-500/20">
                    <Send className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Message Sent!</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6">Thank you for your feedback. We'll look into it shortly.</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Sent via FormSubmit • Activation required for first use
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">Feedback Type</label>
                      <a 
                        href="mailto:adrianomelilloXX@gmail.com" 
                        className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:underline"
                      >
                        Email directly
                      </a>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setType('feature')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${type === 'feature' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'border-transparent bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                      >
                        <Lightbulb className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Feature</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${type === 'bug' ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-500' : 'border-transparent bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                      >
                        <Bug className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bug</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('general')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${type === 'general' ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-white' : 'border-transparent bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                      >
                        <MessageSquare className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">General</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder={
                        type === 'bug' 
                          ? "Describe the issue and steps to reproduce..." 
                          : type === 'feature' 
                            ? "Tell us what feature you'd like to see next..." 
                            : "How can we help you?"
                      }
                      className="w-full h-40 px-5 py-4 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full py-5 addictive-gradient text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            
            <div className="px-8 py-4 bg-zinc-50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5 text-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Moneyflow Feedback System 1.0
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
