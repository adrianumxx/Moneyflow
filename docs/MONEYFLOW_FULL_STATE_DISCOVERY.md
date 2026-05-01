# MONEYFLOW FULL STATE DISCOVERY

**Date:** 2026-05-01  
**Project:** Moneyflow Wealth OS  
**Status:** DISCOVERY COMPLETED — SPRINT MONEYFLOW-FULL-STATE-DISCOVERY-V1

---

## 1. EXECUTIVE STATE

- **Current product stage:**
  **INTERNAL ALPHA / PRIVATE BETA**

- **Recommended current access level:**
  **INTERNAL TESTERS ONLY** (Trusted Beta only after P0 Security fixes)

- **One-line product description based on current implementation:**
  A premium personal wealth dashboard with integrated banking sync and AI-driven geopolitical financial intelligence.

- **Is the product currently safe for a first real client?**
  **ONLY AFTER P0 FIXES**

- **Top 5 reasons for this answer:**
  1. **Security Risk (P0):** Hardcoded admin email in `firestore.rules` grants full database access to a single account.
  2. **Auth Instability:** Google Login relies on environment variables that may be desynced from the Firebase Console (Authorized Domains).
  3. **Financial Fraud Risk (P0):** Stripe webhook signature verification is implemented but lacks automated tests to ensure it cannot be bypassed.
  4. **AI Hallucination Risk:** High-complexity prompts for financial advice lack structured output validation or fallback logic.
  5. **Data Integrity Risk:** No automated tests for account/data deletion, risking PII retention after "deletion".

- **Top 5 strongest parts of the product:**
  1. **Visual Excellence:** State-of-the-art responsive design with premium financial aesthetics.
  2. **Privacy Firewall:** Robust `aiPrivacy` service for recursive PII redaction before AI ingestion.
  3. **Feature Depth:** Ready-to-use ledger, asset tracking, and banking connectors (GoCardless).
  4. **Architecture:** Clean separation of concerns between Firebase Client and Admin SDKs.
  5. **Mobile Readiness:** Excellent responsiveness at 375px viewport.

- **Top 5 most dangerous gaps:**
  1. **Missing Webhook Tests:** Payments and Banking sync rely on unverified webhook logic.
  2. **Model Fragility:** Reliance on experimental Gemini models without version pinning.
  3. **Hardcoded Admin:** Privilege escalation risk in Firestore rules.
  4. **Mock vs Real Confusion:** Several high-value features (Palantir, Weekly Review) are currently static mocks.
  5. **Lack of CSP:** Content Security Policy is disabled in the production API.

---

## 2. FEATURE STATUS MATRIX

| Feature | Status | Evidence | Real/Mock/Mixed | Main Risk | Client Visibility Recommendation | Required Next Step |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Page** | WORKING | Manual QA | Real | Low | KEEP VISIBLE | None |
| **Login Page** | WORKING | Manual QA | Real | Medium | KEEP VISIBLE | Polish error messages |
| **Google Login** | WORKING* | `firebase.ts` | Real | High | KEEP VISIBLE | Verify Authorized Domains |
| **Email/Pass Login** | WORKING | `App.tsx` | Real | Low | KEEP VISIBLE | Add password strength |
| **Demo Mode** | WORKING | Manual QA | **MOCK** | Low | KEEP VISIBLE | Add "Reset Demo" button |
| **Dashboard** | PARTIALLY | Manual QA | **MIXED** | Medium | KEEP VISIBLE | Connect to real data |
| **Manual Trans.** | WORKING | `useFinancialData.ts`| Real | Low | KEEP VISIBLE | Add bulk import |
| **Ledger** | WORKING | Manual QA | Real | Low | KEEP VISIBLE | None |
| **Net Worth Calcs** | WORKING | `financialCalculations.ts`| Real | Low | KEEP VISIBLE | Add currency conversion |
| **Goals** | WORKING | `App.tsx` | Real | Low | KEEP VISIBLE | Add progress notifications |
| **Forecast** | PARTIALLY | `geminiRoutes.ts` | **MIXED** | High | HIDE FROM CLIENT | Add accuracy validation |
| **Assets/Liab.** | WORKING | Firestore | Real | Low | KEEP VISIBLE | None |
| **GoCardless Conn.**| UNVERIFIED | `gocardless.ts` | Real | High | INTERNAL ONLY | Setup Sandbox keys |
| **Bank Sync** | UNVERIFIED | `syncRoutes.ts` | Real | High | HIDE FROM CLIENT | Add duplicate detection |
| **AI Advisor** | PARTIALLY | `geminiRoutes.ts` | Real | High | SAFE AFTER FIX | Add hallucination guard |
| **Global Pulse** | BROKEN | Manual QA | **MOCK** | High | HIDE FROM CLIENT | Connect to real news API |
| **CFO/PDF Report** | NOT IMPL. | `App.tsx` | **MOCK** | Low | REMOVE FROM JOURNEY | Implement backend PDF gen |
| **Stripe Checkout** | UNVERIFIED | `api/index.ts` | Real | High | INTERNAL ONLY | Test in Stripe Sandbox |
| **Privacy Controls**| WORKING | `Settings.tsx` | Real | Low | KEEP VISIBLE | None |
| **Delete Account** | UNVERIFIED | `userService.ts` | Real | High | SAFE AFTER FIX | Add recursive delete test |
| **Mobile 375px** | WORKING | Manual QA | Real | Low | KEEP VISIBLE | None |

---

## 3. WHAT IS REAL VS MOCK

### # Real vs Mock Map

| Area | Real / Mock / Mixed / Unknown | Evidence | Risk if user sees it | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Data** | **MIXED** | Manual QA shows demo data | Trust loss | Clear "Demo Data" badge |
| **Demo Data** | **MOCK** | `App.tsx` hardcoded arrays | Low | Keep for guest users |
| **Bank Connection** | **REAL** | `gocardless.ts` exists | Financial risk | Internal testing only |
| **Bank Sync** | **REAL** | `syncRoutes.ts` exists | Data corruption| Audit duplicate logic |
| **AI Advisor Output**| **REAL** | `geminiRoutes.ts` calls API | Legal liability | Stronger disclaimers |
| **Global Pulse** | **MOCK** | Manual QA (static text) | Trust loss | Hide until real |
| **Forecast** | **MIXED** | Logic exists but unverified | Financial risk | Mark as "Experimental" |
| **PDF Report** | **MOCK** | No backend implementation | UX frustration| Remove menu item |
| **Stripe Checkout** | **REAL** | `api/index.ts` exists | Financial loss | Verify secrets/keys |
| **Subscription Status**| **REAL** | Firestore schema exists | Revenue leakage | Test webhook logic |
| **Delete Account** | **REAL** | `userService.ts` exists | Privacy breach | Verify subcollection wipe |
| **Groups** | **REAL** | `firestore.rules` exists | Privacy leak | Audit cross-user access |
| **Crypto Wallets** | **PARTIALLY** | UI only | Data integrity | Connect to real wallet API |

---

## 4. AUTH AND LOGIN DIAGNOSIS

# Auth Diagnosis

1. **Does Google login work locally?** YES (with fixed `.env` and popup fallback).
2. **Does Google login work in deployed environment?** UNVERIFIED (Depends on Firebase Console).
3. **Exact observed failure:** 404 on `/__/auth/handler` and `auth/popup-closed-by-user`.
4. **Root cause hypothesis:** Mismatch between `authDomain` in config and Authorized Domains in Firebase Console.
5. **Files involved:** `src/firebase.ts`, `src/App.tsx`, `.env`.
6. **Required code fix:** Already applied (improved redirect fallback and loading state reset).
7. **Required Firebase Console setting:** Add Vercel domain to "Authorized Domains" and enable Google Provider.
8. **Required Vercel/env setting:** Set `VITE_FIREBASE_*` variables in Vercel dashboard.
9. **Does email/password login work?** YES.
10. **Does demo mode conflict with real auth?** NO (uses `demo-` prefix for UIDs).

---

## 5. PRODUCT JOURNEY MAP

# Product Journey Map

| Route | What it shows | Public/Private | Works? | Risk | Recommended Future State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Landing / Login | Public | YES | Low | Add marketing copy |
| `/demo` | Simulated Dashboard | Public | YES | Low | Improve onboarding |
| `/app` | Authenticated Shell | Private | YES | Medium | Add auth gate component |
| `/settings`| User preferences | Private | YES | Low | Add data export button |

**Ideal Journey:**
Visitor → Landing → Demo (Try) → Sign Up (Stripe) → Onboarding → Real Dashboard → AI Advisor.

**Broken Transitions:**
- Navigating directly to `/app` while unauthenticated shows the shell briefly before redirect.
- Refreshing in Demo mode loses all "added" data.

---

## 6. SECURITY AND PRIVACY STATE

# Security and Privacy State

### # Security Audit
- **Auth Enforcement:** Strong. `authMiddleware` covers all sensitive API routes.
- **Firestore Rules:** **CRITICAL RISK.** Hardcoded admin email `adrianomelilloXX@gmail.com` has global access.
- **Sensitive Fields:** Good. `stripeCustomerId` and `subscriptionStatus` are client-read-only.
- **CSP:** **FAIL.** Disabled in `api/index.ts`.
- **Webhook Verification:** Logic exists but untested for signature spoofing.

### # Privacy Audit
- **PII Storage:** Minimal. Only email and display name in Auth.
- **AI Sanitization:** Strong. `aiPrivacy.ts` performs recursive redaction.
- **Data Deletion:** Logic exists but needs verification for subcollections.

| ID | Severity | Path | Impact | Required Fix |
| :--- | :--- | :--- | :--- | :--- |
| SEC-001 | **P0** | `firestore.rules` | Global DB Breach | Use custom claims |
| PAY-001 | **P0** | `api/index.ts` | Financial Fraud | Add webhook tests |
| SEC-002 | **P1** | `api/index.ts` | XSS Vulnerability | Enable CSP |
| DATA-001| **P1** | `userService.ts` | GDPR Non-compliance | Test recursive delete |

---

## 7. AI AND PALANTIR STATE

# AI and Palantir State

1. **What does “Palantir” currently do?** It displays a static UI dashboard with mock geopolitical text.
2. **Is it using real sources?** NO. It currently uses hardcoded strings for demonstration.
3. **Can it fabricate links?** YES. In its current mock state, it displays static "Market Signals" without validation.
4. **Does it claim live intelligence?** YES. The UI uses "Live Market Signals" terminology.
5. **Should it be visible?** **NO.** It is a trust risk until connected to real news/data APIs.
6. **What must be fixed?** Connect to `newsSources.ts` (GDELT) and implement real Gemini aggregation.

| AI Feature | Current Behavior | Data Sent | Model Used | Risk | Should First Client See It? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Advisor Chat | Real API Call | Sanitized | Gemini 1.5/2.0 | Hallucination | SAFE AFTER FIX |
| Global Pulse | **STATIC MOCK** | None | N/A | Trust Loss | HIDE FROM CLIENT |
| CFO Report | **UI ONLY** | None | N/A | UX Frustration| REMOVE FROM JOURNEY |

---

## 8. PAYMENTS AND SUBSCRIPTION STATE

# Payments and Subscription State

1. **Stripe Mode:** Code assumes environment variables will determine mode (Sandbox/Live).
2. **Checkout:** Logic implemented in `api/index.ts`.
3. **Webhook:** Implemented but **unverified by automated tests**.
4. **Source of Truth:** Firestore `users/{uid}/subscriptionStatus`.
5. **After Cancellation:** Status updates to `canceled`, but "premium" features need a logic check to verify they are locked.

---

## 9. BANKING / GOCARDLESS STATE

# Banking and GoCardless State

1. **Status:** Real implementation, currently unconfigured (No keys in `.env`).
2. **End-to-End:** Likely fails in current state due to lack of production Redirect URIs.
3. **Safe to show?** **NO.** Banking sync is too fragile without duplicate detection tests.

---

## 10. UX, COPY, AND TRUST STATE

# UX, Copy, and Trust State

| Screen/Area | Clarity | Trust | Friction | Mobile Risk | Copy Risk | Required Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing** | High | High | Low | Low | "Bank-grade" claim | Soften claims |
| **Dashboard** | High | Medium | Medium | Low | "Live" data claim | Add "Demo" labels |
| **Advisor** | High | Medium | High | Low | Financial advice | Bolder disclaimers |
| **Sync Hub** | Medium | Low | High | Medium | "Safe connection" | Add security badge |

---

## 11. TECHNICAL ARCHITECTURE STATE

# Technical Architecture State

- **Top 10 architecture risks:**
  1. **File Bloat:** `geminiRoutes.ts` (41KB) is too complex.
  2. **Mixed Logic:** API routes contain business logic that should be in services.
  3. **Lack of Logging:** Relying on `console.log` instead of structured logging (e.g., Winston).
  4. **No Error Boundaries:** Frontend lacks global catch-all for runtime errors.
  5. **Large Bundle:** 2.6MB JS chunk impacts TTI on mobile.
  6. **Auth State Race:** `App.tsx` handles too much state; needs a dedicated `AuthContext`.
  7. **Unpinned Models:** Using `gemini-2.0-flash-exp` is risky for stability.
  8. **Missing DB Indexes:** Complex Firestore queries (Groups + User) may fail in production.
  9. **No API Docs:** Missing OpenAPI/Swagger spec for backend.
  10. **Fragile Sync:** No retry logic for failed bank API calls.

---

## 12. TESTING AND COMMAND OUTPUT

| Command | Pass/Fail | Notes | Blocks client readiness? |
| :--- | :--- | :--- | :--- |
| `npm run lint` | **PASS** | No syntax or type errors. | NO |
| `npm run test:rules`| **FAIL** | Emulator not running. | **YES** |
| `npm test` | **PASS** | 80/80 passed. | NO |
| `npm run build` | **PASS** | Success with bundle warnings. | NO |

### # Missing Test Matrix

| Area | Existing Evidence | Missing Test | Severity | Recommended Sprint |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe Webhook** | Code only | Signature/Idempotency | **P0** | Sprint 1 |
| **Delete Account** | Code only | Recursive deletion | **P1** | Sprint 2 |
| **Bank Sync** | Code only | Duplicate detection | **P1** | Sprint 2 |
| **AI Privacy** | Unit tests | Nested PII redaction | **P2** | Sprint 3 |

---

## 13. CLIENT MINIMUM CUT

# Client Minimum Cut

## Keep visible now
- Landing Page, Login/Auth, Manual Ledger, Profile, Goals.

## Visible only after P0 fixes
- Stripe Billing (needs webhook tests), AI Advisor (needs hallucination check).

## Internal only
- Bank Sync (GoCardless), Market Pulse (Palantir), Group Expenses.

## Hide/remove from first client journey
- CFO Report (Mock), Global Market Signals (Mock), Crypto Wallets (Incomplete).

---

## 14. FINAL ROADMAP RECOMMENDATION

# Final Roadmap Recommendation

1. **Sprint 1: Security Hardening (P0)**
   - Fix hardcoded admin in `firestore.rules`.
   - Add Stripe signature verification tests.
   - Enable CSP in Helmet.
2. **Sprint 2: Reliability & Compliance (P1)**
   - Implement recursive deletion for user data.
   - Add duplicate detection for banking sync.
   - Standardize AI disclaimers in UI.
3. **Sprint 3: Architecture & Performance (P2)**
   - Code-split large bundles.
   - Refactor `geminiRoutes.ts` into smaller services.
   - Pin stable Gemini models.

---

## 15. QUESTIONS THAT BLOCK FINAL PLANNING

- **Target Jurisdiction:** Is the app primarily for EU, US, or other? (Critical for GDPR vs CCPA).
- **Stripe Mode:** Should we launch with Stripe Test Mode or go straight to Live?
- **Data Retention:** What is the legal requirement for retaining transaction logs?
- **Launch Goal:** Is the goal a 100-user beta or a public launch?

---

## 16. FINAL SUMMARY FOR PRODUCT COUNCIL

1. **Current stage:** Internal Alpha.
2. **Recommended access level:** Internal Testers.
3. **Top 10 blockers:** Hardcoded admin, Unverified webhooks, Missing CSP, Mock Palantir, Bundle size, Missing delete tests, Unpinned AI models, Lack of duplicate sync detection, Missing legal docs, Fragmented state management.
4. **Top 10 strengths:** Premium UX, Privacy Firewall, Feature complete ledger, Multi-device responsive, Robust API middleware, Clear auth flow, Active test suite (80/80), Standardized project structure, Geopolitical AI positioning, Clean Firebase integration.
5. **First 5 sprints:** 1. Security P0, 2. Reliability P1, 3. Privacy Compliance, 4. Banking Sync, 5. AI Gating.
6. **Features to hide immediately:** Palantir, CFO Report, Bank Sync (to public).
7. **What evidence is still missing:** Proof of Stripe success handling, Proof of recursive data erasure.
8. **Whether first client can be invited now:** **NO.** Wait for Sprint 1 completion.
