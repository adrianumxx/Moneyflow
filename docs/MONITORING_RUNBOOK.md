# Moneyflow Wealth OS - Monitoring & Operations Runbook

## 1. Availability Checks
- **Health Endpoint**: `GET /api/health`
  - Status 200: Service is up and responding.
  - Status 500: Backend initialization failure (Check Firebase Admin or ESM extensions).
  - Status 404: Routing misconfiguration in `vercel.json`.

## 2. Critical Logs to Watch (Vercel)
### Gemini & Palantir
- **`GeminiEvent`**: Look for JSON blobs containing `latencyMs` and `success`.
- **429 Too Many Requests**: Triggered when a user exceeds 30 AI requests per 15 minutes.
- **500 Internal Server Error**: Usually means `GEMINI_API_KEY` is missing or API is down.
  - **Fix**: Verify production env vars; check if fallback intelligence renders in UI.

### Banking Synchronization
- **`[SyncError]`**: Structured logs for GoCardless failures.
- **Requisition Failures**: Errors in `/session/create` or `/session/callback`.
  - **Fix**: Verify GoCardless secrets; ensure `APP_URL` matches redirect URL dashboard.
- **Empty Transactions**: If balance syncs but transactions don't, check if the bank requires 24h for initial data availability.

### Intelligence Feed
- **GDELT Timeouts**: Logs showing `GDELT fetch failed or timed out`.
  - **Fix**: Expected intermittently; system should automatically serve stale cache or `[]`.

## 3. Incident Response
| Incident | Action |
|---|---|
| **Whole API returns 500** | Check Firebase Admin Service Account and ESM `.js` imports. |
| **Palantir is "Blind"** | Verify `GEMINI_API_KEY` and GDELT provider status. |
| **Sync Handshake fails** | Check Redirect URL in GoCardless Dashboard vs `VITE_APP_URL`. |
| **Database Permissions Denied** | Verify Firestore Rules and Firebase Admin initialization. |
| **Rate Limit Blocking Tests** | Verify IP-based limit (60/15m for sync). |

## 4. Maintenance
- **Data Purge**: Manual Firestore cleanup required until `/api/purge` is connected.
- **Log Drains**: Recommended to connect Vercel to Axiom/Datadog for long-term alerting.
