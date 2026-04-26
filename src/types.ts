import { Timestamp } from 'firebase/firestore';

export type GroupType = 'personal' | 'household' | 'trip' | 'other';
export type SplitType = 'equal' | 'percentage' | 'exact';
export type MemberRole = 'admin' | 'member';
export type BudgetType = 'weekly' | 'monthly' | 'total';

export type AssetType = 'cash' | 'investment' | 'real_estate' | 'crypto' | 'savings' | 'retirement' | 'other';
export type LiabilityType = 'mortgage' | 'loan' | 'credit_card' | 'other';
export type GoalStatus = 'active' | 'completed' | 'on_hold';
export type TransactionCategory = 'housing' | 'food' | 'transport' | 'entertainment' | 'health' | 'shopping' | 'income' | 'other';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  currency?: string; // e.g., 'EUR', 'USD'
  monthlyIncomeTarget?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: Timestamp;
  bankAccountId?: string;
  isRecurring: boolean;
  type: 'expense' | 'income';
}

export interface BankAccount {
  id: string;
  institutionName: string;
  accountName: string;
  balance: number;
  currency: string;
  lastSynced: Timestamp;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  institution?: string; // Bank name or "Manual"
  updatedAt: Timestamp;
  createdAt: Timestamp;
  notes?: string;
  color?: string; // For UI visualization
}

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  monthlyPayment?: number;
  dueDate?: Timestamp;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  category: 'salary' | 'investment' | 'rental' | 'other';
  date: Timestamp;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Timestamp;
  status: GoalStatus;
  category: 'savings' | 'purchase' | 'investment' | 'retirement';
  createdAt: Timestamp;
}

export interface AIInsight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  createdAt: Timestamp;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
  type: GroupType;
  memberIds: string[];
  maxBudget?: number;
  budgetType?: BudgetType;
}

export interface GroupMember {
  uid: string;
  role: MemberRole;
  joinedAt: Timestamp;
  displayName?: string;
  email?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  paidBy: string; // userId
  date: Timestamp;
  createdAt: Timestamp;
  splitType: SplitType;
}

export const CATEGORIES = [
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Entertainment',
  'Shopping',
  'Health',
  'Travel',
  'Other'
];
