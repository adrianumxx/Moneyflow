/**
 * Feature Flags for Moneyflow Private Beta
 * Defines visibility states for unverified or internal-only features.
 */

export type FeatureState = 'visible' | 'demo-only' | 'internal-only' | 'hidden' | 'coming-later';

export interface FeatureConfig {
  state: FeatureState;
  label?: string;
}

export const FEATURES = {
  PALANTIR_LIVE: {
    state: 'demo-only',
    label: 'Beta: Demo Insights'
  } as FeatureConfig,
  CFO_REPORT: {
    state: 'coming-later',
    label: 'Planned after beta'
  } as FeatureConfig,
  BANK_SYNC: {
    state: 'demo-only',
    label: 'Sandbox sync preview'
  } as FeatureConfig,
  CRYPTO_SYNC: {
    state: 'hidden'
  } as FeatureConfig,
  INVESTMENT_SYNC: {
    state: 'hidden'
  } as FeatureConfig,
  ADVANCED_GROUPS: {
    state: 'visible'
  } as FeatureConfig,
  MARKET_SIGNALS: {
    state: 'internal-only'
  } as FeatureConfig,
};

export const isFeatureVisible = (feature: keyof typeof FEATURES): boolean => {
  const config = FEATURES[feature];
  return config.state !== 'hidden' && config.state !== 'internal-only';
};

export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  const config = FEATURES[feature];
  return config.state === 'visible' || config.state === 'demo-only';
};

export const getFeatureLabel = (feature: keyof typeof FEATURES): string | undefined => {
  return FEATURES[feature].label;
};
