# 🏦 FINROQ — Intelligent Financial Accounting Engine

<div align="center">

![FINROQ Banner](https://img.shields.io/badge/FINROQ-v1.5.0--PROD-173F2B?style=for-the-badge&logo=cashapp&logoColor=C7F36B)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://finroq-app.vercel.app)
![Financial Engines](https://img.shields.io/badge/Engines-17%20Unified%20Modules-173F2B?style=for-the-badge&logo=buffer&logoColor=C7F36B)
![Spend Leak Detector](https://img.shields.io/badge/Spend%20Leak-Evidence--Driven%20Audit-173F2B?style=for-the-badge&logo=radar&logoColor=C7F36B)
![Crash-Test Engine](https://img.shields.io/badge/Crash--Test-6--Agent%20Pipeline-173F2B?style=for-the-badge&logo=shield&logoColor=C7F36B)
![Pytest Suite](https://img.shields.io/badge/Pytest-247%2F247%20Passed-247A50?style=for-the-badge&logo=pytest&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Jest-87%2F87%20Passed-247A50?style=for-the-badge&logo=jest&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

<p align="center">
  <b>Enterprise-grade double-entry personal finance engine built with arbitrary-precision decimal arithmetic (zero float drift), 17 unified financial engines, persistent evidence-driven spend leak detection, 30-year quantum multiverse simulation, live IPO & youth investment radar, 6-agent autonomous stress testing, trustworthy bank statement & receipt reconciliation, 18-language internationalization, adaptive dark/light themes, and deterministic Finroq AI with source deep-linking.</b>
</p>

🔗 **Live Production Deployment on Vercel**: [https://finroq-app.vercel.app](https://finroq-app.vercel.app)  
</div>

---

## 📸 Live Application Exhibits

Captured directly from production on [finroq-app.vercel.app](https://finroq-app.vercel.app) with high-resolution clarity:

<div align="center">

### 1. 5-Second Cyber Vault Hacker Decrypt Intro
*Hardware-grade security enclave decrypt verifying NUMERIC(14,2) registers, intercepting recurring spend leaks, and accelerating wealth targets upon first site entry.*

![Cyber Vault Hacker Decrypt Intro](docs/assets/finroq-landing-boot.png)

<br/>

### 2. Precision Landing Hero & Live Ledger Engine
*Arbitrary decimal precision hero showcasing live double-entry postings, zero float drift telemetry, balance sparklines, and direct access to all financial systems.*

![Precision Landing Hero](docs/assets/finroq-landing-hero.png)

<br/>

### 3. Four Autonomous Systems Bento Architecture
*Interlocked financial ecosystem: Deterministic AI Copilot, Multi-Scenario Crash-Test Simulator, Zero-Trust Privacy Vault, and Dynamic Category Budgets & Pacing.*

![Four Autonomous Systems Bento](docs/assets/finroq-landing-bento.png)

<br/>

| 17-Engine Financial Workspace Hub | Evidence-Driven Spend Leak Detector |
|:---:|:---:|
| ![FINROQ Live 17-Engine Hub](docs/assets/finroq-app-home-live.png) | ![Spend Leak Detector](docs/assets/finroq-spend-leak.png) |
| *Unified workspace view displaying all 17 financial engines with instant 18-language selector and live portfolio stats.* | *Evidence-driven audit identifying recurring subscriptions, price hikes, and duplicate debits with interactive review lifecycle.* |

| Autonomous 6-Agent Crash-Test Engine | Pre-Spend Decision Engine |
|:---:|:---:|
| ![Autonomous Crash-Test Engine](docs/assets/finroq-crash-test.png) | ![Pre-Spend Check](docs/assets/finroq-prespend-check.png) |
| *6-Agent shock traversal simulating career shocks, hospital spikes, inflation waves, and mathematically proven recovery plans.* | *Real-time pre-purchase simulation testing affordability and remaining category cushion before swiping.* |

| 30-Year Quantum Multiverse Simulator | Youth Investment & Live IPO GMP Radar |
|:---:|:---:|
| ![Quantum Multiverse Simulator](docs/assets/finroq-multiverse.png) | ![Youth Investment & IPO Radar](docs/assets/finroq-predictions.png) |
| *Interactive 30-year wealth time-scrubber comparing parallel life forks (Fast FIRE vs Balanced vs Startup) under macro climate shocks.* | *Live Grey Market Premium (GMP %) telemetry, ₹100 micro-SIP compounding calculator, and verified AMFI mutual fund feeds.* |

</div>

---

## ⚡ Key Features & Workflows (To-The-Point)

### 1. 🔍 Evidence-Driven Spend Leak Detection Engine (`/app/spend-leak-detector`)
- **Cadence Interval Detection**: Automatically identifies recurring debits across 4 calendar frequencies (weekly 7d, bi-weekly 14d, monthly 30d, annual 365d) with adaptive date-jitter tolerance.
- **Price Hike & Surge Diagnostics**: Compares consecutive charges from the same merchant to flag stealth price increases (e.g. streaming service or SaaS tier jumps).
- **48-Hour Duplicate Charge Interception**: Pinpoints identical amounts debited by the same merchant within 48 hours, highlighting accidental double payments.
- **Persistent Finding Review Lifecycle**:
  - Findings are persisted in the database (`spend_leak_findings`) with states: `new` (Needs Review), `keep` (Legitimate/Wanted), and `dismissed` (Identified Leak to Eliminate).
  - Review actions are **strictly non-destructive**: dismissing or keeping a leak never mutates or deletes historical ledger transactions.
- **Deduplicated Savings Calculation**: Computes true potential monthly and annual savings by deduplicating distinct recurring patterns—ensuring duplicate transaction alerts do not artificially inflate projected savings.

### 2. 🌌 30-Year Quantum Multiverse Simulator (`/app/multiverse`)
- **Parallel Life Forks**: Models and graphs distinct financial journeys side-by-side in exact INR (`₹`):
  - *Fast FIRE*: 65% aggressive savings rate, high index allocation, financial independence at age 42.
  - *Balanced Corporate*: Steady career progression, moderate savings rate, comfortable retirement at age 60.
  - *Startup Bet*: High-risk equity upside with early cash flow sacrifice.
  - *Real Estate Heavy*: High asset tangibility with mortgage amortizations.
- **Macro Climate Stress Overlays**: Test any life fork against macroeconomic regimes: *Normal Growth* (12.5% Nifty CAGR), *High Inflation* (8.5% CPI), *Market Boom*, or *Tech Freeze / Recession*.
- **Interactive Scrubber**: Real-time slider scrubbing across age 20 to 50 with exact net worth and compound interest calculations.

### 3. 📈 Youth Investment Intelligence & Live IPO GMP Radar (`/app/predictions`)
- **Live IPO GMP Telemetry**: Real-time Grey Market Premium (`GMP %`) tracking, issue price bands, expected listing pop, and estimated subscription demand for upcoming Indian IPOs.
- **The Youngster Compounding Proof**: Demonstrates the mathematical advantage of starting early—investing from age 20 vs age 30 yields a **4.2x higher terminal wealth multiplier** for the exact same monthly contribution.
- **Micro-SIP Compounding Calculator**: Designed for college students and first-job professionals starting with as little as ₹100 to ₹500/month.
- **Curated AMFI Mutual Fund Feeds**: Direct telemetry of top low-minimum-SIP index and mid-cap mutual funds with live NAVs, 3-year/5-year CAGR, and risk profiles.

### 4. 🎬 5-Second Cyber Vault Hacker Decrypt Intro
- **First-Time Immersion**: Matrix-style cryptographic decrypt sequence greeting first-time visitors with 3D perspective cyber grids, audio telemetry, and leak-interception metrics.
- **Strict Single-Play Session**: Automatically records completion in `localStorage ('finroq_intro_seen')`. It plays strictly once on first visit and **never re-triggers** upon sign out, page navigation, or returning to the home page.
- **Instant Skip & Mute Controls**: Includes instantaneous ESC / Skip button and ambient audio mute toggle.

### 5. 📥 Trustworthy Bank Statement & Receipt Ingestion (`/app/expense-tracking`)
- **Bank Statement Processing**: Ingests CSV, TSV, text, and text-based PDF statements from all major banks.
- **Automatic Mathematical Reconciliation**:
  $$\text{Opening Balance} + \text{Total Credits} - \text{Total Debits} = \text{Expected Closing Balance}$$
  Discrepancies are highlighted with exact rupee variance rather than silently corrupting account balances.
- **Receipt & Bill Parsing**: Automatically extracts Merchant, Date, Subtotal, GST/Taxes, Discounts, and Total Amount from shopping bills and restaurant invoices.
- **3-Level Duplicate Shield**: Exact ID hash matching, same-day fingerprinting, and ±3-day cross-source tolerance between paper receipts and digital card debits.

---

## 🏛 System Architecture

The FINROQ platform follows a clean, decoupled 4-tier architecture designed for high throughput, cryptographic tenant isolation, and mathematical certainty:

```mermaid
flowchart TB
    subgraph CLIENT["Client Tier — Next.js 14 App Router (React 18)"]
        UI["17 Unified Financial Engine Modules<br/>Tailwind CSS + Lucide Icons"]
        I18N["i18n Context Engine<br/>18 Global Locales Instant Switch"]
        THEME["Theme Provider<br/>Ivory Light & Forest Dark"]
        AUTH_CTX["Auth Context & Token Store<br/>Stateless JWT & Google Popup Sync"]
        API_CLIENT["Centralized API Client<br/>Axios + Fetch with Auth Interceptors"]
        
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
        ACC_SVC["Account Service<br/>Checking, Savings, Investments, Debt"]
        TXN_SVC["Transaction Service<br/>Double-Entry Commits & Reversals"]
        BUDGET_SVC["Budget Service<br/>Category Caps & Burn Pacing"]
        LEAK_SVC["Spend Leak Detection Service<br/>Cadence Analysis & Review Lifecycle"]
        INGEST_SVC["Document Ingestion Service<br/>Bank Statement & Receipt Parser"]
        CRASH_SVC["6-Agent Crash-Test Engine<br/>Stress Simulation & Invariant Proof"]
        AI_SVC["Finroq AI Service<br/>Deterministic Tool Calling Pipeline"]
    end

    RATE_LIMIT --> DOMAIN

    subgraph ENGINE["Authoritative Mathematical Core (Zero Float Drift)"]
        DECIMAL_ENGINE["Fixed-Point Decimal Math Engine<br/>Python Decimal Math — Exact Paired Cent Accounting"]
        ANALYTICS_CORE["Deterministic Financial Analytics<br/>Net Worth, Solvency, Liquid Runway, Savings Rate"]
        TOOLS_ENGINE["12 Deterministic Financial Tools<br/>Tools A–L with Invariant Mathematical Proofs"]
        
        DOMAIN <--> DECIMAL_ENGINE
        DECIMAL_ENGINE <--> ANALYTICS_CORE
        AI_SVC <--> TOOLS_ENGINE
        TOOLS_ENGINE <--> DECIMAL_ENGINE
    end

    subgraph PERSISTENCE["Persistence Tier — PostgreSQL 16"]
        ORM["SQLAlchemy 2.0 Async ORM<br/>asyncpg high-throughput connection pool"]
        DB[("PostgreSQL 16 Database<br/>NUMERIC(14,2) Exact Decimal Storage")]
        TABLES["Core Schemas:<br/>• accounts • transactions • budgets<br/>• recurring_transactions • spend_leak_findings<br/>• ingestion_sessions • ai_messages"]
        ALEMBIC["Alembic Migrations<br/>Versioned Zero-Downtime DDL"]
        
        DOMAIN --> ORM
        ORM --> DB
        DB --- TABLES
        ALEMBIC -.-> DB
    end

    style CLIENT fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
    style GATEWAY fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style DOMAIN fill:#F4F8F3,stroke:#247A50,stroke-width:2px;
    style ENGINE fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style PERSISTENCE fill:#DCE7D9,stroke:#173F2B,stroke-width:2px;
```

---

## 🔄 Spend Leak Detection & Review Lifecycle Pipeline

The diagram below illustrates how raw ledger transactions are audited for leaks and managed through the non-destructive review lifecycle:

```mermaid
flowchart TD
    TXN_DATA["Shared PostgreSQL Ledger<br/>Completed Outflow Transactions"] --> INGEST["Spend Leak Detection Engine"]
    
    subgraph AUDIT["Deterministic Detection Algorithms"]
        INGEST --> CADENCE["Cadence Interval Sniffer<br/>Detects Weekly (7d), Bi-Weekly (14d),<br/>Monthly (30d), and Annual (365d) Patterns"]
        INGEST --> HIKE["Price Hike & Inflation Detector<br/>Flags Unannounced Cost Increases (Δ > 0)"]
        INGEST --> DUP["Duplicate Debit Detector<br/>Flags Identical Debits within 48 Hours"]
    end

    CADENCE --> COMPILE["Compile Candidates & Match Against Persistent State"]
    HIKE --> COMPILE
    DUP --> COMPILE

    COMPILE --> DB_FINDINGS[("spend_leak_findings Table<br/>Status: new | keep | dismissed")]
    
    DB_FINDINGS --> CLIENT_VIEW["Frontend Review Ledger (/app/spend-leak-detector)"]
    
    subgraph REVIEW["Interactive User Triage"]
        CLIENT_VIEW --> F1["Filter: Needs Review (new)"]
        CLIENT_VIEW --> F2["Filter: Kept (keep)"]
        CLIENT_VIEW --> F3["Filter: Dismissed Leaks (dismissed)"]
        
        CLIENT_VIEW -- "User clicks Keep" --> ACT_KEEP["Mark as Legitimate Mandate<br/>Status: keep"]
        CLIENT_VIEW -- "User clicks Dismiss" --> ACT_DISMISS["Mark as Unwanted Leak<br/>Status: dismissed"]
    end

    ACT_KEEP --> UPDATE_DB["Persist State to Database (Non-Destructive)"]
    ACT_DISMISS --> UPDATE_DB
    UPDATE_DB --> RECALC["Real-time Summary Metrics Recalculation"]

    subgraph METRICS["Authoritative Top-Level Metrics"]
        RECALC --> M_OUTFLOW["Estimated Recurring Outflow (Monthly)"]
        RECALC --> M_ANNUAL["Estimated Annual Outflow (12x)"]
        RECALC --> M_SAVINGS["Potential Monthly Savings<br/>(Deduplicated Distinct Leaks Dismissed)"]
        RECALC --> M_HIKES["Active Price Hikes & Anomalies"]
    end

    style TXN_DATA fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style AUDIT fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style DB_FINDINGS fill:#DCE7D9,stroke:#173F2B,stroke-width:2px;
    style REVIEW fill:#F7F7F0,stroke:#247A50,stroke-width:2px;
    style METRICS fill:#DCFCE7,stroke:#166534,stroke-width:2px;
```

---

## 🛡️ Autonomous 6-Agent Financial Crash-Test Engine

The **Crash-Test Engine** (`/app/crash-test`) evaluates personal financial baselines against severe real-world shocks, identifies fragility, and formulates mathematically proven recovery plans without taking on high-cost debt:

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

---

## 🔄 Financial Accounting Lifecycle & Reactive Propagation

Every transaction—whether manually entered, imported from a bank statement, or settled via Expense Splitter—traverses a deterministic processing pipeline:

```mermaid
flowchart TD
    START["Transaction Ingestion Trigger"] --> SRC{"Source Type"}
    
    SRC -- "Bank Statement / Receipt" --> CSV["Statement / Receipt Ingestion"]
    SRC -- "Manual Form" --> MANUAL["Double-Entry Form"]
    SRC -- "Pre-Spend Sandbox" --> SIM["Pre-Spend Simulation"]
    SRC -- "Auto-Recurrence" --> REC["Calendar Clamped Rule"]
    
    CSV --> SNIFF["Dialect Sniffer & Math Reconciliation Check"]
    SNIFF --> DEDUP["3-Level Duplicate Hash Matcher"]
    DEDUP --> PREVIEW["Interactive Review Modal (Verified / Flagged)"]
    PREVIEW --> BATCH["Atomic Batch Preparation"]
    
    MANUAL --> VALID["Payload Validation & Schema Check"]
    SIM --> VALID
    REC --> VALID
    BATCH --> VALID
    
    VALID --> CAST["Strict Decimal Numeric Cast (Paise / Cents)"]
    CAST --> IS_TFR{"Is Inter-Account Transfer?"}
    
    IS_TFR -- "Yes" --> TFR_LOGIC["Credit Source Account (-)<br/>Debit Destination Account (+)<br/>Net Cash Flow: Neutral (₹0.00)"]
    IS_TFR -- "No" --> DIR_LOGIC["Single Account Balance Update<br/>Update Category Spend Accumulator"]
    
    TFR_LOGIC --> COMMIT["Atomic ACID Transaction Commit (PostgreSQL)"]
    DIR_LOGIC --> COMMIT
    
    COMMIT --> RECALC["Real-time Metric Propagation across 17 Engines"]
    
    subgraph MODULES["Reactive Cross-Module Metric Refresh"]
        RECALC --> M1["Expense Tracking Ledger"]
        RECALC --> M2["Category Budgets & Cushion"]
        RECALC --> M3["Net Worth Architecture"]
        RECALC --> M4["Credit Utilization Ratio"]
        RECALC --> M5["Emergency Runway Projection"]
        RECALC --> M6["Spend Leak Detector & Review Ledger"]
        RECALC --> M7["Debt Watchdog & DTI Ratio"]
        RECALC --> M8["Crash-Test Baseline Profiler"]
    end

    style START fill:#173F2B,stroke:#C7F36B,color:#FFFFFF,stroke-width:2px;
    style COMMIT fill:#247A50,stroke:#C7F36B,color:#FFFFFF,stroke-width:2px;
    style MODULES fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
```

---

## 🧩 17 Unified Financial Modules

| # | Financial Engine | Route | Core Mathematical & Architectural Function |
|:---:|---|---|---|
| 1 | **Expense Tracking** | `/app/expense-tracking` | Real-time double-entry ledger with status cycle (Completed / Pending / Cancelled), account filters, and atomic statement ingestion. |
| 2 | **Budgeting** | `/app/budgeting` | Category spend limits compared against actual verified transactions; neutral transfers excluded automatically. |
| 3 | **Spend Leak Detector** | `/app/spend-leak-detector` | Evidence-driven audit identifying recurring subscriptions, phantom micro-charges, price hikes, and duplicate debits with review lifecycle. |
| 4 | **Pre-Spend Check** | `/app/pre-spend-check` | Pre-transaction diagnostic testing the impact of a planned purchase on remaining category cushion before swiping. |
| 5 | **What-If Life Timeline** | `/app/multiverse` | 30-Year Quantum Multiverse Simulator comparing parallel branches (Fast FIRE vs Balanced vs Startup) in ₹ INR under macro-climate shocks. |
| 6 | **Youth Investment & IPO Radar** | `/app/predictions` | Live Grey Market Premium (GMP %) telemetry, student-friendly micro-SIP compounding calculator, and verified AMFI mutual fund analytics. |
| 7 | **Crash-Test & Resilience** | `/app/crash-test` | Autonomous 6-agent shock traversal, multi-scenario compound crisis simulation, and mathematical invariant recovery proof. |
| 8 | **Financial Health Score** | `/app/financial-health` | Composite vitality diagnostic (0–100) aggregating savings rate, debt ratio, runway, and budget discipline. |
| 9 | **Net Worth Architecture** | `/app/net-worth` | Authoritative calculation of liquid assets minus liabilities across checking, savings, investment, and debt accounts. |
| 10 | **Emergency Cushion** | `/app/emergency-cushion` | Computes liquid burn runway in months based on essential vs discretionary historical spending. |
| 11 | **Debt Watchdog** | `/app/debt-watchdog` | Tracks outstanding loan commitments, debt amortizations, and monthly debt-to-income ratios. |
| 12 | **Goal Timeline Simulator** | `/app/goal-timeline` | Mathematical milestone projector using formula $\lceil(\text{Target} - \text{Saved}) / \text{MonthlySavings}\rceil$. |
| 13 | **Credit Health** | `/app/credit-health` | Monitors credit card utilization against aggregate limits to protect credit scores. |
| 14 | **Expense Splitter** | `/app/splitter` | Multi-party split engine supporting exact equal shares and custom weights with one-click ledger settlement. |
| 15 | **Money Guides & Visual Rules** | `/app/money-guides` | Curated editorial frameworks (50/30/20 rule, debt avalanche/snowball, 24-Hour Impulse Rule, Chai vs Compounding, UPI Zero-PIN Shield) with interactive visual models. |
| 16 | **Finroq AI Copilot** | `/app/ai-assistant` | Accessible financial companion that delivers straight-to-the-point answers upfront, provides expandable verified analysis (`📊 View Detailed Breakdown`), and cites clickable source feature badges. |
| 17 | **Statement & Receipt Ingestion** | `/app/expense-tracking` (Modal) | Full-featured document ingestion for bank statements (CSV/TSV/text/PDF) and receipts with mathematical reconciliation ($\text{Opening} + \text{Credits} - \text{Debits} = \text{Closing}$) and 3-level duplicate prevention. |

---

## 🧪 Verification & Test Suite Results

Every test and validation check passes with 100% compliance across backend and frontend suites:

| Target | Command | Result | Status |
|:---|:---|:---|:---:|
| **Backend Pytest Suite** | `pytest -o pythonpath=.` | **247/247 passed (Spend Leak Review Lifecycle + Statement Reconciliation + Receipt Parser + Duplicate Prevention + Crash-Test + AI)** | ✅ PASS |
| **Frontend Jest Tests** | `npm test -- --watchAll=false` | **87/87 passed across 12 suites (Tax & Investment Budget Sections + Categorized Manual Transactions + Ingestion Modal + AI Linking + UI Units)** | ✅ PASS |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors (Strict mode clean)** | ✅ PASS |
| **Next.js Production Build** | `npm run build` | **29/29 static routes prerendered cleanly (Zero type/lint warnings)** | ✅ PASS |
| **Live Vercel Production** | `https://finroq-app.vercel.app` | **HTTP 200 OK (Google OAuth Flow + Live Telemetry + 18 Locales)** | ✅ PASS |
| **Live App Hub** | `https://finroq-app.vercel.app/app/home` | **HTTP 200 OK (17-Module Hub + Ingestion Modal)** | ✅ PASS |
| **Live Prediction Center** | `https://finroq-app.vercel.app/predictions` | **HTTP 200 OK (Live AMFI Telemetry + IPO Radar)** | ✅ PASS |
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
