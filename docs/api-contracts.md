# API Contracts

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://api.finroq.com/api/v1
```

## Authentication

All endpoints require `X-Owner-ID` header:
```
X-Owner-ID: user-123
```

Missing header returns `401 Unauthorized`.

## Common Response Format

### Success
```json
{
  "id": 1,
  "name": "Example",
  ...
}
```

### Error (RFC 7807)
```json
{
  "detail": "Human-readable error message",
  "status_code": 400,
  "error_code": "VALIDATION_ERROR"
}
```

### Paginated List
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

## Endpoints

### Health

#### GET /health
Liveness probe.

**Response 200:**
```json
{
  "status": "healthy",
  "service": "finroq-api",
  "version": "0.1.0",
  "environment": "development"
}
```

#### GET /health/ready
Readiness probe (verifies database connectivity).

**Response 200:**
```json
{
  "status": "ready",
  "database": "connected"
}
```

**Response 503:**
```json
{
  "status": "not_ready",
  "database": "disconnected",
  "error": "connection refused"
}
```

---

### Accounts

#### GET /accounts
List accounts with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (>=1) |
| page_size | integer | 20 | Items per page (1-100) |
| is_active | boolean | null | Filter by active status |

**Response 200:**
```json
{
  "accounts": [
    {
      "id": 1,
      "owner_id": "user-123",
      "name": "Main Checking",
      "account_type": "checking",
      "currency": "USD",
      "initial_balance": "5000.00",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

#### POST /accounts
Create new account.

**Request Body:**
```json
{
  "name": "Savings Account",
  "account_type": "savings",
  "currency": "USD",
  "initial_balance": "10000.00"
}
```

**Validation:**
- `name`: 1-128 chars, required
- `account_type`: enum (checking, savings, credit, investment, cash, other)
- `currency`: 3 uppercase letters (ISO 4217)
- `initial_balance`: decimal >= 0, max 2 decimal places

**Response 201:** Account object (same as GET)

**Response 422:** Validation error

#### GET /accounts/{id}
Get single account.

**Response 200:** Account object

**Response 404:** Not found

#### PATCH /accounts/{id}
Update account.

**Request Body (all optional):**
```json
{
  "name": "Updated Name",
  "account_type": "savings",
  "currency": "EUR",
  "initial_balance": "15000.00",
  "is_active": false
}
```

**Response 200:** Updated account object

**Response 404:** Not found

---

### Transactions

#### GET /transactions
List transactions with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (>=1) |
| page_size | integer | Items per page (1-100) |
| account_id | integer | Filter by account |
| transaction_type | enum | income, expense |
| category_id | integer | Filter by category |
| start_date | ISO8601 | Filter from date |
| end_date | ISO8601 | Filter to date |

**Response 200:**
```json
{
  "transactions": [
    {
      "id": 1,
      "owner_id": "user-123",
      "account_id": 1,
      "category_id": 2,
      "amount": "100.00",
      "currency": "USD",
      "transaction_type": "expense",
      "description": "Groceries",
      "transaction_date": "2024-01-15T10:30:00",
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

#### POST /transactions
Create transaction.

**Request Body:**
```json
{
  "account_id": 1,
  "category_id": 2,
  "amount": "50.00",
  "currency": "USD",
  "transaction_type": "expense",
  "description": "Coffee",
  "transaction_date": "2024-01-15T08:00:00"
}
```

**Validation:**
- `account_id`: must exist and belong to owner
- `category_id`: optional, must match transaction_type (or be 'both')
- `amount`: decimal > 0, max 2 decimal places
- `currency`: 3 uppercase letters, must match account currency
- `transaction_type`: enum (income, expense)
- `description`: optional, max 512 chars
- `transaction_date`: ISO8601 datetime

**Response 201:** Transaction object

**Response 400:** Invalid account/category reference or type mismatch

**Response 422:** Validation error

#### GET /transactions/{id}
Get single transaction.

**Response 200:** Transaction object

**Response 404:** Not found

#### PATCH /transactions/{id}
Update transaction.

**Request Body (all optional):**
```json
{
  "account_id": 2,
  "category_id": 3,
  "amount": "75.00",
  "currency": "USD",
  "transaction_type": "expense",
  "description": "Updated description",
  "transaction_date": "2024-01-15T09:00:00"
}
```

**Response 200:** Updated transaction object

**Response 400:** Invalid references

**Response 404:** Not found

#### DELETE /transactions/{id}
Delete transaction.

**Response 204:** No content

**Response 404:** Not found

---

### Categories

#### GET /categories
List categories.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| category_type | enum | null | income, expense, both |
| include_system | boolean | true | Include system categories |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Salary",
    "category_type": "income",
    "owner_id": null,
    "is_system": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### POST /categories
Create user category.

**Request Body:**
```json
{
  "name": "Custom Category",
  "category_type": "expense"
}
```

**Response 201:** Category object

#### POST /categories/seed-defaults
Create default system categories (idempotent).

**Response 200:** Array of created system categories

---

### Summary

#### GET /summary
Get financial summary for a period.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| start_date | ISO8601 | First day of current month | Period start |
| end_date | ISO8601 | Now | Period end |

**Response 200:**
```json
{
  "period": {
    "start_date": "2024-01-01T00:00:00",
    "end_date": "2024-01-31T23:59:59"
  },
  "total_income": "5000.00",
  "total_expenses": "2500.00",
  "net_cash_flow": "2500.00",
  "account_balances": [
    {
      "account_id": 1,
      "account_name": "Main Checking",
      "account_type": "checking",
      "currency": "USD",
      "current_balance": "3500.00",
      "period_income": "5000.00",
      "period_expenses": "2500.00"
    }
  ],
  "category_breakdown": [
    {
      "category_id": 1,
      "category_name": "Salary",
      "category_type": "income",
      "total_amount": "5000.00",
      "transaction_count": 1
    },
    {
      "category_id": 2,
      "category_name": "Food",
      "category_type": "expense",
      "total_amount": "800.00",
      "transaction_count": 5
    }
  ]
}
```

**Calculations:**
- `total_income`: Sum of all income transactions in period
- `total_expenses`: Sum of all expense transactions in period
- `net_cash_flow`: total_income - total_expenses
- `current_balance`: initial_balance + all-time income - all-time expenses
- `period_income/expenses`: Income/expenses within the query period only

---

## Data Types

| Type | Format | Example |
|------|--------|---------|
| Decimal | String with 2 decimal places | "1234.56" |
| DateTime | ISO 8601 UTC | "2024-01-15T10:30:00" |
| UUID | Standard | "550e8400-e29b-41d4-a716-446655440000" |
| Enum | Lowercase string | "checking" |

---

## Rate Limiting

Not implemented in Phase 1. Planned for production.

## Versioning

URL path versioning: `/api/v1/`. Breaking changes will increment version.

## CORS

Configured via `CORS_ORIGINS` environment variable. Default: `http://localhost:3000`