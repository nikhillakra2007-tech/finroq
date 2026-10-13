import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    User,
    Account,
    Transaction,
    Category,
    Budget,
    AccountType,
    TransactionType,
    TransactionStatus,
    CategoryType,
)
from app.features.readiness.service import ReadinessService
from app.features.readiness.schemas import ReadinessTier, InsightStatus, InsightType


@pytest.fixture
async def setup_users_and_accounts(db_session: AsyncSession):
    # User 1: created 120 days ago
    user1 = User(
        email="user1@example.com",
        hashed_password="hashed_pw_1",
        full_name="User One",
        created_at=datetime.utcnow() - timedelta(days=120),
    )
    # User 2: created 5 days ago
    user2 = User(
        email="user2@example.com",
        hashed_password="hashed_pw_2",
        full_name="User Two",
        created_at=datetime.utcnow() - timedelta(days=5),
    )
    # Demo User:
    demo_user = User(
        email="demo@finroq.com",
        hashed_password="demo_password",
        full_name="Demo User",
        created_at=datetime.utcnow() - timedelta(days=60),
    )
    db_session.add_all([user1, user2, demo_user])
    await db_session.commit()
    await db_session.refresh(user1)
    await db_session.refresh(user2)
    await db_session.refresh(demo_user)

    # Accounts for User 1
    acc1 = Account(
        owner_id=str(user1.id),
        name="User1 Checking",
        account_type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("5000.00"),
    )
    acc1_savings = Account(
        owner_id=str(user1.id),
        name="User1 Savings",
        account_type=AccountType.SAVINGS,
        currency="USD",
        initial_balance=Decimal("10000.00"),
    )
    acc1_inactive = Account(
        owner_id=str(user1.id),
        name="User1 Inactive Account",
        account_type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("0.00"),
        is_active=False,
    )
    # Account for User 2
    acc2 = Account(
        owner_id=str(user2.id),
        name="User2 Checking",
        account_type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("2000.00"),
    )
    # Account for Demo User
    acc_demo = Account(
        owner_id=str(demo_user.id),
        name="Demo Checking",
        account_type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("8000.00"),
    )
    db_session.add_all([acc1, acc1_savings, acc1_inactive, acc2, acc_demo])

    # Categories
    cat_software = Category(name="Software", category_type=CategoryType.EXPENSE, owner_id=str(user1.id))
    cat_dining = Category(name="Dining", category_type=CategoryType.EXPENSE, owner_id=str(user1.id))
    db_session.add_all([cat_software, cat_dining])
    await db_session.commit()
    await db_session.refresh(acc1)
    await db_session.refresh(acc1_savings)
    await db_session.refresh(acc1_inactive)
    await db_session.refresh(acc2)
    await db_session.refresh(acc_demo)
    await db_session.refresh(cat_software)
    await db_session.refresh(cat_dining)

    return {
        "user1": user1,
        "user2": user2,
        "demo_user": demo_user,
        "acc1": acc1,
        "acc1_savings": acc1_savings,
        "acc1_inactive": acc1_inactive,
        "acc2": acc2,
        "acc_demo": acc_demo,
        "cat_software": cat_software,
        "cat_dining": cat_dining,
    }


@pytest.mark.asyncio
class TestSpendLeakReadinessAndConfidence:

    # 1. New account with no transactions
    async def test_1_new_account_with_no_transactions(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        service = ReadinessService(db_session, str(ctx["user2"].id))
        report = await service.get_readiness_report()

        assert report.available_history_days == 0
        assert report.observed_active_days == 0
        assert report.total_eligible_transactions == 0
        assert report.readiness_tier == ReadinessTier.LIMITED_EVIDENCE
        assert report.verified_coverage_status == "no_history"
        assert len(report.accounts_included) == 1
        assert report.accounts_included[0].account_name == "User2 Checking"

        res = await service.detect_leaks()
        assert len(res.insights) == 0
        assert res.total_monthly_leak == Decimal("0.00")

    # 2. One day of transactions
    async def test_2_one_day_of_transactions(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        t1 = Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("50.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Supermarket One",
            transaction_date=now - timedelta(days=2),
            source="manual",
        )
        db_session.add(t1)
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        assert report.available_history_days == 1
        assert report.observed_active_days == 1
        assert report.readiness_tier == ReadinessTier.LIMITED_EVIDENCE
        assert report.manual_transactions_count == 1

    # 3. Several days of transactions (<7 days)
    async def test_3_several_days_of_transactions(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        base = datetime.utcnow() - timedelta(days=5)

        for d in [0, 2, 4]:
            db_session.add(Transaction(
                owner_id=u1_id,
                account_id=ctx["acc1"].id,
                amount=Decimal("20.00"),
                currency="USD",
                transaction_type=TransactionType.EXPENSE,
                status=TransactionStatus.COMPLETED,
                description=f"Expense on day {d}",
                transaction_date=base + timedelta(days=d),
                source="manual",
            ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        assert report.available_history_days == 5  # day 0 to day 4 = 5 calendar days
        assert report.observed_active_days == 3
        assert report.readiness_tier == ReadinessTier.LIMITED_EVIDENCE

    # 4. Old account with very little financial history (never confusing account age with coverage)
    async def test_4_old_account_with_little_financial_history(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        # user1 was created 120 days ago! But has only 1 recent transaction
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("15.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Coffee",
            transaction_date=datetime.utcnow() - timedelta(days=1),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        # Account age is 120, but available history is only 1 day!
        assert report.account_age_days >= 119
        assert report.available_history_days == 1
        assert report.readiness_tier == ReadinessTier.LIMITED_EVIDENCE
        # Proves FINROQ never confuses account age with financial-history coverage!

    # 5. Complete statement import spanning multiple months (>= 90 days)
    async def test_5_complete_statement_import_90_days(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()
        start = now - timedelta(days=95)

        # Generate bi-weekly transactions across 95 days
        for i in range(0, 96, 7):
            db_session.add(Transaction(
                owner_id=u1_id,
                account_id=ctx["acc1"].id,
                amount=Decimal("100.00"),
                currency="USD",
                transaction_type=TransactionType.EXPENSE,
                status=TransactionStatus.COMPLETED,
                description="Weekly Grocery Mart",
                transaction_date=start + timedelta(days=i),
                source="statement_import",
            ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        assert report.available_history_days >= 90
        assert report.readiness_tier == ReadinessTier.SUFFICIENTLY_SUPPORTED
        assert report.imported_transactions_count > 10
        assert report.verified_coverage_status == "verified_statement"
        assert report.statement_coverage_start is not None
        assert report.statement_coverage_end is not None

    # 6. Incomplete statement spanning multiple months with gaps (>45 days)
    async def test_6_statement_with_detected_gaps(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        # Transaction 100 days ago, and transaction 20 days ago (gap of 80 days)
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("200.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Old Statement Entry",
            transaction_date=now - timedelta(days=100),
            source="statement_import",
        ))
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("150.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Recent Statement Entry",
            transaction_date=now - timedelta(days=20),
            source="statement_import",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        assert len(report.missing_periods) >= 1
        assert report.missing_periods[0].gap_days == 80

    # 7. Data freshness check (stale history)
    async def test_7_stale_history(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        # Last transaction was 60 days ago
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("50.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Stale Entry",
            transaction_date=now - timedelta(days=60),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()
        assert report.data_freshness_days == 60

    # 8. Multiple accounts with active/inactive inclusion
    async def test_8_multiple_accounts_coverage(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)

        # Checking has tx, Savings has tx, Inactive has none
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("30.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Checking Tx",
            transaction_date=datetime.utcnow() - timedelta(days=10),
            source="manual",
        ))
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1_savings"].id,
            amount=Decimal("500.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Savings Tx",
            transaction_date=datetime.utcnow() - timedelta(days=5),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        report = await service.get_readiness_report()

        assert len(report.accounts_included) == 2  # Checking + Savings
        assert len(report.accounts_excluded) == 1  # Inactive Account
        assert report.accounts_excluded[0].account_name == "User1 Inactive Account"

    # 9. Synthetic demo data isolation
    async def test_9_synthetic_demo_data_identified(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        demo_id = str(ctx["demo_user"].id)

        db_session.add(Transaction(
            owner_id=demo_id,
            account_id=ctx["acc_demo"].id,
            amount=Decimal("150.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Demo Netflix Subscription",
            transaction_date=datetime.utcnow() - timedelta(days=10),
            source="seed_demo",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, demo_id)
        report = await service.get_readiness_report()

        assert report.is_synthetic_demo_data is True
        assert report.seed_transactions_count == 1

    # 10. Single transaction must NOT be treated as a confirmed subscription
    async def test_10_single_transaction_not_confirmed_subscription(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)

        # Single transaction with "Netflix" in description
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("649.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Netflix Premium Subscription",
            transaction_date=datetime.utcnow() - timedelta(days=15),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        # Find any insight for Netflix
        netflix_insights = [i for i in res.insights if "netflix" in i.title.lower()]
        assert len(netflix_insights) == 1
        # Must be INSUFFICIENT_EVIDENCE, not confirmed!
        assert netflix_insights[0].status == InsightStatus.INSUFFICIENT_EVIDENCE
        assert netflix_insights[0].potential_monthly_savings == Decimal("0.00")
        assert "cannot confirm an ongoing subscription" in netflix_insights[0].description

    # 11. Repeated transactions support recurring pattern
    async def test_11_repeated_transactions_support_recurring(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        # 3 monthly transactions for Spotify at ~30 day intervals
        for m in [60, 30, 2]:
            db_session.add(Transaction(
                owner_id=u1_id,
                account_id=ctx["acc1"].id,
                amount=Decimal("119.00"),
                currency="USD",
                transaction_type=TransactionType.EXPENSE,
                status=TransactionStatus.COMPLETED,
                description="Spotify Individual Plan",
                transaction_date=now - timedelta(days=m),
                source="statement_import",
            ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        spotify_insights = [i for i in res.insights if "spotify" in i.title.lower()]
        assert len(spotify_insights) == 1
        assert spotify_insights[0].insight_type == InsightType.RECURRING_SUBSCRIPTION
        assert spotify_insights[0].relevant_transaction_count == 3
        assert spotify_insights[0].potential_monthly_savings == Decimal("119.00")
        assert spotify_insights[0].status in [InsightStatus.PROVISIONAL, InsightStatus.SUFFICIENTLY_SUPPORTED]

    # 12. Annual subscription evaluation with insufficient history
    async def test_12_annual_subscription_insufficient_history(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)

        # 60 days of history
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("100.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Regular Spend",
            transaction_date=datetime.utcnow() - timedelta(days=60),
            source="manual",
        ))
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("100.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Regular Spend",
            transaction_date=datetime.utcnow() - timedelta(days=2),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        annual_eval = [i for i in res.insights if i.insight_type == InsightType.ANNUAL_SUBSCRIPTION_EVALUATION]
        assert len(annual_eval) == 1
        assert annual_eval[0].status == InsightStatus.INSUFFICIENT_EVIDENCE
        assert "requires an observation window of at least 365 days" in annual_eval[0].description

    # 13. Duplicate same-day charges leakage detection
    async def test_13_duplicate_charge_leakage(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        # 2 identical charges on the same day for Cloudflare
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("20.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Cloudflare Pro Plan",
            transaction_date=now - timedelta(days=5),
            source="manual",
        ))
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("20.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Cloudflare Pro Plan",
            transaction_date=now - timedelta(days=5),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        dup_insights = [i for i in res.insights if i.insight_type == InsightType.DUPLICATE_CHARGE_LEAKAGE]
        assert len(dup_insights) == 1
        assert dup_insights[0].potential_monthly_savings == Decimal("20.00")
        assert len(dup_insights[0].supporting_transactions) == 2

    # 14. Excessive category spending baseline check (>=30 days)
    async def test_14_excessive_category_spend_with_budget_baseline(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        now = datetime.utcnow()

        # Set budget of 500 for cat_dining
        b = Budget(
            owner_id=u1_id,
            category_id=ctx["cat_dining"].id,
            budget_year=now.year,
            budget_month=now.month,
            allocated_amount=Decimal("500.00"),
        )
        db_session.add(b)

        # Spend 750 in dining this month across 2 transactions
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            category_id=ctx["cat_dining"].id,
            amount=Decimal("400.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Bistro Dinner 1",
            transaction_date=datetime(now.year, now.month, 2),
            source="manual",
        ))
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            category_id=ctx["cat_dining"].id,
            amount=Decimal("350.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Bistro Dinner 2",
            transaction_date=datetime(now.year, now.month, 4),
            source="manual",
        ))
        # Add an older transaction 35 days ago to satisfy >=30 days history threshold
        db_session.add(Transaction(
            owner_id=u1_id,
            account_id=ctx["acc1"].id,
            amount=Decimal("50.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            description="Past month coffee",
            transaction_date=now - timedelta(days=60),
            source="manual",
        ))
        await db_session.commit()

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        cat_insights = [i for i in res.insights if i.insight_type == InsightType.EXCESSIVE_CATEGORY_SPEND]
        assert len(cat_insights) == 1
        assert cat_insights[0].potential_monthly_savings == Decimal("250.00")  # 750 - 500 = 250 overrun

    # 15. Savings projections explicit assumptions & non-guarantee disclosures
    async def test_15_savings_projections_explicit_disclosures(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)

        service = ReadinessService(db_session, u1_id)
        res = await service.detect_leaks()

        assert "not guaranteed money recovered" in res.disclaimer.lower()

    # 16. Multi-user tenant isolation
    async def test_16_user_isolation(self, db_session: AsyncSession, setup_users_and_accounts):
        ctx = setup_users_and_accounts
        u1_id = str(ctx["user1"].id)
        u2_id = str(ctx["user2"].id)

        # User 1 has 5 transactions
        for i in range(5):
            db_session.add(Transaction(
                owner_id=u1_id,
                account_id=ctx["acc1"].id,
                amount=Decimal("100.00"),
                currency="USD",
                transaction_type=TransactionType.EXPENSE,
                status=TransactionStatus.COMPLETED,
                description=f"Secret User1 Spend {i}",
                transaction_date=datetime.utcnow() - timedelta(days=i),
                source="manual",
            ))
        await db_session.commit()

        # User 2 runs readiness and detection
        service2 = ReadinessService(db_session, u2_id)
        report2 = await service2.get_readiness_report()
        res2 = await service2.detect_leaks()

        # User 2 sees ZERO of User 1's transactions!
        assert report2.total_eligible_transactions == 0
        assert len(res2.insights) == 0
        assert report2.accounts_included[0].account_name == "User2 Checking"
