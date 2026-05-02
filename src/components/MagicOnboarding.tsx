import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Home, Activity, Globe, Landmark, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { buildOnboardingProfileUpdate } from '../utils/profileDefaults';
import { injectStarterHorizon } from '../services/onboardingService';

interface MagicOnboardingProps {
  userId: string;
  onComplete: () => void;
}

export default function MagicOnboarding({ userId, onComplete }: MagicOnboardingProps) {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<string>('Italy');
  const [goal, setGoal] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('EUR');
  const [initialAssetValue, setInitialAssetValue] = useState<string>('5000');
  const [isSaving, setIsSaving] = useState(false);

  const countries = [
    { id: 'Italy', currency: 'EUR', symbol: '€' },
    { id: 'United States', currency: 'USD', symbol: '$' },
    { id: 'United Kingdom', currency: 'GBP', symbol: '£' },
    { id: 'Global (Other)', currency: 'USD', symbol: '$' }
  ];

  const handleCountrySelect = (c: { id: string, currency: string }) => {
    setCountry(c.id);
    setCurrency(c.currency);
    setTimeout(nextStep, 300);
  };

  const handleComplete = async (skipData: boolean = false) => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', userId);
      const profileUpdate = buildOnboardingProfileUpdate(country, currency, goal || 'grow_wealth', experience || 'beginner');
      await setDoc(userRef, profileUpdate, { merge: true });

      if (!skipData) {
        // Inject Starter Horizon (Enriched initial data)
        const val = parseFloat(initialAssetValue);
        await injectStarterHorizon(userId, isNaN(val) ? 0 : val, currency);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data', error);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const skipStep = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete(true);
  };

  const goals = [
    { id: 'grow_wealth', title: 'Grow Wealth', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'escape_rat_race', title: 'Escape Rat Race', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'buy_home', title: 'Buy a Home', icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'protect_assets', title: 'Protect Assets', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  ];

  const experiences = [
    { id: 'beginner', title: 'Beginner', desc: 'Simple, clear advice.', icon: CheckCircle2 },
    { id: 'intermediate', title: 'Intermediate', desc: 'Optimize existing flows.', icon: Activity },
    { id: 'quant', title: 'Quant / Pro', desc: 'Raw data & spread analysis.', icon: Target }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-slate-900 border border-white/5 rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        <button 
          onClick={() => handleComplete(true)}
          className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-colors z-20"
          title="Skip all and start with empty dashboard"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Sparkles className="w-64 h-64 text-indigo-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Global Context</h2>
                  <p className="text-slate-400 text-sm font-medium">Select your primary region to calibrate the AI Oracle.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {countries.map(c => {
                    const isSelected = country === c.id;
                    return (
                      <button 
                        key={c.id}
                        onClick={() => handleCountrySelect(c)}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
                      >
                        <Globe className={`w-8 h-8 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-200">{c.id}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Primary Objective</h2>
                  <p className="text-slate-400 text-sm font-medium">What is your single most important financial goal today?</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {goals.map(g => {
                    const Icon = g.icon;
                    const isSelected = goal === g.id;
                    return (
                      <button 
                        key={g.id}
                        onClick={() => { setGoal(g.id); setTimeout(nextStep, 300); }}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
                      >
                        <div className={`p-4 rounded-2xl ${g.bg}`}>
                          <Icon className={`w-8 h-8 ${g.color}`} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-200">{g.title}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Experience Level</h2>
                  <p className="text-slate-400 text-sm font-medium">This adjusts the complexity of AI insights and briefings.</p>
                </div>
                
                <div className="space-y-3">
                  {experiences.map(exp => {
                    const Icon = exp.icon;
                    const isSelected = experience === exp.id;
                    return (
                      <button 
                        key={exp.id}
                        onClick={() => { setExperience(exp.id); setTimeout(nextStep, 300); }}
                        className={`flex items-center gap-5 p-5 w-full rounded-3xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-white">{exp.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">{exp.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col h-full"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Activate Wealth Hub</h2>
                  <p className="text-slate-400 text-sm font-medium">Inject your starting liquidity to prime the predictive engine.</p>
                </div>
                
                <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 mt-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 block flex items-center gap-2 italic">
                    <Landmark className="w-4 h-4" /> Current Liquid Capital ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-slate-600 font-black">
                      {countries.find(c => c.currency === currency)?.symbol || currency}
                    </span>
                    <input 
                      type="number" 
                      value={initialAssetValue}
                      onChange={(e) => setInitialAssetValue(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-16 pr-6 py-6 text-4xl font-black text-white focus:outline-none focus:border-indigo-500 transition-all font-display"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                  <button 
                    onClick={() => handleComplete(false)}
                    disabled={isSaving}
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group shadow-xl shadow-indigo-600/20"
                  >
                    {isSaving ? (
                      <span className="animate-pulse">Priming Neural Core...</span>
                    ) : (
                      <>
                        Initialize Horizon <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleComplete(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Skip & Start Empty
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

