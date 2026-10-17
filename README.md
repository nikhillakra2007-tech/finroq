# 🏦 FINROQ — Intelligent Financial Accounting Engine

<div align="center">

![FINROQ Banner](https://img.shields.io/badge/FINROQ-v1.4.0--PROD-173F2B?style=for-the-badge&logo=cashapp&logoColor=C7F36B)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://finroq-app.vercel.app)
![Agentic Crash-Test](https://img.shields.io/badge/Crash--Test-6--Agent%20Pipeline-173F2B?style=for-the-badge&logo=shield&logoColor=C7F36B)
![Pytest Suite](https://img.shields.io/badge/Pytest-194%2F194%20Passed-247A50?style=for-the-badge&logo=pytest&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Jest-58%2F58%20Passed-247A50?style=for-the-badge&logo=jest&logoColor=white)
![Finroq AI](https://img.shields.io/badge/Finroq%20AI-Floating%20Launcher%20%26%20Voice-173F2B?style=for-the-badge&logo=openai&logoColor=C7F36B)
![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

<p align="center">
  <b>Enterprise-grade double-entry personal finance engine with arbitrary-precision decimal arithmetic, 13 unified financial modules, 6-agent autonomous financial crash-testing, 18-language internationalization, Google popup authentication, adaptive dark/light themes, bank statement ingestion, and Floating Finroq AI personal financial intelligence agent with voice recognition.</b>
</p>

🔗 **Live Production Deployment**: [https://finroq-app.vercel.app](https://finroq-app.vercel.app)  
</div>

---

## 📸 Live Application Exhibits

Captured directly from production on [finroq-app.vercel.app](https://finroq-app.vercel.app) with borderless high-resolution clarity:

<div align="center">

### Cinematic Engine Telemetry Boot Sequence
*Autonomous hardware-grade system calibration verifying NUMERIC(14,2) registers, purging float drift, and securing Argon2id enclaves upon entry.*

![Cinematic Engine Telemetry Boot Sequence](docs/assets/finroq-landing-boot.png)

<br/>

### Precision Landing Hero & Live Ledger Engine
*Arbitrary decimal precision hero showcasing live double-entry postings, zero float drift telemetry, balance sparklines, and interactive telemetry replay controls.*

![Precision Landing Hero](docs/assets/finroq-landing-hero.png)

<br/>

### Four Autonomous Systems Bento Architecture
*Interlocked financial ecosystem: Deterministic AI Copilot, Multi-Scenario Crash-Test Simulator, Zero-Trust Privacy Vault, and Dynamic Category Budgets & Pacing.*

![Four Autonomous Systems Bento](docs/assets/finroq-landing-bento.png)

<br/>

| Autonomous 6-Agent Crash-Test Engine | Evidence-Driven Spend Leak Detector |
|:---:|:---:|
| ![Autonomous Crash-Test Engine](docs/assets/finroq-crash-test.png) | ![Spend Leak Detector](docs/assets/finroq-spend-leak.png) |
| *6-Agent shock traversal simulating career shocks, hospital spikes, and cost-of-living crunches.* | *Evidence-driven audit identifying recurring subscriptions, micro-charges, and irregular surges.* |

| 13-Module Unified Financial Workspace Hub | Pre-Spend Decision Engine |
|:---:|:---:|
| ![FINROQ Live 13-Module Hub](docs/assets/finroq-app-home-live.png) | ![Pre-Spend Check](docs/assets/finroq-prespend-check.png) |
| *Unified workspace view displaying all 13 financial engines with instant 18-language selector.* | *Real-time pre-purchase simulation on remaining budget caps.* |

</div>

---

## 🌟 Core Architectural Pillars

- ⚖️ **Arbitrary-Precision Decimal Arithmetic**: Powered by Python `Decimal` and database `NUMERIC(14, 2)`. Completely eliminates IEEE 754 floating-point drift across currency conversions, allocations, and ledger entries.
- 🎨 **Adaptive Ivory & Forest Theming**: Warm Ivory (`#F7F7F0`) light mode with deep contrast typography and deep forest (`#0D1411`) dark mode with zero-FOUC pre-hydration scripts and system-preference detection.
- 🌍 **Comprehensive 18-Language Internationalization**: Full prototype coverage for 18 global languages (English, Hindi, Bengali, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Spanish, French, German, Japanese, Chinese) with responsive typography protection that eliminates text overflow.
- 🔐 **Google Popup Authentication**: Modern popup-based Google OAuth flow (`/auth/google-popup`) with multi-channel cross-window communication (`window.postMessage`, storage dispatch, fallback sync) and persistent AuthContext state.
- 🤖 **Floating Finroq AI Financial Companion**: Non-intrusive floating launcher on the bottom-right corner of both landing and workspace pages with voice recognition and automatic response language adaptation.
- 🔄 **Unified Decimal Ledger Model**: Single authoritative source of truth. All 13 modules read completed transactions, live accounts, and net-worth metrics directly from the shared financial core.
- 📥 **Robust Bank Statement Ingestion**: Multi-format CSV/TSV dialect sniffer, duplicate detection, and interactive pre-commit review.
- 🛡️ **Zero-Hallucination Safe AI Pipeline**: Strict 3-layer architecture where authoritative numbers are deterministically computed in Python before any context reaches Google Gemini or OpenAI.

---

## 🏛 System Architecture

The FINROQ platform follows a clean, decoupled 4-tier architecture designed for high throughput, cryptographic tenant isolation, and mathematical certainty:

```mermaid
flowchart TB
    subgraph CLIENT["Client Tier — Next.js 14 App Router"]
        UI["React 18 Server & Client Components<br/>Tailwind CSS + Lucide Icons"]
        I18N["i18n Context Engine<br/>18 Global Locales Instant Switch"]
        THEME["Theme Provider<br/>Ivory Light & Forest Dark"]
        AUTH_CTX["Auth Context & Token Store<br/>Stateless JWT & Google Popup Sync"]
        API_CLIENT["Centralized API Client<br/>Fetch with Auth Interceptors"]
        
        UI <--> I18N
        UI <--> THEME
        UI --> AUTH_CTX
        AUTH_CTX --> API_CLIENT
    end

    subgraph GATEWAY["API Gateway & Security — FastAPI"]
        ROUTER["REST Router /api/v1"]
        AUTH_GUARD["Tenant Guard & JWT Validator<br/>Argon2id Hashes + Sub Claims"]
        RATE_LIMIT["Rate Limiter & Quota Guard<br/>Tiered Entitlements Engine"]
        
        API_CLIENT -- "HTTPS / JSON + Bearer JWT" --> ROUTER
        ROUTER --> AUTH_GUARD
        AUTH_GUARD --> RATE_LIMIT
    end

    subgraph DOMAIN["Domain Services Tier"]
        ACC_SVC["Account Service<br/>Checking, Savings, Credit"]
        TXN_SVC["Transaction Service<br/>Double-Entry Commits & Statement Ingestion"]
        BUDGET_SVC["Budget Service<br/>Dynamic Caps & Burn Rate"]
        REC_SVC["Recurrence Engine<br/>Calendar Clamping 28 to 31 Days"]
        AI_SVC["AI Financial Agent Service<br/>Bounded Loop Orchestrator"]
    end

    RATE_LIMIT --> DOMAIN

    subgraph ENGINE["Authoritative Mathematical Core"]
        DECIMAL_ENGINE["Fixed-Point Decimal Math Engine<br/>Python Decimal Math — Zero Float Drift"]
        ANALYTICS_CORE["Deterministic Financial Analytics<br/>Net Worth, Runway, Health Scoring"]
        TOOLS_ENGINE["12 Deterministic Financial Tools<br/>Tools A–L with Pure Decimal Math"]
        
        DOMAIN <--> DECIMAL_ENGINE
        DECIMAL_ENGINE <--> ANALYTICS_CORE
        AI_SVC <--> TOOLS_ENGINE
        TOOLS_ENGINE <--> DECIMAL_ENGINE
    end

    subgraph PERSISTENCE["Persistence Tier — PostgreSQL 16"]
        ORM["SQLAlchemy 2.0 Async ORM<br/>asyncpg connection pool"]
        DB["PostgreSQL 16 Database<br/>NUMERIC 14,2 Columns + Tenant Indexes"]
        AI_STORE["AI Persistence Layer<br/>ai_conversations, ai_messages, ai_usage_logs"]
        ALEMBIC["Alembic Migrations<br/>Strict Versioned Schema"]
        
        DOMAIN --> ORM
        ORM --> DB
        ORM --> AI_STORE
        ALEMBIC -.-> DB
    end

    subgraph AI_PROVIDER["External AI Tier"]
        OPENAI["LLM Tool Calling Provider<br/>Bounded Max 5 Iterations Guardrail"]
        AI_SVC -. "Strict owner_id Scoped Tool Schemas" .-> OPENAI
    end

    style CLIENT fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
    style GATEWAY fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style DOMAIN fill:#F4F8F3,stroke:#247A50,stroke-width:2px;
    style ENGINE fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style PERSISTENCE fill:#DCE7D9,stroke:#173F2B,stroke-width:2px;
    style AI_PROVIDER fill:#F3E8FF,stroke:#8E75C4,stroke-width:2px;
```

---

## 🛡️ Autonomous 6-Agent Financial Crash-Test Engine

The **Crash-Test Engine** (`/app/crash-test`) is an interconnected 6-agent system that stress-tests a user's verified financial baseline against severe real-world shocks, identifies hidden fragility, and generates mathematically proven recovery plans without taking on high-cost debt.

```mermaid
flowchart TD
    subgraph LEDGER["Authoritative PostgreSQL Core (₹ INR)"]
        DATA["Verified Accounts & Transactions<br/>Checking: ₹1.85L • Emergency Cushion: ₹4.75L<br/>Monthly Inflow: ₹1.50L • Fixed Burn: ₹28K/mo Rent + ₹8.5K EMI"]
    end

    subgraph AGENT1["Agent 1: Context Ingestion Agent"]
        A1["Financial Context Profiler<br/>• Reconciles liquid reserves & essential living burn<br/>• Derives net cash flow & savings rate (63.0%)<br/>• Calculates liquid runway in months"]
    end

    subgraph AGENT2["Agent 2: Risk Investigation Agent"]
        A2["Autonomous Fragility Hunter<br/>• Formulates 5 proactive vulnerability hypotheses<br/>• Tests rigidity index & discretionary cushion (₹14.8K/mo)<br/>• Uncovers compound sensitivity (96% confidence)"]
    end

    subgraph AGENT3["Agent 3: Adaptive Crash-Test Engine"]
        A3["Multi-Shock Traversal Simulator<br/>• Evaluates 6 severe stress scenarios over 6-month horizon<br/>• Career pause, salary reduction, inflation surge, hospital bills<br/>• Models compound dual crises and pinpoints cash gap month"]
    end

    subgraph AGENT4["Agent 4: Recovery Planner Agent"]
        A4["Mathematical Budget Optimizer<br/>• Linear expenditure reallocation<br/>• Throttles flexible leisure spending to preserve liquidity<br/>• Conserves up to ₹1,08,000 cash across 6 months"]
    end

    subgraph AGENT5["Agent 5: Constraint Verifier Agent"]
        A5["Formal Invariant Proof Engine<br/>• Proves: ∀ t ∈ [1, H]: Reserves(t) ≥ 0<br/>• Verifies solvency margins & credit covenant limits<br/>• Mathematical guarantee: 100% feasibility, zero hallucinations"]
    end

    subgraph AGENT6["Agent 6: Action & Audit Orchestrator"]
        A6["Plain-English Delivery & Execution<br/>• Ranks actionable shields with confidence metrics<br/>• 1-Click user approval & score boost (+26 pts)<br/>• Telemetry audit trail & performance benchmarks"]
    end

    DATA -- "Verified Ledger History" --> A1
    A1 -- "Net Cash Flow & Liquid Runway" --> A2
    A2 -- "Stress Hypotheses & Rigid Commitments" --> A3
    A3 -- "6-Month Cash Gap Trajectories" --> A4
    A4 -- "Candidate Recovery Shields" --> A5
    A5 -- "Mathematically Proven Plans" --> A6

    style LEDGER fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style AGENT1 fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style AGENT2 fill:#F4F8F3,stroke:#247A50,stroke-width:2px;
    style AGENT3 fill:#FEF3C7,stroke:#B45309,stroke-width:2px;
    style AGENT4 fill:#E0E7FF,stroke:#3730A3,stroke-width:2px;
    style AGENT5 fill:#DCFCE7,stroke:#166534,stroke-width:2px;
    style AGENT6 fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
```

### The 6 Logical Agents Explained

| # | Agent Name | Architecture & Core Responsibilities | Mathematical Tooling & Guardrails |
|:---:|---|---|---|
| 1 | **Context Ingestion Agent** | Reconciles checking, savings, payroll, and debt commitments in INR (`₹`) into an immutable snapshot. | `account_balance()`, `fixed_burn()`, `liquid_runway = accessible_cash / fixed_monthly_expenses`. |
| 2 | **Risk Investigation Agent** | Autonomously formulates and tests structural cash-flow hypotheses without prompt assistance. | `rigidity_index()`, `discretionary_buffer_levers()`, multi-shock sensitivity matrix. |
| 3 | **Crash-Test Simulation Engine** | Traverses 6 multi-scenario shock graphs across a 6-month horizon to pinpoint deficit months. | Deterministic monthly balance trajectory: $B_t = B_{t-1} + \Delta\text{Inflow}_t - \Delta\text{Outflow}_t$. |
| 4 | **Recovery Planner Agent** | Formulates self-funded budget recovery paths by throttling flexible spending instead of borrowing. | Linear budget reallocation, discretionary pause pacing, emergency cushion preservation. |
| 5 | **Constraint Verifier Agent** | Rigorously proves non-negativity across all shock months, eliminating AI hallucinations. | Invariant validation: $\forall t \in [1, 6]: \text{Reserves}(t) \ge 0$, debt covenant checking. |
| 6 | **Action & Audit Orchestrator** | Synthesizes verified math into plain-English advice and 1-click user authorization hooks. | Priority rank matrix, 1-click ledger execution, benchmark telemetry reporting. |

---

## 🔄 Financial Accounting Lifecycle & Data Pipeline

Every transaction, whether manually entered, imported from a bank statement, or simulated via the Pre-Spend sandbox, traverses a deterministic processing pipeline:

```mermaid
flowchart TD
    START["Transaction Ingestion Trigger"] --> SRC{"Source Type"}
    
    SRC -- "Bank Statement" --> CSV["CSV/TSV Upload"]
    SRC -- "Manual Entry" --> MANUAL["Direct Ledger Entry Form"]
    SRC -- "Sandbox / Pre-Spend" --> SIM["Pre-Spend Impact Simulator"]
    SRC -- "Auto-Recurrence" --> REC["Calendar Clamped Rule"]
    
    CSV --> SNIFF["Dialect Sniffer (Delimiters, Header Normalizer)"]
    SNIFF --> DEDUP["Duplicate Transaction Hash Matcher"]
    DEDUP --> PREVIEW["Client Review & Category Editor"]
    PREVIEW --> BATCH["Atomic Batch Preparation"]
    
    MANUAL --> VALID["Payload Validation & Schema Check"]
    SIM --> VALID
    REC --> VALID
    BATCH --> VALID
    
    VALID --> CAST["Strict Decimal Numeric Cast (Paise / Cents)"]
    CAST --> IS_TFR{"Is Inter-Account Transfer?"}
    
    IS_TFR -- "Yes" --> TFR_LOGIC["Credit Source Account (-)<br/>Debit Destination Account (+)<br/>Net Cash Flow Impact: Neutral (₹0.00)"]
    IS_TFR -- "No" --> DIR_LOGIC["Single Account Balance Update<br/>Update Category Spend Accumulator"]
    
    TFR_LOGIC --> COMMIT["Atomic ACID Transaction Commit (PostgreSQL)"]
    DIR_LOGIC --> COMMIT
    
    COMMIT --> RECALC["Real-time Reactive Metric Propagation"]
    
    subgraph MODULES["Reactive Cross-Module Metric Refresh"]
        RECALC --> M1["Expense Tracking Ledger"]
        RECALC --> M2["Category Budgets & Cushion"]
        RECALC --> M3["Net Worth Architecture"]
        RECALC --> M4["Credit Utilization Ratio"]
        RECALC --> M5["Emergency Runway Projection"]
        RECALC --> M6["Spend Leak Classifier"]
    end

    style START fill:#173F2B,stroke:#C7F36B,color:#FFFFFF,stroke-width:2px;
    style COMMIT fill:#247A50,stroke:#C7F36B,color:#FFFFFF,stroke-width:2px;
    style MODULES fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
```

---

## 🧩 13 Unified Financial Modules

| # | Financial Engine | Route | Core Mathematical & Architectural Function |
|:---:|---|---|---|
| 1 | **Expense Tracking** | `/app/expense-tracking` | Real-time double-entry ledger with status cycle (Completed / Pending / Cancelled), account filters, and atomic statement ingestion. |
| 2 | **Daily Budgeting** | `/app/budgeting` | Category spend limits compared against actual verified transactions; neutral transfers excluded automatically. |
| 3 | **Expense Splitter** | `/app/splitter` | Multi-party split engine supporting exact equal shares and custom weights with one-click ledger settlement. |
| 4 | **Pre-Spend Check** | `/app/pre-spend-check` | Pre-transaction diagnostic testing the impact of a planned purchase on remaining category cushion before swiping. |
| 5 | **Net Worth** | `/app/net-worth` | Authoritative calculation of liquid assets minus liabilities across checking, savings, investment, and debt accounts. |
| 6 | **Debt Watchdog** | `/app/debt-watchdog` | Tracks outstanding loan commitments, debt amortizations, and monthly debt-to-income ratios. |
| 7 | **Spend Leak Detector** | `/app/spend-leak-detector` | Evidence-driven audit identifying recurring subscriptions, phantom micro-charges, and irregular spend surges. |
| 8 | **Goal Timeline Simulator** | `/app/goal-timeline` | Mathematical milestone projector using formula `ceil((Target - Saved) / MonthlySavings)`. |
| 9 | **Emergency Cushion** | `/app/emergency-cushion` | Computes liquid burn runway in months based on essential vs discretionary historical spending. |
| 10 | **Money Guides** | `/app/money-guides` | Curated editorial frameworks (50/30/20 rule, debt avalanche/snowball, liquidity buffers, crash-test terminologies) with visual models. |
| 11 | **Credit Health** | `/app/credit-health` | Monitors credit card utilization against aggregate limits to protect credit scores. |
| 12 | **Financial Health Score** | `/app/financial-health` | Composite vitality diagnostic (0–100) aggregating savings rate, debt ratio, runway, and budget discipline. |
| 13 | **Crash-Test & Resilience** | `/app/crash-test` | Autonomous 6-agent shock traversal, multi-scenario compound crisis simulation, and mathematical invariant recovery proof. |

---

## 🧪 Verification & Test Suite Results

Every test and validation check passes with 100% compliance:

| Target | Command | Result | Status |
|:---|:---|:---|:---:|
| **Backend Pytest Suite** | `pytest -o pythonpath=.` | **194/194 passed (12 AI Tools + Auth + Double Entry)** | ✅ PASS |
| **Frontend Jest Tests** | `npm test -- --watchAll=false` | **58/58 passed across all suites** | ✅ PASS |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors (Strict mode clean)** | ✅ PASS |
| **Next.js Production Build** | `npm run build` | **25/25 static routes prerendered cleanly** | ✅ PASS |
| **Live Vercel Production** | `https://finroq-app.vercel.app` | **HTTP 200 OK (Google Popup Auth + Voice Speech + 18 Locales)** | ✅ PASS |
| **Live App Hub** | `https://finroq-app.vercel.app/app/home` | **HTTP 200 OK (13-Module Hub + Green CTA)** | ✅ PASS |
| **Live Crash-Test Engine** | `https://finroq-app.vercel.app/app/crash-test` | **HTTP 200 OK (6-Agent Autonomous Stress Testing)** | ✅ PASS |

---

## 🚀 Local Development Setup

### Prerequisites
- **Python**: 3.12+
- **Node.js**: 20+
- **PostgreSQL**: 16+

### 1. Database Setup
```bash
# Using Docker
docker compose up -d postgres

# Or native PostgreSQL
psql -U postgres -c "CREATE USER finroq WITH PASSWORD 'finroq_dev_secret';"
psql -U postgres -c "CREATE DATABASE finroq OWNER finroq;"
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Linux/macOS
.\.venv\Scripts\Activate.ps1    # On Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed demo data
alembic upgrade head
python seed_demo.py

# Start FastAPI server
python -m app.main
```
> API available at `http://localhost:8000` (Swagger UI documentation at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> Web application accessible locally at `http://localhost:3000`.

---

## 🌐 Production Deployment

- **Primary Production URL**: **[https://finroq-app.vercel.app](https://finroq-app.vercel.app)**
- **Direct Workspace Hub**: **[https://finroq-app.vercel.app/app/home](https://finroq-app.vercel.app/app/home)**
- **Autonomous Crash-Test Engine**: **[https://finroq-app.vercel.app/app/crash-test](https://finroq-app.vercel.app/app/crash-test)**
- **GitHub Repository**: **[https://github.com/nikhillakra2007-tech/finroq](https://github.com/nikhillakra2007-tech/finroq)**

---

## 📄 License

FINROQ is proprietary software designed for high-security personal finance operations. All rights reserved.
