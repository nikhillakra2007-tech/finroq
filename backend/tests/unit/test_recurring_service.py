import pytest
from datetime import datetime
from decimal import Decimal
from app.db.models import (
    Account,
    AccountType,
    Category,
    CategoryType,
    TransactionType,
    TransactionStatus,
    RecurrenceFrequency,
    RecurrenceStatus,
)
from app.features.recurring.service import RecurringService, compute_next_occurrence
from app.shared.schemas import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
)


class TestRecurrenceMath:
    def test_daily_advancement(self):
        start = datetime(2026, 1, 15, 10, 30)
        nxt = compute_next_occurrence(RecurrenceFrequency.DAILY, start, start)
        assert nxt == datetime(2026, 1, 16, 10, 30)

    def test_weekly_advancement(self):
        start = datetime(2026, 1, 15, 10, 30)
        nxt = compute_next_occurrence(RecurrenceFrequency.WEEKLY, start, start)
        assert nxt == datetime(2026, 1, 22, 10, 30)

    def test_monthly_31st_clamping_and_restoration(self):
        # 31st of January
        start = datetime(2026, 1, 31, 9, 0)
        
        # Next should clamp to Feb 28 (non-leap year)
        feb = compute_next_occurrence(RecurrenceFrequency.MONTHLY, start, start)
        assert feb == datetime(2026, 2, 28, 9, 0)

        # From Feb 28, next should restore to March 31!
        mar = compute_next_occurrence(RecurrenceFrequency.MONTHLY, feb, start)
        assert mar == datetime(2026, 3, 31, 9, 0)

        # From March 31, next should clamp to April 30!
        apr = compute_next_occurrence(RecurrenceFrequency.MONTHLY, mar, start)
        assert apr == datetime(2026, 4, 30, 9, 0)

        # From April 30, next should restore to May 31!
        may = compute_next_occurrence(RecurrenceFrequency.MONTHLY, apr, start)
        assert may == datetime(2026, 5, 31, 9, 0)

    def test_monthly_december_to_january(self):
        start = datetime(2026, 12, 15, 14, 0)
        nxt = compute_next_occurrence(RecurrenceFrequency.MONTHLY, start, start)
        assert nxt == datetime(2027, 1, 15, 14, 0)

    def test_yearly_leap_year_handling(self):
        # 2024 is leap year
        start = datetime(2024, 2, 29, 12, 0)
        
        # 2025 non-leap -> clamps to Feb 28
        y2025 = compute_next_occurrence(RecurrenceFrequency.YEARLY, start, start)
        assert y2025 == datetime(2025, 2, 28, 12, 0)

        # 2026 non-leap -> clamps to Feb 28
        y2026 = compute_next_occurrence(RecurrenceFrequency.YEARLY, y2025, start)
        assert y2026 == datetime(2026, 2, 28, 12, 0)

        # 2028 leap -> restores to Feb 29
        y2027 = compute_next_occurrence(RecurrenceFrequency.YEARLY, y2026, start)
        y2028 = compute_next_occurrence(RecurrenceFrequency.YEARLY, y2027, start)
        assert y2028 == datetime(2028, 2, 29, 12, 0)

    def test_end_date_exceeded_returns_none(self):
        start = datetime(2026, 1, 1, 10, 0)
        end = datetime(2026, 1, 10, 10, 0)
        
        nxt1 = compute_next_occurrence(RecurrenceFrequency.WEEKLY, start, start, end_date=end)
        assert nxt1 == datetime(2026, 1, 8, 10, 0)

        nxt2 = compute_next_occurrence(RecurrenceFrequency.WEEKLY, nxt1, start, end_date=end)
        assert nxt2 is None  # Jan 15 > Jan 10


class TestRecurringService:
    @pytest.fixture

    async def sample_account(self, db_session, owner_id):
        account = Account(
            owner_id=owner_id,
            name="Checking Account",
            account_type=AccountType.CHECKING,
            currency="USD",
            initial_balance=Decimal("5000.00"),
        )
        db_session.add(account)
        await db_session.flush()
        return account

    @pytest.fixture
    async def savings_account(self, db_session, owner_id):
        account = Account(
            owner_id=owner_id,
            name="Savings Account",
            account_type=AccountType.SAVINGS,
            currency="USD",
            initial_balance=Decimal("1000.00"),
        )
        db_session.add(account)
        await db_session.flush()
        return account

    @pytest.fixture
    async def expense_category(self, db_session, owner_id):
        cat = Category(
            owner_id=owner_id,
            name="Utilities",
            category_type=CategoryType.EXPENSE,
        )
        db_session.add(cat)
        await db_session.flush()
        return cat

    @pytest.mark.asyncio
    async def test_create_recurring_transaction(self, db_session, owner_id, sample_account, expense_category):
        service = RecurringService(db_session, owner_id)
        start = datetime(2026, 1, 1, 10, 0)
        data = RecurringTransactionCreate(
            account_id=sample_account.id,
            category_id=expense_category.id,
            amount=Decimal("150.00"),
            currency="USD",
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=start,
            description="Monthly internet bill",
        )
        result = await service.create(data)

        assert result.id is not None
        assert result.owner_id == owner_id
        assert result.amount == Decimal("150.00")
        assert result.next_occurrence == start
        assert result.status == RecurrenceStatus.ACTIVE
        assert result.account_name == "Checking Account"
        assert result.category_name == "Utilities"

    @pytest.mark.asyncio
    async def test_transfer_requires_distinct_destination(self, db_session, owner_id, sample_account):
        service = RecurringService(db_session, owner_id)
        start = datetime(2026, 1, 1)

        # Same account for source and destination
        data = RecurringTransactionCreate(
            account_id=sample_account.id,
            to_account_id=sample_account.id,
            amount=Decimal("100.00"),
            currency="USD",
            transaction_type=TransactionType.TRANSFER,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=start,
        )
        with pytest.raises(ValueError, match="Source and destination accounts must differ"):
            await service.create(data)

    @pytest.mark.asyncio
    async def test_pause_and_resume(self, db_session, owner_id, sample_account, expense_category):
        service = RecurringService(db_session, owner_id)
        created = await service.create(RecurringTransactionCreate(
            account_id=sample_account.id,
            category_id=expense_category.id,
            amount=Decimal("50.00"),
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=datetime(2026, 1, 1),
        ))

        paused = await service.pause(created.id)
        assert paused.status == RecurrenceStatus.PAUSED

        resumed = await service.resume(created.id)
        assert resumed.status == RecurrenceStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_record_occurrence_idempotency(self, db_session, owner_id, sample_account, expense_category):
        service = RecurringService(db_session, owner_id)
        start = datetime(2026, 1, 1, 10, 0)
        created = await service.create(RecurringTransactionCreate(
            account_id=sample_account.id,
            category_id=expense_category.id,
            amount=Decimal("120.00"),
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            start_date=start,
            description="Gym subscription",
        ))

        # First recording: creates actual transaction and advances next occurrence
        rec1 = await service.record_occurrence(created.id)
        assert rec1.already_recorded is False
        assert rec1.transaction.amount == Decimal("120.00")
        assert rec1.transaction.account_id == sample_account.id
        assert rec1.transaction.transaction_type == TransactionType.EXPENSE
        assert rec1.transaction.status == TransactionStatus.COMPLETED
        assert rec1.next_occurrence == datetime(2026, 2, 1, 10, 0)

        # Second recording for the SAME occurrence date: returns existing transaction, already_recorded=True
        rec2 = await service.record_occurrence(created.id, occurrence_date=start)
        assert rec2.already_recorded is True
        assert rec2.transaction.id == rec1.transaction.id

    @pytest.mark.asyncio
    async def test_cannot_record_paused_recurrence(self, db_session, owner_id, sample_account):
        service = RecurringService(db_session, owner_id)
        created = await service.create(RecurringTransactionCreate(
            account_id=sample_account.id,
            amount=Decimal("20.00"),
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.DAILY,
            start_date=datetime(2026, 1, 1),
        ))
        await service.pause(created.id)

        with pytest.raises(ValueError, match="Cannot record occurrence for a paused recurring transaction"):
            await service.record_occurrence(created.id)

    @pytest.mark.asyncio
    async def test_user_isolation(self, db_session, owner_id, sample_account):
        service1 = RecurringService(db_session, owner_id)
        service2 = RecurringService(db_session, "other-user-999")

        created = await service1.create(RecurringTransactionCreate(
            account_id=sample_account.id,
            amount=Decimal("30.00"),
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.WEEKLY,
            start_date=datetime(2026, 1, 1),
        ))

        # Other user cannot access
        assert await service2.get_by_id(created.id) is None
        assert await service2.update(created.id, RecurringTransactionUpdate(description="hacked")) is None
        assert await service2.delete(created.id) is False
        with pytest.raises(ValueError, match="Recurring transaction not found"):
            await service2.record_occurrence(created.id)
