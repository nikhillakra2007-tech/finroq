from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from app.db.models import AccountType, CategoryType, TransactionType, TransactionStatus
from app.features.finance import engine


class FakeAccount:
    def __init__(self, id, name, account_type, currency, initial_balance, is_active=True):
        self.id = id
        self.name = name
        self.account_type = account_type
        self.currency = currency
        self.initial_balance = initial_balance
        self.is_active = is_active


class FakeCategory:
    def __init__(self, id, name, category_type):
        self.id = id
        self.name = name
        self.category_type = category_type


class FakeTxn:
    def __init__(
        self,
        id,
        account_id,
        amount,
        transaction_type,
        to_account_id=None,
        category_id=None,
        status=TransactionStatus.COMPLETED,
        related_transaction_id=None,
        transaction_date=None,
    ):
        self.id = id
        self.account_id = account_id
        self.to_account_id = to_account_id
        self.category_id = category_id
        self.amount = amount
        self.transaction_type = transaction_type
        self.status = status
        self.related_transaction_id = related_transaction_id
        self.transaction_date = transaction_date or datetime(2026, 1, 15)


@pytest.fixture
def accounts():
    return [
        FakeAccount(1, "A", AccountType.CHECKING, "USD", Decimal("10000.00")),
        FakeAccount(2, "B", AccountType.SAVINGS, "USD", Decimal("5000.00")),
    ]


class TestCoreExample:
    def test_prompt_example(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("30000.00"), TransactionType.INCOME),
            FakeTxn(2, 1, Decimal("8000.00"), TransactionType.EXPENSE),
            FakeTxn(3, 1, Decimal("2000.00"), TransactionType.EXPENSE),
            FakeTxn(4, 1, Decimal("3000.00"), TransactionType.TRANSFER, to_account_id=2),
        ]
        assert engine.total_income(txns) == Decimal("30000.00")
        assert engine.total_expenses(txns) == Decimal("10000.00")
        assert engine.net_cash_flow(txns) == Decimal("20000.00")

    def test_transfer_does_not_inflate_income_or_expenses(self, accounts):
        txns = [FakeTxn(1, 1, Decimal("3000.00"), TransactionType.TRANSFER, to_account_id=2)]
        assert engine.total_income(txns) == Decimal("0.00")
        assert engine.total_expenses(txns) == Decimal("0.00")
        assert engine.net_cash_flow(txns) == Decimal("0.00")

    def test_transfer_does_not_change_combined_balance(self, accounts):
        txns = [FakeTxn(1, 1, Decimal("3000.00"), TransactionType.TRANSFER, to_account_id=2)]
        before = engine.combined_balance(accounts, [])
        after = engine.combined_balance(accounts, txns)
        assert before == Decimal("15000.00")
        assert after == Decimal("15000.00")

    def test_account_balances_with_transfer(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("30000.00"), TransactionType.INCOME),
            FakeTxn(2, 1, Decimal("8000.00"), TransactionType.EXPENSE),
            FakeTxn(3, 1, Decimal("2000.00"), TransactionType.EXPENSE),
            FakeTxn(4, 1, Decimal("3000.00"), TransactionType.TRANSFER, to_account_id=2),
        ]
        assert engine.account_balance(accounts[0], txns) == Decimal("27000.00")
        assert engine.account_balance(accounts[1], txns) == Decimal("8000.00")


class TestDecimalPrecision:
    def test_decimal_precision_preserved(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("10.10"), TransactionType.EXPENSE),
            FakeTxn(2, 1, Decimal("20.20"), TransactionType.EXPENSE),
        ]
        assert engine.total_expenses(txns) == Decimal("30.30")
        assert engine.total_expenses(txns) == Decimal("30.30")

    def test_no_float_artifacts(self, accounts):
        txns = [FakeTxn(1, 1, Decimal("0.10"), TransactionType.EXPENSE) for _ in range(3)]
        assert engine.total_expenses(txns) == Decimal("0.30")


class TestRefundsAndReversals:
    def test_refund_reduces_expense(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("1000.00"), TransactionType.EXPENSE),
            FakeTxn(2, 1, Decimal("200.00"), TransactionType.INCOME, related_transaction_id=1),
        ]
        assert engine.total_expenses(txns) == Decimal("800.00")
        assert engine.total_income(txns) == Decimal("0.00")

    def test_reversal_reduces_income(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("5000.00"), TransactionType.INCOME),
            FakeTxn(2, 1, Decimal("1000.00"), TransactionType.EXPENSE, related_transaction_id=1),
        ]
        assert engine.total_income(txns) == Decimal("4000.00")
        assert engine.total_expenses(txns) == Decimal("0.00")

    def test_refund_not_double_counted(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("1000.00"), TransactionType.EXPENSE),
            FakeTxn(2, 1, Decimal("200.00"), TransactionType.EXPENSE, related_transaction_id=1),
            FakeTxn(3, 1, Decimal("100.00"), TransactionType.EXPENSE, related_transaction_id=1),
        ]
        assert engine.total_expenses(txns) == Decimal("700.00")

    def test_equal_amounts_are_not_treated_as_duplicates(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("500.00"), TransactionType.EXPENSE),
            FakeTxn(2, 1, Decimal("500.00"), TransactionType.EXPENSE),
        ]
        assert engine.total_expenses(txns) == Decimal("1000.00")


class TestStatuses:
    def test_pending_and_cancelled_excluded(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("5000.00"), TransactionType.INCOME),
            FakeTxn(2, 1, Decimal("3000.00"), TransactionType.INCOME, status=TransactionStatus.PENDING),
            FakeTxn(3, 1, Decimal("2000.00"), TransactionType.INCOME, status=TransactionStatus.CANCELLED),
        ]
        assert engine.total_income(txns) == Decimal("5000.00")

    def test_pending_expense_excluded(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("100.00"), TransactionType.EXPENSE),
            FakeTxn(2, 1, Decimal("999.00"), TransactionType.EXPENSE, status=TransactionStatus.CANCELLED),
        ]
        assert engine.total_expenses(txns) == Decimal("100.00")


class TestEmptyAndBoundaries:
    def test_empty_period(self, accounts):
        assert engine.total_income([]) == Decimal("0.00")
        assert engine.total_expenses([]) == Decimal("0.00")
        assert engine.net_cash_flow([]) == Decimal("0.00")
        assert engine.combined_balance(accounts, []) == Decimal("15000.00")

    def test_date_boundaries_inclusive(self, accounts):
        start = datetime(2026, 1, 1)
        end = datetime(2026, 1, 31, 23, 59, 59)
        txns = [
            FakeTxn(1, 1, Decimal("100.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 1)),
            FakeTxn(2, 1, Decimal("200.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 31, 12, 0, 0)),
            FakeTxn(3, 1, Decimal("999.00"), TransactionType.INCOME, transaction_date=datetime(2026, 2, 1)),
        ]
        in_range = engine.filter_by_period(txns, start, end)
        assert engine.total_income(in_range) == Decimal("300.00")


class TestCategoryAndAccount:
    def test_category_breakdown(self, accounts):
        categories = [
            FakeCategory(1, "Food", CategoryType.EXPENSE),
            FakeCategory(2, "Salary", CategoryType.INCOME),
        ]
        txns = [
            FakeTxn(1, 1, Decimal("100.00"), TransactionType.EXPENSE, category_id=1),
            FakeTxn(2, 1, Decimal("50.00"), TransactionType.EXPENSE, category_id=1),
            FakeTxn(3, 1, Decimal("3000.00"), TransactionType.INCOME, category_id=2),
        ]
        breakdown = engine.category_breakdown(txns, categories)
        by_id = {c.category_id: c for c in breakdown}
        assert by_id[1].total_amount == Decimal("150.00")
        assert by_id[1].transaction_count == 2
        assert by_id[2].total_amount == Decimal("3000.00")

    def test_account_activity(self, accounts):
        txns = [
            FakeTxn(1, 1, Decimal("30000.00"), TransactionType.INCOME),
            FakeTxn(2, 1, Decimal("8000.00"), TransactionType.EXPENSE),
            FakeTxn(3, 1, Decimal("3000.00"), TransactionType.TRANSFER, to_account_id=2),
        ]
        activity = {a.account_id: a for a in engine.account_activity(accounts, txns)}
        assert activity[1].period_income == Decimal("30000.00")
        assert activity[1].period_expenses == Decimal("8000.00")
        assert activity[1].transfer_out == Decimal("3000.00")
        assert activity[2].transfer_in == Decimal("3000.00")


class TestPeriodComparison:
    def test_comparison_with_previous(self, accounts):
        current = [FakeTxn(1, 1, Decimal("1000.00"), TransactionType.INCOME)]
        previous = [FakeTxn(2, 1, Decimal("500.00"), TransactionType.INCOME)]
        result = engine.compute_summary(accounts, current, [], previous_transactions=previous)
        assert result.period_comparison.income_change_percent == Decimal("100.00")

    def test_comparison_zero_previous_is_none(self, accounts):
        current = [FakeTxn(1, 1, Decimal("1000.00"), TransactionType.INCOME)]
        previous = []
        result = engine.compute_summary(accounts, current, [], previous_transactions=previous)
        assert result.period_comparison.income_change_percent is None

    def test_comparison_negative_change(self, accounts):
        current = [FakeTxn(1, 1, Decimal("500.00"), TransactionType.INCOME)]
        previous = [FakeTxn(2, 1, Decimal("1000.00"), TransactionType.INCOME)]
        result = engine.compute_summary(accounts, current, [], previous_transactions=previous)
        assert result.period_comparison.income_change_percent == Decimal("-50.00")


class TestNetWorth:
    def test_net_worth_assets_minus_liabilities(self):
        accounts = [
            FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("10000.00")),
            FakeAccount(2, "Credit", AccountType.CREDIT, "USD", Decimal("0.00")),
        ]
        txns = [
            FakeTxn(1, 1, Decimal("2000.00"), TransactionType.EXPENSE),
            FakeTxn(2, 2, Decimal("1500.00"), TransactionType.EXPENSE),
        ]
        # assets = 10000 - 2000 = 8000; liabilities = 1500
        assert engine.compute_net_worth(accounts, txns) == Decimal("6500.00")

    def test_net_worth_excludes_other_type(self):
        accounts = [
            FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("10000.00")),
            FakeAccount(2, "Mystery", AccountType.OTHER, "USD", Decimal("5000.00")),
        ]
        assert engine.compute_net_worth(accounts, []) == Decimal("10000.00")
