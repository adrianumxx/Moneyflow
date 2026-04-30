import { describe, it, expect } from 'vitest';
import { assessGoalProgress, suggestGoalTemplates } from './goalInsights';
import { FinancialGoal } from '../types';

describe('goalInsights engine', () => {
  it('returns templates when requested', () => {
    const templates = suggestGoalTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].title).toBe('Emergency Fund');
  });

  it('calculates progress safely', () => {
    const goal: Partial<FinancialGoal> = {
      currentAmount: 500,
      targetAmount: 1000
    };
    const insight = assessGoalProgress(goal as any);
    expect(insight.progress).toBe(50);
    expect(insight.status).toBe('On track');
  });

  it('handles missing target amount', () => {
    const goal: Partial<FinancialGoal> = {
      currentAmount: 500,
      targetAmount: 0
    };
    const insight = assessGoalProgress(goal as any);
    expect(insight.status).toBe('More data needed');
    expect(insight.nextAction).toContain('Set a target');
  });

  it('detects behind schedule status', () => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000); // 50 days ago
    const deadline = new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000); // 50 days in future
    
    // Total 100 days, 50% elapsed. Progress 20% -> behind.
    const goal: Partial<FinancialGoal> = {
      currentAmount: 200,
      targetAmount: 1000,
      createdAt: createdAt.toISOString() as any,
      deadline: deadline.toISOString() as any
    };
    
    const insight = assessGoalProgress(goal as any);
    expect(insight.status).toBe('Needs attention');
    expect(insight.nextAction).toContain('Review your monthly contribution');
  });

  it('never leaks sensitive identifiers', () => {
    const goal: Partial<FinancialGoal> = {
        id: 'confidential-id',
        userId: 'secret-user',
        currentAmount: 100,
        targetAmount: 500
    };
    const result = assessGoalProgress(goal as any);
    const outputString = JSON.stringify(result);
    expect(outputString).not.toContain('id');
    expect(outputString).not.toContain('userId');
  });
});
