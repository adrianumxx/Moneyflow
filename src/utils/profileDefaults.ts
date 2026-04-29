import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

/**
 * Maps a primary goal to a financial mode.
 */
export const getFinancialModeFromGoal = (goal?: string): UserProfile['financialMode'] => {
  if (!goal) return 'balanced';
  
  const g = goal.toLowerCase();
  if (g.includes('wealth') || g.includes('growth') || g.includes('invest')) return 'growth';
  if (g.includes('save') || g.includes('emergency') || g.includes('safety')) return 'defensive';
  if (g.includes('freedom') || g.includes('fire')) return 'aggressive';
  
  return 'balanced';
};

/**
 * Maps experience level string to the enum type.
 */
export const getInvestmentExperience = (exp?: string): UserProfile['investmentExperience'] => {
  if (!exp) return 'unknown';
  const e = exp.toLowerCase();
  if (e.includes('beginner') || e.includes('just starting')) return 'beginner';
  if (e.includes('intermediate') || e.includes('some experience')) return 'intermediate';
  if (e.includes('advanced') || e.includes('expert')) return 'advanced';
  if (e.includes('pro') || e.includes('professional')) return 'professional';
  return 'unknown';
};

/**
 * Builds the update object for the onboarding completion.
 */
export const buildOnboardingProfileUpdate = (
  country: string,
  baseCurrency: string,
  primaryGoal: string,
  experienceLevel: string
): Partial<UserProfile> => {
  return {
    country,
    baseCurrency,
    primaryGoal,
    experienceLevel,
    taxResidence: country,
    currencyExposure: [baseCurrency],
    financialMode: getFinancialModeFromGoal(primaryGoal),
    investmentExperience: getInvestmentExperience(experienceLevel),
    hasCompletedOnboarding: true,
    onboardingCompletedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
};
