# GoCardless Production Deployment Checklist

## 1. Environment Configuration (Vercel)
- [ ] **GOCARDLESS_SECRET_ID**: ID from GoCardless Bank Account Data dashboard.
- [ ] **GOCARDLESS_SECRET_KEY**: Key from GoCardless Bank Account Data dashboard.
- [ ] **VITE_APP_URL**: Public production domain (e.g., `https://moneyflow.vercel.app`).
- [ ] **APP_URL**: Public production domain (mirrors VITE_APP_URL for backend use).

## 2. GoCardless Dashboard Setup
- [ ] **User Agreements**: Enable for target countries (e.g., Belgium).
- [ ] **Redirect URL**: Add `https://your-domain.com` to allowed Redirect URLs.
- [ ] **IP Whitelisting**: If applicable, ensure Vercel outbound IPs can reach GoCardless.

## 3. Manual Production Smoke Test
1. [ ] **Auth**: Login with production account.
2. [ ] **Connect**: Open Integrations Hub -> Add Bank -> GoCardless.
3. [ ] **Consent**: Select Belgian institution -> Redirect to GoCardless consent page.
4. [ ] **Return**: Authorize -> Redirect back to Moneyflow -> Observe callback toast.
5. [ ] **Sync Balances**: Click "Sync Balances" -> Verify account balances update.
6. [ ] **Sync Transactions**: Click "Sync Transactions" -> Verify Ledger population.

## 4. API & Security Validation
- [ ] **Auth**: Verify `/api/sync/*` returns 401 for unauthenticated requests.
- [ ] **Privacy**: Verify raw transaction descriptions are NOT in Vercel logs.
- [ ] **Sanitization**: Verify 500 errors from GoCardless return safe generic messages to client.
- [ ] **Integrity**: Verify `providerTransactionId` prevents duplicates in Ledger.

## 5. Troubleshooting
- **`not_configured`**: Check `GOCARDLESS_SECRET_ID/KEY` env vars.
- **`requisition_failed`**: Verify Redirect URL matches GoCardless dashboard exactly.
- **Empty Accounts**: Ensure user actually authorized the accounts in the consent flow.
- **Empty Transactions**: Some banks require 24h for initial transaction sync availability.
