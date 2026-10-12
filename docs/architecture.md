# Finroq Architecture

## Overview

Finroq is a personal finance management application built with a modern full-stack architecture:

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.12, SQLAlchemy 2.0 (async), Pydantic v2
- **Database**: PostgreSQL 16 with Alembic migrations
- **Development**: Docker Compose for PostgreSQL, hot reload for both frontend and backend

## Project Structure

```
finroq/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature-specific components
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   └── summary/
│   │   └── lib/             # Utilities, API client, types
│   └── package.json
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   └── routes/
│   │   ├── core/            # Configuration, security
│   │   ├── db/              # Database session, models
│   │   ├── features/        # Feature-specific services
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   └── summary/
│   │   └── shared/          # Shared schemas
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── pytest.ini
├── database/
│   ├── migrations/          # Alembic migration files
│   └── seeds/               # Development seed scripts
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
└── docs/                    # Documentation
```

## Architectural Principles

### 1. Separation of Concerns

- **API Routes** (`backend/app/api/routes/`): HTTP handling, request validation, response serialization
- **Services** (`backend/app/features/*/service.py`): Business logic, financial calculations, workflow orchestration
- **Database Layer** (`backend/app/db/`): Models, session management, raw queries
- **Frontend Components**: Presentation only, no business logic

### 2. Shared Infrastructure (Single Source of Truth)

- Database connection: `backend/app/db/session.py`
- Configuration: `backend/app/core/config.py`
- Pydantic Schemas: `backend/app/shared/schemas.py`
- API Client: `frontend/src/lib/api-client.ts`
- Utilities: `frontend/src/lib/utils.ts`

### 3. Feature-Based Organization

Each feature has ~2-3 primary implementation files:
- Accounts: `service.py`, `api/routes/accounts.py`
- Transactions: `service.py`, `api/routes/transactions.py`
- Categories: `service.py`, `api/routes/categories.py`
- Summary: `service.py`, `api/routes/summary.py`

### 4. Data Integrity

- Decimal arithmetic for all monetary values (never float)
- Foreign key constraints with RESTRICT/SET NULL
- Check constraints for positive amounts, non-negative balances
- Owner isolation enforced at service layer

## API Design

### Versioning
All endpoints under `/api/v1`

### Authentication
Development authentication via `X-Owner-ID` header. Production will use JWT tokens.

### Endpoints

| Resource | Endpoints |
|----------|-----------|
| Health | `GET /health`, `GET /health/ready` |
| Accounts | `GET/POST /accounts`, `GET/PATCH /accounts/{id}` |
| Transactions | `GET/POST /transactions`, `GET/PATCH/DELETE /transactions/{id}` |
| Categories | `GET/POST /categories`, `POST /categories/seed-defaults` |
| Summary | `GET /summary` |

### Request/Response Format

All requests/responses use JSON with Pydantic validation. Errors follow RFC 7807 format.

## Database Schema

### Core Tables

1. **accounts** - Financial accounts (checking, savings, credit, etc.)
2. **transactions** - Income/expense records linked to accounts
3. **categories** - Transaction categories (system + user-defined)

### Conventions

- Amounts stored as positive `NUMERIC(14,2)` with separate `transaction_type` (income/expense)
- Currency per account (single currency in Phase 1)
- Soft delete via `is_active` flag on accounts
- Timestamps: `created_at`, `updated_at` on all tables

## Frontend Architecture

### State Management
- React Query (TanStack Query) for server state (planned)
- React Hook Form + Zod for form validation
- Local component state for UI interactions

### Component Structure
- `components/ui/` - Primitive reusable components (Button, Input, Modal, etc.)
- `features/*/` - Feature-specific components composed from UI primitives
- `app/` - Page components using feature components

### API Integration
Centralized `apiClient` in `lib/api-client.ts` with:
- Automatic `X-Owner-ID` header injection
- Error handling interceptors
- Type-safe request/response methods

## Development Workflow

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)

### Commands

```bash
# Start database
docker-compose up -d

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
cp ../.env.example .env
alembic upgrade head
python -m app.main

# Frontend
cd frontend
npm install
npm run dev

# Tests
cd backend && pytest
cd frontend && npm test
```

## Security Considerations

- Never expose database credentials to frontend
- Validate ownership on every database query
- Use parameterized queries (SQLAlchemy ORM)
- CORS restricted to known origins
- Secrets in `.env` (never committed)

## Future Extensibility

- Multi-user authentication (JWT/OAuth)
- Multi-currency with exchange rates
- Budgeting and forecasting
- Investment tracking
- Bank integration (Plaid, etc.)
- Reports and analytics