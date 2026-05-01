# Moneyflow Master Blueprint V1

**Status:** FINAL SPECIFICATION  
**Version:** 1.0  
**Category:** Personal Wealth Intelligence Platform  
**Date:** 2026-05-01  

---

## 1. Product Essence

- **One sentence:** A Personal Wealth Intelligence Platform for everyone, from simple money tracking to global signal awareness.
- **One paragraph:** Moneyflow is designed for a broad consumer audience, offering a simple "understand your money in one place" entry point. It progressively reveals depth for power users, families, and professionals—integrating bank sync, shared group expenses, and "Palantir" geopolitical intelligence signals to help users orient themselves in a complex economy.
- **Investor-style positioning:** Moneyflow is a mass-market Wealth Intelligence Platform. We capture the broad consumer base with extreme simplicity, while providing a high-ceiling upgrade path for investors, freelancers, and enterprise users through progressive feature depth and intelligence layers.
- **User-facing positioning:** "Understand your money in one place." (Mass Market) / "Orient your financial decisions with global intelligence." (Advanced).
- **Internal team positioning:** We build for the "normal person" first. We hide complexity until it's needed, ensuring the entry experience is as simple as a budgeting app, while the engine is as powerful as a family office dashboard.

---

## 2. Core Product Formula

**User Financial Data + Connected Account Data + Manual Inputs + Group Money Data + External Global Signals = Personal Wealth Intelligence**

- **User Financial Data:** The fundamental identity, profile, and preferences of the user.
- **Connected Account Data:** Live read-only feeds from banks, brokers, and exchanges (The "Real-Time Fact").
- **Manual Inputs:** Assets that can't be synced—real estate, physical gold, private loans, or cash (The "Full Picture").
- **Group Money Data:** Shared life expenses, travel, and household costs (The "Social Financial Context").
- **External Global Signals:** Macro trends, geopolitical risks, and market shifts (The "World Context").
- **Result:** Intelligence that allows a user to say: *"I know exactly what I have, and I understand how the current world affects it."*

---

## 3. Core Pillars

### 1. Financial Profile
- **User Problem:** Fragmented view of total net worth across different categories.
- **Product Promise:** A single source of truth for your entire financial identity.
- **Data Used:** Assets, liabilities, income, goals, net worth history.
- **Core Features:** Wealth dashboard, net worth trend, category distribution.
- **Risk Level:** Low.
- **Monetization:** Free / Entry Tier.
- **Client-ready Requirements:** Accurate calculations, basic privacy controls.

### 2. Sync Connector
- **User Problem:** Manually updating transactions is tedious and error-prone.
- **Product Promise:** Set it and forget it. Your data is always fresh and ready.
- **Data Used:** Bank accounts, transactions, balances, metadata.
- **Core Features:** GoCardless integration, automated categorization.
- **Risk Level:** High (Data integrity/privacy).
- **Monetization:** Premium Tier.
- **Client-ready Requirements:** Duplicate detection, secure token storage.

### 3. Manual + Smart Inputs
- **User Problem:** Not everything is in a bank (Real estate, crypto wallets, private loans).
- **Product Promise:** No gaps in your wealth map.
- **Data Used:** Manual entries, property values, loan schedules.
- **Core Features:** Asset/Liability ledger, upcoming expense detection.
- **Risk Level:** Low.
- **Monetization:** Free / Premium (Unlimited).
- **Client-ready Requirements:** Clean UI, deletion verification.

### 4. Groups / Shared Expenses
- **User Problem:** Managing shared costs (Tricount-style) is disconnected from personal tracking.
- **Product Promise:** Settle up and stay friends, while your share is tracked in your main wealth view.
- **Data Used:** Group expenses, member balances, settlement records.
- **Core Features:** Split logic, debt simplification, settlement history.
- **Risk Level:** Medium (Cross-user privacy).
- **Monetization:** Group/Family Plan.
- **Client-ready Requirements:** Robust Firestore rules, "Exit Group" logic.

### 5. Palantir / Global Intelligence
- **User Problem:** News is noise; users don't know how a news headline impacts *their* money.
- **Product Promise:** We filter the world's noise into signals that matter for your specific profile.
- **Data Used:** News APIs, Market data, Gemini AI, User Profile context.
- **Core Features:** 11 Relevant Signals, Source grounding, Impact mapping.
- **Risk Level:** High (Hallucination/Regulatory).
- **Monetization:** Premium/Pro Tier.
- **Client-ready Requirements:** Hallucination guards, mandatory disclaimers, real-data grounding.

---

## 4. Financial Profile Scope

| Entity | Purpose | Source | Validation Needed | Risk | Client-ready condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bank Accounts** | Liquid cash monitoring | Sync / Manual | Balance vs Sum of TXs | Medium | Real-time sync success |
| **Transactions** | Cashflow analysis | Sync / Manual | Deduplication | Medium | Correct categorization |
| **Assets** | Wealth growth | Manual / Sync | Value freshness | Low | Delete verification |
| **Liabilities** | Debt management | Manual | Interest/Repayment | Medium | Clear "Net" view |
| **Real Estate** | High-value tracking | Manual | Market valuation | Low | Address/Ref. storage |
| **Crypto Wallets** | Exposure monitoring | Sync / Manual | Price volatility | High | Address validation |
| **Investments** | Growth/Risk | Sync / Manual | Allocation % | High | Clear risk warnings |
| **Goals** | Psychological motivation| User Input | Progress % | Low | "Target Date" logic |

---

## 5. Data Input Sources

| Input Source | Data Type | Provider/Mechanism | Trust Risk | Required Safeguards |
| :--- | :--- | :--- | :--- | :--- |
| **Manual Entry** | All | UI Forms | Low | Confirmation modals |
| **Bank Sync** | Balances/TXs | GoCardless | High | OAuth/Token encryption |
| **Crypto Sync** | Balances | Public API / Keys | High | Read-only API keys |
| **Group Input** | Shared TXs | Peer users | Medium | Cross-user DB isolation |
| **AI Assisted** | Categories | Gemini/Neural | Medium | User override/Correction |

---

## 6. Sync Connector Definition

**Read-Only Core Infrastructure:**
- **Access Level:** Strictly read-only. No payments, no transfers.
- **Provider States:** `connected`, `syncing`, `disconnected`, `error`, `expired`.
- **Token Safety:** Encryption-at-rest. No tokens returned to client UI.
- **Behavior:**
  - Automated deduplication using `providerTransactionId`.
  - Last synced timestamp visible to user.
  - Graceful failure with "Reconnect" prompt if token expires (90-day rule).
- **Readiness Criteria:**
  - **MVB (Minimum Viable):** Manual CSV import + Sandbox GoCardless.
  - **Production:** Live GoCardless + Automated daily sync + Error retry logic.

---

## 7. Manual + Smart Inputs

Manual inputs are the "Connectors to Reality" for non-digital assets.
- **Strategy:** Allow users to bridge the gap between their bank accounts and their actual life.
- **Features:**
  - **Expected Expenses:** Predict future outgoings (Rent, Taxes) to show "Safe-to-Spend" balance.
  - **Custom Focus:** Tag specific assets for "Daily Monitoring" by Palantir.
  - **Manual Overrides:** Fix AI categorization errors to train the local model.

---

## 8. Groups / Shared Expenses

**"Tricount within a Wealth OS"**
- **Core Logic:** Split-by-share or Split-equally.
- **Settlement:** Simplified debt calculation (A owes B who owes C -> A owes C).
- **Privacy:** Group members see *group* data but never each other's *personal* wealth data.
- **Security:** Firestore rules must enforce `memberIds` array-contains checks for all group subcollections.

---

## 9. Palantir / Global Intelligence Layer

**The Hero Feature: Mapping World Complexity to Personal Wealth.**
- **Purpose:** Analyze external global signals and map them to the user’s financial profile.
- **Consumer Positioning:** "Cosa potrebbe influenzare i tuoi soldi questa settimana?" (What could influence your money this week?).
- **Inputs:** Google GenAI (Gemini) grounded in news/macro data.
- **Outputs:** The "11 Signals" report tailored to the user's Assets/Liabilities/Geography.
- **Safety Boundary:** Palantir provides **Information and Orientation**, not **Advice**. It is an awareness tool, not a command system.

---

## 10. Palantir “11 Signals” Schema

| Field | Type | Constraint |
| :--- | :--- | :--- |
| `id` | UUID | Unique |
| `title` | String | Short, non-alarmist |
| `category` | Enum | [Macro, Market, Tech, Regulatory, Geopolitical] |
| `summary` | String | Max 200 chars |
| `why_it_matters` | String | Clear explanation |
| `possible_impact` | String | Contextualized to user profile |
| `affected_areas` | Array | e.g. ["Savings", "Tech Stocks", "Real Estate"] |
| `confidence` | Float | 0.0 to 1.0 |
| `source_urls` | Array | Verified clickable links |
| `safe_action` | Enum | [monitor, review, compare, discuss_with_pro] |
| `disclaimer` | String | Mandatory "Not Financial Advice" |

**Forbidden Actions:** `buy`, `sell`, `short`, `leverage`.

---

## 11. Intelligence and Analysis Capabilities

| Capability | Data Required | AI Needed? | Beta Scope |
| :--- | :--- | :--- | :--- |
| **Excessive Spending** | Transaction history | Yes (Pattern) | Phase 2 |
| **Upcoming Detection** | Recurring history | Deterministic | **Phase 1** |
| **Macro Mapping** | News + Portfolio | Yes (Gemini) | **Phase 1 (Limited)** |
| **Debt Pressure** | Liabilities + Income | Deterministic | **Phase 1** |
| **Liquidity Stress** | Cash vs Expenses | Deterministic | **Phase 1** |

---

## 12. AI Safety and Compliance Rules

- **Golden Rule:** Never use the word "Should" (e.g., "You should buy gold"). Use "Could affect" or "May impact".
- **Sanitization:** All context sent to AI must pass `aiPrivacy` (redact Names, IBANs, specific balances -> use $10k-$20k ranges).
- **Verbiage:**
  - **Approved:** "This signal is relevant because...", "Consider reviewing...", "Compare with...".
  - **Forbidden:** "I recommend...", "The best strategy is...", "Guaranteed profit...".

---

## 13. User Journey

1. **Visitor:** Landing -> Interactive Demo (No Login) -> High-Trust Pitch.
2. **Onboarding:** Auth -> Geography Setup -> Risk Profile -> Financial Focus Selection.
3. **Daily Use:** Dashboard -> New Transaction Alert -> Palantir Pulse Check.
4. **Social:** Split dinner expense -> Auto-update "Personal Share" in Ledger.

---

## 14. Client-Ready Minimum Cut

| Visibility | Features |
| :--- | :--- |
| **Keep Visible** | Landing, Auth, Manual Ledger, Profile, Goals, Demo. |
| **Safe After Fix** | Stripe, AI Advisor (Basic), Export/Delete. |
| **Internal Only** | GoCardless (Live), Palantir (Live), PDF Reports. |
| **Hide Immediately** | Unverified Market Signals, Crypto Sync (Beta). |

---

## 15. Monetization Model

- **Free (Personal Lite):** Mass-market entry. Manual tracking, Basic Dashboard, 1 Group.
- **Premium (Wealth Intelligence):** Automated Sync, Palantir Awareness, Unlimited Groups.
- **Pro (Wealth OS):** Portfolio analysis, Custom signals, CSV/Data export. Targeted at investors and freelancers.
- **Future (Enterprise/Family Office):** Multi-user, multi-currency, advanced risk modeling.

---

## 16. Trust Layer

Moneyflow is a **Read-Only Vault**.
- Transparency: "Why am I seeing this signal?" (Show the data source).
- Control: "Delete my data" must be a one-click irreversible action.
- Neutrality: No affiliate links for financial products (Prevents conflict of interest).

---

## 17. Compliance-Safe Positioning

- **Simple Entry (Mass Market):** "Understand your money in one place."
- **Landing Page (Italian):** "Capisci i tuoi soldi in una sola vista."
- **Advanced Positioning:** "Unifica patrimonio, gruppi e segnali globali per orientare le tue decisioni finanziarie."
- **Palantir Simple Promise:** "Cosa potrebbe influenzare i tuoi soldi questa settimana?"
- **Approved Taglines:** "Your orientation engine for a complex economy", "Your personal wealth intelligence".
- **Forbidden:** "The best way to invest", "Guaranteed profit", "Trading command system", "Beat the market with AI".

---

## 18. Roadmap Implications

| Sprint | Priority | Objective | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **1. Auth & Admin** | P0 | Fix hardcoded admin rules & Prod Auth | No admin email in rules; Vercel login works. |
| **2. Payment Safety**| P0 | Webhook signature & test suite | 100% test coverage for Stripe routes. |
| **3. Privacy & Data** | P1 | Recursive delete & Export proof | One-click delete verified in Firestore. |
| **4. Palantir Gating**| P1 | Implement "Signal Schema" & Gating | Palantir shows only grounded signals. |
| **5. Banking Hardening**| P1 | Sync deduplication & error handling | No duplicate transactions after multiple syncs. |

---

## 19. Success Metrics

- **Activation:** User adds first manual asset or connects first bank.
- **Stickiness:** Weekly review of Palantir signals.
- **Trust:** <1% account deletion rate in first 30 days.
- **Conversion:** % of demo users who create a real account.

---

## 20. Open Questions

1. **Jurisdiction:** Initial launch focus (EU/UK due to GoCardless/GDPR)?
2. **Pricing:** $9.99/mo or $99/yr?
3. **Groups:** Should we allow groups between Free and Premium users?
4. **Palantir Freshness:** Is a 4-hour news cache sufficient?

---

## 21. Final Recommendation

- **Recommended Category:** Personal Wealth Intelligence Platform.
- **Strongest Positioning:** *"Your orientation engine for a complex economy."*
- **First Beta Scope:** Manual Tracking + Basic AI Advisor + P0 Security Fixes.
- **Top Risk:** AI Hallucination regarding financial advice.
- **Immediate Action:** **HIDE** Global Market Signals and **FIX** Firestore Admin rules.
