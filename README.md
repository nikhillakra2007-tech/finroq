# 🏦 FINROQ — Intelligent Financial Accounting Engine

<div align="center">

![FINROQ Banner](https://img.shields.io/badge/FINROQ-v1.0.0--PROD-173F2B?style=for-the-badge&logo=cashapp&logoColor=C7F36B)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://pocketcircle.vercel.app)
![Pytest Suite](https://img.shields.io/badge/Pytest-129%2F129%20Passed-247A50?style=for-the-badge&logo=pytest&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Jest-22%2F22%20Passed-247A50?style=for-the-badge&logo=jest&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

<p align="center">
  <b>Double-entry personal finance engine with arbitrary-precision decimal arithmetic, 12 unified financial modules, dark/light theming, Hindi/English i18n, bank statement ingestion, and deterministic AI intelligence.</b>
</p>

🔗 **Live Production App**: [https://pocketcircle.vercel.app](https://pocketcircle.vercel.app)

[System Architecture](#-system-architecture) •
[12 Core Financial Modules](#-12-unified-financial-modules) •
[Transaction Ingestion Pipeline](#-transaction-ingestion-pipeline) •
[Safe AI Pipeline](#-safe-3-layer-ai-architecture) •
[Test Verification Matrix](#-verification--test-suite-results) •
[Quickstart](#-local-development-setup)

</div>

---

## 🌟 Executive Overview

**FINROQ** is an enterprise-grade personal finance platform built with FastAPI, Next.js 14, and PostgreSQL 16. It replaces the error-prone assumptions of standard budget apps with strict financial mathematics and tenant-scoped security:

- ⚖️ **Arbitrary-Precision Decimal Arithmetic**: Powered by Python `Decimal` and PostgreSQL `NUMERIC(14, 2)`. Zero IEEE 754 floating-point drift.
- 🎨 **Bespoke Dark/Light Design System**: Warm Ivory (`#F7F7F0`) light mode and deep forest (`#0D1411`) dark mode with localStorage persistence, system-preference detection, and zero-FOUC pre-hydration.
- 🌐 **Hindi/English Internationalization**: Full i18n via React context with zero-latency client-side dictionaries — no external API dependencies.
- 🔄 **Unified Financial Data Model**: Single source of truth. All modules read live accounts, completed transactions, category allocations, and net-worth metrics directly from the authoritative backend engine.
- 📥 **Comprehensive Transaction Ingestion**: Support for manual entries (including zero-sum inter-account transfers), CSV/TSV bank-statement file imports with preview and duplicate detection, and architecture-ready institutional aggregation.
- 🛡️ **Zero-Hallucination AI Pipeline**: Strict 3-layer architecture where authoritative numbers are deterministically computed in Layer A before context reaches Google Gemini in Layer C.
- 🔁 **Calendar-Clamping Recurrences**: Handles 28/29/30/31-day months with leap-year clamping and automatic day restoration.

---

## 🏛 System Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client Tier (Web / Mobile)"]
        UI["Next.js 14 App Router\n(React 18 / Tailwind CSS)"]
        AUTH_CTX["Auth Context & Token Store\n(Secure Bearer JWT)"]
        API_CLIENT["Centralized API Client\n(Fetch with Interceptors)"]
        UI --> AUTH_CTX
        AUTH_CTX --> API_CLIENT
    end

    subgraph BACKEND["Backend Tier (FastAPI / Python 3.12)"]
        ROUTER["API Router (/api/v1)"]
        AUTH_GUARD["JWT Authentication Guard\n(Argon2id + sub claims)"]
        ENTITLE["Entitlements Engine\n(Quota Checks & Rate Limits)"]
        
        API_CLIENT -- "HTTPS / JSON + Bearer" --> ROUTER
        ROUTER --> AUTH_GUARD
        AUTH_GUARD --> ENTITLE
        
        subgraph DOMAIN["Domain Services Layer"]
            ACC_SVC["Account Service"]
            TXN_SVC["Transaction Service\n(Transfers & Statement Parser)"]
            BUDGET_SVC["Budget Service"]
            REC_SVC["Recurring Engine"]
            AI_SVC["AI Intelligence Service"]
        end
        
        ENTITLE --> DOMAIN
        
        subgraph ENGINE["Core Computation Engine"]
            FIN_ENGINE["Stateless Financial Engine\n(Python Decimal Math)"]
        end
        
        DOMAIN <--> FIN_ENGINE
    end

    subgraph STORAGE["Persistence Tier (PostgreSQL 16)"]
        ORM["SQLAlchemy 2.0 Async\n(asyncpg driver)"]
        DB[(PostgreSQL 16 RDBMS\nStrict Constraints & Indexes)]
        MIGRATIONS["Alembic Migrations\n(Ordered Schema Revisions)"]
        
        DOMAIN --> ORM
        ORM --> DB
        MIGRATIONS -.-> DB
    end

    subgraph EXTERNAL["External AI Provider"]
        GEMINI["Google Gemini 1.5 Flash\n(REST API via httpx)"]
        AI_SVC -. "Sanitized Context Only" .-> GEMINI
    end

    style CLIENT fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
    style BACKEND fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style STORAGE fill:#DCE7D9,stroke:#173F2B,stroke-width:2px;
    style EXTERNAL fill:#F3E8FF,stroke:#8E75C4,stroke-width:2px;
```

---

## 🧩 12 Unified Financial Modules

All modules are unified under the FINROQ design system (dark + light themes) and synchronized with the shared financial engine:

| # | Financial Module | Route | Live Data Integration |
|---|---|---|---|
| 1 | **Expense Tracking** | `/app/expense-tracking` | Real-time transaction ledger, account filters, manual entry, and statement import. |
| 2 | **Daily Budgeting** | `/app/budgeting` | Category budgets compared against actual completed spending; transfers excluded. |
| 3 | **Splitter** | `/app/splitter` | Bill split calculator connected to user accounts; one-click commit of expense shares. |
| 4 | **Pre-Spend Check** | `/app/pre-spend-check` | Real-time budget impact simulation with optional one-click transaction commitment. |
| 5 | **Net Worth** | `/app/net-worth` | Authoritative assets vs liabilities computed across all checking, savings, and credit accounts. |
| 6 | **EMI/Debt Watchdog** | `/app/debt-watchdog` | Live outstanding debt and monthly EMI burden derived from credit accounts and recurring commitments. |
| 7 | **Spend Leak Detector** | `/app/spend-leak-detector` | Audits real transaction history for recurring, high-frequency small transactions, and irregular spikes. |
| 8 | **Goal Timeline Simulator** | `/app/goal-timeline` | Projections synchronized with real liquid savings balances. |
| 9 | **Emergency Cushion** | `/app/emergency-cushion` | Calculates runway months using real liquid accounts and essential category spending. |
| 10 | **Money Guides** | `/app/money-guides` | Curated editorial financial strategies in FINROQ typography. |
| 11 | **Credit Health** | `/app/credit-health` | Credit utilization ratios synchronized with active credit account debt. |
| 12 | **Integrated Financial Health**| `/app/financial-health` | Unified financial vitality score derived from authoritative summary metrics. |

---

## 📥 Transaction Ingestion Pipeline

FINROQ supports four distinct transaction entry pathways that converge on the same accounting rules:

```mermaid
flowchart LR
    CSV["Bank Statement (CSV/TSV)"] --> PARSE["Dialect Sniffer & Parser"]
    MANUAL["Manual Transaction Entry"] --> VALID["Validation & Decimal Cast"]
    SEED["Demo Seed Generator"] --> IDEMP["Idempotency Filter"]
    
    PARSE --> NORM["Normalize (Date/Amount/Direction)"]
    NORM --> DEDUP["Duplicate Detection"]
    DEDUP --> PREVIEW["Client Review & Edit"]
    PREVIEW --> CONFIRM["Atomic Batch Ingestion"]
    
    VALID --> COMMIT["Authoritative Ledger Commit"]
    CONFIRM --> COMMIT
    IDEMP --> COMMIT
    
    COMMIT --> REFRESH["Cross-Module Reactive Refresh"]
```

1. **Manual Entry**: Full validation for income, expense, and inter-account transfers (`to_account_id` destination validation prevents duplicate balance changes).
2. **Bank Statement Import**:
   - Supported Formats: CSV, TSV (comma, semicolon, tab).
   - Smart Normalization: Multiple date formats (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`), explicit debit/credit columns or signed amounts.
   - Duplicate Detection: Matches date, normalized amount, and account to prevent double-counting.
   - Interactive Preview: Inspect suggested categories, edit before committing, and commit in an atomic database transaction.
3. **Institutional Aggregator Status**:
   - Ready for RBI Account Aggregator / Open Banking consent flow integrations.
   - Explicitly displays architecture status without fabricating connections or collecting user bank passwords.
4. **Deterministic Demo Seeding**:
   - Reproducible, idempotent seed command (`python seed_demo.py`) creating coherent demo financial accounts, budgets, and transactions for `demo@finroq.com`.

---

## 🤖 Safe 3-Layer AI Architecture

FINROQ guarantees zero financial hallucinations by strictly isolating mathematical computation from language synthesis:

```mermaid
flowchart LR
    subgraph LAYER_A["Layer A: Deterministic Engine"]
        RAW_TXN["Ledger Records\n(Completed Only)"] --> CALC["Authoritative Engine\n(Python Decimal Math)"]
        CALC --> FACTS["Verified Financial Facts\n• Cash Flow & Balances\n• Budget Overruns (%)\n• Goal Funding Gaps"]
    end

    subgraph LAYER_B["Layer B: Context Preparation"]
        FACTS --> SANITIZE["Context Sanitizer\n(strip PII, tokens, notes)"]
        INJECT_GUARD["Prompt Injection Filter\n(Sanitize User Queries)"] --> SANITIZE
        SANITIZE --> PAYLOAD["Safe Context Prompt\n(Aggregates Only)"]
    end

    subgraph LAYER_C["Layer C: AI Synthesis & Fallback"]
        PAYLOAD --> CHECK{Credentials\nConfigured?}
        CHECK -- Yes --> GEMINI_CALL["Google Gemini 1.5 Flash\n(15s Timeout + Retries)"]
        CHECK -- No / Timeout --> FALLBACK["Deterministic Fallback Engine\n(Rule-Based Plain English)"]
        GEMINI_CALL --> OUT["Actionable Financial Advice\n• Explanations\n• Q&A Answers\n• Goal Projections"]
        FALLBACK --> OUT
    end

    style LAYER_A fill:#EAF3E7,stroke:#247A50,stroke-width:2px;
    style LAYER_B fill:#FEF3C7,stroke:#B77925,stroke-width:2px;
    style LAYER_C fill:#EFF6FF,stroke:#1D4ED8,stroke-width:2px;
```

---

## 🧪 Verification & Test Suite Results

Every test and verification check passes with 100% compliance:

| Target | Command | Result | Status |
| :--- | :--- | :--- | :---: |
| **Backend Test Suite** | `pytest` | **129 passed in 110.59s** | ✅ PASS |
| **Frontend Unit Tests** | `npm test -- --watchAll=false` | **22 passed across 4 test suites** | ✅ PASS |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors (Strict mode clean)** | ✅ PASS |
| **Production Build** | `npm run build` | **37/37 static routes prerendered** | ✅ PASS |
| **Demo Seeding** | `python seed_demo.py` | **Idempotent, 0 duplicates created** | ✅ PASS |
| **Live Vercel Production** | `curl https://pocketcircle.vercel.app` | **HTTP 200 OK** | ✅ PASS |

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
> API available at `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (respects .npmrc legacy-peer-deps)
npm install

# Start development server
npm run dev
```
> Web application accessible at `http://localhost:3000`.

---

## 🌐 Production Deployment

- **Frontend**: Deployed on Vercel at [https://pocketcircle.vercel.app](https://pocketcircle.vercel.app) using Next.js 14 App Router with dark/light theming and Hindi/English internationalization.
- **Backend**: Containerized with Uvicorn and FastAPI, easily deployable to Render, Railway, AWS ECS, or Fly.io.

---

## 📄 License

FINROQ is proprietary software designed for high-security personal finance operations. All rights reserved.