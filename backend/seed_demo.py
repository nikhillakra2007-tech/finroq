import asyncio
from decimal import Decimal
from datetime import datetime, date, timedelta
from app.db.session import async_session_factory
from app.core.security import get_password_hash
from app.db.models import (
    User, Account, AccountType, Category, CategoryType,
    Transaction, TransactionType, TransactionStatus,
    Budget, RecurringTransaction, RecurrenceFrequency, RecurrenceStatus
)
from sqlalchemy import select

async def seed_demo():
    async with async_session_factory() as session:
        # 1. Create or get Demo User
        res = await session.execute(select(User).where(User.email == "demo@finroq.com"))
        user = res.scalars().first()
        if not user:
            user = User(
                email="demo@finroq.com",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Morgan (Demo)",
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created demo user: {user.id}")
        else:
            print(f"Demo user exists: {user.id}")

        owner_id = str(user.id)

        # 2. Seed Categories
        cat_res = await session.execute(select(Category).where(Category.owner_id == owner_id))
        if not cat_res.scalars().first():
            categories = [
                Category(name="Salary", category_type=CategoryType.INCOME, owner_id=owner_id),
                Category(name="Investments", category_type=CategoryType.INCOME, owner_id=owner_id),
                Category(name="Housing", category_type=CategoryType.EXPENSE, owner_id=owner_id),
                Category(name="Groceries & Food", category_type=CategoryType.EXPENSE, owner_id=owner_id),
                Category(name="Transportation", category_type=CategoryType.EXPENSE, owner_id=owner_id),
                Category(name="Utilities", category_type=CategoryType.EXPENSE, owner_id=owner_id),
                Category(name="Entertainment", category_type=CategoryType.EXPENSE, owner_id=owner_id),
                Category(name="Healthcare", category_type=CategoryType.EXPENSE, owner_id=owner_id),
            ]
            session.add_all(categories)
            await session.commit()

        cats = (await session.execute(select(Category).where(Category.owner_id == owner_id))).scalars().all()
        cat_map = {c.name: c.id for c in cats}

        # 3. Seed Accounts
        acc_res = await session.execute(select(Account).where(Account.owner_id == owner_id))
        accounts = acc_res.scalars().all()
        if not accounts:
            checking = Account(owner_id=owner_id, name="Primary Checking", account_type=AccountType.CHECKING, initial_balance=Decimal("6500.00"), currency="USD")
            savings = Account(owner_id=owner_id, name="High-Yield Savings", account_type=AccountType.SAVINGS, initial_balance=Decimal("24500.00"), currency="USD")
            investments = Account(owner_id=owner_id, name="Vanguard Brokerage", account_type=AccountType.INVESTMENT, initial_balance=Decimal("48200.00"), currency="USD")
            credit = Account(owner_id=owner_id, name="Sapphire Reserve Credit", account_type=AccountType.CREDIT, initial_balance=Decimal("1250.00"), currency="USD")
            session.add_all([checking, savings, investments, credit])
            await session.commit()
            accounts = [checking, savings, investments, credit]

        acc_map = {a.name: a.id for a in accounts}

        # 4. Seed Budgets
        now = datetime.now()
        year = now.year
        month = now.month
        b_res = await session.execute(select(Budget).where(Budget.owner_id == owner_id, Budget.budget_year == year, Budget.budget_month == month))
        if not b_res.scalars().first():
            budgets = []
            if "Housing" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Housing"], allocated_amount=Decimal("2200.00"), budget_year=year, budget_month=month))
            if "Groceries & Food" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Groceries & Food"], allocated_amount=Decimal("800.00"), budget_year=year, budget_month=month))
            if "Transportation" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Transportation"], allocated_amount=Decimal("350.00"), budget_year=year, budget_month=month))
            if "Entertainment" in cat_map:
                budgets.append(Budget(owner_id=owner_id, category_id=cat_map["Entertainment"], allocated_amount=Decimal("400.00"), budget_year=year, budget_month=month))
            session.add_all(budgets)
            await session.commit()

        # 5. Seed Transactions
        tx_res = await session.execute(select(Transaction).where(Transaction.owner_id == owner_id))
        if not tx_res.scalars().first():
            chk_id = acc_map.get("Primary Checking")
            crd_id = acc_map.get("Sapphire Reserve Credit")
            txs = [
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Salary"),
                    amount=Decimal("5400.00"), transaction_type=TransactionType.INCOME, status=TransactionStatus.COMPLETED,
                    description="Acme Corp Monthly Payroll Direct Deposit", transaction_date=datetime.utcnow() - timedelta(days=5)
                ),
                Transaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Housing"),
                    amount=Decimal("2100.00"), transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Beacon Luxury Apartments Rent", transaction_date=datetime.utcnow() - timedelta(days=10)
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Groceries & Food"),
                    amount=Decimal("184.50"), transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Whole Foods Market Organic Groceries", transaction_date=datetime.utcnow() - timedelta(days=2)
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Groceries & Food"),
                    amount=Decimal("92.30"), transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Trader Joe's Weekly Provisions", transaction_date=datetime.utcnow() - timedelta(days=4)
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Transportation"),
                    amount=Decimal("55.00"), transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Metro Transit Monthly Pass", transaction_date=datetime.utcnow() - timedelta(days=8)
                ),
                Transaction(
                    owner_id=owner_id, account_id=crd_id, category_id=cat_map.get("Entertainment"),
                    amount=Decimal("45.00"), transaction_type=TransactionType.EXPENSE, status=TransactionStatus.COMPLETED,
                    description="Criterion Channel & Spotify Subscriptions", transaction_date=datetime.utcnow() - timedelta(days=1)
                ),
            ]
            session.add_all(txs)
            await session.commit()

        # 6. Seed Recurring Transactions
        rec_res = await session.execute(select(RecurringTransaction).where(RecurringTransaction.owner_id == owner_id))
        if not rec_res.scalars().first():
            chk_id = acc_map.get("Primary Checking")
            recs = [
                RecurringTransaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Housing"),
                    amount=Decimal("2100.00"), transaction_type=TransactionType.EXPENSE, frequency=RecurrenceFrequency.MONTHLY,
                    status=RecurrenceStatus.ACTIVE, description="Monthly Apartment Rent",
                    start_date=date(2026, 1, 1), next_occurrence=date(2026, 11, 1)
                ),
                RecurringTransaction(
                    owner_id=owner_id, account_id=chk_id, category_id=cat_map.get("Salary"),
                    amount=Decimal("5400.00"), transaction_type=TransactionType.INCOME, frequency=RecurrenceFrequency.MONTHLY,
                    status=RecurrenceStatus.ACTIVE, description="Bi-Weekly / Monthly Salary",
                    start_date=date(2026, 1, 15), next_occurrence=date(2026, 10, 15)
                ),
            ]
            session.add_all(recs)
            await session.commit()

        print("DEMO_SEED_COMPLETED_SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(seed_demo())
