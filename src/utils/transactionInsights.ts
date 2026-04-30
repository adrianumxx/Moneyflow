import { Transaction } from '../types';

export interface TransactionSummary {
  monthlySpending: number;
  monthlyIncome: number;
  netCashFlow: number;
  largeTransactions: Transaction[];
  recurringCandidates: Array<{ description: string; amount: number; count: number }>;
}

export function summarizeMonthlySpending(transactions: Transaction[]): number {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return transactions
    .filter(t => {
      const d = new Date(t.date || t.bookingDate || '');
      return d >= startOfMonth && (t.amount || 0) < 0;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
}

export function summarizeIncomeVsExpense(transactions: Transaction[]): { income: number; expense: number; net: number } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date || t.bookingDate || '');
    return d >= startOfMonth;
  });

  const income = currentMonthTxs
    .filter(t => (t.amount || 0) > 0)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
    
  const expense = currentMonthTxs
    .filter(t => (t.amount || 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  return { income, expense, net: income - expense };
}

export function detectLargeTransactions(transactions: Transaction[], threshold: number = 500): Transaction[] {
  // Return transactions larger than threshold from the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return transactions
    .filter(t => {
      const d = new Date(t.date || t.bookingDate || '');
      return d >= thirtyDaysAgo && Math.abs(t.amount || 0) >= threshold;
    })
    .sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0))
    .slice(0, 5);
}

export function detectRecurringCandidates(transactions: Transaction[]): Array<{ description: string; amount: number; count: number }> {
  const groups: Record<string, { amount: number; dates: Date[] }> = {};
  
  transactions.forEach(t => {
    if (!t.description || (t.amount || 0) >= 0) return;
    
    const key = `${t.description.toLowerCase().trim()}_${Math.abs(t.amount || 0)}`;
    if (!groups[key]) {
      groups[key] = { amount: Math.abs(t.amount || 0), dates: [] };
    }
    groups[key].dates.push(new Date(t.date || t.bookingDate || ''));
  });

  return Object.entries(groups)
    .filter(([_, data]) => data.dates.length >= 2)
    .map(([key, data]) => ({
      description: key.split('_')[0],
      amount: data.amount,
      count: data.dates.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export function getTransactionIntelligence(transactions: Transaction[]): TransactionSummary {
  const summary = summarizeIncomeVsExpense(transactions);
  return {
    monthlySpending: summary.expense,
    monthlyIncome: summary.income,
    netCashFlow: summary.net,
    largeTransactions: detectLargeTransactions(transactions),
    recurringCandidates: detectRecurringCandidates(transactions)
  };
}
