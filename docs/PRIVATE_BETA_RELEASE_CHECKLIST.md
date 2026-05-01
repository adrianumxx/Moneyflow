# Moneyflow Private Beta Release Checklist (V1)

This document outlines the final requirements, scope, and operational procedures for the Moneyflow Private Beta launch.

## 1. Beta Scope & Value Proposition
Moneyflow is a **Personal Wealth Intelligence Platform** designed to provide a unified view of net worth with AI-assisted strategic insights.
*   **Target Audience**: Private beta testers (invitation only).
*   **Core Goal**: Validate the accuracy of net worth tracking and the utility of the AI Neural Advisor.

## 2. Feature Visibility Matrix

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Google Authentication** | ✅ PRODUCTION | Secure, hardened against redirect loops. |
| **Wealth Dashboard** | ✅ PRODUCTION | Live data from Firestore. |
| **Neural Advisor (AI)** | ✅ PRODUCTION | Server-side proxy; requires ID token. |
| **Group Circles** | ✅ PRODUCTION | Shared expenses and AI circle burn audit. |
| **Data Export/Delete** | ✅ PRODUCTION | Full GDPR-compliant data control. |
| **Bank Sync (GoCardless)** | ⚠️ DEMO ONLY | Labeled as "Sandbox/Demo" for beta. |
| **Palantir Intelligence** | ⚠️ DEMO ONLY | Strategic fallback data; non-live. |
| **CFO PDF Report** | 🔒 GATED | Hidden behind beta feature flag. |

## 3. Known Limitations & Disclosures
*   **Browser Privacy**: "Ultra" privacy settings (blocking 3rd party cookies) may require users to use the Redirect Flow instead of Popups for Auth.
*   **Data Entry**: Real-time bank sync is currently in Sandbox mode; manual transaction entry is the primary flow for beta.
*   **AI Accuracy**: Models may occasionally produce inaccuracies; disclosure is visible in the chat UI.

## 4. Tester Instructions
1.  **Onboarding**: Sign in using a Google Account.
2.  **Wealth Entry**: Add at least one Asset, one Liability, and one Financial Goal.
3.  **Intelligence**: Ask the Neural Advisor (bottom right) for a "Strategic assessment of my net worth."
4.  **Groups**: Create a Group Circle and add a dummy expense to test the "AI Intelligence" analysis.
5.  **Privacy**: Visit Settings -> Privacy to verify data export functionality.

## 5. Feedback & Support
*   **Feedback**: Use the "Beta Feedback" button in the App Shell.
*   **Bug Reports**:
    *   **Title**: [BUG] Short description
    *   **Device/Browser**: (e.g., iPhone 15 / Safari)
    *   **Steps to Reproduce**: 1, 2, 3...
    *   **Expected vs Actual**: ...
*   **Support**: Reach out to `beta-support@moneyflowai.com`.

## 6. Rollback & Emergency Plan
*   **Vercel Deployment**: If a P0 crash is detected, use the Vercel dashboard to "Promote" the previous stable deployment (Commit `96410e7`).
*   **Feature Toggles**: Use `src/config/featureFlags.ts` to disable specific modules (e.g., set `FEATURES.AI_ADVISOR = false`) without a full code rollback.
*   **Database**: In case of corruption, Firestore snapshots can be restored via the Firebase Console (Standard tier backup).

## 7. Pre-Flight Final Checklist
- [ ] **GEMINI_API_KEY**: Verified in Vercel Environment Variables (Server-side).
- [ ] **STRIPE_SECRET_KEY**: Verified in Vercel Environment Variables.
- [ ] **Authorized Domains**: `moneyflowai.vercel.app` added to Firebase Console.
- [ ] **Firestore Rules**: `npm run test:rules` passes 100%.
- [ ] **Logs**: Diagnostic logs audited for PII (truncated UIDs verified).
- [ ] **SSL**: Production certificate active on `moneyflowai.vercel.app`.

---
**Status**: READY-FOR-RELEASE
**Version**: 1.0.0-beta
