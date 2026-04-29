# Sprint 2: Real Connector Foundation

## Goal
Establish a professional connector infrastructure that bridges simulated demo data with institutional-grade data models.

## Proposed Changes

### Sprint 2 - [x] Part 1: Connector Data Architecture & Provider Registry
- **Files**: `src/types.ts`, `src/utils/connectors.ts`, `firestore.rules`
- **Status**: Completed. Defined core models and centralized provider registry.

### Sprint 2 - [x] Part 2: Connect Center UI Bridge
- **Files**: `src/components/IntegrationsHub.tsx`, `src/components/ConnectBankModal.tsx`, `src/components/CryptoConnector.tsx`
- **Status**: Completed. Connected UI to persistent data models.

### Sprint 2 - [x] Part 3: Backend Sync Routes Foundation
- **Files**: `api/syncRoutes.ts`, `api/connectorProviders.ts`, `api/index.ts`
- **Status**: Completed. Established secure API router for synchronization.

### Sprint 2 - [x] Part 4: Connector Frontend API Bridge
- **Files**: `src/services/syncService.ts`, `src/components/IntegrationsHub.tsx`, `src/components/ConnectBankModal.tsx`
- **Tasks**:
  - [x] Created `src/services/syncService.ts` with authenticated API wrappers.
  - [x] Wired `IntegrationsHub` to initiate backend sessions via `createSyncSession`.
  - [x] Wired `ConnectBankModal` to perform backend handshakes via `handleSyncCallback`.
  - [x] Implemented graceful error handling for connection failures.
  - [x] Preserved existing client-side demo writes for compatibility.

### Sprint 2 - [ ] Part 5: Neural Core Optimization
- **Files**: `src/services/geminiService.ts`, `api/geminiRoutes.ts`
- **Tasks**:
  - Update Palantir prompts to use the new `UserProfile` strategic fields.
  - Inject `riskTolerance`, `financialMode`, and `taxResidence` into the AI context.
  - Personalize advice based on `employmentStatus` and `currencyExposure`.

## Verification Plan
### Automated Tests
- `npm run build`
- Type validation for the new connector models.

### Manual Verification
- Select a provider in IntegrationsHub and verify that the flow proceeds only if the backend returns success.
- Complete a connection in ConnectBankModal and verify the backend handshake call in network logs.
