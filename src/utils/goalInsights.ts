import { FinancialGoal } from '../types';

export interface GoalInsight {
  status: 'On track' | 'Needs attention' | 'More data needed' | 'Complete';
  progress: number;
  nextAction: string;
}

export interface GoalTemplate {
  title: string;
  category: string;
  description: string;
}

export function assessGoalProgress(goal: FinancialGoal): GoalInsight {
  if (!goal.targetAmount || goal.targetAmount <= 0) {
    return {
      status: 'More data needed',
      progress: 0,
      nextAction: 'Set a target amount for this goal.'
    };
  }

  const progress = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
  
  if (progress >= 100) {
    return {
      status: 'Complete',
      progress: 100,
      nextAction: 'Goal achieved! Review your next priority.'
    };
  }

  // Simple "on track" logic: if target date is set and we're behind a linear path (simplified)
  let status: GoalInsight['status'] = 'On track';
  let nextAction = 'Continue your monthly contributions.';

  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const totalDays = (deadline.getTime() - new Date(goal.createdAt || now).getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - new Date(goal.createdAt || now).getTime()) / (1000 * 60 * 60 * 24);
    
    const expectedProgress = (elapsedDays / totalDays) * 100;
    
    if (now > deadline) {
      status = 'Needs attention';
      nextAction = 'Goal deadline passed. Review and adjust your target.';
    } else if (progress < expectedProgress - 10) {
      status = 'Needs attention';
      nextAction = 'Progress is behind schedule. Review your monthly contribution.';
    }
  }

  return { status, progress, nextAction };
}

export function suggestGoalTemplates(): GoalTemplate[] {
  return [
    {
      title: 'Emergency Fund',
      category: 'safety',
      description: 'Save 3-6 months of expenses for total peace of mind.'
    },
    {
      title: 'Home Deposit',
      category: 'property',
      description: 'Building the foundation for your future residence.'
    },
    {
      title: 'Investment Target',
      category: 'wealth',
      description: 'Allocate capital toward your long-term growth portfolio.'
    },
    {
      title: 'Major Purchase',
      category: 'lifestyle',
      description: 'Save for travel, a vehicle, or other significant lifestyle goals.'
    }
  ];
}
