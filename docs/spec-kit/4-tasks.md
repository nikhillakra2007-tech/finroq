# FINROQ Spec Kit — Step 4: Actionable Tasks

- [ ] **Task 1: Design Tokens & Typography**
  - Add Google Fonts (`Bricolage Grotesque`, `Hanken Grotesk`, `JetBrains Mono`) to `globals.css`.
  - Update `globals.css` and `tailwind.config.js` with tokens matching `Finroq.html` (`--bg: #F5F7F5`, `--surface: #FFFFFF`, `--ink: #121B17`, `--muted: #5E6B65`, `--line: #DCE3DF`, `--accent: #1E6A4E`, `--bad: #B3382C`, `--wait: #8A6A12`).

- [ ] **Task 2: Curtain Transition Component**
  - Create `src/components/layout/CurtainTransition.tsx` with forward and backward full-screen wipe animations, dynamic wordmarks (`finroq` / `welcome` / `ledger` / `home`), and `prefers-reduced-motion` handling.

- [ ] **Task 3: Landing Page Replacement (`/`)**
  - Replace `src/components/landing/LandingShowcase.tsx` and `src/app/page.tsx` with reference-driven marketing page:
    - Sticky Header with navigation (`#ledger`, `#budgets`, `#simulator`, `#features`), theme toggle, "Sign in", "Get started".
    - Hero with exact copy and sample net-worth / assets / liabilities preview cards.
    - Proof strip with technical guarantees.
    - Feature 1: Exact Ledger with status toggler (`Completed` / `Pending` / `Cancelled`) and net cash flow recalculation.
    - Feature 2: Category Budgets with meter bars and safe recurring recording occurrence demo button.
    - Feature 3: Interactive Budget Comparison Graph with sliders for allocated cap, monthly spend, category selection, and instant overspending warnings.
    - Feature 4: Interactive Savings-Goal Timeline Simulator with sliders for target, current savings, monthly contribution, spend cut redirect, and milestone completion periods.
    - Feature 5: Recurring bills and duplicate-safe automation.
    - Feature 6: All 12 FINROQ Features Grid (Track, Decide, Build, Protect).
    - Feature 7: Precision & Security guarantees.
    - Closing CTA & minimal footer with sample-data disclosure.

- [ ] **Task 4: Authentication Experience (`/login`, `/register`, `/auth/sign-in`, `/auth/sign-up`)**
  - Create modern 2-column authentication layout matching `Finroq.html` (forest green branding panel on left, clean segmented auth card on right).
  - Connect to real backend APIs (`/api/v1/auth/login`, `/api/v1/auth/register`).
  - Wire "Use the demo account" button to authenticate with real demo credentials (`demo@finroq.com` / `password123`).
  - Transition on successful authentication directly to `/app/home`.

- [ ] **Task 5: Authenticated 12-Module Home Hub (`/app/home`)**
  - Create `src/app/app/home/page.tsx` displaying exactly twelve rounded-square feature cards in a 4×3 grid.
  - Zero competing charts, tables, or widgets.
  - Category tags (Track & Control, Decide Before Spending, Build & Protect, Manage Obligations).
  - Active hover/focus feedback and navigation to dedicated feature routes.

- [ ] **Task 6: Twelve Dedicated Feature Routes (`/app/*`)**
  - Build or alias all 12 feature routes under `/app/`:
    - `/app/expense-tracking` (Expense Tracking & Ledger)
    - `/app/budgeting` (Daily Budgeting)
    - `/app/splitter` (Expense Splitter)
    - `/app/pre-spend-check` (Pre-Spend Check)
    - `/app/net-worth` (Net Worth Balance Sheet)
    - `/app/debt-watchdog` (EMI & Debt Watchdog)
    - `/app/spend-leak-detector` (Spend Leak Detector)
    - `/app/goal-timeline` (Goal Timeline Simulator)
    - `/app/emergency-cushion` (Emergency Cushion)
    - `/app/money-guides` (Money Guides)
    - `/app/credit-health` (Credit Health)
    - `/app/financial-health` (Financial Health)
  - Ensure every feature page contains a prominent **"← Back to home"** button returning to `/app/home`.

- [ ] **Task 7: Test Suite & Build Verification**
  - Run frontend Jest unit tests.
  - Run Next.js production build (`npm run build`).
  - Run backend Pytest suite (`pytest -v`).
  - Record outcomes in `docs/spec-kit/5-verification.md`.
