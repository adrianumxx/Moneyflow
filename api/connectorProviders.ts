/**
 * Backend Connector Provider Map
 * Standardized registry for financial data providers.
 * Aligned with src/utils/connectors.ts
 */

export interface BackendProvider {
  providerId: string;
  providerName: string;
  providerType: 'bank' | 'crypto_wallet' | 'broker' | 'investment' | 'custom_api' | 'import';
  isDemo: boolean;
}

export const BACKEND_PROVIDERS: Record<string, BackendProvider> = {
  revolut_demo: {
    providerId: 'revolut_demo',
    providerName: 'Revolut (Demo)',
    providerType: 'bank',
    isDemo: true
  },
  n26_demo: {
    providerId: 'n26_demo',
    providerName: 'N26 (Demo)',
    providerType: 'bank',
    isDemo: true
  },
  bank_sandbox: {
    providerId: 'bank_sandbox',
    providerName: 'Generic Bank (Sandbox)',
    providerType: 'bank',
    isDemo: false
  },
  coinbase_wallet: {
    providerId: 'coinbase_wallet',
    providerName: 'Coinbase Wallet',
    providerType: 'crypto_wallet',
    isDemo: false
  },
  binance_demo: {
    providerId: 'binance_demo',
    providerName: 'Binance (Demo)',
    providerType: 'broker',
    isDemo: true
  },
  custom_api: {
    providerId: 'custom_api',
    providerName: 'Custom Neural API',
    providerType: 'custom_api',
    isDemo: false
  }
};

export const getBackendProviderById = (id: string): BackendProvider | undefined => {
  return BACKEND_PROVIDERS[id];
};
