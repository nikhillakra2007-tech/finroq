import asyncio
import sys
from decimal import Decimal
from datetime import datetime, date, timedelta

sys.path.insert(0, '.')
from app.db.session import async_session_factory
from app.core.security import get_password_hash
from app.db.models import (
    User, Account, AccountType, Category, CategoryType,
    Transaction, TransactionType, TransactionStatus,
    Budget, RecurringTransaction, RecurrenceFrequency, RecurrenceStatus
)
from sqlalchemy import select, delete

async def seed_inr_data_for_all():
    async with async_session_factory() as session:
        users = (await session.execute(select(User))).scalars().all()
        print(f"Found {len(users)} users in database.")

        for user in users:
            owner_id = str(user.id)
            print(f"Seeding rich INR data for user {user.id} ({user.email})...")

            # 1. Standard categories
            existing_cats = (await session.execute(select(Category).where(Category.owner_id == owner_id))).scalars().all()
            cat_map = {c.name: c.id for c in existing_cats}

            standard_cats = [
                ("Salary", CategoryType.INCOME),
                ("Investments", CategoryType.INCOME),
                ("Housing & Rent", CategoryType.EXPENSE),
                ("Groceries & Food", CategoryType.EXPENSE),
                ("Commute & Fuel", CategoryType.EXPENSE),
                ("Utilities & Bills", CategoryType.EXPENSE),
                ("Dining & Entertainment", CategoryType.EXPENSE),
                ("Healthcare & Medical", CategoryType.EXPENSE),
                ("Debt & EMI Repayment", CategoryType.EXPENSE),
            ]

            for name, ctype in standard_cats:
                if name not in cat_map:
                    new_cat = Category(name=name, category_type=ctype, owner_id=owner_id)
                    session.add(new_cat)
            await session.commit()

            cats = (await session.execute(select(Category).where(Category.owner_id == owner_id))).scalars().all()
            cat_map = {c.name: c.id for c in cats}

            # 2. Clean child records first
            await session.execute(delete(RecurringTransaction).where(RecurringTransaction.owner_id == owner_id))
            await session.execute(delete(Transaction).where(Transaction.owner_id == owner_id))
            await session.execute(delete(Account).where(Account.owner_id == owner_id))
            await session.execute(delete(Budget).where(Budget.owner_id == owner_id))
            await session.commit()

            # 3. Create fresh INR Accounts
            checking = Account(
                owner_id=owner_id,
                name="HDFC Salary Checking",
                account_type=AccountType.CHECKING,
                initial_balance=Decimal("185000.00"),
                currency="INR"
            )
            savings = Account(
                owner_id=owner_id,
                name="SBI Emergency Cushion Savings",
                account_type=AccountType.SAVINGS,
                initial_balance=Decimal("475400.00"),
                currency="INR"
            )
            investments = Account(
                owner_id=owner_id,
                name="Zerodha Wealth Portfolio",
                account_type=AccountType.INVESTMENT,
                initial_balance=Decimal("1250000.00"),
                currency="INR"
            )
            credit = Account(
                owner_id=owner_id,
                name="HDFC Regalia Credit Card",
                account_type=AccountType.CREDIT,
                initial_balance=Decimal("24500.00"),
                currency="INR"
            )
            session.add_all([checking, savings, investments, credit])
            await session.commit()

            chk_id = checking.id
            sav_id = savings.id
            crd_id = credit.id

            # 4. Realistic verified transactions (in INR)
            now = datetime.utcnow()
            txs = [
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Salary"),
                    amount=Decimal("150000.00"), currency="INR", transaction_type=TransactionType.INCOME, status=TransactionStatus.COMPLETED,
                    description="Monthly Corporate Payroll Credit", transaction_date=now - timedelta(days=5),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Housing & Rent"),
                    amount=Decimal("28000.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Apartment Monthly Rent Transfer", transaction_date=now - timedelta(days=10),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Groceries & Food"),
                    amount=Decimal("12500.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Blinkit & Nature's Basket Monthly Groceries", transaction_date=now - timedelta(days=3),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Utilities & Bills"),
                    amount=Decimal("4200.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Electricity & High-Speed Fiber Internet", transaction_date=now - timedelta(days=6),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Commute & Fuel"),
                    amount=Decimal("5500.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="HP Fuel Station & Fastag Auto-Recharge", transaction_date=now - timedelta(days=7),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Dining & Entertainment"),
                    amount=Decimal("14800.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Weekend Dining, OTT & Coffee Subscriptions", transaction_date=now - timedelta(days=2),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=chk_id, to_account_id=sav_id,
                    amount=Decimal("25000.00"), currency="INR", transaction_type=TransactionType.TRANSFER, status=TransactionStatus.COMPLETED,
                    description="Monthly Emergency Cushion Allocation", transaction_date=now - timedelta(days=8),
                    source="verified_ledger"
                ),
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Debt & EMI Repayment"),
                    amount=Decimal("8500.00"), currency="INR", transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="HDFC Personal / Auto Loan EMI", transaction_date=now - timedelta(days=12),
                    source="verified_ledger"
                ),
            ]
            session.add_all(txs)
            await session.commit()

            # 5. Recurring commitments (in INR)
            recs = [
                RecurringTransaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Salary"),
                    amount=Decimal("150000.00"), currency="INR", transaction_type=TransactionType.INCOME,
                    frequency=RecurrenceFrequency.MONTHLY, status=RecurrenceStatus.ACTIVE,
                    description="Monthly Corporate Salary Mandate",
                    start_date=date(2026, 1, 1), next_occurrence=date(2026, 11, 1)
                ),
                RecurringTransaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Housing & Rent"),
                    amount=Decimal("28000.00"), currency="INR", transaction_type=TransactionType.EXPENSE,
                    frequency=RecurrenceFrequency.MONTHLY, status=RecurrenceStatus.ACTIVE,
                    description="Apartment Monthly Rent Standing Instruction",
                    start_date=date(2026, 1, 1), next_occurrence=date(2026, 11, 1)
                ),
                RecurringTransaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Debt & EMI Repayment"),
                    amount=Decimal("8500.00"), currency="INR", transaction_type=TransactionType.EXPENSE,
                    frequency=RecurrenceFrequency.MONTHLY, status=RecurrenceStatus.ACTIVE,
                    description="Automated EMI Loan Auto-Debit",
                    start_date=date(2026, 1, 1), next_occurrence=date(2026, 11, 5)
                ),
            ]
            session.add_all(recs)
            await session.commit()

            # 6. Current month Budgets (in INR)
            now = datetime.now()
            budgets = []
            if "Housing & Rent" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Housing & Rent"], allocated_amount=Decimal("30000.00"), budget_year=now.year, budget_month=now.month))
            if "Groceries & Food" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Groceries & Food"], allocated_amount=Decimal("15000.00"), budget_year=now.year, budget_month=now.month))
            if "Commute & Fuel" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Commute & Fuel"], allocated_amount=Decimal("7000.00"), budget_year=now.year, budget_month=now.month))
            if "Utilities & Bills" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Utilities & Bills"], allocated_amount=Decimal("5000.00"), budget_year=now.year, budget_month=now.month))
            if "Dining & Entertainment" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Dining & Entertainment"], allocated_amount=Decimal("15000.00"), budget_year=now.year, budget_month=now.month))
            session.add_all(budgets)
            await session.commit()

        print("ALL_USERS_INR_SEEDING_COMPLETED_SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(seed_inr_data_for_all())
