/**
 * AI Privacy Firewall
 * Sanitizes user financial context by redacting PII and sensitive identifiers
 * while preserving aggregate financial signals for AI analysis.
 */

export function sanitizeUserContextForAI(userContext: any): any {
  if (!userContext) return null;

  // Deep clone to avoid mutating original context
  const sanitized = JSON.parse(JSON.stringify(userContext));

  const sensitiveKeys = [
    'email', 'phone', 'fullName', 'displayName', 'iban', 'accountNumber',
    'providerAccountId', 'requisitionId', 'agreementId', 'accessToken', 'refreshToken',
    'apiKey', 'secret', 'privateKey', 'seedPhrase', 'credentials', 'password',
    'walletAddress', 'address'
  ];

  const traverseAndSanitize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => traverseAndSanitize(item));
      } else if (typeof obj[key] === 'object') {
        traverseAndSanitize(obj[key]);
      }
    }
  };

  traverseAndSanitize(sanitized);

  // Redact potentially personal transaction descriptions
  if (sanitized.transactions && Array.isArray(sanitized.transactions)) {
    sanitized.transactions = sanitized.transactions.map((t: any) => ({
      ...t,
      description: '[REDACTED_DESCRIPTION]',
      originalDescription: undefined
    }));
  }

  // Create useful aggregates for the AI
  const assets = userContext.assets || [];
  const bankAccounts = userContext.bankAccounts || [];
  const connectedAccounts = userContext.connectedAccounts || [];
  const cryptoWallets = userContext.cryptoWallets || [];
  const liabilities = userContext.liabilities || [];
  const transactions = userContext.transactions || [];

  sanitized.aggregates = {
    totalAssets: assets.reduce((s: number, a: any) => s + (a.value || 0), 0),
    totalBankBalances: bankAccounts.reduce((s: number, b: any) => s + (b.balance || 0), 0),
    totalConnectedBalances: connectedAccounts.reduce((s: number, c: any) => s + (c.balance || 0), 0),
    totalCryptoValue: cryptoWallets.reduce((s: number, w: any) => s + (w.totalValue || w.estimatedValue || 0), 0),
    totalLiabilities: liabilities.reduce((s: number, l: any) => s + (l.remainingAmount || 0), 0),
    monthlyIncome: transactions.filter((t: any) => (t.type === 'income' || t.amount > 0)).reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0),
    monthlyExpenses: transactions.filter((t: any) => (t.type === 'expense' || t.amount < 0)).reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0),
    activeConnections: (bankAccounts.length + connectedAccounts.length)
  };
  
  sanitized.aggregates.monthlyCashFlow = sanitized.aggregates.monthlyIncome - sanitized.aggregates.monthlyExpenses;

  return sanitized;
}
