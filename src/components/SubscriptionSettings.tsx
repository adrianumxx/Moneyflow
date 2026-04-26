import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, CreditCard, ExternalLink, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionSettingsProps {
  userProfile: UserProfile | null;
  userId: string;
  userEmail: string | null;
}

export default function SubscriptionSettings({ userProfile, userId, userEmail }: SubscriptionSettingsProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = userProfile?.plan === 'premium' || userProfile?.subscriptionStatus === 'active' || userProfile?.subscriptionStatus === 'trialing';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 rounded-3xl p-8 border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold font-display">Premium Membership</h3>
            </div>
            <p className="text-slate-500 max-w-md">
              Unlock advanced AI insights, unlimited group sharing, and precise financial forecasting.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPremium ? (
              <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Active Premium
              </div>
            ) : (
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full font-bold text-sm">
                Free Plan
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">What's included:</h4>
            <ul className="space-y-3">
              {[
                '15-day Free Trial (No risk)',
                'Advanced CFO AI Reports',
                'Unlimited Household Groups',
                'Real-time Bank Account Sync',
                'Custom Spending Alerts'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-zinc-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-4">
            {!isPremium ? (
              <>
                <div className="text-center md:text-right">
                  <p className="text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">€4.99<span className="text-sm text-zinc-400 font-bold ml-1">/month</span></p>
                  <p className="text-xs text-indigo-500 font-bold mt-1">First 15 days entirely free</p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Start 15-Day Free Trial
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="w-full py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-900 dark:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                  Manage Billing & Cards
                </button>
                <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-widest">
                  Securely hosted by Stripe
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
