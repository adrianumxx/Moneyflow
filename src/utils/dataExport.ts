/**
 * Data Export Utility
 * Handles sanitization and preparation of user financial data for portability archives.
 */

export const prepareExportBundle = (exportData: any) => {
  if (!exportData) return null;
  
  // 1. Structural grouping
  const bundle = {
    exportedAt: new Date().toISOString(),
    profile: exportData.userProfile,
    assets: exportData.assets,
    liabilities: exportData.liabilities,
    transactions: exportData.transactions,
    bankAccounts: exportData.bankAccounts,
    goals: exportData.goals,
    insights: exportData.insights,
    groups: exportData.groups?.filter((g: any) => g.ownerId === exportData.userProfile?.uid || g.createdBy === exportData.userProfile?.uid),
    connectedInstitutions: exportData.connectedInstitutions,
    connectedAccounts: exportData.connectedAccounts,
    cryptoWallets: exportData.cryptoWallets
  };

  // 2. Sensitive data sanitization
  const SENSITIVE_KEYS = [
    'accessToken', 'refreshToken', 'apiKey', 'privateKey', 
    'seedPhrase', 'credentials', 'password', 'token', 
    'stripeCustomerId', 'sessionToken', 'secret', 'clientSecret'
  ];

  const sanitize = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    
    // Handle Timestamps or Dates
    if (obj instanceof Date) return obj.toISOString();
    if (obj.toDate && typeof obj.toDate === 'function') {
      return obj.toDate().toISOString();
    }

    if (Array.isArray(obj)) return obj.map(sanitize);
    
    return Object.keys(obj).reduce((acc: any, key) => {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k.toLowerCase()));
      
      if (isSensitive) {
        return acc; // Skip sensitive keys
      }
      
      acc[key] = sanitize(obj[key]);
      return acc;
    }, {});
  };

  return sanitize(bundle);
};
