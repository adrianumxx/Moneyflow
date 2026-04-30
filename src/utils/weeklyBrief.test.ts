import { describe, it, expect } from 'vitest';
import { generateWeeklyBrief } from './weeklyBrief';

describe('weeklyBrief engine', () => {
  it('returns sparse brief for empty data', () => {
    const brief = generateWeeklyBrief([], [], [], []);
    expect(brief.isSparse).toBe(true);
    expect(brief.dataQualityNote).toContain('Connect a bank');
  });

  it('generates spending note for transactions', () => {
    const now = new Date().toISOString();
    const transactions = [
      { id: '1', amount: 1000, type: 'expense', date: now, category: 'rent', description: 'Rent' }
    ];
    const brief = generateWeeklyBrief([], [], transactions as any, []);
    expect(brief.bullets).toContain('Spending was higher than income this week.');
    expect(brief.bullets).toContain('Review large transactions before your next sync.');
  });

  it('generates goal progress note', () => {
    const goals = [
      { id: '1', name: 'Savings', targetAmount: 1000, currentAmount: 100, category: 'safety' }
    ];
    const brief = generateWeeklyBrief([], [], [], goals as any);
    expect(brief.bullets).toContain('You are making progress on 1 active goal.');
  });

  it('never includes sensitive identifiers', () => {
    const transactions = [
        { id: 'confidential-id', amount: 100, type: 'expense', date: new Date().toISOString(), userId: 'secret-user' }
    ];
    const brief = generateWeeklyBrief([], [], transactions as any, []);
    const outputString = JSON.stringify(brief);
    expect(outputString).not.toContain('id');
    expect(outputString).not.toContain('userId');
  });
});
