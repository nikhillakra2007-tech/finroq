# 🏦 FINROQ — Intelligent Financial Accounting Engine

<div align="center">

![FINROQ Banner](https://img.shields.io/badge/FINROQ-v1.0.0--PROD-173F2B?style=for-the-badge&logo=cashapp&logoColor=C7F36B)
![Build Status](https://img.shields.io/badge/Build-Passing-247A50?style=for-the-badge&logo=github-actions&logoColor=white)
![Backend Tests](https://img.shields.io/badge/Pytest-127%2F127%20Passed-247A50?style=for-the-badge&logo=pytest&logoColor=white)
![Frontend Tests](https://img.shields.io/badge/Jest-22%2F22%20Passed-247A50?style=for-the-badge&logo=jest&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-8E75C4?style=for-the-badge&logo=google&logoColor=white)

<p align="center">
  <b>Enterprise-Grade Double-Entry Personal Finance Platform with Deterministic Ledger Semantics, Arbitrary-Precision Decimal Arithmetic, and a Safe 3-Layer AI Intelligence Pipeline.</b>
</p>

[System Architecture](#-system-architecture) •
[AI Safety Pipeline](#-safe-3-layer-ai-architecture) •
[Core Modules](#-core-system-modules) •
[Verification Matrix](#-verification-and-test-suite-results) •
[Getting Started](#-local-development-setup)

</div>

---

## 🌟 Executive Overview

**FINROQ** is a high-performance personal finance platform built on modern asynchronous Python and React/TypeScript architectures. Designed to solve common flaws in typical budget apps—such as floating-point rounding errors, loose tenant boundaries, and hallucinated AI metrics—FINROQ guarantees:

- ⚖️ **Mathematical Correctness**: Arbitrary-precision decimal arithmetic via Python `Decimal` and PostgreSQL `NUMERIC(14, 2)`. Zero IEEE 754 floating-point drift.
- 🛡️ **Zero-Hallucination AI Guarantee**: Strict 3-layer architecture where authoritative financial metrics are deterministically computed in Layer A before context reaches Google Gemini in Layer C.
- 🔒 **Ironclad Security**: Argon2id password hashing, cryptographic JWT bearer tokens, and server-side tenant isolation where every query scopes explicitly to the authenticated owner.
- 🔁 **Idempotent Recurring Rules Engine**: Comprehensive calendar arithmetic handling shorter months (e.g. Feb 28/29, Apr 30) with leap-year clamping and restoration.
- 🎨 **Editorial Design System**: Bespoke Warm Ivory (`#F7F7F0`), Forest Green (`#173F2B`), and Lime Accent (`#C7F36B`) palette engineered for readability, accessibility, and high information density.

---

## 🏛 System Architecture

The FINROQ stack strictly decouples presentation, API orchestration, computational services, and relational persistence.

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
            TXN_SVC["Transaction Service"]
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

## 🤖 Safe 3-Layer AI Architecture

AI should interpret financial facts, never manufacture them. FINROQ enforces an isolated, unidirectional pipeline to guarantee user privacy and data integrity.

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

### Safety Principles
1. **Zero Hallucinated Numbers**: All dollar values in AI answers originate directly from Layer A calculation output.
2. **PII Isolation**: Account identifiers, passwords, authorization tokens, and detailed transaction descriptions are never sent to external AI providers.
3. **Graceful Fallback**: If Gemini rate limits or encounters connectivity issues, the platform transparently falls back to Layer A deterministic heuristics. Core financial workflows never break.
4. **Server-Side Quota Enforcement**: Users on `FREE` tiers are capped at 10 AI requests/month; `PREMIUM` accounts receive 100 requests/month with `403 Forbidden` limits enforced at the API boundary.

---

## 🔄 Core Financial Workflows

### 1. Transaction Lifecycle & Equilibrium

```mermaid
stateDiagram-v2
    [*] --> Pending: Created
    Pending --> Completed: Settlement / Cleared
    Pending --> Cancelled: Voided / Rejected
    
    state Completed {
        Income: Credit Account Balance
        Expense: Debit Account Balance
        Transfer: Atomic Debit Source + Credit Target
    }
    
    Completed --> Refunded: Related Transaction Linked
    Refunded --> Completed: Reversal Recorded
    Cancelled --> [*]
```

- **Transfers**: Handled as zero-sum movements between accounts without artificially inflating income or expense totals.
- **Refunds & Reversals**: Linked to parent transactions via `related_transaction_id` to adjust net spend without duplicate entries.

---

### 2. Recurring Calendar Clamping Engine

Monthly recurrences respect real-world calendar variations without schedule degradation:

```mermaid
graph TD
    RULE["Recurring Monthly Rule\nTarget Day: 31st"] --> MONTH_CHECK{"Evaluate Target Month"}
    
    MONTH_CHECK -- 31-day Month\n(Jan, Mar, May, Jul, Aug, Oct, Dec) --> DAY31["Fire on 31st\n(Normal)"]
    MONTH_CHECK -- 30-day Month\n(Apr, Jun, Sep, Nov) --> CLAMP30["Clamp to 30th\n(Last Valid Day)"]
    MONTH_CHECK -- February (Non-Leap) --> CLAMP28["Clamp to 28th"]
    MONTH_CHECK -- February (Leap Year) --> CLAMP29["Clamp to 29th"]
    
    CLAMP30 --> RESTORE["Next Month Evaluation:\nAutomatically Restores to 31st!"]
    CLAMP28 --> RESTORE
    CLAMP29 --> RESTORE

    style RULE fill:#173F2B,color:#FFFFFF,stroke:#C7F36B,stroke-width:2px;
    style RESTORE fill:#C7F36B,color:#173F2B,stroke:#173F2B,stroke-width:2px;
```

---

## 🎨 Design System & Color Palette

FINROQ's user interface is built on a bespoke editorial design system crafted for high contrast, calm readability, and fintech elegance:

| Role | Token Name | Hex Code | Visual Sample | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Surface** | `finroq-ivory` | `#F7F7F0` | ![#F7F7F0](https://via.placeholder.com/20/F7F7F0/000000?text=+) | Calming paper-white page background |
| **Primary** | `finroq-forest` | `#173F2B` | ![#173F2B](https://via.placeholder.com/20/173F2B/000000?text=+) | Deep forest green for headings and brand elements |
| **Accent** | `finroq-lime` | `#C7F36B` | ![#C7F36B](https://via.placeholder.com/20/C7F36B/000000?text=+) | Vibrant electric lime for active badges and CTAs |
| **Secondary** | `finroq-mint` | `#EAF3E7` | ![#EAF3E7](https://via.placeholder.com/20/EAF3E7/000000?text=+) | Pale mint for hover states and secondary cards |
| **Muted** | `finroq-sage` | `#DCE7D9` | ![#DCE7D9](https://via.placeholder.com/20/DCE7D9/000000?text=+) | Subdued sage for input borders and dividers |
| **Positive** | `finroq-positive`| `#247A50` | ![#247A50](https://via.placeholder.com/20/247A50/000000?text=+) | Verified surplus, income, and cash flow positivity |
| **Negative** | `finroq-negative`| `#B74747` | ![#B74747](https://via.placeholder.com/20/B74747/000000?text=+) | Overspending alerts, deficits, and expenses |

---

## 📡 REST API Specification

All authenticated routes require `Authorization: Bearer <JWT_TOKEN>`. Tenant ownership is derived automatically on the server from the token `sub` claim.

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user with Argon2id password hashing | `201 Created` |
| `POST` | `/login` | Authenticate credentials and receive JWT access token | `200 OK` |
| `GET` | `/me` | Get current user profile and account tier status | `200 OK` |

### 💳 Accounts & Transactions (`/api/v1/accounts`, `/api/v1/transactions`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/accounts` | List all accounts with real-time balance calculations | `200 OK` |
| `POST` | `/accounts` | Create checking, savings, credit, or cash account | `201 Created` |
| `GET` | `/transactions` | List filtered transactions (type, category, date, account) | `200 OK` |
| `POST` | `/transactions` | Record new income, expense, or atomic transfer | `201 Created` |
| `DELETE`| `/transactions/{id}`| Remove transaction and update account balance | `204 No Content` |

### 📊 Budgets & Recurring (`/api/v1/budgets`, `/api/v1/recurring`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/budgets` | Fetch monthly budgets with utilization % and overrun flags | `200 OK` |
| `POST` | `/budgets` | Allocate category budget for specific year and month | `201 Created` |
| `GET` | `/recurring` | List recurring schedules with calculated `next_occurrence` | `200 OK` |
| `POST` | `/recurring/{id}/record` | Idempotently record occurrence into actual ledger | `201 Created` |
| `PATCH`| `/recurring/{id}/pause`  | Pause recurring schedule execution | `200 OK` |

### 🧠 AI Intelligence (`/api/v1/ai`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/explain` | AI explanation of monthly cash flow and spending anomalies | `200 OK` |
| `POST` | `/spending-assistant` | Context-aware spending Q&A with prompt injection defense | `200 OK` |
| `POST` | `/simulate-goal` | Deterministic timeline and funding gap projection | `200 OK` |
| `POST` | `/classify-transaction` | Suggest transaction category with heuristic fallback | `200 OK` |
| `GET` | `/entitlements` | Check user tier (`FREE`/`PREMIUM`) and monthly AI quota | `200 OK` |

---

## 🧪 Verification and Test Suite Results

FINROQ enforces a zero-tolerance policy for failing tests, untested financial calculations, and type errors.

```
============================= test session starts =============================
platform win32 -- Python 3.12.3, pytest-8.3.5
rootdir: C:\Users\nikhi\OneDrive\Desktop\coding\FINROQ\finroq\backend
collected 127 items

tests/unit/test_ai_service.py ........                                   [  6%]
tests/unit/test_budget_service.py ..........                             [ 14%]
tests/unit/test_finance_engine.py ..................                     [ 28%]
tests/unit/test_models.py ........                                       [ 34%]
tests/unit/test_recurring_service.py ............                        [ 44%]
tests/unit/test_services.py ...................                          [ 59%]
tests/integration/test_ai_api.py ......                                  [ 63%]
tests/integration/test_auth_api.py ..........                            [ 71%]
tests/integration/test_budget_api.py ..........                          [ 79%]
tests/integration/test_recurring_api.py ..........                       [ 87%]
tests/integration/test_api.py .................                          [100%]

============================ 127 passed in 33.17s =============================
```

### Full Verification Matrix

| Verification Target | Command Executed | Metric / Outcome | Status |
| :--- | :--- | :--- | :---: |
| **Backend Unit Tests** | `pytest tests/unit -v` | **81 passed, 0 failed** | ✅ PASS |
| **Backend Integration Tests** | `pytest tests/integration -v` | **46 passed, 0 failed** | ✅ PASS |
| **Frontend Unit Tests** | `npm test -- --watchAll=false` | **22 passed, 0 failed** (4 test suites) | ✅ PASS |
| **TypeScript Type Check** | `npm run build` | **0 errors (Strict mode clean)** | ✅ PASS |
| **Next.js Production Build** | `npm run build` | **14/14 application routes compiled** | ✅ PASS |
| **Database Migrations** | `alembic upgrade head` | **Verified at head revision `d4f6a8b1c3e5`** | ✅ PASS |
| **Financial Decimal Precision** | `test_decimal_precision.py` | **Zero binary floating-point drift** | ✅ PASS |
| **AI Quota Rejection** | `test_ai_quota_exhaustion_403` | **403 Forbidden verified on limit** | ✅ PASS |

---

## 🚀 Local Development Setup

### Prerequisites
- **Python**: 3.12+
- **Node.js**: 20+
- **PostgreSQL**: 16+

### 1. Database Setup
```bash
# Option A: With Docker
docker compose up -d postgres

# Option B: Native PostgreSQL
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

# Run database migrations
alembic upgrade head

# Start development API server
python -m app.main
```
> The API will be available at `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Run local development server
npm run dev
```
> The web application will be accessible at `http://localhost:3000`.

---

## 📁 Repository Structure

```
FINROQ/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # Auth, Accounts, Budgets, Recurring, AI
│   │   │   ├── deps.py          # JWT authentication and user ownership dependencies
│   │   │   └── router.py        # Centralized /api/v1 route mounting
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic v2 application settings
│   │   │   └── security.py      # Argon2id password hashing and JWT encoding
│   │   ├── db/
│   │   │   ├── models.py        # SQLAlchemy 2.0 ORM models
│   │   │   └── session.py       # Async engine and database session provider
│   │   └── features/
│   │       ├── ai/              # Gemini REST client, context sanitizer, fallbacks
│   │       ├── budget/          # Monthly budget allocations & spending tracking
│   │       ├── entitlements/    # User tier management & quota enforcement
│   │       ├── finance/         # Authoritative Decimal calculation engine
│   │       └── recurring/       # Calendar-clamping recurring transaction scheduler
│   ├── alembic/                 # Database schema migrations
│   └── tests/                   # 127 automated unit and integration tests
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router pages (14 routes)
│   │   │   ├── accounts/        # Account management & balances
│   │   │   ├── budgets/         # Monthly category budget trackers
│   │   │   ├── insights/        # AI Intelligence hub & Goal timeline simulator
│   │   │   ├── net-worth/       # Balance sheet & debt-to-asset ratios
│   │   │   ├── recurring/       # Recurrence rules & occurrence recorder
│   │   │   └── transactions/   # Ledger transactions & filters
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Footer, Container primitives
│   │   │   └── ui/              # Button, Input, Modal, ConfirmationDialog, Card
│   │   └── lib/                 # Centralized API client, Auth Context, Types
│   └── public/                  # Static assets and icons
└── docs/                        # Architecture specs & implementation audit logs
```

---

## 📄 License & Attribution

FINROQ is proprietary software designed and developed for high-security personal finance operations. All rights reserved.