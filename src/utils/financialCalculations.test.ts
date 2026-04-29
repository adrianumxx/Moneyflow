import { describe, it, expect } from 'vitest';
import { 
  calculateTotalAssets, 
  calculateTotalLiabilities, 
  calculateNetWorth, 
  calculateCashFlow 
} from './financialCalculations';
import { Timestamp } from 'firebase/firestore';

describe('Financial Calculations', () => {
  const mockTimestamp = { toDate: () => new Date() } as Timestamp;

  describe('calculateTotalAssets', () => {
    it('sums manual assets and bank balances', () => {
      const assets: any[] = [{ value: 1000 }, { value: 500 }];
      const bankAccounts: any[] = [{ balance: 2000 }, { balance: 300 }];
      expect(calculateTotalAssets(assets, bankAccounts)).toBe(3800);
    });

    it('handles missing values by defaulting to 0', () => {
      const assets: any[] = [{ value: undefined }];
      const bankAccounts: any[] = [{}];
      expect(calculateTotalAssets(assets, bankAccounts)).toBe(0);
    });
  });

  describe('calculateTotalLiabilities', () => {
    it('sums remaining amounts of liabilities', () => {
      const liabilities: any[] = [{ remainingAmount: 5000 }, { remainingAmount: 200 }];
      expect(calculateTotalLiabilities(liabilities)).toBe(5200);
    });
  });

  describe('calculateNetWorth', () => {
    it('correctly calculates assets - liabilities', () => {
      const assets: any[] = [{ value: 10000 }];
      const bankAccounts: any[] = [{ balance: 5000 }];
      const liabilities: any[] = [{ remainingAmount: 3000 }];
      expect(calculateNetWorth(assets, bankAccounts, liabilities)).toBe(12000);
    });

    it('is not affected by transactions directly', () => {
      // Net worth in this app is a snapshot of current balances, not a ledger sum
      const assets: any[] = [{ value: 1000 }];
      const bankAccounts: any[] = [{ balance: 500 }];
      const liabilities: any[] = [];
      const initialNetWorth = calculateNetWorth(assets, bankAccounts, liabilities);
      
      // Even if many transactions exist, calculateNetWorth ignores them
      expect(initialNetWorth).toBe(1500);
    });
  });

  describe('calculateCashFlow', () => {
    it('sums transaction amounts', () => {
      const transactions: any[] = [
        { amount: 500, date: mockTimestamp },
        { amount: -200, date: mockTimestamp }
      ];
      expect(calculateCashFlow(transactions)).toBe(300);
    });

    it('filters by days if provided', () => {
      const today = new Date();
      const halfDayAgo = new Date();
      halfDayAgo.setHours(today.getHours() - 12);
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 10);

      const transactions: any[] = [
        { amount: 100, date: { toDate: () => halfDayAgo } },
        { amount: 500, date: { toDate: () => lastWeek } }
      ];

      // Only halfDayAgo should count if days=1
      expect(calculateCashFlow(transactions, 1)).toBe(100);
      // Both should count if days=30
      expect(calculateCashFlow(transactions, 30)).toBe(600);
    });
  });
});
