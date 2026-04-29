import { 
  ConnectionStatus, 
  DataSourceType, 
  ConnectedInstitution, 
  ConnectedAccount 
} from '../types';
import { Timestamp } from 'firebase/firestore';

export interface Provider {
  providerId: string;
  providerName: string;
  providerType: DataSourceType;
  status: 'active' | 'beta' | 'deprecated';
  countrySupport: string[];
  supportsOAuth: boolean;
  supportsSandbox: boolean;
  isDemo: boolean;
  description: string;
}

/**
 * Global Provider Registry
 * Standardized list of supported financial data providers.
 */
export const PROVIDER_REGISTRY: Provider[] = [
  {
    providerId: 'revolut_demo',
    providerName: 'Revolut (Demo)',
    providerType: 'bank',
    status: 'active',
    countrySupport: ['UK', 'EU'],
    supportsOAuth: true,
    supportsSandbox: true,
    isDemo: true,
    description: 'Simulated Revolut connection for testing liquidity flows.'
  },
  {
    providerId: 'n26_demo',
    providerName: 'N26 (Demo)',
    providerType: 'bank',
    status: 'active',
    countrySupport: ['EU'],
    supportsOAuth: true,
    supportsSandbox: true,
    isDemo: true,
    description: 'Simulated N26 connection for testing digital bank sync.'
  },
  {
    providerId: 'bank_sandbox',
    providerName: 'Generic Bank (Sandbox)',
    providerType: 'bank',
    status: 'active',
    countrySupport: ['GLOBAL'],
    supportsOAuth: true,
    supportsSandbox: true,
    isDemo: false,
    description: 'Institutional-grade sandbox for PSD2/Open Banking testing.'
  },
  {
    providerId: 'coinbase_wallet',
    providerName: 'Coinbase Wallet',
    providerType: 'crypto_wallet',
    status: 'beta',
    countrySupport: ['GLOBAL'],
    supportsOAuth: false,
    supportsSandbox: true,
    isDemo: false,
    description: 'Direct wallet connection for tracking on-chain assets.'
  },
  {
    providerId: 'binance_demo',
    providerName: 'Binance (Demo)',
    providerType: 'broker',
    status: 'active',
    countrySupport: ['GLOBAL'],
    supportsOAuth: true,
    supportsSandbox: true,
    isDemo: true,
    description: 'Simulated exchange connection for testing trading balance sync.'
  },
  {
    providerId: 'custom_api',
    providerName: 'Custom Neural API',
    providerType: 'custom_api',
    status: 'active',
    countrySupport: ['GLOBAL'],
    supportsOAuth: false,
    supportsSandbox: false,
    isDemo: false,
    description: 'Connect to external proprietary wealth endpoints.'
  }
];

/**
 * Retrieves a provider by its unique ID.
 */
export const getProviderById = (providerId: string): Provider | undefined => {
  return PROVIDER_REGISTRY.find(p => p.providerId === providerId);
};

/**
 * Filters providers by their data source type.
 */
export const getProvidersByType = (type: DataSourceType): Provider[] => {
  return PROVIDER_REGISTRY.filter(p => p.providerType === type);
};

/**
 * Checks if a provider is a demo provider.
 */
export const isDemoProvider = (providerId: string): boolean => {
  return getProviderById(providerId)?.isDemo || false;
};

/**
 * Normalizes connection status to handle edge cases and unknown states.
 */
export const normalizeConnectionStatus = (status: any): ConnectionStatus => {
  const validStatuses: ConnectionStatus[] = [
    'demo', 'sandbox', 'connecting', 'connected', 
    'syncing', 'failed', 'needs_reauth', 'disconnected'
  ];
  return validStatuses.includes(status) ? status : 'failed';
};

/**
 * Builds a demo ConnectedInstitution object.
 */
export const buildDemoInstitution = (ownerId: string, providerId: string): Partial<ConnectedInstitution> => {
  const provider = getProviderById(providerId);
  return {
    ownerId,
    providerId,
    providerName: provider?.providerName || 'Unknown Provider',
    providerType: provider?.providerType || 'demo',
    status: 'demo',
    isDemo: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastSyncedAt: Timestamp.now()
  };
};

/**
 * Builds a demo ConnectedAccount object.
 */
export const buildDemoAccount = (
  ownerId: string, 
  institutionId: string, 
  providerId: string, 
  currency: string = 'EUR'
): Partial<ConnectedAccount> => {
  return {
    ownerId,
    institutionId,
    providerId,
    name: 'Demo Account',
    type: 'checking',
    balance: Math.floor(Math.random() * 10000),
    currency,
    status: 'demo',
    isDemo: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastSyncedAt: Timestamp.now()
  };
};
