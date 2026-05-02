import { UserProfile } from '../types';
import { PlanTier, hasTierAccess } from './pricingTiers';

/**
 * Feature Flag System
 * Controls access to specific features based on environment and user plan.
 */

export const FEATURES = {
  PALANTIR_LIVE: 'PALANTIR_LIVE',
  BANK_SYNC: 'BANK_SYNC',
  CFO_REPORT: 'CFO_REPORT',
  ADVANCED_GROUPS: 'ADVANCED_GROUPS',
  SCENARIO_ENGINE: 'SCENARIO_ENGINE',
  TACTICAL_BRIEF: 'TACTICAL_BRIEF',
  NEURAL_VOICE: 'NEURAL_VOICE'
} as const;

export type FeatureKey = keyof typeof FEATURES;

const FEATURE_REQUIREMENTS: Record<FeatureKey, PlanTier> = {
  [FEATURES.PALANTIR_LIVE]: 'premium',
  [FEATURES.BANK_SYNC]: 'pro',
  [FEATURES.CFO_REPORT]: 'premium',
  [FEATURES.ADVANCED_GROUPS]: 'pro',
  [FEATURES.SCENARIO_ENGINE]: 'premium',
  [FEATURES.TACTICAL_BRIEF]: 'pro',
  [FEATURES.NEURAL_VOICE]: 'premium'
};

export const isFeatureVisible = (feature: FeatureKey): boolean => {
  // During Beta, some experimental features might be globally hidden regardless of plan
  const hiddenInBeta: FeatureKey[] = [];
  return !hiddenInBeta.includes(feature);
};

export const canUserAccessFeature = (userProfile: UserProfile | null, feature: FeatureKey): boolean => {
  if (!userProfile) return false;
  
  // Admin bypass
  if ((userProfile as any).role === 'admin') return true;

  const requiredTier = FEATURE_REQUIREMENTS[feature];
  return hasTierAccess(userProfile.plan, requiredTier);
};
