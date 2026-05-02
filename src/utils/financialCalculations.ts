import { Asset, Liability, Transaction, BankAccount, CryptoWallet, InvestmentAccount } from '../types';

/**
 * Calculates total assets based on manual assets, bank accounts, crypto wallets, and investments.
 * Transactions are NOT included here to avoid double-counting.
 */
export const calculateTotalAssets = (
  assets: Asset[], 
  bankAccounts: BankAccount[],
  cryptoWallets: CryptoWallet[] = [],
  investmentAccounts: InvestmentAccount[] = []
): number => {
  const manualAssetsSum = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const bankBalancesSum = bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const cryptoBalancesSum = cryptoWallets.reduce((sum, wallet) => sum + (wallet.nativeBalance || 0), 0); // Assuming fiat conversion happens elsewhere or using fiatValue
  const investmentsSum = investmentAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  
  return manualAssetsSum + bankBalancesSum + cryptoBalancesSum + investmentsSum;
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
export const calculateNetWorth = (
  assets: Asset[], 
  bankAccounts: BankAccount[], 
  liabilities: Liability[],
  cryptoWallets: CryptoWallet[] = [],
  investmentAccounts: InvestmentAccount[] = []
): number => {
  return calculateTotalAssets(assets, bankAccounts, cryptoWallets, investmentAccounts) - calculateTotalLiabilities(liabilities);
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

/**
 * Level 3: Inflation Drag
 * Calculates monthly loss of purchasing power on liquid assets.
 * @param liquidAssets Cash + Bank balances + Stablecoins
 * @param inflationRate Annual inflation rate (default 2.5%)
 */
export const calculateInflationDrag = (liquidAssets: number, inflationRate: number = 2.5): number => {
  const annualLoss = liquidAssets * (inflationRate / 100);
  return annualLoss / 12;
};

/**
 * Level 3: Financial Runway
 * Calculates how many months the user can sustain their current lifestyle.
 * @param totalLiquidity Immediately accessible funds
 * @param monthlyExpenses Current burn rate
 */
export const calculateFinancialRunway = (totalLiquidity: number, monthlyExpenses: number): number => {
  if (monthlyExpenses <= 0) return 999; // Financial freedom state
  return totalLiquidity / monthlyExpenses;
};

/**
 * Level 3: Savings Efficiency
 * Calculates the percentage of income retained after all expenses.
 */
export const calculateSavingsRate = (monthlyIncome: number, monthlyExpenses: number): number => {
  if (monthlyIncome <= 0) return 0;
  const rate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  return Math.max(0, rate);
};

/**
 * Level 4: Scenario Engine
 * Projects wealth evolution over N years, factoring in current state and future events.
 */
export interface ProjectionData {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  events?: string[];
}

export const projectWealthEvolution = (
  initialNetWorth: number,
  monthlySavings: number,
  years: number,
  events: FutureEvent[] = [],
  annualGrowth: number = 4 // Default 4% growth
): ProjectionData[] => {
  const result: ProjectionData[] = [];
  let currentNetWorth = initialNetWorth;
  let currentMonthlySavings = monthlySavings;
  const monthlyGrowthRate = Math.pow(1 + annualGrowth / 100, 1 / 12) - 1;

  const now = new Date();

  for (let m = 0; m <= years * 12; m++) {
    const projectionDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const monthLabel = projectionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    // 1. Process Monthly Savings and Compounding
    if (m > 0) {
      currentNetWorth = currentNetWorth * (1 + monthlyGrowthRate) + currentMonthlySavings;
    }

    // 2. Process Specific Future Events
    const activeEvents = events.filter(e => {
      const eDate = e.date.toDate();
      return eDate.getMonth() === projectionDate.getMonth() && eDate.getFullYear() === projectionDate.getFullYear();
    });

    const eventLabels: string[] = [];
    activeEvents.forEach(e => {
      eventLabels.push(e.label);
      if (e.type === 'one_time_purchase') currentNetWorth -= e.amount;
      else if (e.type === 'one_time_income') currentNetWorth += e.amount;
      else if (e.type === 'recurring_income_change') currentMonthlySavings += e.amount;
      else if (e.type === 'recurring_expense_change') currentMonthlySavings -= e.amount;
    });

    result.push({
      month: monthLabel,
      netWorth: Math.max(0, currentNetWorth),
      assets: currentNetWorth, // Simplified for now
      liabilities: 0,
      events: eventLabels.length > 0 ? eventLabels : undefined
    });
  }

  return result;
};
