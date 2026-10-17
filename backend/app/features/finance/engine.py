"""Shared, decimal-safe financial calculation engine.

This module is deliberately DB-agnostic: it operates on objects exposing the
relevant attributes (SQLAlchemy models or simple test doubles) so the financial
semantics can be unit-tested with explicit fixtures and reused by the summary,
budgeting, and recurring-transaction features.

Financial semantics
-------------------
- Amounts are nonnegative; the ``transaction_type`` gives the meaning.
- Eligible transactions have ``status == COMPLETED``; ``PENDING`` and
  ``CANCELLED`` are excluded from every total.
- Income increases income totals and net cash flow.
- Expenses increase expense totals and reduce net cash flow.
- Transfers move value between two owned accounts; they are never income or
  expenses and leave the combined balance unchanged.
- Refunds/reversals carry ``related_transaction_id`` linking them to an
  original transaction. They are excluded from the raw income/expense sums and
  instead reduce the original's contribution, so they are never double-counted.
  Duplicates are never inferred from equal amounts.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Iterable, List, Optional, Sequence

from app.db.models import AccountType, TransactionStatus, TransactionType

ZERO = Decimal("0.00")


def _is_eligible(txn) -> bool:
    return txn.status in (TransactionStatus.COMPLETED, TransactionStatus.COMPLETED.value)


def _is_income(txn) -> bool:
    return txn.transaction_type in (TransactionType.INCOME, TransactionType.INCOME.value)


def _is_expense(txn) -> bool:
    return txn.transaction_type in (TransactionType.EXPENSE, TransactionType.EXPENSE.value)


def _is_transfer(txn) -> bool:
    return txn.transaction_type in (TransactionType.TRANSFER, TransactionType.TRANSFER.value)


def _is_refund(txn) -> bool:
    return txn.related_transaction_id is not None


def eligible_transactions(transactions: Iterable) -> List:
    return [t for t in transactions if _is_eligible(t)]


def _refunds_by_original(transactions: Iterable) -> dict:
    result: dict = {}
    for t in transactions:
        if _is_refund(t):
            result.setdefault(t.related_transaction_id, []).append(t)
    return result


def _net_amount(txn, refunds_by_original: dict) -> Decimal:
    refunded = sum((r.amount for r in refunds_by_original.get(txn.id, [])), ZERO)
    return txn.amount - refunded


def total_income(transactions: Iterable) -> Decimal:
    txns = eligible_transactions(transactions)
    refunds = _refunds_by_original(txns)
    total = ZERO
    for t in txns:
        if _is_income(t) and not _is_refund(t):
            total += _net_amount(t, refunds)
    return total


def total_expenses(transactions: Iterable) -> Decimal:
    txns = eligible_transactions(transactions)
    refunds = _refunds_by_original(txns)
    total = ZERO
    for t in txns:
        if _is_expense(t) and not _is_refund(t):
            total += _net_amount(t, refunds)
    return total


def net_cash_flow(transactions: Iterable) -> Decimal:
    return total_income(transactions) - total_expenses(transactions)


def account_balance(account, transactions: Iterable) -> Decimal:
    txns = eligible_transactions(transactions)
    refunds = _refunds_by_original(txns)
    income = ZERO
    expense = ZERO
    transfer_out = ZERO
    transfer_in = ZERO
    account_id = account.id
    for t in txns:
        if _is_refund(t):
            continue
        if _is_transfer(t):
            if t.account_id == account_id:
                transfer_out += t.amount
            if t.to_account_id == account_id:
                transfer_in += t.amount
        elif _is_income(t) and t.account_id == account_id:
            income += _net_amount(t, refunds)
        elif _is_expense(t) and t.account_id == account_id:
            expense += _net_amount(t, refunds)
    is_credit = account.account_type in (AccountType.CREDIT, AccountType.CREDIT.value)
    initial = -account.initial_balance if is_credit else account.initial_balance
    return initial + income - expense - transfer_out + transfer_in


def combined_balance(accounts: Iterable, transactions: Iterable) -> Decimal:
    return sum((account_balance(a, transactions) for a in accounts), ZERO)


@dataclass
class AccountActivity:
    account_id: int
    account_name: str
    account_type: AccountType
    currency: str
    current_balance: Decimal
    period_income: Decimal
    period_expenses: Decimal
    transfer_in: Decimal
    transfer_out: Decimal


def account_activity(
    accounts: Iterable,
    transactions: Iterable,
    balance_transactions: Optional[Iterable] = None,
) -> List[AccountActivity]:
    period_txns = eligible_transactions(transactions)
    period_refunds = _refunds_by_original(period_txns)
    bal_txns = eligible_transactions(balance_transactions) if balance_transactions is not None else period_txns
    bal_refunds = _refunds_by_original(bal_txns) if balance_transactions is not None else period_refunds

    activities = []
    for account in accounts:
        # 1. Period metrics (restricted strictly to the reporting window)
        period_income = ZERO
        period_expense = ZERO
        period_transfer_in = ZERO
        period_transfer_out = ZERO
        for t in period_txns:
            if _is_refund(t):
                continue
            if _is_transfer(t):
                if t.account_id == account.id:
                    period_transfer_out += t.amount
                if t.to_account_id == account.id:
                    period_transfer_in += t.amount
            elif _is_income(t) and t.account_id == account.id:
                period_income += _net_amount(t, period_refunds)
            elif _is_expense(t) and t.account_id == account.id:
                period_expense += _net_amount(t, period_refunds)

        # 2. Cumulative balance as of end date (includes historical transactions through end date)
        bal_income = ZERO
        bal_expense = ZERO
        bal_transfer_in = ZERO
        bal_transfer_out = ZERO
        for t in bal_txns:
            if _is_refund(t):
                continue
            if _is_transfer(t):
                if t.account_id == account.id:
                    bal_transfer_out += t.amount
                if t.to_account_id == account.id:
                    bal_transfer_in += t.amount
            elif _is_income(t) and t.account_id == account.id:
                bal_income += _net_amount(t, bal_refunds)
            elif _is_expense(t) and t.account_id == account.id:
                bal_expense += _net_amount(t, bal_refunds)

        is_credit = account.account_type in (AccountType.CREDIT, AccountType.CREDIT.value)
        initial = -account.initial_balance if is_credit else account.initial_balance
        current_balance = (
            initial + bal_income - bal_expense - bal_transfer_out + bal_transfer_in
        )

        activities.append(AccountActivity(
            account_id=account.id,
            account_name=account.name,
            account_type=account.account_type,
            currency=account.currency,
            current_balance=current_balance,
            period_income=period_income,
            period_expenses=period_expense,
            transfer_in=period_transfer_in,
            transfer_out=period_transfer_out,
        ))
    return activities


@dataclass
class CategorySpend:
    category_id: Optional[int]
    category_name: str
    category_type: str
    total_amount: Decimal
    transaction_count: int


def category_breakdown(transactions: Iterable, categories: Iterable) -> List[CategorySpend]:
    category_map = {c.id: c for c in categories}
    totals: dict = {}
    counts: dict = {}
    for t in eligible_transactions(transactions):
        if _is_refund(t) or _is_transfer(t):
            continue
        key = t.category_id
        totals[key] = totals.get(key, ZERO) + t.amount
        counts[key] = counts.get(key, 0) + 1
    result = []
    for key, total in totals.items():
        category = category_map.get(key)
        result.append(CategorySpend(
            category_id=key,
            category_name=category.name if category else "Uncategorized",
            category_type=category.category_type.value if category else "expense",
            total_amount=total,
            transaction_count=counts.get(key, 0),
        ))
    result.sort(key=lambda c: c.total_amount, reverse=True)
    return result


def category_spending(transactions: Iterable, category_id: int) -> Decimal:
    """Net eligible spending for a single category.

    Expenses only; transfers excluded; pending/cancelled excluded; refunds
    netted into their original transaction.
    """
    txns = eligible_transactions(transactions)
    refunds = _refunds_by_original(txns)
    total = ZERO
    for t in txns:
        if _is_refund(t) or _is_transfer(t):
            continue
        if _is_expense(t) and t.category_id == category_id:
            total += _net_amount(t, refunds)
    return total


def _percentage_change(current: Decimal, previous: Decimal) -> Optional[Decimal]:
    if previous == ZERO:
        return None
    return ((current - previous) / previous) * Decimal("100")


@dataclass
class PeriodComparison:
    previous_period_start: datetime
    previous_period_end: datetime
    income_change_percent: Optional[Decimal]
    expense_change_percent: Optional[Decimal]
    net_cash_flow_change_percent: Optional[Decimal]


@dataclass
class FinancialSummaryResult:
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    account_balances: List[AccountActivity]
    category_breakdown: List[CategorySpend]
    net_worth: Optional[Decimal]
    period_comparison: Optional[PeriodComparison] = None


def compute_net_worth(accounts: Iterable, transactions: Iterable) -> Optional[Decimal]:
    """Net worth = total assets - total liabilities.

    Account balances use the net-value convention (credit accounts go negative
    as they are paid down), so net worth is the sum of the balances of all
    reliably-classified accounts. Only accounts with a reliable classification
    are included: credit accounts are liabilities; checking, savings,
    investment and cash are assets. The ``other`` type is ambiguous and excluded
    (documented limitation).
    """
    asset_types = {
        AccountType.CHECKING, AccountType.SAVINGS, AccountType.INVESTMENT, AccountType.CASH,
    }
    asset_values = {t.value for t in asset_types}
    total = ZERO
    for account in accounts:
        account_type = account.account_type
        is_asset = account_type in asset_types or account_type in asset_values
        is_liability = account_type == AccountType.CREDIT or account_type == AccountType.CREDIT.value
        if is_asset or is_liability:
            total += account_balance(account, transactions)
    return total


def compute_summary(
    accounts: Iterable,
    transactions: Iterable,
    categories: Iterable,
    previous_transactions: Optional[Iterable] = None,
    previous_period_start: Optional[datetime] = None,
    previous_period_end: Optional[datetime] = None,
    balance_transactions: Optional[Iterable] = None,
) -> FinancialSummaryResult:
    accounts = list(accounts)
    transactions = list(transactions)
    categories = list(categories)
    bal_txns = list(balance_transactions) if balance_transactions is not None else transactions

    result = FinancialSummaryResult(
        total_income=total_income(transactions),
        total_expenses=total_expenses(transactions),
        net_cash_flow=net_cash_flow(transactions),
        account_balances=account_activity(accounts, transactions, balance_transactions=bal_txns),
        category_breakdown=category_breakdown(transactions, categories),
        net_worth=compute_net_worth(accounts, bal_txns),
    )

    if previous_transactions is not None:
        prev_income = total_income(previous_transactions)
        prev_expense = total_expenses(previous_transactions)
        prev_net = net_cash_flow(previous_transactions)
        result.period_comparison = PeriodComparison(
            previous_period_start=previous_period_start,
            previous_period_end=previous_period_end,
            income_change_percent=_percentage_change(result.total_income, prev_income),
            expense_change_percent=_percentage_change(result.total_expenses, prev_expense),
            net_cash_flow_change_percent=_percentage_change(result.net_cash_flow, prev_net),
        )

    return result


def in_range(txn, start: datetime, end: datetime) -> bool:
    return start <= txn.transaction_date <= end


def filter_by_period(transactions: Iterable, start: datetime, end: datetime) -> List:
    return [t for t in transactions if in_range(t, start, end)]
