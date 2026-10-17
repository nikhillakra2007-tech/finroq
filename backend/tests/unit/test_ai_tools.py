import pytest
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Account,
    AccountType,
    Category,
    CategoryType,
    Transaction,
    TransactionType,
    TransactionStatus,
    Budget,
    RecurringTransaction,
    RecurrenceFrequency,
    RecurrenceStatus,
)
from app.features.ai.tools import FinancialToolRegistry, TOOL_DEFINITIONS


@pytest.mark.asyncio
class TestFinancialTools:
    async def test_tool_definitions_valid(self):
        assert len(TOOL_DEFINITIONS) >= 12
        for tool in TOOL_DEFINITIONS:
            assert tool["type"] == "function"
            fn = tool["function"]
            assert "name" in fn
            assert "description" in fn
            assert "parameters" in fn

    async def test_financial_summary_and_user_isolation(self, db_session: AsyncSession):
        user_a = "user_alpha"
        user_b = "user_beta"

        # Setup accounts
        acc_a = Account(
            owner_id=user_a,
            name="Checking A",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("50000.00"),
        )
        acc_b = Account(
            owner_id=user_b,
            name="Checking B",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("1000000.00"),
        )
        db_session.add_all([acc_a, acc_b])
        await db_session.flush()

        # Add income and expense for user A
        cat_inc = Category(name="Salary", category_type=CategoryType.INCOME, owner_id=user_a)
        cat_exp = Category(name="Rent", category_type=CategoryType.EXPENSE, owner_id=user_a)
        db_session.add_all([cat_inc, cat_exp])
        await db_session.flush()

        tx_inc = Transaction(
            owner_id=user_a,
            account_id=acc_a.id,
            category_id=cat_inc.id,
            amount=Decimal("30000.00"),
            currency="INR",
            transaction_type=TransactionType.INCOME,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime.utcnow(),
        )
        tx_exp = Transaction(
            owner_id=user_a,
            account_id=acc_a.id,
            category_id=cat_exp.id,
            amount=Decimal("10000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime.utcnow(),
        )
        # Secret transaction for user B
        tx_b = Transaction(
            owner_id=user_b,
            account_id=acc_b.id,
            amount=Decimal("999999.00"),
            currency="INR",
            transaction_type=TransactionType.INCOME,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime.utcnow(),
        )
        db_session.add_all([tx_inc, tx_exp, tx_b])
        await db_session.flush()

        registry_a = FinancialToolRegistry(db_session, user_a)
        summary = await registry_a.tool_get_financial_summary()

        assert summary["total_income"] == "30000.00"
        assert summary["total_expenses"] == "10000.00"
        assert summary["net_cash_flow"] == "20000.00"
        # Liquid cash = initial 50,000 + 30,000 - 10,000 = 70,000
        assert summary["liquid_cash_available"] == "70000.00"

        # Verify User B's secret 999,999 balance is completely isolated and absent
        assert "999999.00" not in str(summary)

    async def test_calculate_purchase_affordability(self, db_session: AsyncSession):
        user_id = "user_afford"
        acc = Account(
            owner_id=user_id,
            name="Bank",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("25000.00"),
        )
        db_session.add(acc)
        await db_session.flush()

        # Add upcoming recurring bill of 5,000
        bill = RecurringTransaction(
            owner_id=user_id,
            account_id=acc.id,
            amount=Decimal("5000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=datetime.utcnow(),
            next_occurrence=datetime.utcnow() + timedelta(days=5),
            status=RecurrenceStatus.ACTIVE,
            description="Broadband & Mobile",
        )
        db_session.add(bill)
        await db_session.flush()

        registry = FinancialToolRegistry(db_session, user_id)

        # 1. Comfortable: ₹5,000 purchase with ₹25,000 balance, ₹5,000 bill, ₹5,000 buffer
        # Remaining: 25,000 - 5,000 - 5,000 = 15,000 > buffer
        res1 = await registry.tool_calculate_purchase_affordability(
            purchase_amount=5000.0, context="Headphones"
        )
        assert "Comfortably" in res1["affordability_rating"]
        assert res1["available_liquid_cash"] == "25000.00"

        # 2. Caution: ₹18,000 purchase. 25,000 - 18,000 - 5,000 = 2,000 < buffer (5,000)
        res2 = await registry.tool_calculate_purchase_affordability(
            purchase_amount=18000.0, context="Laptop"
        )
        assert "Caution" in res2["affordability_rating"]

        # 3. Not affordable: ₹30,000 purchase > available 25,000
        res3 = await registry.tool_calculate_purchase_affordability(
            purchase_amount=30000.0, context="Bike"
        )
        assert "Not Affordable" in res3["affordability_rating"]

    async def test_calculate_savings_scenario(self, db_session: AsyncSession):
        user_id = "user_scenario"
        acc = Account(
            owner_id=user_id,
            name="Savings",
            account_type=AccountType.SAVINGS,
            currency="INR",
            initial_balance=Decimal("10000.00"),
        )
        cat = Category(name="Dining", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([acc, cat])
        await db_session.flush()

        tx = Transaction(
            owner_id=user_id,
            account_id=acc.id,
            category_id=cat.id,
            amount=Decimal("8000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime.utcnow(),
        )
        db_session.add(tx)
        await db_session.flush()

        registry = FinancialToolRegistry(db_session, user_id)

        # Target savings scenario
        res_target = await registry.tool_calculate_savings_scenario(target_monthly_savings=2000.0)
        assert res_target["monthly_target"] == "2000.00"
        assert res_target["annual_savings_impact"] == "24000.00"

        # Percentage cut scenario on Dining (15%)
        res_pct = await registry.tool_calculate_savings_scenario(
            category_name="Dining", reduction_percentage=15.0
        )
        # 15% of 8,000 is 1,200
        assert res_pct["estimated_monthly_savings"] == "1200.00"
        assert res_pct["estimated_annual_savings"] == "14400.00"

    async def test_estimate_month_end_position(self, db_session: AsyncSession):
        user_id = "user_monthend"
        acc = Account(
            owner_id=user_id,
            name="Primary Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("40000.00"),
        )
        db_session.add(acc)
        await db_session.flush()

        registry = FinancialToolRegistry(db_session, user_id)
        pos = await registry.tool_estimate_month_end_position()

        assert "scenarios" in pos
        assert "baseline_projected_cash" in pos["scenarios"]
        assert "frugal_scenario_cash" in pos["scenarios"]
        assert "assumptions_and_transparency" in pos

    async def test_category_filtering_before_sql_limit_older_matching_records(self, db_session: AsyncSession):
        user_id = "user_cat_test"
        acc = Account(
            owner_id=user_id,
            name="Checking Cat",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("50000.00"),
        )
        cat_dining = Category(name="Dining", category_type=CategoryType.EXPENSE, owner_id=user_id)
        cat_groceries = Category(name="Groceries", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([acc, cat_dining, cat_groceries])
        await db_session.flush()

        base_date = datetime(2026, 10, 1, 10, 0, 0)
        txns = []
        # 5 older Groceries transactions (days 1 to 5)
        for i in range(5):
            txns.append(
                Transaction(
                    owner_id=user_id,
                    account_id=acc.id,
                    category_id=cat_groceries.id,
                    amount=Decimal("150.00"),
                    currency="INR",
                    transaction_type=TransactionType.EXPENSE,
                    status=TransactionStatus.COMPLETED,
                    description=f"Groceries #{i+1}",
                    transaction_date=base_date + timedelta(days=i),
                )
            )

        # 20 newer Dining transactions (days 6 to 25)
        for i in range(20):
            txns.append(
                Transaction(
                    owner_id=user_id,
                    account_id=acc.id,
                    category_id=cat_dining.id,
                    amount=Decimal("50.00"),
                    currency="INR",
                    transaction_type=TransactionType.EXPENSE,
                    status=TransactionStatus.COMPLETED,
                    description=f"Dining #{i+1}",
                    transaction_date=base_date + timedelta(days=6 + i),
                )
            )

        db_session.add_all(txns)
        await db_session.commit()

        registry = FinancialToolRegistry(db_session, user_id)

        # Before fix: selecting top 20 by date got 20 Dining txns, then Python filtered out all of them -> 0 Groceries!
        # After fix: SQL filters for Groceries first, then orders and limits -> all 5 Groceries are returned!
        res = await registry.tool_get_transactions(category_name="Groceries", limit=20)

        assert res["transaction_count"] == 5
        assert len(res["transactions"]) == 5
        for t in res["transactions"]:
            assert t["category"] == "Groceries"

    async def test_category_filtering_limit_and_ordering(self, db_session: AsyncSession):
        user_id = "user_limit_test"
        acc = Account(
            owner_id=user_id,
            name="Checking Limit",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("20000.00"),
        )
        cat = Category(name="Utilities", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([acc, cat])
        await db_session.flush()

        base_date = datetime(2026, 1, 1)
        for i in range(10):
            db_session.add(
                Transaction(
                    owner_id=user_id,
                    account_id=acc.id,
                    category_id=cat.id,
                    amount=Decimal("100.00"),
                    currency="INR",
                    transaction_type=TransactionType.EXPENSE,
                    status=TransactionStatus.COMPLETED,
                    description=f"Utility bill #{i+1}",
                    transaction_date=base_date + timedelta(days=i),
                )
            )
        await db_session.commit()

        registry = FinancialToolRegistry(db_session, user_id)
        # Request limit=4
        res = await registry.tool_get_transactions(category_name="Utilities", limit=4)
        assert res["transaction_count"] == 4
        assert len(res["transactions"]) == 4
        # Newest first (day 9, day 8, day 7, day 6)
        assert res["transactions"][0]["description"] == "Utility bill #10"
        assert res["transactions"][3]["description"] == "Utility bill #7"

    async def test_category_filtering_user_isolation_and_no_match(self, db_session: AsyncSession):
        user_1 = "user_iso_1"
        user_2 = "user_iso_2"
        acc_1 = Account(owner_id=user_1, name="Acc 1", account_type=AccountType.CHECKING, currency="INR", initial_balance=Decimal("10000.00"))
        acc_2 = Account(owner_id=user_2, name="Acc 2", account_type=AccountType.CHECKING, currency="INR", initial_balance=Decimal("10000.00"))
        cat_secret = Category(name="SecretTravel", category_type=CategoryType.EXPENSE, owner_id=user_2)
        db_session.add_all([acc_1, acc_2, cat_secret])
        await db_session.flush()

        # User 2 has SecretTravel transaction
        db_session.add(
            Transaction(
                owner_id=user_2,
                account_id=acc_2.id,
                category_id=cat_secret.id,
                amount=Decimal("9999.00"),
                currency="INR",
                transaction_type=TransactionType.EXPENSE,
                status=TransactionStatus.COMPLETED,
                transaction_date=datetime.utcnow(),
            )
        )
        await db_session.commit()

        # User 1 queries for SecretTravel -> must return 0 (owner isolation)
        registry_1 = FinancialToolRegistry(db_session, user_1)
        res_iso = await registry_1.tool_get_transactions(category_name="SecretTravel")
        assert res_iso["transaction_count"] == 0
        assert len(res_iso["transactions"]) == 0

        # Query for non-existent category
        res_none = await registry_1.tool_get_transactions(category_name="NonExistentCategory123")
        assert res_none["transaction_count"] == 0

    async def test_simulate_financial_goal(self, db_session: AsyncSession):
        registry = FinancialToolRegistry(db_session, "user_goal_test")
        res = await registry.tool_simulate_financial_goal(
            goal_name="Emergency Reserve",
            target_amount=100000.0,
            monthly_contribution=10000.0,
            current_savings=20000.0,
        )
        assert res["type"] == "goal_timeline_simulation"
        assert res["goal_name"] == "Emergency Reserve"
        assert res["target_amount"] == "100000.00"
        assert res["current_savings"] == "20000.00"
        assert res["funding_gap"] == "80000.00"
        assert res["monthly_contribution"] == "10000.00"
        assert res["projected_months_needed"] == 8
        assert res["feasibility_status"] == "Comfortably Feasible"

    async def test_propose_budget_adjustment_requires_confirmation(self, db_session: AsyncSession):
        user_id = "user_budget_prop"
        cat = Category(name="Entertainment", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add(cat)
        await db_session.flush()

        now = datetime.now()
        b = Budget(
            owner_id=user_id,
            category_id=cat.id,
            budget_year=now.year,
            budget_month=now.month,
            allocated_amount=Decimal("5000.00"),
        )
        db_session.add(b)
        await db_session.commit()

        registry = FinancialToolRegistry(db_session, user_id)
        res = await registry.tool_propose_budget_adjustment(
            category_name="Entertainment",
            proposed_amount=7500.0,
            reason="Holiday season adjustment",
        )

        assert res["type"] == "budget_adjustment_proposal"
        assert res["requires_confirmation"] is True
        assert res["category_name"] == "Entertainment"
        assert res["current_allocated"] == "5000.00"
        assert res["proposed_allocated"] == "7500.00"
        assert res["difference"] == "2500.00"
        assert "Consequential change" in res["consequential_action_notice"]

    async def test_propose_recurring_bill_requires_confirmation(self, db_session: AsyncSession):
        user_id = "user_rec_prop"
        acc = Account(
            owner_id=user_id,
            name="Salary Account",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("50000.00"),
        )
        cat = Category(name="Subscriptions", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([acc, cat])
        await db_session.commit()

        registry = FinancialToolRegistry(db_session, user_id)
        res = await registry.tool_propose_recurring_bill(
            description="Gym Membership",
            amount=2000.0,
            frequency="monthly",
            category_name="Subscriptions",
        )

        assert res["type"] == "recurring_bill_proposal"
        assert res["requires_confirmation"] is True
        assert res["description"] == "Gym Membership"
        assert res["amount"] == "2000.00"
        assert res["frequency"] == "monthly"
        assert res["account_id"] == acc.id
        assert res["category_name"] == "Subscriptions"
        assert "Consequential change" in res["consequential_action_notice"]

    async def test_calculate_purchase_affordability_with_category_budget(self, db_session: AsyncSession):
        user_id = "user_afford_cat"
        acc = Account(
            owner_id=user_id,
            name="Checking",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("40000.00"),
        )
        cat = Category(name="Electronics", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([acc, cat])
        await db_session.flush()

        now = datetime.now()
        b = Budget(
            owner_id=user_id,
            category_id=cat.id,
            budget_year=now.year,
            budget_month=now.month,
            allocated_amount=Decimal("10000.00"),
        )
        db_session.add(b)
        await db_session.commit()

        registry = FinancialToolRegistry(db_session, user_id)
        # Purchase of 15000: Affordable by liquid cash (40000 > 15000 + 5000 reserve),
        # but exceeds the 10000 Electronics budget cap!
        res = await registry.tool_calculate_purchase_affordability(
            purchase_amount=15000.0,
            category_name="Electronics",
        )

        assert "Category Budget Exceeded" in res["affordability_rating"]
        cat_assessment = res.get("category_budget_assessment")
        assert cat_assessment is not None
        assert cat_assessment["category_name"] == "Electronics"
        assert cat_assessment["will_overspend_category_budget"] is True
        assert cat_assessment["overrun_amount"] == "5000.00"

