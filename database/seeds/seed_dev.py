#!/usr/bin/env python3
"""Development seed script for Finroq.

This script creates fictional accounts, categories, and transactions
for local development and testing. It does not use real financial data.

Usage:
    python -m database.seeds.seed_dev --owner-id dev-user-001
"""

import asyncio
import argparse
import sys
from datetime import datetime, date, timedelta
from decimal import Decimal
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.db.models import Account, AccountType, Category, CategoryType, Transaction, TransactionType
from app.core.config import settings


async def seed_database(owner_id: str, db_url: str) -> None:
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check if data already exists for this owner
        existing_accounts = await db.execute(
            select(Account).where(Account.owner_id == owner_id)
        )
        if existing_accounts.scalars().first():
            print(f"Data already exists for owner '{owner_id}'. Skipping seed.")
            return

        print(f"Seeding development data for owner: {owner_id}")

        # Create system categories
        system_categories = [
            # Income
            ("Salary", CategoryType.INCOME),
            ("Freelance", CategoryType.INCOME),
            ("Investments", CategoryType.INCOME),
            ("Gifts", CategoryType.INCOME),
            ("Other Income", CategoryType.INCOME),
            # Expense
            ("Housing", CategoryType.EXPENSE),
            ("Transportation", CategoryType.EXPENSE),
            ("Food", CategoryType.EXPENSE),
            ("Utilities", CategoryType.EXPENSE),
            ("Healthcare", CategoryType.EXPENSE),
            ("Entertainment", CategoryType.EXPENSE),
            ("Shopping", CategoryType.EXPENSE),
            ("Education", CategoryType.EXPENSE),
            ("Personal Care", CategoryType.EXPENSE),
            ("Other Expenses", CategoryType.EXPENSE),
        ]

        category_map = {}
        for name, cat_type in system_categories:
            cat = Category(name=name, category_type=cat_type, owner_id=None, is_system=True)
            db.add(cat)
            await db.flush()
            category_map[(name, cat_type)] = cat.id

        # Create accounts
        accounts_data = [
            ("HDFC Bank (Salary)", AccountType.CHECKING, Decimal("100400.00")),
            ("ICICI Savings", AccountType.SAVINGS, Decimal("375000.00")),
            ("SBI Prime Credit", AccountType.CREDIT, Decimal("24500.00")),
            ("Investment Portfolio", AccountType.INVESTMENT, Decimal("50000.00")),
        ]

        account_map = {}
        for name, acc_type, initial_balance in accounts_data:
            acc = Account(
                owner_id=owner_id,
                name=name,
                account_type=acc_type,
                currency="USD",
                initial_balance=initial_balance,
            )
            db.add(acc)
            await db.flush()
            account_map[name] = acc.id

        # Create transactions for the last 60 days
        today = date.today()
        transactions_data = [
            # Income transactions
            ("Salary", "Main Checking", TransactionType.INCOME, Decimal("5000.00"), -30, "Monthly salary"),
            ("Salary", "Main Checking", TransactionType.INCOME, Decimal("5000.00"), -1, "Monthly salary"),
            ("Freelance", "Main Checking", TransactionType.INCOME, Decimal("1200.00"), -15, "Web development project"),
            ("Investments", "Investment Portfolio", TransactionType.INCOME, Decimal("500.00"), -10, "Dividend payment"),
            ("Gifts", "Main Checking", TransactionType.INCOME, Decimal("200.00"), -5, "Birthday gift"),
            # Expense transactions
            ("Housing", "Main Checking", TransactionType.EXPENSE, Decimal("1800.00"), -28, "Rent payment"),
            ("Utilities", "Main Checking", TransactionType.EXPENSE, Decimal("250.00"), -25, "Electricity and water"),
            ("Utilities", "Main Checking", TransactionType.EXPENSE, Decimal("120.00"), -20, "Internet"),
            ("Food", "Main Checking", TransactionType.EXPENSE, Decimal("450.00"), -27, "Groceries"),
            ("Food", "Main Checking", TransactionType.EXPENSE, Decimal("380.00"), -12, "Groceries"),
            ("Food", "Main Checking", TransactionType.EXPENSE, Decimal("420.00"), -2, "Groceries"),
            ("Transportation", "Main Checking", TransactionType.EXPENSE, Decimal("80.00"), -26, "Gas"),
            ("Transportation", "Main Checking", TransactionType.EXPENSE, Decimal("75.00"), -10, "Gas"),
            ("Transportation", "Main Checking", TransactionType.EXPENSE, Decimal("60.00"), -3, "Bus pass"),
            ("Healthcare", "Main Checking", TransactionType.EXPENSE, Decimal("150.00"), -18, "Pharmacy"),
            ("Entertainment", "Main Checking", TransactionType.EXPENSE, Decimal("50.00"), -14, "Movie night"),
            ("Entertainment", "Main Checking", TransactionType.EXPENSE, Decimal("30.00"), -8, "Streaming subscription"),
            ("Shopping", "Main Checking", TransactionType.EXPENSE, Decimal("120.00"), -22, "Clothing"),
            ("Shopping", "Credit Card", TransactionType.EXPENSE, Decimal("200.00"), -19, "Electronics"),
            ("Education", "Main Checking", TransactionType.EXPENSE, Decimal("300.00"), -16, "Online course"),
            ("Personal Care", "Main Checking", TransactionType.EXPENSE, Decimal("80.00"), -7, "Haircut"),
            ("Other Expenses", "Main Checking", TransactionType.EXPENSE, Decimal("100.00"), -4, "Miscellaneous"),
            # Credit card payment
            ("Housing", "Credit Card", TransactionType.EXPENSE, Decimal("100.00"), -2, "Credit card interest"),
            # Savings transfer
            ("Other Income", "Savings Account", TransactionType.INCOME, Decimal("1000.00"), -3, "Emergency fund contribution"),
        ]

        for cat_name, acc_name, txn_type, amount, days_ago, description in transactions_data:
            txn_date = datetime.combine(today + timedelta(days=days_ago), datetime.min.time())
            cat_key = (cat_name, CategoryType.INCOME if txn_type == TransactionType.INCOME else CategoryType.EXPENSE)
            category_id = category_map.get(cat_key)
            account_id = account_map.get(acc_name)

            if category_id and account_id:
                txn = Transaction(
                    owner_id=owner_id,
                    account_id=account_id,
                    category_id=category_id,
                    amount=amount,
                currency="INR",
                    transaction_type=txn_type,
                    description=description,
                    transaction_date=txn_date,
                )
                db.add(txn)

        await db.commit()
        print("Development seed completed successfully!")

    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Seed development database")
    parser.add_argument(
        "--owner-id",
        default="dev-user-001",
        help="Owner ID for seeded data (default: dev-user-001)",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Database URL (default: from settings)",
    )
    args = parser.parse_args()

    db_url = args.database_url or settings.database_url_async
    asyncio.run(seed_database(args.owner_id, db_url))


if __name__ == "__main__":
    main()