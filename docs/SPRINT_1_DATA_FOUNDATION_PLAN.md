# Sprint 1: Data Foundation & Firestore Integrity

## Goal
Establish a professional, reliable, and consistent financial data layer. Before optimizing the Neural Core (Palantir), we must ensure that the numbers being analyzed are accurate, non-inflated, and correctly scoped.

## User Review Required
> [!IMPORTANT]
> **Net Worth Inflation Bug**: The current logic adds "Total Transaction Flow" to current Assets. If you have €10,000 in a bank account and receive a €1,000 salary transaction, the app currently reports your assets as €11,000. We must fix this by decoupling Transactions (Cash Flow) from Balance Tracking (Net Worth).

---

## 1. Data Model Audit

### 1.1 UserProfile / Financial Profile
**Current State**: Basic fields (uid, email, displayName) plus basic onboarding info (country, goal).
**Missing Critical Fields**:
- `taxResidence`: Required for tax optimization advice.
- `currencyExposure`: List of currencies the user holds.
- `financialMode`: e.g., 'aggressive_growth', 'preservation', 'debt_reduction'.
- `incomeType`: e.g., 'fixed_salary', 'freelance', 'passive'.
- `riskTolerance`: 1-10 scale.
- `monthlyFixedCostsEstimate`: For runway calculation.
- `onboardingCompletedAt`: Tracking for analytics.

**Proposed Change**: Consolidate `currency` and `baseCurrency` into a single `baseCurrency` field.

### 1.2 Assets
**Current State**: Lacks `ownerId` in the TypeScript interface. No distinction between "Manual" and "Synced" sources.
**Audit Findings**:
- Value is a raw number without currency context (assumed EUR).
- No `lastSynced` field for connected accounts.
- `institution` field is optional but should be structured.

### 1.3 Liabilities
**Current State**: `interestRate` and `monthlyPayment` are optional.
**Audit Findings**:
- Missing `currency`.
- Missing `lender` field for better Palantir analysis.
- Interest rates are critical for "Potential Efficiency Gap" (Arbitrage) analysis.

### 1.4 Transactions
**Current State**: Being incorrectly used to calculate Net Worth.
**Audit Findings**:
- `amount` sign convention is inconsistent.
- Missing `accountId` link in many cases.
- `category` list is limited and hardcoded in `types.ts`.

---

## 2. Financial Logic Audit

### 2.1 Net Worth Calculation
**The Bug**:
```typescript
const totalAssets = assets.reduce((sum, a) => sum + a.value, 0) + totalBankBalance + totalTransactionFlow;
```
Adding `totalTransactionFlow` to assets results in **double-counting**.

**Correct Formula**:
`Net Worth = SUM(Manual Assets) + SUM(Connected Account Balances) - SUM(Liabilities)`

**Cash Flow Formula (Separate)**:
`Monthly Savings = Monthly Income - Monthly Expenses`

### 2.2 Currency System
**Audit Findings**: 
- `€` and `EUR` are hardcoded in `WealthOverview.tsx`, `Dashboard.tsx`, `AddAssetModal.tsx`, etc.
- No central utility to format money based on user preference.

---

## 3. App.tsx Data Flow Audit

**Issues Identified**:
- **Memory Leaks**: `onSnapshot` listeners are never unsubscribed. They persist after logout.
- **Race Conditions**: If a user logs out and logs in quickly as someone else, old listeners might still be pushing data.
- **Complexity**: `App.tsx` is >1500 lines. The data fetching logic is buried in a giant `useEffect`.

---

## 4. Implementation Plan

### Sprint 1 - [x] Part 2: Money Formatting and Currency Consistency
- **Files**: `src/utils/format.ts`, `src/types.ts`
- **Tasks**:
  - Create `formatMoney(amount, currency, locale)` utility.
  - Add `currency` field to `Asset`, `Liability`, and `Transaction` interfaces.
  - Replace all hardcoded `€` symbols with `formatMoney` calls.
- **Acceptance Criteria**: All UI elements show currency based on `userProfile.baseCurrency`.

### Sprint 1 - [x] Part 3: Net Worth and Cash Flow Formula Correction
- **Files**: `src/components/WealthOverview.tsx`, `src/components/Dashboard.tsx`
- **Tasks**:
  - Remove `totalTransactionFlow` from the net worth sum.
  - Implement a dedicated `CashFlow` component or section that uses transactions.
  - Fix sign convention for transaction amounts.
- **Acceptance Criteria**: Net worth matches the sum of balances, not the history of transactions.

### Sprint 1 - [x] Part 4: UserProfile / FinancialProfile Extension
- **Files**: `src/types.ts`, `src/components/MagicOnboarding.tsx`
- **Tasks**:
  - Add missing fields to `UserProfile` type.
  - Update onboarding to collect `taxResidence` and `monthlyFixedCosts`.
  - Ensure all writes include `updatedAt`.
- **Acceptance Criteria**: User profile contains enough metadata for advanced AI advice.

### Sprint 1 - [x] Part 5: App.tsx Listener Cleanup & Data Layer Hook
- **Files**: `src/hooks/useFinancialData.ts` [NEW], `src/App.tsx`
- **Tasks**:
  - Extract all Firestore listeners into a custom hook.
  - Implement `unsubscribe()` calls in a cleanup function.
  - Ensure data is cleared on logout.
- **Acceptance Criteria**: No ghost listeners after logout. `App.tsx` size reduced.

---

## 5. What NOT to touch in Sprint 1
- **DO NOT** change `geminiRoutes.ts` logic.
- **DO NOT** implement real Plaid/Ponto connectors.
- **DO NOT** redesign the Palantir UI.
- **DO NOT** modify Stripe pricing or checkout flow.

## 6. Verification Plan
- **Automated**: `npm run build` and `npm run lint`.
- **Manual**:
  - Add an asset and check if it reflects correctly in net worth.
  - Add a transaction and check if it **only** reflects in cash flow, not net worth.
  - Log out and log in to ensure no data from the previous session is visible.
