# FINROQ — Financial Intelligence & Accounting Engine

FINROQ is an enterprise-grade, personal financial management platform built on modern asynchronous Python and TypeScript architectures. Designed with strict ledger semantics, arbitrary-precision decimal arithmetic, robust JWT/Argon2id authentication, category-level monthly budgeting, and an idempotent recurring transaction rules engine.

---

## Technical Architecture Overview

FINROQ follows a clean, decoupled architecture separating presentation, API routing, business logic, and persistence layers:

```
                                  +------------------------------------+
                                  |     Next.js 14 (App Router)        |
                                  |   React 18 / TypeScript / Tailwind |
                                  +-----------------+------------------+
                                                    |  HTTP / REST (JSON)
                                                    |  Bearer JWT Auth
                                                    v
                                  +------------------------------------+
                                  |     FastAPI Web Framework          |
                                  | (Pydantic v2 / Starlette / ASGI)   |
                                  +--------+------------------+--------+
                                           |                  |
                    +----------------------+                  +----------------------+
                    |                                                                |
                    v                                                                v
+----------------------------------------+                       +----------------------------------------+
|      Domain Services & Features        |                       |       Core Financial Engine            |
| (Accounts, Auth, Budget, Recurring)    |<--------------------->| (Arbitrary Precision Decimal Math,     |
+-------------------+--------------------+                       |  Ledger Semantics, Period Analysis)    |
                    |                                            +----------------------------------------+
                    v
+----------------------------------------+
|   SQLAlchemy 2.0 (Async Engine)        |
|    asyncpg / Alembic Migrations        |
+-------------------+--------------------+
                    |
                    v
+----------------------------------------+
|         PostgreSQL 16 (RDBMS)          |
|  Strict Constraints, Indexes, Enums    |
+----------------------------------------+
```

---

## Core System Modules

### 1. Financial Calculation Engine (`app.features.finance.engine`)
A stateless, storage-agnostic computational engine that operates directly on entity sequences:
- **Monetary Precision**: All currency calculations utilize Python's `Decimal` and PostgreSQL `NUMERIC(14, 2)`. IEEE 754 binary floating-point math is strictly prohibited to eliminate rounding drift.
- **Transaction Semantics**:
  - Positive amounts paired with explicit `TransactionType` (`income`, `expense`, `transfer`).
  - Strict eligibility filtering: only `COMPLETED` transactions contribute to financial balances. `PENDING` and `CANCELLED` statuses are excluded.
  - **Net Cash Flow**: Calculated as $\text{Total Eligible Income} - \text{Total Eligible Expenses}$.
  - **Transfers**: Handled as atomic movements between `account_id` and `to_account_id`. Transfers never inflate income or expense metrics and maintain total combined portfolio equilibrium.
  - **Refunds & Reversals**: Linked via `related_transaction_id`. Deducted directly from the original transaction's magnitude to prevent double-counting.
  - **Net Worth**: $\text{Total Assets} - \text{Total Liabilities}$. Accounts typed as `checking`, `savings`, `cash`, and `investment` are categorized as assets; accounts typed as `credit` are categorized as liabilities.

### 2. Monthly Budgeting Engine (`app.features.budget.service`)
- **Period Constraints**: Composite database uniqueness constraint enforced across `(owner_id, category_id, budget_year, budget_month)`.
- **Dynamic Spending Derivation**: Category spending is calculated on-the-fly from eligible completed expense transactions in the active month.
- **Utilization & Overspending Metrics**:
  $$\text{Utilization Percentage} = \frac{\text{Actual Spending}}{\text{Allocated Amount}} \times 100$$
  - Safe zero-allocation handling (avoids division by zero; returns `None`).
  - Active `is_overspent` boolean flag for automated threshold detection and visual alarms.

### 3. Recurring Transaction Engine (`app.features.recurring.service`)
- **Frequencies Supported**: `daily`, `weekly`, `monthly`, `yearly`.
- **Calendar Edge-Case Handling**:
  - **Month-End Date Clamping**: For monthly rules created on the 29th, 30th, or 31st, occurrences in shorter months (e.g. February, April) clamp to the last valid day of that month (`calendar.monthrange`), while dynamically restoring to the target day in subsequent full months.
  - **Leap Year Calculations**: Leap-day rules (Feb 29) clamp to Feb 28 in non-leap years and automatically restore to Feb 29 on leap years.
  - **Exhaustion Handling**: Transitions `next_occurrence` to `None` once scheduled occurrences pass `end_date`.
- **Idempotent Occurrence Recording**:
  - Separates scheduled expectations from real ledger transactions. Scheduled occurrences do not alter account balances until explicitly confirmed.
  - An occurrence record table (`recurring_occurrences`) with a database unique constraint `uq_recurring_occurrence_date` on `(recurring_id, occurrence_date)` guarantees idempotency. Repeated execution requests for the same date return the existing recorded transaction without duplicating ledger entries.

### 4. Security & Authentication Architecture (`app.core.security`, `app.api.deps`)
- **Password Hashing**: Hardened Argon2id algorithm via `passlib` with custom salt generation and bcrypt fallback verification.
- **JWT Authentication**: HS256-signed tokens with expiration management (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Owner Identity Derivation**: User identity is derived strictly from server-validated JWT claims (`sub: user_id`). Untrusted client-supplied identity headers (`X-Owner-ID`) are completely rejected in protected routes.
- **Data Isolation**: All queries enforce tenant isolation at the database query level (`where(Model.owner_id == str(current_user.id))`).

---

## Database Schema & Migrations

Database schema versioning is managed via Alembic:

| Revision ID | Description |
| :--- | :--- |
| `001_initial_schema` | Initial schema for accounts, categories, and transactions. |
| `37c08a2cbadf` | Added `users` table for Argon2id credentials and account status. |
| `c3d5e7f9a1b2` | Added uniqueness constraint on `(owner_id, name)` for accounts. |
| `e8b1c3d5f7a2` | Expanded `transactiontype` enum to include `transfer`. |
| `a2c4e6f8b1d3` | Added `status` enum (`completed`, `pending`, `cancelled`), `to_account_id`, and `related_transaction_id`. |
| `b7d2e4f6a9c1` | Created `budgets` table with monthly category constraints and check rules. |
| `d4f6a8b1c3e5` | Created `recurring_transactions` and `recurring_occurrences` tables with idempotency constraints. |

---

## API Reference

All private endpoints require an `Authorization: Bearer <access_token>` header.

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account | `201 Created` |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT token | `200 OK` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | `200 OK` |

### Accounts (`/api/v1/accounts`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/accounts` | Create financial account | `201 Created` |
| `GET` | `/api/v1/accounts` | List user accounts with pagination | `200 OK` |
| `GET` | `/api/v1/accounts/{id}` | Retrieve account details | `200 OK` |
| `PATCH` | `/api/v1/accounts/{id}` | Update account metadata / active state | `200 OK` |

### Transactions (`/api/v1/transactions`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/transactions` | Record new transaction (income/expense/transfer) | `201 Created` |
| `GET` | `/api/v1/transactions` | Query transactions with filter params | `200 OK` |
| `GET` | `/api/v1/transactions/{id}` | Retrieve transaction by ID | `200 OK` |
| `PATCH` | `/api/v1/transactions/{id}`| Update transaction parameters | `200 OK` |
| `DELETE` | `/api/v1/transactions/{id}`| Delete transaction | `204 No Content` |

### Categories (`/api/v1/categories`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | List user and system categories | `200 OK` |
| `POST` | `/api/v1/categories` | Create custom category | `201 Created` |
| `POST` | `/api/v1/categories/seed-defaults` | Seed standard categories | `200 OK` |

### Financial Summary (`/api/v1/summary`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/summary` | Aggregated cash flow, breakdown & net worth | `200 OK` |

### Budgets (`/api/v1/budgets`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/budgets` | Create monthly category budget allocation | `201 Created` |
| `GET` | `/api/v1/budgets?year={y}&month={m}` | List budgets for specified period | `200 OK` |
| `GET` | `/api/v1/budgets/{id}` | Retrieve budget by ID | `200 OK` |
| `PATCH` | `/api/v1/budgets/{id}` | Update allocated budget amount | `200 OK` |
| `DELETE` | `/api/v1/budgets/{id}` | Remove budget allocation | `204 No Content` |

### Recurring Transactions (`/api/v1/recurring`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/recurring` | Create recurring schedule rule | `201 Created` |
| `GET` | `/api/v1/recurring` | List recurring schedules (with filters) | `200 OK` |
| `GET` | `/api/v1/recurring/{id}` | Retrieve recurring definition | `200 OK` |
| `PATCH` | `/api/v1/recurring/{id}` | Update recurring parameters | `200 OK` |
| `POST` | `/api/v1/recurring/{id}/pause` | Pause recurring rule | `200 OK` |
| `POST` | `/api/v1/recurring/{id}/resume` | Resume recurring rule | `200 OK` |
| `POST` | `/api/v1/recurring/{id}/record` | Record next occurrence (idempotent) | `200 OK` |
| `DELETE` | `/api/v1/recurring/{id}` | Delete recurring definition | `204 No Content` |

---

## Frontend Architecture

The frontend is built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**:
- **Centralized API Client**: [`src/lib/api-client.ts`](frontend/src/lib/api-client.ts) handles token persistence and attaches `Authorization: Bearer <token>` automatically.
- **Type Safety**: [`src/lib/api-types.ts`](frontend/src/lib/api-types.ts) mirrors backend Pydantic schemas.
- **UI Components**: Atomic, reusable components ([`Button`](frontend/src/components/ui/Button.tsx), [`Input`](frontend/src/components/ui/Input.tsx), [`Select`](frontend/src/components/ui/Select.tsx), [`Modal`](frontend/src/components/ui/Modal.tsx), [`Card`](frontend/src/components/ui/Card.tsx), [`Badge`](frontend/src/components/ui/Badge.tsx), [`EmptyState`](frontend/src/components/ui/EmptyState.tsx)).
- **Dedicated Application Routes**:
  - `/` & `/summary`: Financial Dashboard with cash flow metrics and period selector.
  - `/accounts`: Account listing, creation, and status management.
  - `/transactions`: Comprehensive transaction history with filtering and creation modal.
  - `/budgets`: Visual monthly budget tracking with utilization meters and overspending indicators.
  - `/recurring`: Recurring schedule management, pause/resume, and one-click idempotent ledger execution.

---

### 5. AI-Powered Financial Intelligence & Entitlements Engine (`app.features.ai`, `app.features.entitlements`)
- **Safe 3-Layer Architecture**:
  - **Layer A (Deterministic Financial Engine)**: Core calculations (cash flow, net worth, budget overruns, goal timelines) are executed using arbitrary-precision Python `Decimal`. The AI layer is strictly read-only and never invents or alters authoritative balances.
  - **Layer B (Controlled Context Preparation)**: User-scoped context sanitization strips PII, passwords, account numbers, and token claims, compiling only verified aggregates.
  - **Layer C (AI Explanation & Guidance)**: Centralized Gemini client (`app/features/ai/gemini.py`) connecting to Google Gemini REST API (`gemini-1.5-flash`) with 15-second bounded timeouts, retry backoff, prompt injection filtering, and automatic deterministic fallback when credentials are not configured or the remote provider fails.
- **AI Modules**:
  - **Financial Explainer** (`POST /api/v1/ai/explain`): Translates monthly aggregates, savings rates, and overspent categories into plain English.
  - **Spending Assistant** (`POST /api/v1/ai/spending-assistant`): Conversational spending Q&A protected against prompt injection.
  - **Goal Timeline Simulator** (`POST /api/v1/ai/simulate-goal`): Deterministic calculation of funding gaps and projected months required, paired with actionable recommendations.
  - **Transaction Classifier** (`POST /api/v1/ai/classify-transaction`): Intelligent categorization with heuristic keyword fallback against predefined system categories.
- **Server-Enforced Quota Entitlements**:
  - Server-side tier evaluation (`FREE` vs `PREMIUM`).
  - Monthly AI quota tracker (`check_and_consume_ai_quota`) with 403 Forbidden enforcement upon quota exhaustion.

---

## Test Suite & Verification

FINROQ enforces a strict verification bar with zero failing tests.

### 1. Backend Test Suite (Pytest)
```bash
cd backend
python -m pytest tests -v
```
**Results (127/127 passing):**
- `tests/unit/test_ai_service.py`: 7 passed
- `tests/unit/test_budget_service.py`: 10 passed
- `tests/unit/test_finance_engine.py`: 18 passed
- `tests/unit/test_models.py`: 8 passed
- `tests/unit/test_recurring_service.py`: 12 passed
- `tests/unit/test_services.py`: 19 passed
- `tests/integration/test_ai_api.py`: 6 passed
- `tests/integration/test_auth_api.py`: 10 passed
- `tests/integration/test_budget_api.py`: 10 passed
- `tests/integration/test_recurring_api.py`: 10 passed
- `tests/integration/test_api.py`: 17 passed

### 2. Frontend Test Suite (Jest)
```bash
cd frontend
npm test -- --watchAll=false
```
**Results (22/22 passing):**
- `src/components/ui/Button.test.tsx`: 7 passed
- `src/components/ui/ConfirmationDialog.test.tsx`: 4 passed
- `src/components/ui/Input.test.tsx`: 5 passed
- `src/lib/utils.test.ts`: 6 passed

### 3. Production Build Compilation
```bash
cd frontend
npm run build
```
**Results:** Compiled and verified across all 14 static and dynamic application routes with zero type errors.

---

## Local Setup & Deployment

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16

### 1. Database Setup
```bash
# With Docker:
docker compose up -d postgres

# Or Native PostgreSQL:
psql -U postgres -c "CREATE USER finroq WITH PASSWORD 'finroq_dev_secret';"
psql -U postgres -c "CREATE DATABASE finroq OWNER finroq;"
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start API server
python -m app.main
```
API runs on `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Application accessible at `http://localhost:3000`.

---

## License

Proprietary — Internal use only.