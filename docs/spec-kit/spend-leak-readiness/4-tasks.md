# FINROQ Spec Kit — Step 4: Actionable Tasks
## Spend Leak Detector Data Readiness, History Coverage & Insight Confidence

- [ ] **Task 1: Add Transaction Source Provenance**
  - Update `Transaction` in `backend/app/db/models.py` with `source: Column(String(32), nullable=False, default="manual")`.
  - Update `backend/app/shared/schemas.py` (`TransactionResponse`, `TransactionCreate`, `StatementImportConfirmItem`).
  - Update `backend/app/features/transactions/service.py` (`confirm_import` sets `source="statement_import"`).
  - Update `backend/seed_demo.py` (`source="seed_demo"`).

- [ ] **Task 2: Implement Readiness & Spend Leak Analysis Engine**
  - Create `backend/app/features/readiness/schemas.py`: Pydantic models for readiness summary, coverage, evidence items, leak insights, and savings projections.
  - Create `backend/app/features/readiness/service.py`:
    - History vs account age vs active days logic.
    - Tiered readiness evaluation (<7d, 7-29d, 30-89d, >=90d).
    - Recurring subscription detection with evidence requirement (>=2 txns, ±5% tolerance).
    - Dormant recurring detection (>30d inactive).
    - Excessive category spend against budget or historical baseline.
    - Annual subscription check (requires >=365d, otherwise states limitation).
    - Transparent savings calculations with non-guarantee disclosures.
    - Strict user-isolation and completed-only transaction filters.

- [ ] **Task 3: Expose REST Endpoints**
  - Create `backend/app/api/routes/spend_leaks.py`:
    - `GET /spend-leaks/readiness`
    - `GET /spend-leaks/insights`
  - Register in `backend/app/api/router.py`.

- [ ] **Task 4: Write Backend Pytest Suite**
  - Create `backend/tests/unit/test_readiness_service.py` covering all 16 test cases required by section 8.
  - Verify tenant isolation, zero transaction accounts, single day transactions, gap detection, annual subscription limits, and demo data isolation.

- [ ] **Task 5: Frontend API Integration & UI Enhancements**
  - Add API client methods in `frontend/src/lib/api-client.ts`.
  - Update `frontend/src/app/app/spend-leak-detector/page.tsx` with:
    - Compact Data-Readiness Panel.
    - Honest limitations and status badges for insights.
    - Evidence drill-down drawer or badges.
    - Annual subscription disclaimer if history < 365 days.
    - Demo dataset banner if viewing synthetic demo records.

- [ ] **Task 6: Verification & Production Deployment**
  - Run `python -m pytest` across entire test suite.
  - Run frontend `npm test` and `npm run build`.
  - Deploy to Vercel production and verify live deployment.
  - Document verification in `docs/spec-kit/spend-leak-readiness/5-verification.md`.
