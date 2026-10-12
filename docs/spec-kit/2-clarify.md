# FINROQ Spec Kit — Step 2: Clarification
## Repository Audit & Architecture Resolution

### 1. Existing Authentication Endpoints
- **Endpoints**:
  - `POST /api/v1/auth/login`: Accepts `LoginRequest(email, password)`, returns `Token(access_token, token_type="bearer", user)`.
  - `POST /api/v1/auth/register`: Accepts `UserCreate(email, password, full_name)`, returns `UserResponse`.
  - `GET /api/v1/auth/me`: Authenticated endpoint returning current user profile.
- **Session Handling**:
  - Stored in `localStorage` under `finroq_access_token` and `finroq_user`.
  - AuthContext provides `isAuthenticated`, `user`, `login(email, password)`, `register(email, password, fullName)`, and `logout()`.

### 2. Verified Demo Account Mechanism
- Seeded via `seed_demo.py` in the SQLite database:
  - **Email**: `demo@finroq.com`
  - **Password**: `password123`
  - **Accounts**: 4 accounts (Savings $52.4k, Checking $8.8k, Investments $18.0k, Credit Card -$1.25k).
  - **Transactions**: 18 pre-loaded transactions across varied categories.
  - **Budgets & Recurring**: Active monthly budgets and recurring subscriptions (Broadband, Gym, Spotify).

### 3. Authoritative Financial Calculations vs Demo Simulations
- Authoritative backend services:
  - `finance_engine.py`: Computes completed-only net cash flow, assets, liabilities, and net worth using exact Python `Decimal`. Excludes transfers from income/expense totals.
  - `budget_service.py`: Computes category spending, utilization percentages, and overspending flags.
  - `recurring_service.py`: Computes calendar date advancements with month-end clamping and duplicate prevention.
- Public Landing Simulations:
  - Isolated client-side state using integer paise arithmetic.
  - Interactive toggles do NOT mutate authenticated database records.

### 4. Route Architecture & Mapping
- Public Landing: `/`
- Authentication: `/auth/sign-in` (and `/login`), `/auth/sign-up` (and `/register`)
- Authenticated Hub: `/app/home`
- 12 Dedicated Modules under `/app/*`:
  1. `/app/expense-tracking` (and `/transactions`)
  2. `/app/budgeting` (and `/budgets`)
  3. `/app/splitter` (and `/splitter`)
  4. `/app/pre-spend-check` (and `/pre-spend-check`)
  5. `/app/net-worth` (and `/net-worth`)
  6. `/app/debt-watchdog` (and `/debt-watchdog`)
  7. `/app/spend-leak-detector` (and `/spend-leaks`)
  8. `/app/goal-timeline` (and `/insights`)
  9. `/app/emergency-cushion` (and `/emergency-cushion`)
  10. `/app/money-guides` (and `/guides`)
  11. `/app/credit-health` (and `/credit-health`)
  12. `/app/financial-health` (and `/financial-health`)

### 5. Motion & Scrolling
- Lenis already installed in `SmoothScrollProvider.tsx`.
- Curtain wipe transition component with forward (upward curtain) and backward (downward curtain) options.
