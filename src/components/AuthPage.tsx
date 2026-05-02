import React from 'react';
import { motion } from 'motion/react';
import { Activity, Zap } from 'lucide-react';
import GlobalPulse from './GlobalPulse';

interface LandingPageProps {
  onGoogleSignIn: () => void;
  onEmailAuth: (e: React.FormEvent) => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  isEmailView: boolean;
  setIsEmailView: (view: boolean) => void;
  isSignUp: boolean;
  setIsSignUp: (signUp: boolean) => void;
  authError: string;
  authLoading: boolean;
  onTryDemo: () => void;
}

export default function AuthPage({
  onGoogleSignIn,
  onEmailAuth,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  isEmailView,
  setIsEmailView,
  isSignUp,
  setIsSignUp,
  authError,
  authLoading,
  onTryDemo
}: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617] p-4 text-center relative overflow-hidden transition-colors duration-300">
      {/* Advanced Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-fuchsia-500/10 dark:bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10 sm:p-14 rounded-[3.5rem] shadow-premium relative z-10"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-glow rotate-3">
          <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Activity className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white font-display leading-tight">
          Your financial life, clearly organized.
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed text-base font-medium px-4">
          Moneyflow helps you understand your accounts, spending, goals and AI-assisted insights in one private workspace.
        </p>

        <div className="space-y-6">
          {!isEmailView ? (
            <div className="space-y-3">
              {authError && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-600 dark:text-rose-400 text-xs font-bold mb-4 animate-shake leading-relaxed">
                  {authError}
                </div>
              )}
              <button
                onClick={onGoogleSignIn}
                disabled={authLoading}
                className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 text-lg outline-none focus:ring-4 focus:ring-indigo-500/40 group disabled:opacity-70"
              >
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-1.5 shadow-sm group-hover:rotate-12 transition-transform shrink-0">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-full h-full" />
                </div>
                {authLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
              
              <button
                onClick={() => setIsEmailView(true)}
                className="w-full py-4 bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-400 rounded-[2rem] font-bold border-2 border-slate-100 dark:border-white/5 hover:border-indigo-500 transition-all text-sm"
              >
                Continue with Email
              </button>
            </div>
          ) : (
            <form onSubmit={onEmailAuth} className="space-y-4">
              {authError && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">
                  {authError}
                </div>
              )}
              
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-5">Email Address</label>
                  <input 
                    type="email" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white transition-all font-medium"
                    placeholder="you@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-5">Security Key</label>
                  <input 
                    type="password" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-5 addictive-gradient text-white rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 text-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  {authLoading ? 'Verifying...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
                
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "New to Moneyflow? Create an account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmailView(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Back to Google Login
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Explore</span>
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
          </div>
          
          <div className="pt-2">
            <button
              onClick={onTryDemo}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-200 dark:shadow-black/20 text-sm group"
            >
              <Zap className="w-5 h-5 text-indigo-500 group-hover:animate-pulse" />
              <span>Try demo</span>
            </button>
            <p className="mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] text-center leading-relaxed">
              Informational read-only view. No money movement.<br />
              <span className="opacity-60">Private beta access • Not financial advice</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
