# Moneyflow Wealth OS - Environment Setup Checklist

**IMPORTANT**: All variables must adhere to [PROJECT_SECURITY_RULES.md](./PROJECT_SECURITY_RULES.md).

## 1. Frontend Configuration (Public)
| Variable | Source | Category | Secret? | Failure if Missing |
|---|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console (Project Settings) | Frontend | No | Auth/DB init failure |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console | Frontend | No | Auth redirect failure |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console | Frontend | No | DB init failure |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console | Frontend | No | Assets failure |
| `VITE_FIREBASE_MESSAGING_ID` | Firebase Console | Frontend | No | Notifications failure |
| `VITE_FIREBASE_APP_ID` | Firebase Console | Frontend | No | Init failure |
| `VITE_APP_URL` | `https://moneyflowai.vercel.app` | Frontend | No | Redirect/Callback failure |
| `VITE_STRIPE_PRICE_MONTHLY` | Stripe Dashboard (Products) | Frontend | No | Checkout failure |

## 2. Backend Configuration (Private)
| Variable | Source | Category | Secret? | Failure if Missing |
|---|---|---|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console | Backend | No | Admin init failure |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account JSON | Backend | **YES** | Admin init failure |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account JSON | Backend | **YES** | Admin init failure |
| `GEMINI_API_KEY` | [AI Studio](https://aistudio.google.com/) | Backend | **YES** | Neural Core failure |
| `GOCARDLESS_SECRET_ID` | [GoCardless](https://bankaccountdata.gocardless.com/) | Backend | **YES** | Bank Sync failure |
| `GOCARDLESS_SECRET_KEY` | [GoCardless](https://bankaccountdata.gocardless.com/) | Backend | **YES** | Bank Sync failure |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (API Keys) | Backend | **YES** | Subscription failure |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI / Dashboard (Webhooks) | Backend | **YES** | Webhook 400/500 |
| `APP_URL` | `https://moneyflowai.vercel.app` | Backend | No | Callback redirection |
| `NEWS_PROVIDER` | `gdelt` | Backend | No | Intelligence Feed empty |

## 3. Deployment Targets (Vercel)
Ensure all variables are set for both **Production** and **Preview** environments in the Vercel Dashboard.

## 4. Firebase Authentication Safeguards
Ensure the following domains are added to **Firebase Console > Authentication > Settings > Authorized Domains**:
- [ ] `localhost`
- [ ] `moneyflowai.vercel.app`
- [ ] Any active Vercel Preview/Branch domains

## 5. Final Verification
- [ ] `GET /api/health` returns `status: "ok"`
- [ ] Unauthenticated `POST /api/sync/institutions/list` returns `401`
- [ ] Login -> Dashboard works (verifies Firebase Client)
- [ ] Palantir Intelligence Feed renders (verifies Gemini + GDELT)
- [ ] Connect Bank -> List Institutions (verifies GoCardless)
- [ ] Subscribe -> Stripe Checkout loads (verifies Stripe)

