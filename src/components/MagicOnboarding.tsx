import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Home, Activity, Globe, Landmark } from 'lucide-react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { buildOnboardingProfileUpdate } from '../utils/profileDefaults';

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

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', userId);
      const profileUpdate = buildOnboardingProfileUpdate(country, currency, goal || 'grow_wealth', experience || 'beginner');
      await setDoc(userRef, profileUpdate, { merge: true });

      // Inject initial asset
      const val = parseFloat(initialAssetValue);
      if (!isNaN(val) && val > 0) {
        await addDoc(collection(db, 'users', userId, 'assets'), {
          name: 'Primary Liquidity',
          type: 'cash',
          value: val,
          institution: 'Main Bank',
          ownerId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data', error);
      // Fallback complete anyway to not block user
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const goals = [
    { id: 'grow_wealth', title: 'Grow Wealth', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'escape_rat_race', title: 'Escape Rat Race', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'buy_home', title: 'Buy a Home', icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'protect_assets', title: 'Protect Assets', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  ];

  const experiences = [
    { id: 'beginner', title: 'Beginner', desc: 'I want simple, clear advice.', icon: CheckCircle2 },
    { id: 'intermediate', title: 'Intermediate', desc: 'I know the basics, looking to optimize.', icon: Activity },
    { id: 'quant', title: 'Quant / Pro', desc: 'Give me raw data, spread analysis & macro.', icon: Target }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-premium relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Zap className="w-64 h-64 text-amber-500" />
        </div>

        <div className="relative z-10">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-indigo-500' : 'bg-slate-800'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Select your location</h2>
                  <p className="text-slate-400 text-sm font-medium">This centers the Insights AI on your region.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {countries.map(c => {
                    const isSelected = country === c.id;
                    return (
                      <button 
                        key={c.id}
                        onClick={() => handleCountrySelect(c)}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'}`}
                      >
                        <div className={`p-4 rounded-2xl ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                          <Globe className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">{c.id}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{c.currency}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">What is your primary goal?</h2>
                  <p className="text-slate-400 text-sm font-medium">Insights AI will tailor your entire dashboard to this singular objective.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {goals.map(g => {
                    const Icon = g.icon;
                    const isSelected = goal === g.id;
                    return (
                      <button 
                        key={g.id}
                        onClick={() => { setGoal(g.id); setTimeout(nextStep, 300); }}
                        className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'}`}
                      >
                        <div className={`p-4 rounded-2xl ${g.bg}`}>
                          <Icon className={`w-8 h-8 ${g.color}`} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-slate-200">{g.title}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">What's your experience level?</h2>
                  <p className="text-slate-400 text-sm font-medium">This helps the AI communicate with you more effectively.</p>
                </div>
                
                <div className="space-y-4">
                  {experiences.map(exp => {
                    const Icon = exp.icon;
                    const isSelected = experience === exp.id;
                    return (
                      <button 
                        key={exp.id}
                        onClick={() => { setExperience(exp.id); setTimeout(nextStep, 300); }}
                        className={`flex items-center gap-5 p-5 w-full rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'}`}
                      >
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-white">{exp.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{exp.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex flex-col h-full"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Add your starting balance</h2>
                  <p className="text-slate-400 text-sm font-medium">To activate the AI Core, enter your primary bank or asset balance.</p>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-500" /> Primary Account Balance ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-slate-500 font-black">
                      {countries.find(c => c.currency === currency)?.symbol || currency}
                    </span>
                    <input 
                      type="number" 
                      value={initialAssetValue}
                      onChange={(e) => setInitialAssetValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-16 pr-6 py-5 text-3xl font-black text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                  <button 
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 group shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)]"
                  >
                    {isSaving ? (
                      <span className="animate-pulse">Initializing Insights...</span>
                    ) : (
                      <>
                        Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
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
