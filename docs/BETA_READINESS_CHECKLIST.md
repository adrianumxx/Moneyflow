# Moneyflow Wealth OS - Beta Readiness Checklist

## 1. Production API & Backend Infrastructure
- [ ] **Auth Enforcement**: `/api/gemini/*` and `/api/sync/*` return 401 for unauthenticated requests.
- [ ] **Stability**: No `FUNCTION_INVOCATION_FAILED` errors in Vercel logs.
- [ ] **Firebase Admin**: Verified lazy initialization for `db` instance.
- [ ] **Rate Limiting**: 30 req/15m (AI) and 60 req/15m (Sync) active per IP.
- [ ] **Security Headers**: Helmet (Frameguard, X-Content-Type-Options) and Production-only CORS active.

## 2. Required Production Environment Variables
- [ ] **Firebase**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- [ ] **AI Intelligence**: `GEMINI_API_KEY`, `NEWS_PROVIDER=gdelt`.
- [ ] **Banking**: `GOCARDLESS_SECRET_ID`, `GOCARDLESS_SECRET_KEY`.
- [ ] **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- [ ] **Deployment**: `APP_URL`, `VITE_APP_URL` (matched to production domain).

## 3. Core User Smoke Test (Final)
- [ ] **Lifecycle**: Login -> Onboarding -> Profile completion.
- [ ] **Ledger**: Manual Asset/Liability/Transaction entry works.
- [ ] **Banking**: Connect GoCardless -> Redirect -> Return -> Sync Balances -> Sync Transactions.
- [ ] **Palantir**: Dashboard renders with Intelligence Feed and Neural Advisor messages.
- [ ] **Sovereignty**: Data Export (JSON) is clean of tokens/PII.
- [ ] **Revocation**: Disconnect institution stops sync but preserves history.

## 4. Security & Privacy Audit
- [ ] **PII Protection**: AI Privacy Firewall redacts IBANs/emails/phones from AI context.
- [ ] **No Leakage**: Frontend never sends `userId` in body; backend uses `req.user.uid`.
- [ ] **Credentials**: No GoCardless tokens or banking credentials persisted in Firestore.
- [ ] **Firestore Rules**: Owner-scoped read/write enforced for all collections.

## 5. UX & Accessibility
- [ ] **Mobile**: Responsive dashboard and Palantir feed checks.
- [ ] **Fallbacks**: Graceful UI states for empty data or API timeouts.
- [ ] **Loading States**: Crystal-clear progress indicators for banking syncs.

## 6. Beta Blockers & Next Steps
- [ ] **Legal**: Privacy Policy and Terms of Service needed in footer.
- [ ] **Purge**: Finalize "Delete Account" backend cleanup route.
- [ ] **Monitoring**: Connect Vercel Log Drain to an observability tool (e.g., Axiom).

## 7. Launch Recommendation
- **Initial Scale**: 5-10 trusted internal testers to monitor sync stability.
