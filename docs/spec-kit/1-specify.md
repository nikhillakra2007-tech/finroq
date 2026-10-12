# FINROQ Spec Kit — Step 1: Specification
## Reference-Driven Frontend Replacement & 12-Module Finance Hub

### 1. Objective & Scope
Completely replace the current frontend presentation and application shell with a reference-driven implementation inspired by `Finroq.html`, retaining all authoritative backend services, calculations, database schemas, and authentication APIs.

### 2. Core User Experience Architecture
1. **Public Marketing Landing (`/`)**:
   - Clean sticky navigation with Finroq wordmark, section anchors (`#ledger`, `#budgets`, `#simulator`, `#features`), theme toggle, and auth actions.
   - Hero section with exact copy ("Personal finance, done precisely / Your money, to the paisa") and live-feeling sample data preview (Net worth, Assets, Liabilities).
   - Technical trust strip: `NUMERIC(14,2) money`, `Argon2id password hashing`, `JWT sessions`, `Per-user data isolation`.
   - Feature 1: Exact Ledger ("A ledger that always adds up") with interactive sample status toggling (`Completed` / `Pending` / `Cancelled`) and real-time net cash flow recalculation.
   - Feature 2: Category Budgets ("Budgets that watch themselves") with meters, status warnings, and duplicate-safe recurring occurrence demonstration.
   - Feature 3: Interactive Budget Comparison Graph with dynamic sliders/inputs (allocated cap, actual spend, category picker) with instant bar recalculations, remaining cushion, and over-budget warnings.
   - Feature 4: Interactive Savings-Goal Timeline Simulator with adjustable target, current savings, monthly recurring savings, discretionary spend redirection, milestone timeline markers, and completion estimates (`ceil(remaining / contribution)`).
   - Feature 5: Recurring bills and automation mechanics.
   - Feature 6: Discovery of All 12 FINROQ Financial Modules in 4 structured categories (Track, Decide, Build, Protect).
   - Feature 7: Mathematical precision & security guarantees.
   - Closing CTA & minimal footer with sample-data disclosure.

2. **Authentication Flow (`/auth/sign-in`, `/auth/sign-up`, `/login`, `/register`)**:
   - Desktop 2-column layout (forest green brand panel on left with verified technical guarantees, clean segmented sign-in/register card on right). Mobile single-column responsive.
   - Welcoming copy: "Welcome back / Your financial picture is waiting for you."
   - Integration with real FastAPI JWT endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`).
   - "Use the demo account" button connecting directly to verified seed credentials (`demo@finroq.com` / `password123`).
   - Full-screen curtain wipe transition (`#curtain`) with brand wordmark and forward/reverse directionality.

3. **Authenticated Hub (`/app/home`)**:
   - Clean top app bar with Finroq logo, greeting ("Hello, {name}"), theme toggle, and Sign out button.
   - Executive launcher hero ("Welcome back / Choose what you want to work on today").
   - **EXACTLY TWELVE rounded-square feature cards** arranged in a deliberate 4×3 grid (4 columns desktop, 2-3 columns tablet, 1-2 columns mobile).
   - Zero competing dashboard charts, tables, or widgets on this home page. It is a dedicated, distraction-free module launcher.
   - Clean category badges and arrow cues on each card.
   - Every card navigates to its dedicated route:
     1. `/app/expense-tracking` (Expense Tracking & Ledger)
     2. `/app/budgeting` (Daily & Monthly Budgeting)
     3. `/app/splitter` (Shared Expense Splitter)
     4. `/app/pre-spend-check` (Pre-Spend Cushion Checker)
     5. `/app/net-worth` (Net Worth Balance Sheet)
     6. `/app/debt-watchdog` (EMI & Debt Watchdog)
     7. `/app/spend-leak-detector` (Spend Leak Detector)
     8. `/app/goal-timeline` (Goal Timeline Simulator)
     9. `/app/emergency-cushion` (Emergency Cushion Calculator)
     10. `/app/money-guides` (Practical Financial Guides)
     11. `/app/credit-health` (Credit Health & Guidance)
     12. `/app/financial-health` (Integrated Financial Health)

4. **Twelve Dedicated Feature Routes**:
   - Uniform shell with a prominent **"← Back to home"** button returning directly to `/app/home`.
   - Clear module title, description, and active API integrations.
   - Real data isolation and graceful handling of empty or error states.

### 3. Design System & Visual Identity
- **Background**: `#F5F7F5` (`--bg`), Surface: `#FFFFFF` (`--surface`)
- **Primary Ink**: `#121B17` (`--ink`), Muted: `#5E6B65` (`--muted`), Line: `#DCE3DF` (`--line`)
- **Accent Green**: `#1E6A4E` (`--accent`), Accent Ink: `#FFFFFF`
- **Negative / Bad**: `#B3382C` (`--bad`), Warning / Pending: `#8A6A12` (`--wait`)
- **Typography**: Display: `Bricolage Grotesque`, Body: `Hanken Grotesk`, Numbers: `JetBrains Mono`
- **Motion**: Lenis smooth scrolling for marketing landing, CSS/JS curtain wipe transitions, and scroll reveal effects respecting `prefers-reduced-motion`.
