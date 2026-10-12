# Database Schema

## Overview

PostgreSQL 16 database with three core tables for Phase 1.

## Tables

### accounts

Financial accounts (not user accounts).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| owner_id | VARCHAR(64) | NOT NULL, INDEX | User identifier |
| name | VARCHAR(128) | NOT NULL | Display name |
| account_type | ENUM | NOT NULL, DEFAULT 'checking' | checking, savings, credit, investment, cash, other |
| currency | CHAR(3) | NOT NULL, DEFAULT 'USD' | ISO 4217 currency code |
| initial_balance | NUMERIC(14,2) | NOT NULL, DEFAULT 0.00, CHECK >= 0 | Starting balance |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_accounts_owner_id` (owner_id)
- `ix_accounts_owner_id_name` (owner_id, name)

**Constraints:**
- `ck_accounts_initial_balance_nonnegative`: initial_balance >= 0

### categories

Transaction categories (system and user-defined).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| name | VARCHAR(64) | NOT NULL | Category name |
| category_type | ENUM | NOT NULL, DEFAULT 'expense' | income, expense, both |
| owner_id | VARCHAR(64) | NULL, INDEX | User identifier (NULL for system) |
| is_system | BOOLEAN | NOT NULL, DEFAULT false | System vs user category |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_categories_owner_id_type` (owner_id, category_type)

**Constraints:**
- `uq_category_name_owner_type`: UNIQUE(name, owner_id, category_type)

### transactions

Financial transactions (income or expense).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| owner_id | VARCHAR(64) | NOT NULL, INDEX | User identifier |
| account_id | INTEGER | NOT NULL, FK, INDEX | Reference to accounts |
| category_id | INTEGER | NULL, FK, INDEX | Reference to categories |
| amount | NUMERIC(14,2) | NOT NULL, CHECK > 0 | Transaction magnitude (always positive) |
| currency | CHAR(3) | NOT NULL, DEFAULT 'USD' | ISO 4217 currency code |
| transaction_type | ENUM | NOT NULL | income, expense |
| description | VARCHAR(512) | NULL | Optional description |
| transaction_date | TIMESTAMP | NOT NULL, DEFAULT now(), INDEX | When transaction occurred |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `ix_transactions_owner_id` (owner_id)
- `ix_transactions_account_id` (account_id)
- `ix_transactions_category_id` (category_id)
- `ix_transactions_transaction_date` (transaction_date)
- `ix_transactions_owner_account_date` (owner_id, account_id, transaction_date)
- `ix_transactions_owner_type_date` (owner_id, transaction_type, transaction_date)

**Constraints:**
- `ck_transactions_amount_positive`: amount > 0
- FK `account_id` → accounts.id ON DELETE RESTRICT
- FK `category_id` → categories.id ON DELETE SET NULL

## Enums

```sql
CREATE TYPE accounttype AS ENUM ('checking', 'savings', 'credit', 'investment', 'cash', 'other');
CREATE TYPE categorytype AS ENUM ('income', 'expense', 'both');
CREATE TYPE transactiontype AS ENUM ('income', 'expense');
```

## Amount Convention

**All amounts stored as positive values.** The `transaction_type` column determines whether it's income (+) or expense (-).

- Income: `transaction_type = 'income'` → adds to balance
- Expense: `transaction_type = 'expense'` → subtracts from balance

This avoids sign confusion and enables simple aggregation.

## Balance Calculation

Current account balance = `initial_balance` + Σ(income amounts) - Σ(expense amounts)

For credit accounts, the balance is typically negative (money owed).

## Migration History

| Revision | Description |
|----------|-------------|
| 001 | Initial schema: accounts, categories, transactions tables with indexes and constraints |

## Development Seeding

Run `python -m database.seeds.seed_dev --owner-id dev-user-001` to create:
- 4 accounts (checking, savings, credit, investment)
- 15 system categories (5 income, 10 expense)
- ~25 transactions over 60 days

## Production Considerations

- Add partitioning for transactions by date (monthly)
- Consider read replicas for summary queries
- Add audit logging for financial changes
- Implement row-level security for multi-tenant deployments