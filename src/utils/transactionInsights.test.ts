import { describe, it, expect } from 'vitest';
import { 
  summarizeMonthlySpending, 
  summarizeIncomeVsExpense, 
  detectLargeTransactions, 
  detectRecurringCandidates 
} from './transactionInsights';
import { Transaction } from '../types';

describe('transactionInsights', () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  const mockTransactions: any[] = [
    { id: '1', amount: -100, date: dateStr, description: 'Grocery', category: 'food' },
    { id: '2', amount: -100, date: dateStr, description: 'Grocery', category: 'food' },
    { id: '3', amount: 2000, date: dateStr, description: 'Salary', category: 'income' },
    { id: '4', amount: -600, date: dateStr, description: 'Rent', category: 'housing' },
    { id: '5', amount: -50, date: '2020-01-01', description: 'Old', category: 'other' },
  ];

  it('summarizes monthly spending correctly', () => {
    const spending = summarizeMonthlySpending(mockTransactions);
    expect(spending).toBe(800); // 100 + 100 + 600
  });

  it('summarizes income vs expense correctly', () => {
    const { income, expense, net } = summarizeIncomeVsExpense(mockTransactions);
    expect(income).toBe(2000);
    expect(expense).toBe(800);
    expect(net).toBe(1200);
  });

  it('detects large transactions correctly', () => {
    const large = detectLargeTransactions(mockTransactions, 500);
    expect(large.length).toBe(2); // Salary (2000) and Rent (-600)
    expect(large[0].description).toBe('Salary');
  });

  it('detects recurring candidates correctly', () => {
    const recurring = detectRecurringCandidates(mockTransactions);
    expect(recurring.length).toBe(1);
    expect(recurring[0].description).toBe('grocery');
    expect(recurring[0].count).toBe(2);
  });

  it('returns safe empty state for empty list', () => {
    expect(summarizeMonthlySpending([])).toBe(0);
    expect(summarizeIncomeVsExpense([]).net).toBe(0);
    expect(detectLargeTransactions([]).length).toBe(0);
    expect(detectRecurringCandidates([]).length).toBe(0);
  });
});
