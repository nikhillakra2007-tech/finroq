# FINROQ Spec Kit — Step 1: Specification
## Spend Leak Detector Data Readiness, History Coverage & Insight Confidence

### 1. Objective
Make the Spend Leak Detector evidence-driven by determining whether sufficient trustworthy financial history exists before producing recurring-spend findings, subscription warnings, spending-leak estimates, or projected savings.

The detector must never infer that the user has been actively using FINROQ for a particular duration merely because an account was created, a seed dataset exists, or the earliest transaction is old.

### 2. Core Principles & Distinctions
1. **Account Age**: How long the FINROQ account has existed (`User.created_at`).
2. **Available History**: The period between earliest and latest eligible transaction dates.
3. **Observed Activity**: The count and specific dates on which eligible transactions occurred.
4. **Verified Coverage**: The period for which the source provides sufficient evidence of complete records (e.g. verified statement imports or provider sync).
5. **Data Freshness**: How recently the underlying source was updated relative to the analysis time.

### 3. Data Readiness Assessment Policy
- **Under 7 calendar days**: Limited evidence (`insufficient_evidence` / `limited_evidence`).
- **7–29 calendar days**: Preliminary observations (`preliminary`).
- **30–89 calendar days**: Provisional trends (`provisional`).
- **90 or more calendar days**: Eligible for stronger historical comparisons (`sufficiently_supported`).

### 4. Insight-Specific Evidence Requirements
- **Recurring Subscriptions**: Requires >=2 occurrences with regular intervals (weekly/monthly ± tolerance) and amount tolerance. A single transaction must never be labeled as a confirmed subscription.
- **Annual Subscriptions**: Requires >=365 days of history or explicit user recurrence. When unavailable, explicitly states annual recurrence cannot yet be assessed.
- **Excessive Category Spending**: Requires valid category data, >=30 days of history, and a baseline comparison (budget allocation or historical multi-period average).
- **Recurring-Cost Inflation**: Compares equivalent periods accounting for transaction volume and coverage.
- **Hidden / Repeated Leakage**: Identifies specific underlying transactions with traceable dates and amounts.
- **Potential Savings**: Separates observed expenditure from future projections; states explicit assumptions; does not guarantee recovered money.

### 5. Provenance & Demo Isolation
- Every transaction tracks its provenance: `manual`, `statement_import`, `provider_sync`, or `seed_demo`.
- Demo seed datasets are explicitly flagged and isolated from real user insights.

### 6. User Interface
- Compact Data-Readiness Panel atop `/app/spend-leak-detector`.
- Clear distinction between active transaction days and covered calendar days.
- Insight confidence badges grounded in evidence rules without arbitrary percentage numbers.
