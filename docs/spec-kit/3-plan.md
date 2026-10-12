# FINROQ Spec Kit — Step 3: Implementation Plan
## Systematic Execution Phases

### Phase 1: Shared Design Tokens & Motion Foundation
- Configure CSS variables and Tailwind tokens for `Finroq.html` palette (`--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--bad`, `--wait`).
- Import Google Fonts: `Bricolage Grotesque`, `Hanken Grotesk`, `JetBrains Mono`.
- Implement `CurtainTransition.tsx` with forward/backward wipes, brand wordmark, and accessibility flags (`prefers-reduced-motion`).

### Phase 2: Reference-Driven Marketing Landing Page (`/`)
- Header with Finroq logo, anchor links, theme switcher, and auth triggers.
- Hero with copy, net worth preview cards, and sample-data notice.
- Proof strip with technical guarantees.
- Feature 1: Spend Tracker & Ledger with interactive status cycling and net cash flow updates.
- Feature 2: Monthly Budgets & safe recurring occurrence demo button.
- Feature 3: Interactive Budget Comparison Graph with sliders, category switching, and real-time overspending alerts.
- Feature 4: Interactive Savings-Goal Timeline Simulator with adjustable target, current balance, monthly contributions, spend cut redirection scenario, and timeline projection.
- Feature 5: Recurring bills and duplicate-safe occurrence automation.
- Feature 6: 12-Module Finance Explorer grid with categorized preview cards.
- Feature 7: Precision & Security guarantees.
- Closing CTA and footer.

### Phase 3: Welcoming Authentication Experience
- Clean 2-column layout (Green brand sidebar with security guarantees + segmented login/register card).
- Connect to `apiClient.login` and `apiClient.register`.
- "Use the demo account" button pre-filling / logging in to verified demo credentials.
- Curtain transition forward into `/app/home`.

### Phase 4: Authenticated 12-Module Home Hub (`/app/home`)
- Create dedicated route at `/app/home`.
- App bar with logo, user greeting, theme toggle, and Sign out action.
- Focused headline: "Welcome back / Choose what you want to work on today."
- Deliberate 4×3 grid containing **EXACTLY TWELVE rounded-square feature cards**.
- No competing dashboard widgets, charts, or tables on this screen.
- Active card hover/focus feedback and navigation to dedicated feature routes.

### Phase 5: Twelve Dedicated Feature Routes (`/app/*`)
- Ensure all 12 routes under `/app/` provide a clean shell with a prominent **"← Back to home"** button returning to `/app/home`.
- Reuse existing backend API integrations (Transactions, Budgets, Net Worth, Recurring, AI Insights, Pre-Spend Check, Spend Leaks, Splitter, Emergency Cushion, Debt Watchdog, Credit Health, Financial Health).

### Phase 6: Verification & Testing
- Run Jest test suite (`npm test -- --watchAll=false`).
- Run Next.js production build (`npm run build`).
- Run Backend Pytest suite (`pytest -v`).
- Document verification in `docs/spec-kit/5-verification.md`.
