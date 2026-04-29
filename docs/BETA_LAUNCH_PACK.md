# Moneyflow Wealth OS - Closed Beta Launch Pack

## 1. Mission & Goals
The objective of this closed beta is to stress-test the production core of Moneyflow Wealth OS before scaling.
- **Onboarding**: Validate the "Neural Handshake" (Onboarding) clarity.
- **Banking**: Confirm GoCardless balance and transaction ingestion accuracy.
- **Intelligence**: Measure the perceived value and accuracy of Palantir AI insights.
- **Mobile UX**: Ensure the premium glassmorphism design holds up on mobile viewports.

## 2. Target Tester Profile
- **Size**: 5-10 trusted users.
- **Region**: EU/Belgium preferred (optimal for GoCardless testing).
- **Mindset**: Users comfortable with financial tech, willing to provide deep feedback on UX and trust.

## 3. Tester Flight Plan (Instructions)
1. **Initialize**: Create an account and complete the Magic Onboarding.
2. **Wealth Entry**: Add at least one manual Asset and one Liability.
3. **Neural Sync**: Connect a real bank account (if comfortable) via Integrations Hub.
4. **Ingest**: Perform a "Sync Balances" followed by a "Sync Transactions".
5. **Analyze**: Navigate to Palantir and review the Intelligence Feed and Neural Advisor messages.
6. **Sovereignty**: Go to Settings -> Download Archive to verify your data is portable.
7. **Cleanup**: Revoke a bank connection to verify access is terminated.

## 4. Key Feedback Pillars
- **Clarity**: Was the onboarding flow intuitive or overwhelming?
- **Accuracy**: Did bank balances match your live banking app?
- **Utility**: Did Palantir identify any non-obvious patterns?
- **Trust**: Did the AI-powered financial disclaimer feel sufficient?
- **Premium**: Does the interface feel "state-of-the-art" or "work-in-progress"?

## 5. Known Limitations & Disclosure
- **Beta State**: Experimental software; UI may shift.
- **Informational Only**: AI insights are NOT financial advice.
- **Ingestion Delay**: Banking transactions may take up to 24h to appear post-sync.
- **Backend Purge**: Automated account deletion is currently being secured; manual deletion upon request only.

## 6. Pre-Flight Checklist (Founder Only)
- [ ] `GET /api/health` returns `status: "ok"`.
- [ ] Unauthenticated API requests return `401`.
- [ ] `GEMINI_API_KEY` and `GOCARDLESS` secrets verified in Vercel.
- [ ] Master `QA_CHECKLIST.md` is fully signed off.

## 7. Tester Invitation Message
> **Subject**: Invitation: Moneyflow Wealth OS Closed Beta 🚀
>
> Hi [Name],
> 
> I’m inviting you to be one of the first 10 users to test **Moneyflow Wealth OS**, the AI-powered intelligence layer for your wealth.
> 
> **What I’d love for you to test:**
> - The Neural Onboarding flow.
> - Connecting your bank via our GoCardless bridge.
> - Our AI analyst, Palantir, and its automated risk/opportunity queue.
>
> **Access Link**: https://moneyflowai.vercel.app/
>
> This is an early beta—I’m looking for your honest feedback on where things feel "magic" and where they feel confusing. 
> 
> Note: AI insights are informational only. You can revoke all access and export your data at any time from the Settings menu.
>
> Thanks for helping me build the future of wealth management!
