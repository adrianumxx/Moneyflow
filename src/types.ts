import { Timestamp } from 'firebase/firestore';

export type GroupType = 'personal' | 'household' | 'trip' | 'other';
export type SplitType = 'equal' | 'percentage' | 'exact';
export type MemberRole = 'admin' | 'member';
export type BudgetType = 'weekly' | 'monthly' | 'total';

export type AssetType = 'cash' | 'investment' | 'real_estate' | 'crypto' | 'savings' | 'retirement' | 'other';
export type LiabilityType = 'mortgage' | 'loan' | 'credit_card' | 'other';
export type GoalStatus = 'active' | 'completed' | 'on_hold';
export type TransactionCategory = 'housing' | 'food' | 'transport' | 'entertainment' | 'health' | 'shopping' | 'income' | 'other';

export type ConnectionStatus = 'demo' | 'sandbox' | 'connecting' | 'connected' | 'syncing' | 'failed' | 'needs_reauth' | 'disconnected';
export type DataSourceType = 'manual' | 'demo' | 'bank' | 'crypto_wallet' | 'broker' | 'investment' | 'custom_api' | 'import';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  currency?: string; // e.g., 'EUR', 'USD'
  monthlyIncomeTarget?: number;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  plan?: 'free' | 'premium';
  updatedAt?: Timestamp;
  hasCompletedOnboarding?: boolean;
  primaryGoal?: string;
  experienceLevel?: string;
  baseCurrency?: string;
  country?: string;
  taxResidence?: string;
  currencyExposure?: string[];
  financialMode?: 'defensive' | 'balanced' | 'growth' | 'aggressive';
  incomeType?: 'fixed_salary' | 'freelance' | 'business' | 'passive' | 'mixed' | 'unknown';
  employmentStatus?: 'employee' | 'self_employed' | 'business_owner' | 'student' | 'unemployed' | 'retired' | 'unknown';
  riskTolerance?: number; // 1-10
  investmentExperience?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'unknown';
  liquidityNeed?: 'low' | 'medium' | 'high' | 'unknown';
  monthlyFixedCostsEstimate?: number;
  onboardingCompletedAt?: Timestamp;
  language?: string;
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
  currency?: string;
  createdAt: Timestamp;
}

export interface BankAccount {
  id: string;
  institutionName: string;
  accountName: string;
  balance: number;
  currency: string;
  lastSynced: Timestamp;
  // Production extension fields
  ownerId?: string;
  institutionId?: string;
  providerId?: string;
  providerAccountId?: string;
  status?: ConnectionStatus;
  source?: DataSourceType;
  isManual?: boolean;
  isDemo?: boolean;
  lastSyncedAt?: Timestamp;
}

export interface ConnectedInstitution {
  id: string;
  ownerId: string;
  providerId: string;
  providerName: string;
  providerType: DataSourceType;
  status: ConnectionStatus;
  country?: string;
  baseCurrency?: string;
  lastSyncedAt?: Timestamp;
  consentExpiresAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isDemo?: boolean;
  errorMessage?: string;
}

export interface ConnectedAccount {
  id: string;
  ownerId: string;
  institutionId: string;
  providerId: string;
  providerAccountId?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: ConnectionStatus;
  lastSyncedAt?: Timestamp;
  isManual?: boolean;
  isDemo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CryptoWallet {
  id: string;
  ownerId: string;
  address: string;
  chain: string;
  label?: string;
  nativeBalance?: number;
  fiatValue?: number;
  currency?: string;
  lastSyncedAt?: Timestamp;
  status: ConnectionStatus;
  isDemo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface InvestmentAccount {
  id: string;
  ownerId: string;
  institutionId?: string;
  providerId?: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: ConnectionStatus;
  lastSyncedAt?: Timestamp;
  isDemo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  institution?: string; // Bank name or "Manual"
  annualReturn?: number; // Expected yearly growth (%)
  updatedAt: Timestamp;
  createdAt: Timestamp;
  currency?: string;
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
  currency?: string;
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

export interface SplitDetail {
  userId: string;
  amount: number;
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
  splits?: SplitDetail[];
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
