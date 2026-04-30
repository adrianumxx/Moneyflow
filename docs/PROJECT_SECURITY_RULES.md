# Moneyflow Wealth OS - Project Security & Environment Rules

## 1. Environment & Secrets
- **Separation**: Local development uses `.env` only (never committed). Production uses Vercel Environment Variables.
- **VITE_ Prefix**: Reserved for frontend-safe public variables (e.g., Firebase API Key). Backend-only secrets must **NEVER** use `VITE_`.
- **Firebase Private Key**: `FIREBASE_PRIVATE_KEY` must preserve newline characters correctly (use escaped `\n` in Vercel if necessary).
- **No Secrets in Git**: Never commit API keys, tokens, or provider secrets to GitHub.

## 2. API & Authentication
- **ID Tokens**: All sensitive routes (`/api/gemini/*`, `/api/sync/*`) **MUST** require a valid Firebase ID Token.
- **Identity**: The backend must use `req.user.uid` only. The frontend must never send a `userId` as a trusted identity.
- **Stripe Webhook**: Remains public but **MUST** be signature-verified.
- **Error Handling**: Do not return raw error messages or stack traces to clients.

## 3. AI Privacy Firewall
- **Mandatory Egress**: All data to Gemini must pass through `api/aiPrivacy.ts`.
- **Prohibited Data**: Raw financial records, PII (names, emails, phones), IBANs, requisition IDs, wallet addresses, and secrets must **NEVER** be sent to AI.

## 4. Banking & Provider Security
- **GoCardless**: Secrets remain backend-only. Access tokens are transient and must **NOT** be stored in Firestore.
- **Scoped Data**: Accounts and transactions must be scoped to `users/{uid}` with `ownerId == uid`.
- **Idempotency**: Use `providerTransactionId` for duplicate-free ingestion.

## 5. Firestore Rules & Sovereignty
- **Access Control**: Users can only access their own documents where `ownerId == request.auth.uid`. Group access is member-based.
- **Purge**: Account erasure must be a secure, authenticated backend action, not a destructive frontend shortcut.
- **Export**: Data portability exports must scrub secrets recursively.

## 6. Logging & Deployment
- **Zero-Secret Logging**: Do not log financial payloads, raw transactions, or secrets.
- **Pre-Deploy Verification**: Before every production deploy, verify:
  - `npm run build` && `npx tsc --noEmit` && `npm test`
  - `GET /api/health` returns `ok`
  - Unauthenticated `/api/gemini/global-pulse` and `/api/sync/institutions/list` return `401`.
