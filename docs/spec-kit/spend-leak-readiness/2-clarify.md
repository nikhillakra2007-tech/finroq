# FINROQ Spec Kit — Step 2: Clarification
## Architectural Clarifications & Design Choices

### 1. Database Schema Additions
- **Field**: `Transaction.source = Column(String(32), nullable=False, default="manual")`
- **Values**: `"manual"`, `"statement_import"`, `"seed_demo"`, `"provider_sync"`.
- Documented schema rationale: Captures provenance at the transaction record boundary without adding bulky ancillary tables. Reuses existing `Transaction` entity.

### 2. Accounting Invariants Handled
- Only `COMPLETED` transactions are eligible for leak detection (`status == 'completed'`).
- `PENDING` and `CANCELLED` transactions are strictly excluded from leak totals.
- `TRANSFER` transactions between owned accounts are excluded from expenditure and leak calculations.
- Refunds (`related_transaction_id` is not null) are netted into the original transaction.

### 3. Coverage Calculations
- **Earliest / Latest Dates**: Computed via `MIN(transaction_date)` and `MAX(transaction_date)` over eligible transactions for the user.
- **Available History Days**: `(latest_date.date() - earliest_date.date()).days + 1` if transactions exist, else `0`.
- **Observed Active Days**: `COUNT(DISTINCT DATE(transaction_date))` over eligible transactions.
- **Data Freshness**: `(now.date() - latest_date.date()).days`.
- **Gaps / Missing Periods**: Detected when consecutive transaction dates differ by >45 days within the available window.

### 4. Readiness Service Endpoint
- `GET /api/v1/spend-leaks/readiness`: Lightweight summary of coverage, active days, provenance counts, demo status, and readiness tier.
- `GET /api/v1/spend-leaks/insights`: Deep analysis returning evidence-backed findings for subscriptions, excessive category spend, dormant recurring charges, and savings estimates with explicit limitations.
