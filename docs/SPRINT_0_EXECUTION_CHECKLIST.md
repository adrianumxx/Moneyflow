# SPRINT 0 EXECUTION CHECKLIST: Security, Secrets and Product Truth

This document outlines the exact execution steps for Sprint 0. **Do not begin implementation until this checklist is reviewed.**

## 1. Exact Files to Modify

| File | Purpose | Changes | Risks |
| :--- | :--- | :--- | :--- |
| **[NEW] `api/authMiddleware.ts`** | Backend Auth | Implement Firebase ID Token verification middleware. | Blocks all API traffic if misconfigured. |
| **`api/index.ts`** | API Entry | Apply `authMiddleware` to all routes except `/api/webhook`. Replace `req.body.userId` with `req.user.uid`. | Server crash if `FIREBASE_PROJECT_ID` is missing. |
| **`api/geminiRoutes.ts`** | AI Routes | Use verified `uid` for Firestore lookups. Hardened error handling. | AI features break if UID extraction fails. |
| **`api/syncRoutes.ts`** | Connector Stubs | Apply `authMiddleware`. | None (currently stubs). |
| **`src/utils/api.ts` [NEW]** | API Helper | Create `authenticatedFetch` wrapper that handles `getIdToken()`. | Race conditions with token refresh. |
| **`src/services/geminiService.ts`**| AI Integration | Migrate all `fetch` calls to `authenticatedFetch`. | AI features break if headers are missing. |
| **`src/components/SubscriptionSettings.tsx`** | Stripe | Use `authenticatedFetch` for checkout/portal sessions. | Billing flows break. |
| **`src/components/Palantir.tsx`** | AI UI | Use `authenticatedFetch`. Update "Loophole" -> "Legal Tax Optimization". | UI breaks. |
| **`firestore.rules`** | Data Security | Merge `DRAFT` logic. Add `country` to allowed update keys. Ensure strict ownership. | Onboarding might fail if keys are missing. |
| **`.env.example`** | Configuration | Remove `VITE_` from server secrets. Replace real keys with placeholders. | Local dev setup needs manual update. |
| **`package.json`** | Dependencies | Ensure `firebase-admin` and `dotenv` are correctly versioned. | Dependency conflicts. |
| **`src/components/ConnectBankModal.tsx`** | Product Truth | Remove "Zero-Knowledge" and "AES-256" (unless verified). Label as "Demo Hub". | UX feels "less premium" but is more honest. |

---

## 2. Firebase Admin Strategy

### Required Environment Variables
- `FIREBASE_PROJECT_ID`: The ID of your Firebase project.
- `FIREBASE_CLIENT_EMAIL`: Service account email.
- `FIREBASE_PRIVATE_KEY`: Service account private key (escaped newlines).
- `GEMINI_API_KEY`: (Formerly `VITE_GEMINI_API_KEY`) - Backend ONLY.
- `STRIPE_SECRET_KEY`: Backend ONLY.

### Initialization Strategy
- **Local Development**: Load from `.env` using `dotenv`.
- **Production**: Environment variables provided by host (Vercel/Cloud Run).
- **Safety**: The server will log a "CRITICAL: Backend Intelligence Offline" message if keys are missing, instead of crashing, but will return 503 for relevant routes.

---

## 3. Backend Auth Strategy

### Protected vs Public Routes
- **PUBLIC**: `/api/webhook` (Stripe handles its own signature verification).
- **PROTECTED**: All other routes starting with `/api/`.

### Implementation Details
- **Header**: `Authorization: Bearer <ID_TOKEN>`.
- **Validation**: `admin.auth().verifyIdToken(token)`.
- **UID Injection**: The middleware attaches the decoded token to `req.user`.
- **Unauthorized Response**: `401 Unauthorized` with a generic message.
- **Error Logging**: Log internal errors to server console; return generic `Internal Server Error` to client.

---

## 4. Frontend Authenticated Fetch Strategy

### The `authenticatedFetch` Helper
- **Location**: `src/utils/api.ts`.
- **Logic**: 
    1. Check `auth.currentUser`.
    2. Call `user.getIdToken()`.
    3. Inject into `headers.Authorization`.
    4. Handle `401` by triggering a logout or re-auth if needed.

### Migration List
- `geminiService.ts`: `chatWithNeuralPartner`, `generateFinancialInsights`, `categorizeTransaction`, `generateCFOReportData`, `getPalantirIntelligence`.
- `SubscriptionSettings.tsx`: `handleSubscribe`, `handleManageBilling`.
- `Palantir.tsx`: `handleSubscribe`.

---

## 5. Firestore Rules Migration

### Current Issues
- Overly permissive subcollection access if `request.auth != null`.
- Missing `country` in update validation.

### Merge Strategy
1.  **Preserve Strictness**: Keep `isValidUser`, `isValidAsset`, etc., from the 204-line `firestore.rules`.
2.  **Fix Onboarding**: 
    - `allow create`: Must allow initial document creation with `uid`, `email`, `createdAt`.
    - `allow update`: Add `country` and ensure all onboarding fields are allowed.
3.  **Relational Security**: Ensure `groups` membership check remains robust.
4.  **Subcollections**: Explicitly check `request.auth.uid == userId` for every nested collection.

---

## 6. Secrets Cleanup

### Variable Migration
- **KEEP `VITE_`**: `VITE_FIREBASE_*`, `VITE_APP_URL`, `VITE_STRIPE_PRICE_ID_MONTHLY`.
- **REMOVE `VITE_`**: `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

### Placeholder Enforcement
- `.env.example` will be scrubbed of ALL real keys.
- **ACTION**: User must rotate `STRIPE_SECRET_KEY` if the one in `.env.example` was actually live.

---

## 7. Product Truth Cleanup

### Copy Replacements
- **ConnectBankModal**: 
    - "Zero-Knowledge Proof protocol" -> "Secure Sandbox Verification"
    - "secure encrypted bridge (AES-256)" -> "Secure demo connection"
    - "Sync your financial DNA across 15,000+ institutions" -> "Simulate sync with major institutions"
- **Palantir**:
    - "Loophole Strategy" -> "Legal Tax Optimization"
    - "Guaranteed Spread" -> "Potential Efficiency Gap"
- **General**:
    - Add "Demo Mode" or "Sandbox" badges to the Bank Connector UI.
    - Add "AI Simulation" watermark to Palantir when API key is missing.

---

## 8. Verification Plan

### Terminal Validation
1.  `npm install` (if middleware dependencies added).
2.  `npm run build` (Verify no TS errors in new files).
3.  `curl -X POST http://localhost:3000/api/gemini/chat` -> Expect `401`.

### App Validation
1.  Log in -> Verify Onboarding still works.
2.  Create Asset -> Verify Firestore write works.
3.  Open Palantir -> Verify AI insights load (requires local `.env` with key).
4.  Trigger Checkout -> Verify Stripe redirect works.

---

## 9. Rollback Plan
- **Backend Auth**: Revert `api/index.ts` to remove `app.use(authMiddleware)`.
- **Secrets**: Rename variables back to `VITE_` if frontend build fails due to missing keys.
- **Firestore Rules**: Restore previous `firestore.rules` from Git history.

---

## 10. What NOT to touch in Sprint 0
- No visual CSS changes.
- No new features.
- No Plaid/GoCardless real API implementation.
- No changes to existing Firestore data models.

---

### **ARE YOU READY TO IMPLEMENT SPRINT 0?**
Yes, Sprint 0 is safe to implement and critical for security.

**To begin, provide the following prompt:**
> "Proceed with Sprint 0 Execution Checklist. Implement backend auth middleware, secure the secrets, harden Firestore rules, and clean up product-truth copy as specified in SPRINT_0_EXECUTION_CHECKLIST.md."
