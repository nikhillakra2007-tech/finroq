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


class TestHistoricalBalancesAndPeriodSeparation:
    def test_previous_month_transaction_affects_balance_not_period_metrics(self):
        # Account initial balance: 10,000.00
        account = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("10000.00"))
        # Jan: Salary 5,000.00
        jan_txn = FakeTxn(1, 1, Decimal("5000.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 15))
        # Feb: Rent 2,000.00
        feb_txn = FakeTxn(2, 1, Decimal("2000.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 2, 10))

        # Feb reporting period: period_transactions contains only feb_txn, balance_transactions contains both
        period_txns = [feb_txn]
        balance_txns = [jan_txn, feb_txn]

        summary = engine.compute_summary(
            accounts=[account],
            transactions=period_txns,
            categories=[],
            balance_transactions=balance_txns,
        )

        # 1. Previous month transaction does not inflate current month income or expenses
        assert summary.total_income == Decimal("0.00")
        assert summary.total_expenses == Decimal("2000.00")
        assert summary.net_cash_flow == Decimal("-2000.00")

        # 2. Account activity correctly separates period activity from cumulative balance
        activity = summary.account_balances[0]
        assert activity.period_income == Decimal("0.00")
        assert activity.period_expenses == Decimal("2000.00")
        # 10,000 initial + 5,000 (Jan) - 2,000 (Feb) = 13,000.00
        assert activity.current_balance == Decimal("13000.00")
        assert summary.net_worth == Decimal("13000.00")

    def test_multiple_months_produce_correct_ending_balance(self):
        account = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("5000.00"))
        txns = [
            # Jan: +3000 income, -500 expense
            FakeTxn(1, 1, Decimal("3000.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 10)),
            FakeTxn(2, 1, Decimal("500.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 1, 20)),
            # Feb: +3000 income, -1200 expense
            FakeTxn(3, 1, Decimal("3000.00"), TransactionType.INCOME, transaction_date=datetime(2026, 2, 10)),
            FakeTxn(4, 1, Decimal("1200.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 2, 15)),
            # Mar: -800 expense
            FakeTxn(5, 1, Decimal("800.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 3, 5)),
        ]
        # Reporting period: March
        mar_period = [txns[4]]
        mar_balance = txns  # All through March

        summary = engine.compute_summary(
            accounts=[account],
            transactions=mar_period,
            categories=[],
            balance_transactions=mar_balance,
        )
        assert summary.total_income == Decimal("0.00")
        assert summary.total_expenses == Decimal("800.00")
        # Expected: 5000 + 3000 - 500 + 3000 - 1200 - 800 = 8500.00
        assert summary.account_balances[0].current_balance == Decimal("8500.00")
        assert summary.net_worth == Decimal("8500.00")

    def test_date_range_change_produces_correct_balance_as_of_new_end_date(self):
        account = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("1000.00"))
        t1 = FakeTxn(1, 1, Decimal("500.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 15))
        t2 = FakeTxn(2, 1, Decimal("300.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 2, 15))
        t3 = FakeTxn(3, 1, Decimal("400.00"), TransactionType.INCOME, transaction_date=datetime(2026, 3, 15))

        # View as of end of Jan
        summary_jan = engine.compute_summary(
            accounts=[account],
            transactions=[t1],
            categories=[],
            balance_transactions=[t1],
        )
        assert summary_jan.account_balances[0].current_balance == Decimal("1500.00")

        # View as of end of Feb
        summary_feb = engine.compute_summary(
            accounts=[account],
            transactions=[t2],
            categories=[],
            balance_transactions=[t1, t2],
        )
        assert summary_feb.account_balances[0].current_balance == Decimal("1200.00")

        # View as of end of March
        summary_mar = engine.compute_summary(
            accounts=[account],
            transactions=[t3],
            categories=[],
            balance_transactions=[t1, t2, t3],
        )
        assert summary_mar.account_balances[0].current_balance == Decimal("1600.00")

    def test_transfers_do_not_alter_net_worth_or_count_as_income_expenses(self):
        acc_a = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("10000.00"))
        acc_b = FakeAccount(2, "Savings", AccountType.SAVINGS, "USD", Decimal("5000.00"))
        # Jan transfer from A to B: 4000.00
        t_transfer = FakeTxn(1, 1, Decimal("4000.00"), TransactionType.TRANSFER, to_account_id=2, transaction_date=datetime(2026, 1, 20))
        # Feb expense on B: 500.00
        t_expense = FakeTxn(2, 2, Decimal("500.00"), TransactionType.EXPENSE, transaction_date=datetime(2026, 2, 5))

        summary_feb = engine.compute_summary(
            accounts=[acc_a, acc_b],
            transactions=[t_expense],
            categories=[],
            balance_transactions=[t_transfer, t_expense],
        )
        # Period metrics: only 500 expense
        assert summary.total_income == Decimal("0.00") if 'summary' in locals() else True
        assert summary_feb.total_income == Decimal("0.00")
        assert summary_feb.total_expenses == Decimal("500.00")
        assert summary_feb.net_cash_flow == Decimal("-500.00")

        balances = {b.account_id: b.current_balance for b in summary_feb.account_balances}
        # Acc A: 10000 - 4000 = 6000.00
        assert balances[1] == Decimal("6000.00")
        # Acc B: 5000 + 4000 - 500 = 8500.00
        assert balances[2] == Decimal("8500.00")
        # Net worth: 6000 + 8500 = 14500.00 (Initial 15000 - 500 expense)
        assert summary_feb.net_worth == Decimal("14500.00")

    def test_opening_balance_preserved_without_transactions(self):
        account = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("25000.00"))
        summary = engine.compute_summary(
            accounts=[account],
            transactions=[],
            categories=[],
            balance_transactions=[],
        )
        assert summary.total_income == Decimal("0.00")
        assert summary.total_expenses == Decimal("0.00")
        assert summary.account_balances[0].current_balance == Decimal("25000.00")
        assert summary.net_worth == Decimal("25000.00")

    def test_empty_period_with_historical_transactions(self):
        account = FakeAccount(1, "Checking", AccountType.CHECKING, "USD", Decimal("1000.00"))
        hist_txn = FakeTxn(1, 1, Decimal("3000.00"), TransactionType.INCOME, transaction_date=datetime(2026, 1, 15))

        # Month with zero transactions (empty period), but historical transaction exists
        summary = engine.compute_summary(
            accounts=[account],
            transactions=[],
            categories=[],
            balance_transactions=[hist_txn],
        )
        assert summary.total_income == Decimal("0.00")
        assert summary.total_expenses == Decimal("0.00")
        assert summary.net_cash_flow == Decimal("0.00")
        # Ending balance preserves historical accumulation
        assert summary.account_balances[0].current_balance == Decimal("4000.00")
        assert summary.net_worth == Decimal("4000.00")


class TestCreditCardLiabilitiesAndNetWorth:
    def test_credit_card_initial_balance_is_liability_in_net_worth(self):
        # Scenario 3: Cash 100,000, Credit card debt 50,000 -> Expected net worth 50,000
        cash = FakeAccount(1, "Cash Account", AccountType.CASH, "INR", Decimal("100000.00"))
        credit_card = FakeAccount(2, "Credit Card", AccountType.CREDIT, "INR", Decimal("50000.00"))

        assert engine.account_balance(cash, []) == Decimal("100000.00")
        # Credit card initial balance represents outstanding debt (liability -> -50,000)
        assert engine.account_balance(credit_card, []) == Decimal("-50000.00")

        net_worth = engine.compute_net_worth([cash, credit_card], [])
        assert net_worth == Decimal("50000.00")

    def test_credit_card_purchase_increases_debt(self):
        credit_card = FakeAccount(1, "Credit Card", AccountType.CREDIT, "INR", Decimal("10000.00"))
        expense_txn = FakeTxn(1, 1, Decimal("2500.00"), TransactionType.EXPENSE)

        # 10,000 initial debt + 2,500 new expense = 12,500 total debt (balance: -12,500.00)
        bal = engine.account_balance(credit_card, [expense_txn])
        assert bal == Decimal("-12500.00")

    def test_credit_card_payment_conserves_net_worth_without_duplicate_expense(self):
        # Scenario 4: Card payment
        # Initial cash: 100,000; Initial card debt: 50,000.
        # Make a transfer of 10,000 from cash to card.
        # Expected: Cash 90,000; Card debt 40,000; Net worth before: 50,000; Net worth after: 50,000.
        cash = FakeAccount(1, "Cash Account", AccountType.CHECKING, "INR", Decimal("100000.00"))
        card = FakeAccount(2, "Credit Card", AccountType.CREDIT, "INR", Decimal("50000.00"))
        accounts = [cash, card]

        # Net worth before payment
        nw_before = engine.compute_net_worth(accounts, [])
        assert nw_before == Decimal("50000.00")

        # Payment transaction: transfer from cash to card
        payment_txn = FakeTxn(1, 1, Decimal("10000.00"), TransactionType.TRANSFER, to_account_id=2)
        txns = [payment_txn]

        summary = engine.compute_summary(accounts=accounts, transactions=txns, categories=[])

        # Payment is a transfer: NOT counted as income or expense
        assert summary.total_income == Decimal("0.00")
        assert summary.total_expenses == Decimal("0.00")
        assert summary.net_cash_flow == Decimal("0.00")

        balances = {a.account_id: a.current_balance for a in summary.account_balances}
        assert balances[1] == Decimal("90000.00")   # Cash after payment
        assert balances[2] == Decimal("-40000.00")  # Card debt reduced to 40,000
        assert summary.net_worth == Decimal("50000.00")  # Net worth conserved

    def test_credit_card_refund_reduces_debt(self):
        card = FakeAccount(1, "Credit Card", AccountType.CREDIT, "INR", Decimal("0.00"))
        # Purchase 500, Refund 200 linked to purchase
        purchase = FakeTxn(1, 1, Decimal("500.00"), TransactionType.EXPENSE)
        refund = FakeTxn(2, 1, Decimal("200.00"), TransactionType.INCOME, related_transaction_id=1)

        bal = engine.account_balance(card, [purchase, refund])
        # Net expense = 300, debt = 300 (balance: -300.00)
        assert bal == Decimal("-300.00")
        assert engine.compute_net_worth([card], [purchase, refund]) == Decimal("-300.00")
