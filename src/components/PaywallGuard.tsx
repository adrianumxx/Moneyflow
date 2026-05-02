import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Crown, Zap, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FeatureKey, canUserAccessFeature } from '../config/featureFlags';
import { PRICING_TIERS, PlanTier } from '../config/pricingTiers';

interface PaywallGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PaywallGuard({ feature, children, fallback }: PaywallGuardProps) {
  const { userProfile } = useAuth();
  const hasAccess = canUserAccessFeature(userProfile, feature);

  if (hasAccess) return <>{children}</>;

  // If a specific lightweight fallback is provided (like a blurred preview)
  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center p-6 overflow-hidden rounded-[3.5rem] bg-zinc-950 border border-indigo-500/20 shadow-2xl">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-lg w-full text-center space-y-8"
      >
        <div className="inline-flex flex-col items-center gap-6">
           <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3">
              <Crown className="w-10 h-10 text-white" />
           </div>
           <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">Upgrade to Pro</h2>
              <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px]">Unlock the full power of the Oracle</p>
           </div>
        </div>

        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl text-left space-y-6">
           <p className="text-sm text-slate-300 leading-relaxed font-medium">
             The <span className="text-indigo-400 font-black italic">{feature.replace('_', ' ')}</span> engine is reserved for our Intelligence tiers. 
             Join the private beta to get high-fidelity forecasts and global macro signals.
           </p>

           <div className="space-y-3">
              {PRICING_TIERS.pro.features.slice(1, 4).map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">{f}</span>
                </div>
              ))}
           </div>

           <div className="pt-4 flex flex-col gap-3">
              <button 
                className="w-full py-5 bg-white text-zinc-950 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5"
              >
                Start 7-Day Free Trial <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest italic">
                Cancel anytime • Powered by Stripe
              </p>
           </div>
        </div>

        <div className="flex items-center justify-center gap-8">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none italic">Secure Assets</span>
           </div>
           <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none italic">A.I. Reasoning</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
