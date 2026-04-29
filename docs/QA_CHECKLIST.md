# Moneyflow Wealth OS - QA & Compliance Checklist

## 1. Automated Stability & Integrity
- [ ] `npm run build` - Production bundle build status.
- [ ] `npx tsc --noEmit` - TypeScript type safety across all layers.
- [ ] `npm test` - Standard unit tests (must be 26/26).

## 2. Security & Compliance (Firestore)
- [ ] `npm run test:rules` - Firestore rules isolation (Requires Emulator).
- [ ] **Auth Check**: `/api/gemini/global-pulse` unauthenticated returns 401.
- [ ] **Privacy Check**: Data Export JSON does NOT contain tokens or API keys.
- [ ] **Revocation Check**: Revoking an institution stops sync but preserves history.

## 3. Financial Intelligence (Palantir)
- [ ] **API Resilience**: Palantir Dashboard renders fallback if API fails.
- [ ] **Feed Provider**: Verify `NEWS_PROVIDER=gdelt` for Intelligence Feed.
- [ ] **Compliance**: Verify "Not Financial Advice" disclaimers in Modal/Advisor.

## 4. Manual App Smoke Tests
- [ ] **Auth**: Login -> Onboarding -> Profile completion.
- [ ] **Ledger**: Add Asset -> Add Transaction -> Verify Net Worth calculation.
- [ ] **Integrations**: Connect GoCardless -> Sync Balances -> Sync Transactions -> Verify Ledger.
- [ ] **Sovereignty**: Export Data Archive -> Delete Data (Non-destructive check).

## 5. Production Health & Observability
- [ ] **Rate Limiting**: Verify `/api/gemini/*` rate limit exists (429 returns after limit).
- [ ] **Resilience**: Verify Gemini route logs `latencyMs` and falls back/fails safely.
- [ ] **Sync Safety**: Verify sync routes log safe structured errors.
- [ ] **Privacy**: Verify no raw `error.message` is returned to clients in responses.
- [ ] **Webhooks**: Verify Stripe webhook is NOT rate-limited.
- [ ] **Intelligence**: Verify GDELT failures return `[]` and do not break Palantir.
- [ ] **Environment**: Verify `NEWS_PROVIDER=gdelt` is set in production for active Intelligence Feed.

## 6. Vercel Log Checks
- [ ] **GeminiEvent**: Verify logs contain latency and success metrics.
- [ ] **Sync Errors**: Verify structured error logging for backend syncs.
- [ ] **Rate Limits**: Verify 429 responses are logged for monitoring.

## 7. Pre-Deployment Audit (Final)
- [ ] No hardcoded model keys in `geminiService.ts`.
- [ ] Vitest environment set to `node` for rules tests.
- [ ] Build artifacts generated successfully in `/dist`.
- [ ] Vercel log drain confirmed active.

