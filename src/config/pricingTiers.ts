export type PlanTier = 'free' | 'pro' | 'premium';

export interface TierConfig {
  id: PlanTier;
  label: string;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  features: string[];
}

export const PRICING_TIERS: Record<PlanTier, TierConfig> = {
  free: {
    id: 'free',
    label: 'Foundation',
    priceMonthly: 0,
    currency: 'EUR',
    trialDays: 0,
    features: [
      'Manual Asset Tracking',
      'Basic Ledger',
      '1 Social Circle',
      'Standard Analytics'
    ]
  },
  pro: {
    id: 'pro',
    label: 'Intelligence',
    priceMonthly: 4.99,
    currency: 'EUR',
    trialDays: 7,
    features: [
      'Everything in Free',
      'Live Crypto Bridge',
      'Tactical Briefing',
      'Unlimited Social Circles',
      'Advanced Risk Metrics'
    ]
  },
  premium: {
    id: 'premium',
    label: 'Oracle',
    priceMonthly: 14.99,
    currency: 'EUR',
    trialDays: 7,
    features: [
      'Everything in Pro',
      'Palantir Full Macro Hub',
      'Scenario Engine (What-If)',
      'CFO Intelligence Reports',
      'Neural Voice Interaction',
      'Priority Oracle Support'
    ]
  }
};

/**
 * Checks if a user has access to a specific tier based on their plan or trial status.
 */
export const hasTierAccess = (userPlan: PlanTier | undefined, requiredTier: PlanTier): boolean => {
  const tiers: PlanTier[] = ['free', 'pro', 'premium'];
  const userIdx = tiers.indexOf(userPlan || 'free');
  const requiredIdx = tiers.indexOf(requiredTier);
  
  return userIdx >= requiredIdx;
};
