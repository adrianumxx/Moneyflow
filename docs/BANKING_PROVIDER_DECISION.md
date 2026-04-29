# Banking Provider Decision Matrix - Moneyflow Wealth OS

## Provider Comparison

| Feature | GoCardless (Nordigen) | Tink (Visa) | Plaid | Salt Edge | TrueLayer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BE/EU Coverage** | Excellent | Superior | Good | Excellent | Great |
| **PSD2 Support** | Native | Native | Native | Native | Native |
| **Balances** | Yes | Yes | Yes | Yes | Yes |
| **Transactions** | Yes | Yes | Yes | Yes | Yes |
| **Consent Flow** | Standard Redirect | Embedded/Redirect | Link SDK | Redirect | Link SDK |
| **Dev Complexity** | Low (REST) | Medium | Low (Best SDK) | Medium | Medium |
| **Cost** | Free Tier (AISP) | Enterprise | High | Tiered | Tiered |
| **Architecture Fit** | Perfect (Async) | High | High | Medium | High |

## Evaluation
- **GoCardless (Nordigen)**: Optimal for MVP phase. The free tier for account information (AISP) covers all major Belgian banks (KBC, BNP, ING, Belfius) without upfront cost.
- **Tink**: Best-in-class data enrichment and depth for Europe, but higher enterprise barrier.
- **Plaid**: Excellent developer experience but expensive for EU-only focus.
- **Salt Edge**: Reliable compliance focus, but slightly more complex integration.
- **TrueLayer**: Strong for payments, but secondary for data-only wealth platforms in BE.

## Final Recommendation
**Recommended Provider**: **GoCardless (Nordigen)**

### Why?
1. **Zero Barrier to Entry**: Free AISP tier allows for real production testing without cost.
2. **Belgian Depth**: Strong API connectivity for the specific banks used by the target demographic.
3. **Async Compatibility**: The "Requisition" flow fits perfectly with our existing background sync architecture in `/api/sync`.
4. **Maintenance**: Simple REST-only interaction reduces dependency overhead.

## First Implementation Micro-task
- [ ] Register for GoCardless Bank Account Data API.
- [ ] Configure `GOCARDLESS_SECRET_ID` and `GOCARDLESS_SECRET_KEY`.
- [ ] Scaffold `gocardlessService.ts` to handle requisition/link creation.
- [ ] Update `connectorProviders.ts` with GoCardless metadata.
