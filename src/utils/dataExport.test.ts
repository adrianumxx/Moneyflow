import { describe, it, expect } from 'vitest';
import { prepareExportBundle } from './dataExport';

describe('dataExport Utility', () => {
  const mockData = {
    userProfile: { uid: 'user_123', email: 'test@example.com', stripeCustomerId: 'cus_890' },
    assets: [{ id: 'a1', name: 'Cash', value: 1000 }],
    liabilities: [],
    transactions: [{ id: 't1', amount: 50, secretToken: 'ST_123', metadata: { apiKey: 'key_456', clientSecret: 'cs_789' } }],
    bankAccounts: [{ id: 'b1', accessToken: 'AT_789', refreshToken: 'RT_111' }],
    goals: [],
    insights: [{ id: 'i1', description: 'Save more' }],
    groups: [
      { id: 'g1', ownerId: 'user_123', name: 'My Group' },
      { id: 'g2', ownerId: 'other_user', name: 'Other Group' }
    ],
    connectedInstitutions: [],
    connectedAccounts: [],
    cryptoWallets: []
  };

  it('prepares a bundle with correct structure and data inclusion', () => {
    const result = prepareExportBundle(mockData);
    
    expect(result).toBeDefined();
    expect(result.profile.uid).toBe('user_123');
    expect(result.assets).toHaveLength(1);
    expect(result.insights).toHaveLength(1);
    // Groups should only include user-owned ones
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].id).toBe('g1');
  });

  it('sanitizes sensitive keys from the export', () => {
    const result = prepareExportBundle(mockData);
    
    // Check profile
    expect(result.profile.stripeCustomerId).toBeUndefined();
    
    // Check transactions
    expect(result.transactions[0].secretToken).toBeUndefined();
    expect(result.transactions[0].metadata.apiKey).toBeUndefined();
    expect(result.transactions[0].metadata.clientSecret).toBeUndefined();
    
    // Check bank accounts
    expect(result.bankAccounts[0].accessToken).toBeUndefined();
    expect(result.bankAccounts[0].refreshToken).toBeUndefined();
  });

  it('converts Firebase-style objects or Dates to ISO strings', () => {
    const dateData = {
      ...mockData,
      assets: [{ 
        id: 'a1', 
        updatedAt: { toDate: () => new Date('2024-01-01T12:00:00Z') } 
      }]
    };
    
    const result = prepareExportBundle(dateData);
    expect(result.assets[0].updatedAt).toBe('2024-01-01T12:00:00.000Z');
  });

  it('returns null if no data is provided', () => {
    expect(prepareExportBundle(null)).toBeNull();
  });
});
