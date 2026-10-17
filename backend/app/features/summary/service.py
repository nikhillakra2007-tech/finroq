from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Account, Transaction, Category, CategoryType, TransactionType
from app.features.finance import engine
from app.shared.schemas import (
    FinancialSummary,
    AccountBalance,
    CategoryBreakdown,
    SummaryPeriod,
)


class SummaryService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def _get_accounts(self) -> list[Account]:
        result = await self.db.execute(
            select(Account).where(and_(Account.owner_id == self.owner_id, Account.is_active == True))
        )
        return list(result.scalars().all())

    async def _get_transactions(self, start_date: datetime, end_date: datetime) -> list[Transaction]:
        result = await self.db.execute(
            select(Transaction).where(
                and_(
                    Transaction.owner_id == self.owner_id,
                    Transaction.transaction_date >= start_date,
                    Transaction.transaction_date <= end_date,
                )
            )
        )
        return list(result.scalars().all())

    async def _get_balance_transactions(self, end_date: datetime) -> list[Transaction]:
        result = await self.db.execute(
            select(Transaction).where(
                and_(
                    Transaction.owner_id == self.owner_id,
                    Transaction.transaction_date <= end_date,
                )
            )
        )
        return list(result.scalars().all())

    async def _get_categories(self) -> list[Category]:
        result = await self.db.execute(
            select(Category).where(
                or_(Category.owner_id == self.owner_id, Category.is_system == True)
            )
        )
        return list(result.scalars().all())

    async def get_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> FinancialSummary:
        if not start_date:
            start_date = datetime.combine(date.today().replace(day=1), datetime.min.time())
        if not end_date:
            end_date = datetime.combine(date.today(), datetime.max.time())

        period = SummaryPeriod(start_date=start_date, end_date=end_date)

        accounts = await self._get_accounts()
        transactions = await self._get_transactions(start_date, end_date)
        balance_transactions = await self._get_balance_transactions(end_date)
        categories = await self._get_categories()

        period_length = end_date - start_date
        previous_end = start_date
        previous_start = start_date - period_length
        previous_transactions = await self._get_transactions(previous_start, previous_end)

        result = engine.compute_summary(
            accounts=accounts,
            transactions=transactions,
            categories=categories,
            previous_transactions=previous_transactions,
            previous_period_start=previous_start,
            previous_period_end=previous_end,
            balance_transactions=balance_transactions,
        )

        account_balances = [
            AccountBalance(
                account_id=a.account_id,
                account_name=a.account_name,
                account_type=a.account_type,
                currency=a.currency,
                current_balance=a.current_balance,
                period_income=a.period_income,
                period_expenses=a.period_expenses,
            )
            for a in result.account_balances
        ]

        category_breakdown = [
            CategoryBreakdown(
                category_id=c.category_id,
                category_name=c.category_name,
                category_type=CategoryType(c.category_type),
                total_amount=c.total_amount,
                transaction_count=c.transaction_count,
            )
            for c in result.category_breakdown
        ]

        return FinancialSummary(
            period=period,
            total_income=result.total_income,
            total_expenses=result.total_expenses,
            net_cash_flow=result.net_cash_flow,
            account_balances=account_balances,
            category_breakdown=category_breakdown,
            net_worth=result.net_worth,
            previous_period=SummaryPeriod(
                start_date=previous_start,
                end_date=previous_end,
            ) if result.period_comparison else None,
            income_change_percent=result.period_comparison.income_change_percent if result.period_comparison else None,
            expense_change_percent=result.period_comparison.expense_change_percent if result.period_comparison else None,
            net_cash_flow_change_percent=result.period_comparison.net_cash_flow_change_percent if result.period_comparison else None,
        )
