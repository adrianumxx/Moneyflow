import { describe, it, expect } from 'vitest';
import { assessDataQuality, DataQualityContext } from './dataQuality';

describe('dataQuality engine', () => {
  it('returns low quality for empty data', () => {
    const ctx: DataQualityContext = {
      assetsCount: 0,
      liabilitiesCount: 0,
      transactionsCount: 0,
      bankAccountsCount: 0,
      connectedAccountsCount: 0,
      goalsCount: 0
    };
    const result = assessDataQuality(ctx);
    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.missingSignals).toContain('Asset baseline');
  });

  it('returns fair quality for manual assets only', () => {
    const ctx: DataQualityContext = {
      assetsCount: 2,
      liabilitiesCount: 1,
      transactionsCount: 0,
      bankAccountsCount: 0,
      connectedAccountsCount: 0,
      goalsCount: 0
    };
    const result = assessDataQuality(ctx);
    expect(result.score).toBe(30);
    expect(result.level).toBe('low'); // Still low with only 30
    expect(result.missingSignals).toContain('Live bank connection');
  });

  it('returns good quality for connected accounts + transactions', () => {
    const ctx: DataQualityContext = {
      assetsCount: 2,
      liabilitiesCount: 1,
      transactionsCount: 15,
      bankAccountsCount: 1,
      connectedAccountsCount: 1,
      goalsCount: 1
    };
    const result = assessDataQuality(ctx);
    expect(result.score).toBe(100);
    expect(result.level).toBe('strong');
  });

  it('lowers quality for stale sync', () => {
    const staleDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(); // 72 hours ago
    const ctx: DataQualityContext = {
      assetsCount: 2,
      liabilitiesCount: 1,
      transactionsCount: 15,
      bankAccountsCount: 1,
      connectedAccountsCount: 1,
      goalsCount: 1,
      lastSyncedAt: staleDate
    };
    const result = assessDataQuality(ctx);
    expect(result.score).toBe(90); // 100 - 10 penalty
    expect(result.missingSignals).toContain('Fresh data sync');
  });

  it('never includes sensitive identifiers in output', () => {
    const result = assessDataQuality({
        assetsCount: 1,
        liabilitiesCount: 1,
        transactionsCount: 1,
        bankAccountsCount: 1,
        connectedAccountsCount: 1,
        goalsCount: 1
    });
    const outputString = JSON.stringify(result);
    expect(outputString).not.toContain('accountId');
    expect(outputString).not.toContain('uid');
    expect(outputString).not.toContain('userId');
  });
});
