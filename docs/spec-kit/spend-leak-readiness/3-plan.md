# FINROQ Spec Kit — Step 3: Implementation Plan
## Systematic Execution Phases

### Phase 1: Database Model & Provenance Schema
- Add `source: Column(String(32))` to `Transaction` model in `backend/app/db/models.py`.
- Update `TransactionCreate`, `TransactionResponse`, `StatementImportConfirmItem` in `backend/app/shared/schemas.py`.
- Update `TransactionService.confirm_import` to assign `source="statement_import"`.
- Update `seed_demo.py` and demo fixtures to set `source="seed_demo"`.

### Phase 2: Readiness & Evidence-Driven Leak Backend Service
- Create `backend/app/features/readiness/service.py`:
  - Calculate account age, available history, active days, data freshness, gaps, source breakdown, and demo dataset isolation.
  - Assess readiness status (`limited_evidence`, `preliminary`, `provisional`, `sufficiently_supported`).
  - Scan for repeated charges (group by cleaned description/merchant, frequency tolerance).
  - Distinguish detected patterns from confirmed user subscriptions.
  - Scan for excessive category spending against budget/historical baselines (>=30 days required).
  - Scan for dormant recurring subscriptions (>30 days since last activity).
  - Project savings with documented assumptions and explicit disclaimers.
  - Ensure zero leak inference for single isolated transactions or insufficient history.
- Create API schemas in `backend/app/features/readiness/schemas.py`.
- Create API router in `backend/app/api/routes/spend_leaks.py` and mount in `backend/app/api/router.py`.

### Phase 3: Comprehensive Test Suite
- Write unit tests in `backend/tests/unit/test_readiness_service.py` covering:
  - New account with no transactions.
  - One day of transactions.
  - Several days of transactions (<7 days).
  - Incomplete statement spanning multiple months with gaps.
  - Complete history >=90 days.
  - Old account with little history.
  - Sufficient history but stale synchronization.
  - Synthetic demo data identification.
  - Single transaction never treated as confirmed subscription.
  - Annual subscription without sufficient history flagged as unassessed.
  - Category spending without baseline.
  - Multi-user isolation.

### Phase 4: Frontend Data Readiness Panel & Evidence Display
- Update `frontend/src/lib/api-client.ts` with readiness and spend leak API client calls.
- Update `frontend/src/app/app/spend-leak-detector/page.tsx`:
  - Add compact Data Readiness Panel showing history, active days, verified coverage, freshness, accounts, sources, and action buttons.
  - Show demo dataset warning badge when demo data is used.
  - Render evidence trail on each detected leak card (dates, count, variance, calculation method).
  - Display annual subscription limitations banner when history < 365 days.
  - Display clear explanation of unavailable analyses when evidence is limited.

### Phase 5: Verification & Deployment
- Run all backend unit and integration tests (`pytest`).
- Run frontend Jest unit tests (`npm test`).
- Run Next.js production build (`npm run build`).
- Deploy updated build to Vercel via `npx vercel --prod --yes` and verify production status.
- Document results in `docs/spec-kit/spend-leak-readiness/5-verification.md`.
