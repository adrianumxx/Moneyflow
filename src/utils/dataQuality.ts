export interface DataQualityContext {
  assetsCount: number;
  liabilitiesCount: number;
  transactionsCount: number;
  bankAccountsCount: number;
  connectedAccountsCount: number;
  goalsCount: number;
  lastSyncedAt?: string | null;
  isDemo?: boolean;
}

export interface DataQualityResult {
  score: number;
  level: 'low' | 'fair' | 'good' | 'strong';
  summary: string;
  missingSignals: string[];
  recommendedNextStep: string;
  confidenceImpact: string;
}

export function assessDataQuality(ctx: DataQualityContext): DataQualityResult {
  let score = 0;
  const missingSignals: string[] = [];
  
  // 1. Foundation (Assets/Liabilities) - 30 pts
  if (ctx.assetsCount > 0) score += 20;
  else missingSignals.push('Asset baseline');
  
  if (ctx.liabilitiesCount > 0) score += 10;
  else missingSignals.push('Liability baseline');

  // 2. Activity (Transactions) - 30 pts
  if (ctx.transactionsCount >= 10) score += 30;
  else if (ctx.transactionsCount > 0) score += 15;
  else missingSignals.push('Recent transactions');

  // 3. Connectivity (Bank Sync) - 30 pts
  if (ctx.connectedAccountsCount > 0 || ctx.bankAccountsCount > 0) {
    score += 30;
    
    // Freshness check
    if (ctx.lastSyncedAt) {
      const lastSync = new Date(ctx.lastSyncedAt);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 48) {
        score -= 10; // Stale data penalty
        missingSignals.push('Fresh data sync');
      }
    }
  } else {
    missingSignals.push('Live bank connection');
  }

  // 4. Purpose (Goals) - 10 pts
  if (ctx.goalsCount > 0) score += 10;
  else missingSignals.push('Financial goals');

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  let level: DataQualityResult['level'] = 'low';
  if (score >= 80) level = 'strong';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';

  const summaries = {
    low: 'Your picture is just beginning. Adding more data will unlock clearer insights.',
    fair: 'Basic visibility established. Connect more sources to improve reliability.',
    good: 'Solid data foundation. Insights are reaching high reliability.',
    strong: 'Comprehensive picture. Your Moneyflow intelligence is operating at peak accuracy.'
  };

  const steps = {
    low: 'Add your first asset or liability',
    fair: 'Connect a bank account for live sync',
    good: 'Record recent transactions or set a goal',
    strong: 'Maintain regular sync for continuous intelligence'
  };

  const confidenceImpacts = {
    low: 'Low (limited context)',
    fair: 'Moderate (manual data)',
    good: 'High (connected data)',
    strong: 'Peak (full structural sync)'
  };

  return {
    score,
    level,
    summary: summaries[level],
    missingSignals: missingSignals.slice(0, 3),
    recommendedNextStep: steps[level],
    confidenceImpact: confidenceImpacts[level]
  };
}
