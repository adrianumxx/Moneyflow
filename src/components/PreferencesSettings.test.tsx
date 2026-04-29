import { describe, it, expect } from 'vitest';
import { prepareExportBundle } from '../utils/dataExport';

describe('Data Export Utility', () => {
  const mockData = {
    userProfile: { uid: '123', email: 'test@example.com', stripeCustomerId: 'cus_123' },
    assets: [{ id: 'a1', value: 1000 }],
    liabilities: [{ id: 'l1', remainingAmount: 500 }],
    transactions: [{ id: 't1', amount: -20, apiKey: 'sk_test_123' }],
    bankAccounts: [{ id: 'b1', balance: 5000, accessToken: 'tok_123' }],
    goals: [],
    connectedInstitutions: [{ id: 'i1', providerId: 'revolut', sessionToken: 'abc' }],
    connectedAccounts: [],
    cryptoWallets: [{ id: 'w1', address: '0x123', privateKey: '0xabc', seedPhrase: 'word word word' }]
  };

  it('includes all expected financial data categories', () => {
    const bundle = prepareExportBundle(mockData);
    
    expect(bundle).toHaveProperty('profile');
    expect(bundle).toHaveProperty('assets');
    expect(bundle).toHaveProperty('liabilities');
    expect(bundle).toHaveProperty('transactions');
    expect(bundle).toHaveProperty('bankAccounts');
    expect(bundle).toHaveProperty('connectedInstitutions');
    expect(bundle).toHaveProperty('cryptoWallets');
    expect(bundle.exportedAt).toBeDefined();
  });

  it('sanitizes sensitive keys and credentials', () => {
    const bundle = prepareExportBundle(mockData);
    
    // Check root-level profile
    expect(bundle.profile).not.toHaveProperty('stripeCustomerId');
    
    // Check nested transaction data
    expect(bundle.transactions[0]).not.toHaveProperty('apiKey');
    
    // Check bank account tokens
    expect(bundle.bankAccounts[0]).not.toHaveProperty('accessToken');
    
    // Check institution session tokens
    expect(bundle.connectedInstitutions[0]).not.toHaveProperty('sessionToken');
    
    // Check crypto secrets
    expect(bundle.cryptoWallets[0]).not.toHaveProperty('privateKey');
    expect(bundle.cryptoWallets[0]).not.toHaveProperty('seedPhrase');
    
    // Ensure non-sensitive data remains
    expect(bundle.profile.email).toBe('test@example.com');
    expect(bundle.cryptoWallets[0].address).toBe('0x123');
  });

  it('returns null if input is missing', () => {
    expect(prepareExportBundle(null)).toBeNull();
  });
});
