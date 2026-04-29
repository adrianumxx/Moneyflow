import { Asset, Liability, Transaction, BankAccount } from '../types';

/**
 * Calculates total assets based on manual assets and connected bank accounts.
 * Transactions are NOT included here to avoid double-counting.
 */
export const calculateTotalAssets = (assets: Asset[], bankAccounts: BankAccount[]): number => {
  const manualAssetsSum = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const bankBalancesSum = bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  return manualAssetsSum + bankBalancesSum;
};

/**
 * Calculates total liabilities.
 */
export const calculateTotalLiabilities = (liabilities: Liability[]): number => {
  return liabilities.reduce((sum, liability) => sum + (liability.remainingAmount || 0), 0);
};

/**
 * Calculates Net Worth: Total Assets - Total Liabilities.
 */
export const calculateNetWorth = (assets: Asset[], bankAccounts: BankAccount[], liabilities: Liability[]): number => {
  return calculateTotalAssets(assets, bankAccounts) - calculateTotalLiabilities(liabilities);
};

/**
 * Calculates total cash flow (Net Flow) from transactions over a specific period.
 */
export const calculateCashFlow = (transactions: Transaction[], days?: number): number => {
  const filtered = days 
    ? transactions.filter(tx => {
        const txDate = tx.date instanceof Date ? tx.date : tx.date.toDate();
        const diff = (new Date().getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= days;
      })
    : transactions;

  return filtered.reduce((sum, tx) => sum + (tx.amount || 0), 0);
};

/**
 * Calculates monthly income from transactions.
 */
export const calculateMonthlyIncome = (transactions: Transaction[]): number => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return transactions
    .filter(tx => tx.type === 'income' && (tx.date instanceof Date ? tx.date : tx.date.toDate()) > thirtyDaysAgo)
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
};

/**
 * Calculates monthly expenses from transactions and recurring debt payments.
 */
export const calculateMonthlyExpenses = (transactions: Transaction[], liabilities: Liability[] = []): number => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const realExpenses = transactions
    .filter(tx => tx.type === 'expense' && (tx.date instanceof Date ? tx.date : tx.date.toDate()) > thirtyDaysAgo)
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  const monthlyDebtPayments = liabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0);

  return realExpenses + monthlyDebtPayments;
};
