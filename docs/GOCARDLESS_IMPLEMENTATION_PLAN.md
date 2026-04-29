# GoCardless Integration Implementation Plan - Moneyflow Wealth OS

## 1. Environment Configuration
- `GOCARDLESS_SECRET_ID`: API Secret ID (Backend Only).
- `GOCARDLESS_SECRET_KEY`: API Secret Key (Backend Only).
- `VITE_APP_URL`: Base URL for OAuth redirect callbacks (e.g., `http://localhost:3000`).

## 2. API Flow (AISP)
1. **Token Auth**: Request JWT via `/api/v2/token/new/`.
2. **Institution Discovery**: Fetch supported banks via `/api/v2/institutions/?country=be`.
3. **End User Agreement**: Create optional agreement (max 90 days historical access).
4. **Requisition**: Create session via `/api/v2/requisitions/` and obtain `link`.
5. **Consent Redirect**: Frontend redirects user to the bank's authorization page.
6. **Callback Handling**: Process redirect back to `/api/sync/session/callback`.
7. **Data Ingestion**: 
   - Fetch accounts via `/api/v2/requisitions/{id}/`.
   - Fetch balances via `/api/v2/accounts/{id}/balances/`.
   - Fetch transactions via `/api/v2/accounts/{id}/transactions/`.

## 3. Firestore Integration
- **connectedInstitutions**: Store `requisitionId`, `agreementId`, `institutionId`, `status`, and `updatedAt`.
- **connectedAccounts**: Map GoCardless account IDs to Moneyflow accounts; store balance and currency.
- **transactions**: Map external transaction IDs to prevent duplicates; store amount, date, and description.

## 4. Security & Compliance
- **Credential Safety**: Never store `SECRET_ID` or `SECRET_KEY` in Firestore or return them to the client.
- **Token Isolation**: GoCardless JWTs remain backend-side; only `requisitionId` is shared with the client.
- **Data Privacy**: Logs must use `safeLogError` to prevent PII/credential leakage.

## 5. UX States
- `not_configured`: Provider keys missing in environment.
- `selecting_bank`: User browsing the institution list.
- `redirecting`: Redirecting to bank portal.
- `awaiting_consent`: Waiting for callback after bank authorization.
- `connected`: Successfully synced.
- `failed`: API or authorization error.
- `needs_reauth`: Consent expired or revoked by user.

## 6. Implementation Phases
- **Phase 1: Discovery**: Implement `getInstitutionList` to populate the bank selector.
- **Phase 2: Linkage**: Implement `createRequisitionSession` and redirect logic.
- **Phase 3: Handshake**: Implement callback handling and requisition status verification.
- **Phase 4: Balances**: Implement account discovery and real-time balance sync.
- **Phase 5: Transactions**: Implement transaction fetch and Firestore ingestion.
- **Phase 6: Lifecycle**: Implement disconnect and 90-day re-authorization flows.

## 7. First Micro-task
- [ ] Implement `getInstitutionList('BE')` in `api/providers/gocardless.ts` with real `fetch` calls to Nordigen/GoCardless API (wrapped in env check).
