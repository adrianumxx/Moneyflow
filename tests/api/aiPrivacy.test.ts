import { describe, it, expect } from 'vitest';
import { sanitizeUserContextForAI } from '../../server/aiPrivacy';

describe('AI Privacy Firewall', () => {
  const mockContext = {
    userProfile: {
      email: 'secret@example.com',
      fullName: 'John Doe',
      phone: '+123456789'
    },
    bankAccounts: [
      { institutionName: 'Bank A', balance: 1000, iban: 'BE123456789' }
    ],
    connectedAccounts: [
      { name: 'Bank B', balance: 500, providerAccountId: 'acc_sec_123' }
    ],
    transactions: [
      { description: 'Dinner with family at Italian Resto', amount: -50, type: 'expense' },
      { description: 'Salary March', amount: 3000, type: 'income' }
    ],
    assets: [
      { name: 'House', value: 250000 }
    ],
    liabilities: [
      { name: 'Mortgage', remainingAmount: 150000 }
    ]
  };

  it('redacts sensitive fields recursively', () => {
    const sanitized = sanitizeUserContextForAI(mockContext);
    
    expect(sanitized.userProfile.email).toBe('[REDACTED]');
    expect(sanitized.userProfile.fullName).toBe('[REDACTED]');
    expect(sanitized.bankAccounts[0].iban).toBe('[REDACTED]');
    expect(sanitized.connectedAccounts[0].providerAccountId).toBe('[REDACTED]');
  });

  it('redacts transaction descriptions', () => {
    const sanitized = sanitizeUserContextForAI(mockContext);
    expect(sanitized.transactions[0].description).toBe('[REDACTED_DESCRIPTION]');
  });

  it('calculates useful aggregates correctly', () => {
    const sanitized = sanitizeUserContextForAI(mockContext);
    
    expect(sanitized.aggregates.totalAssets).toBe(250000);
    expect(sanitized.aggregates.totalBankBalances).toBe(1000);
    expect(sanitized.aggregates.totalConnectedBalances).toBe(500);
    expect(sanitized.aggregates.totalLiabilities).toBe(150000);
    expect(sanitized.aggregates.monthlyIncome).toBe(3000);
    expect(sanitized.aggregates.monthlyExpenses).toBe(50);
    expect(sanitized.aggregates.monthlyCashFlow).toBe(2950);
  });

  it('preserves public non-sensitive signals', () => {
    const sanitized = sanitizeUserContextForAI(mockContext);
    expect(sanitized.bankAccounts[0].institutionName).toBe('Bank A');
  });
});
