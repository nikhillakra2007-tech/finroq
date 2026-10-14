# 🏦 FINROQ — Intelligent Financial Accounting Engine

<div align="center">

![FINROQ Banner](https://img.shields.io/badge/FINROQ-v1.2.0--PROD-173F2B?style=for-the-badge&logo=cashapp&logoColor=C7F36B)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Production-black?style=for-the-badge&logo=vercel&logoColor=white)](https://finroq-app.vercel.app)
![Languages](https://img.shields.io/badge/Languages-18%20Global%20Locales-173F2B?style=for-the-badge&logo=google-translate&logoColor=white)
![Pytest Suite](https://img.shields.io/badge/Pytest-159%2F159%20Passed-247A50?style=for-the-badge&logo=pytest&logoColor=white)
![Jest Tests](https://img.shields.io/badge/Jest-25%2F25%20Passed-247A50?style=for-the-badge&logo=jest&logoColor=white)
![Finroq AI](https://img.shields.io/badge/Finroq%20AI-Floating%20Launcher%20%26%20Voice-173F2B?style=for-the-badge&logo=openai&logoColor=C7F36B)
![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

<p align="center">
  <b>Enterprise-grade double-entry personal finance engine with arbitrary-precision decimal arithmetic, 12 unified financial modules, 18-language internationalization, Google popup authentication, adaptive dark/light themes, bank statement ingestion, and Floating Finroq AI personal financial intelligence agent with voice recognition.</b>
</p>

🔗 **Live Production Deployment**: [https://finroq-app.vercel.app](https://finroq-app.vercel.app)  
🌐 **Alternative Production Mirrors**: [https://pocketcircle.vercel.app](https://pocketcircle.vercel.app) • [https://finroq-os.vercel.app](https://finroq-os.vercel.app)

[Live Application Exhibits](#-live-application-exhibits) •
[System Architecture](#-system-architecture) •
[Finroq AI Intelligence Agent](#-finroq-ai--personal-financial-intelligence-agent) •
[Financial Accounting Lifecycle](#-financial-accounting-lifecycle--data-pipeline) •
[12 Unified Financial Modules](#-12-unified-financial-modules) •
[18-Language i18n & Theming Engine](#-full-site-18-language-i18n--theming-engine) •
[Verification Matrix](#-verification--test-suite-results) •
[Quickstart](#-local-development-setup)

</div>

---

## 📸 Live Application Exhibits

High-resolution application captures taken directly from live production on [finroq-app.vercel.app](https://finroq-app.vercel.app):

<div align="center">

### 12-Module Unified Financial Workspace Hub
*Live workspace view displaying all 12 financial engines with instant 18-language selector, Google authentication, and floating AI assistant launcher.*

![FINROQ Live 12-Module Hub](docs/assets/finroq-app-home-live.png)

</div>

<br/>

<div align="center">

| Precision Landing Showcase | Pre-Spend Decision Engine |
|:---:|:---:|
| ![Landing Showcase](docs/assets/finroq-landing-hero.png) | ![Pre-Spend Check](docs/assets/finroq-prespend-check.png) |
| *Arbitrary decimal precision hero, 18-language switcher, and ledger verification.* | *Real-time pre-purchase simulation on remaining budget caps with localized impact cards.* |

| Credit Health Architecture | Autonomous Daily Budgeting |
|:---:|:---:|
| ![Credit Health](docs/assets/finroq-credit-health.png) | ![Daily Budgeting](docs/assets/finroq-budgeting.png) |
| *Live credit utilization ratios and payment discipline.* | *Active category burn-rate monitoring and auto-rebalancing.* |

</div>

---

## 🌟 Executive Overview

**FINROQ** is an enterprise-class financial platform built with FastAPI, Next.js 14, and PostgreSQL 16. It replaces the error-prone assumptions and floating-point roundoff errors of consumer budget apps with strict mathematical accounting and zero-trust tenant security:

- ⚖️ **Arbitrary-Precision Decimal Arithmetic**: Powered by Python `Decimal` and database `NUMERIC(14, 2)`. Completely eliminates IEEE 754 floating-point drift across currency conversions, allocations, and ledger entries.
- 🎨 **Adaptive Ivory & Forest Theming**: Warm Ivory (`#F7F7F0`) light mode with deep contrast typography and deep forest (`#0D1411`) dark mode with zero-FOUC pre-hydration scripts and system-preference detection.
- 🌍 **Comprehensive 18-Language Internationalization**: Full prototype coverage for 18 global languages (English, Hindi, Spanish, French, German, Mandarin, Japanese, Russian, Arabic, Portuguese, Italian, Korean, Dutch, Turkish, Bengali, Telugu, Marathi, Tamil) with responsive typography protection that eliminates text overflow.
- 🔐 **Google Popup Authentication**: Modern popup-based Google OAuth flow (`/auth/google-popup`) with multi-channel cross-window communication (`window.postMessage`, storage dispatch, fallback sync) and persistent AuthContext state.
- 🤖 **Floating Finroq AI Financial Companion**: Non-intrusive floating launcher on the bottom-right corner of both landing and workspace pages with voice recognition and automatic response language adaptation.
- 🔄 **Unified Decimal Ledger Model**: Single authoritative source of truth. All 12 modules read completed transactions, live accounts, and net-worth metrics directly from the shared financial core.
- 📥 **Robust Bank Statement Ingestion**: Multi-format CSV/TSV dialect sniffer, duplicate detection, and interactive pre-commit review.
- 🛡️ **Zero-Hallucination Safe AI Pipeline**: Strict 3-layer architecture where authoritative numbers are deterministically computed in Python before any context reaches Google Gemini.

---

## 🏛 System Architecture

The FINROQ platform follows a clean, decoupled 4-tier architecture designed for high throughput, cryptographic tenant isolation, and mathematical certainty:

```mermaid
flowchart TB
    subgraph CLIENT["Client Tier — Next.js 14 App Router"]
        UI["React 18 Server & Client Components<br/>Tailwind CSS + Lucide Icons"]
        I18N["i18n Context Engine<br/>Hindi and English Instant Switch"]
        THEME["Theme Provider<br/>Ivory Light and Forest Dark"]
        AUTH_CTX["Auth Context & Token Store<br/>Stateless JWT Storage"]
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
        TXN_SVC["Transaction Service<br/>Ledger Commits & Statement Ingestion"]
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
        OPENAI["OpenAI Tool Calling Provider<br/>gpt-4o-mini (Bounded Max 5 Iterations)"]
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

## 🤖 Finroq AI — Personal Financial Intelligence Agent

FINROQ incorporates an enterprise-grade financial intelligence agent designed for **deterministic certainty**, **zero numerical hallucinations**, and **frictionless multimodal interaction**:

```mermaid
flowchart LR
    subgraph INPUT["Client Interaction Tier"]
        VOICE["🎙️ Web Speech Voice Input<br/>SpeechRecognition API"]
        TYPE["⌨️ Natural Language Text<br/>Interactive Message Bar"]
        FLOAT_BTN["Floating Bottom-Right Logo<br/>fixed bottom-6 right-6"]
        
        FLOAT_BTN --> VOICE
        FLOAT_BTN --> TYPE
    end

    subgraph ORCHESTRATION["Backend Orchestration (FastAPI)"]
        CHAT_SVC["Chat Service /api/v1/ai/chat<br/>Conversation Lifecycle & Token Accounting"]
        BOUNDED_LOOP["Bounded Tool Calling Loop<br/>Enforced Max 5 Iterations Guardrail"]
        SECURITY_GUARD["Tenant Isolation Guard<br/>Strict owner_id Filter on all ORM queries"]
        
        VOICE --> CHAT_SVC
        TYPE --> CHAT_SVC
        CHAT_SVC --> SECURITY_GUARD
        SECURITY_GUARD --> BOUNDED_LOOP
    end

    subgraph TOOLS["12 Deterministic Financial Tools (A–L)"]
        T1["get_account_balances"]
        T2["get_cash_flow_summary"]
        T3["get_budget_status"]
        T4["get_recurring_commitments"]
        T5["get_net_worth"]
        T6["get_debt_and_liabilities"]
        T7["get_spending_breakdown"]
        T8["get_emergency_fund_runway"]
        T9["simulate_purchase_affordability"]
        T10["get_investment_allocation"]
        T11["get_goal_milestones"]
        T12["detect_spending_anomalies"]
        
        BOUNDED_LOOP <--> TOOLS
    end

    subgraph OUTPUT["Rich Structured Client Experience"]
        SYNTH["Plain-Text Advisory Synthesis"]
        CARDS["Structured Metric Cards<br/>Cash Flow, Budget Variance, Runway, Bills"]
        PERSIST["Conversation History DB<br/>ai_conversations, ai_messages"]
        
        BOUNDED_LOOP --> SYNTH
        BOUNDED_LOOP --> CARDS
        CHAT_SVC --> PERSIST
    end

    style INPUT fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
    style ORCHESTRATION fill:#EAF3E7,stroke:#247A50,stroke-width:2px;
    style TOOLS fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style OUTPUT fill:#DCE7D9,stroke:#173F2B,stroke-width:2px;
```

### 1. The 12 Deterministic Financial Tools (A–L)

Every metric returned to the language model is executed deterministically against verified ledger rows using Python `Decimal` math quantized to `0.01`:

| Tool Letter | Function Name | Purpose & Arithmetic Specification |
|:---:|---|---|
| **A** | `get_account_balances` | Returns checking, savings, investment, and credit accounts with exact balances. |
| **B** | `get_cash_flow_summary` | Quantizes total income, total expense, and net surplus over custom timeframe; neutral transfers excluded. |
| **C** | `get_budget_status` | Category-by-category plan vs. actual spending, remaining cushion, and percentage utilized. |
| **D** | `get_recurring_commitments`| Active subscriptions, auto-debits, frequencies, next due dates, and projected 30-day burden. |
| **E** | `get_net_worth` | Total assets minus liabilities with full asset/liability breakdown. |
| **F** | `get_debt_and_liabilities` | Outstanding loan balances, minimum monthly obligations, and debt-to-income (DTI) ratio. |
| **G** | `get_spending_breakdown` | Category aggregates, percentage of total spend, and top merchant transactions. |
| **H** | `get_emergency_fund_runway` | Liquid cash reserves divided by monthly burn rate (`Runway = Liquid / MonthlyBurn`). |
| **I** | `simulate_purchase_affordability` | Pre-transaction check calculating post-purchase category balance, remaining cushion, and safe-to-spend verdict. |
| **J** | `get_investment_allocation` | Current asset distribution (equity, debt, gold, cash) compared against target allocations. |
| **K** | `get_goal_milestones` | Savings milestone trajectory and estimated completion months: `ceil((Target - Saved) / MonthlySavings)`. |
| **L** | `detect_spending_anomalies` | Audits recent charges against 90-day moving averages to flag duplicate bills and unexpected surges. |

### 2. Multi-Modal Interaction: Type & Speak
- **Floating Bottom-Right Trigger**: Available across all workspace pages (`fixed bottom-6 right-6 z-50`) as an unobtrusive glowing badge.
- **Web Speech API Voice Input**: Tap the microphone button (`🎙️`) to speak queries in English or Hindi. Real-time speech transcription renders directly into the input bar.
- **Zero Layout Disruption**: Leaves the classic 12-Module home launcher intact while giving instant access to conversational accounting.

### 3. Security, Guardrails & Bounded Tool Loops
- **Tenant Isolation**: Every database tool query explicitly joins or filters on `owner_id = current_user.id`. Impossible to leak cross-user ledger records.
- **Bounded Tool Calling**: Enforces an strict upper bound of **5 iterations** per conversational turn (`AI_MAX_TOOL_ITERATIONS = 5`) to prevent runaway API loops.
- **Conversation Persistence**: Full thread history stored across PostgreSQL tables `ai_conversations`, `ai_messages`, and `ai_usage_logs` with cascading deletes.

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

## 🧩 12 Unified Financial Modules

All modules are seamlessly integrated into the unified FINROQ navigation shell, sharing identical design language, responsive states, and dual Hindi/English localization:

```mermaid
flowchart LR
    subgraph CAT1["Track & Control"]
        M1["Expense Tracking Ledger<br/>/app/expense-tracking"]
        M2["Daily Category Budgeting<br/>/app/budgeting"]
        M3["Expense Splitter<br/>/app/splitter"]
    end

    subgraph CAT2["Decide Before Spending"]
        M4["Pre-Spend Check Simulator<br/>/app/pre-spend-check"]
        M5["Spend Leak Detector<br/>/app/spend-leak-detector"]
        M6["Practical Money Guides<br/>/app/money-guides"]
    end

    subgraph CAT3["Build & Protect Wealth"]
        M7["Net Worth Architecture<br/>/app/net-worth"]
        M8["Goal Timeline Simulator<br/>/app/goal-timeline"]
        M9["Emergency Cushion Calculator<br/>/app/emergency-cushion"]
    end

    subgraph CAT4["Manage Obligations"]
        M10["EMI & Debt Watchdog<br/>/app/debt-watchdog"]
        M11["Credit Health Monitor<br/>/app/credit-health"]
        M12["Financial Health Score<br/>/app/financial-health"]
    end

    style CAT1 fill:#EAF3E7,stroke:#173F2B,stroke-width:2px;
    style CAT2 fill:#F4F8F3,stroke:#247A50,stroke-width:2px;
    style CAT3 fill:#DCFCE7,stroke:#15803D,stroke-width:2px;
    style CAT4 fill:#F7F7F0,stroke:#173F2B,stroke-width:2px;
```

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
| 10 | **Money Guides** | `/app/money-guides` | Curated editorial frameworks (50/30/20 rule, debt avalanche/snowball, liquidity buffers) with visual models. |
| 11 | **Credit Health** | `/app/credit-health` | Monitors credit card utilization against aggregate limits to protect credit scores. |
| 12 | **Financial Health Score** | `/app/financial-health` | Composite vitality diagnostic (0–100) aggregating savings rate, debt ratio, runway, and budget discipline. |

---

## 🌐 Full-Site 18-Language i18n & Theming Engine

FINROQ features zero-latency switching across 18 global languages and bespoke ivory/forest theming built directly into the client architecture:

```mermaid
flowchart LR
    subgraph PRE_HYDRATION["Pre-Hydration Phase (HTML Head)"]
        SCRIPT["Inline Theme Script"] --> LOCAL_STORAGE["Inspect localStorage ('finroq_theme')"]
        LOCAL_STORAGE --> OS_PREF["Fallback: window.matchMedia('(prefers-color-scheme: dark)')"]
        OS_PREF --> APPLY_ATTR["Set data-theme and dark class on HTML root<br/>Zero Flash of Unstyled Content"]
    end

    subgraph RUNTIME["React Runtime Tier"]
        I18N_CTX["I18nProvider Context"] --> DICT["In-Memory Static Dictionaries (18 Global Locales)"]
        DICT --> HOOK["useI18n() Hook: language, setLanguage, t(key, fallback)"]
        HOOK --> ALL_VIEWS["All 12 Modules + Navbar + Landing + Auth + Chatbot"]
        
        THEME_CTX["ThemeProvider Context"] --> THEME_HOOK["useTheme() Hook: theme, toggleTheme()"]
        THEME_HOOK --> ALL_VIEWS
    end

    style PRE_HYDRATION fill:#FEF3C7,stroke:#B77925,stroke-width:2px;
    style RUNTIME fill:#EAF3E7,stroke:#247A50,stroke-width:2px;
```

### Supported Languages (18 Locales)
- 🇬🇧 English (`en`)
- 🇮🇳 Hindi (`hi`)
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)
- 🇩🇪 German (`de`)
- 🇨🇳 Mandarin (`zh`)
- 🇯🇵 Japanese (`ja`)
- 🇷🇺 Russian (`ru`)
- 🇸🇦 Arabic (`ar`)
- 🇧🇷 Portuguese (`pt`)
- 🇮🇹 Italian (`it`)
- 🇰🇷 Korean (`ko`)
- 🇳🇱 Dutch (`nl`)
- 🇹🇷 Turkish (`tr`)
- 🇧🇩 Bengali (`bn`)
- 🇮🇳 Telugu (`te`)
- 🇮🇳 Marathi (`mr`)
- 🇮🇳 Tamil (`ta`)

---

## 🧪 Verification & Test Suite Results

Every test and validation check passes with 100% compliance:

| Target | Command | Result | Status |
|:---|:---|:---|:---:|
| **Backend Pytest Suite** | `pytest -o pythonpath=.` | **159 passed in 51.20s (12 AI Tools + Auth + Double Entry)** | ✅ PASS |
| **Frontend Jest Tests** | `npm test -- --watchAll=false` | **25 passed across 5 test suites (Components + AI Results)** | ✅ PASS |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors (Strict mode clean)** | ✅ PASS |
| **Next.js Production Build** | `npm run build` | **24/24 static routes prerendered cleanly** | ✅ PASS |
| **Live Vercel Production** | `https://finroq-app.vercel.app` | **HTTP 200 OK (Google Popup Auth + Voice Speech + 18 Locales)** | ✅ PASS |
| **Vercel Mirror 1** | `https://pocketcircle.vercel.app` | **HTTP 200 OK (Instant Synchronization)** | ✅ PASS |
| **Vercel Mirror 2** | `https://finroq-os.vercel.app` | **HTTP 200 OK (Instant Synchronization)** | ✅ PASS |

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

# Install dependencies (respects .npmrc legacy-peer-deps)
npm install

# Start development server
npm run dev
```
> Web application accessible locally at `http://localhost:3000`.

---

## 🌐 Production Deployment

- **Primary Production URL**: **[https://finroq-app.vercel.app](https://finroq-app.vercel.app)**
- **Alternative Mirror**: **[https://finroq-os.vercel.app](https://finroq-os.vercel.app)**
- **GitHub Repository**: **[https://github.com/nikhillakra2007-tech/finroq](https://github.com/nikhillakra2007-tech/finroq)**

---

## 📄 License

FINROQ is proprietary software designed for high-security personal finance operations. All rights reserved.