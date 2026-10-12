from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Budget, Category, CategoryType, Transaction
from app.features.finance import engine
from app.shared.schemas import BudgetCreate, BudgetUpdate, BudgetResponse

ZERO = Decimal("0.00")
HUNDRED = Decimal("100")


class BudgetService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def _validate_category(self, category_id: int) -> Category:
        category = await self.db.get(Category, category_id)
        if not category or (category.owner_id and category.owner_id != self.owner_id):
            raise ValueError("Category not found or access denied")
        if category.category_type == CategoryType.INCOME:
            raise ValueError("Budgets can only be created for expense categories")
        return category

    async def _get_budget(self, budget_id: int) -> Optional[Budget]:
        result = await self.db.execute(
            select(Budget).where(
                and_(Budget.id == budget_id, Budget.owner_id == self.owner_id)
            )
        )
        return result.scalar_one_or_none()

    async def _get_month_transactions(self, year: int, month: int) -> list[Transaction]:
        result = await self.db.execute(
            select(Transaction).where(
                and_(
                    Transaction.owner_id == self.owner_id,
                    extract("year", Transaction.transaction_date) == year,
                    extract("month", Transaction.transaction_date) == month,
                )
            )
        )
        return list(result.scalars().all())

    async def _to_response(self, budget: Budget) -> BudgetResponse:
        transactions = await self._get_month_transactions(budget.budget_year, budget.budget_month)
        actual = engine.category_spending(transactions, budget.category_id)
        allocated = budget.allocated_amount
        remaining = allocated - actual
        utilization = (actual / allocated * HUNDRED) if allocated > 0 else None
        is_overspent = actual > allocated
        category = await self.db.get(Category, budget.category_id)
        return BudgetResponse(
            id=budget.id,
            owner_id=budget.owner_id,
            category_id=budget.category_id,
            category_name=category.name if category else "Unknown",
            budget_year=budget.budget_year,
            budget_month=budget.budget_month,
            allocated_amount=allocated,
            actual_spending=actual,
            remaining_amount=remaining,
            utilization_percent=utilization,
            is_overspent=is_overspent,
            created_at=budget.created_at,
            updated_at=budget.updated_at,
        )

    async def create(self, data: BudgetCreate) -> BudgetResponse:
        await self._validate_category(data.category_id)

        existing = await self.db.execute(
            select(Budget).where(
                and_(
                    Budget.owner_id == self.owner_id,
                    Budget.category_id == data.category_id,
                    Budget.budget_year == data.budget_year,
                    Budget.budget_month == data.budget_month,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("A budget for this category and period already exists")

        budget = Budget(
            owner_id=self.owner_id,
            category_id=data.category_id,
            budget_year=data.budget_year,
            budget_month=data.budget_month,
            allocated_amount=data.allocated_amount,
        )
        self.db.add(budget)
        await self.db.commit()
        await self.db.refresh(budget)
        return await self._to_response(budget)

    async def list(self, year: int, month: int) -> List[BudgetResponse]:
        result = await self.db.execute(
            select(Budget).where(
                and_(
                    Budget.owner_id == self.owner_id,
                    Budget.budget_year == year,
                    Budget.budget_month == month,
                )
            ).order_by(Budget.category_id)
        )
        budgets = result.scalars().all()
        return [await self._to_response(b) for b in budgets]

    async def get_by_id(self, budget_id: int) -> Optional[BudgetResponse]:
        budget = await self._get_budget(budget_id)
        if not budget:
            return None
        return await self._to_response(budget)

    async def update(self, budget_id: int, data: BudgetUpdate) -> Optional[BudgetResponse]:
        budget = await self._get_budget(budget_id)
        if not budget:
            return None
        if data.allocated_amount is not None:
            budget.allocated_amount = data.allocated_amount
        await self.db.commit()
        await self.db.refresh(budget)
        return await self._to_response(budget)

    async def delete(self, budget_id: int) -> bool:
        budget = await self._get_budget(budget_id)
        if not budget:
            return False
        await self.db.delete(budget)
        await self.db.commit()
        return True
