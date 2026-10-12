import pytest
from decimal import Decimal
from datetime import datetime
from app.features.budget.service import BudgetService
from app.shared.schemas import BudgetCreate, BudgetUpdate
from app.db.models import (
    Account,
    AccountType,
    Category,
    CategoryType,
    Transaction,
    TransactionType,
    TransactionStatus,
)


class TestBudgetService:
    @pytest.fixture
    def service(self, db_session, owner_id):
        return BudgetService(db_session, owner_id)

    @pytest.fixture
    async def expense_category(self, db_session, owner_id):
        cat = Category(name="Food", category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add(cat)
        await db_session.flush()
        return cat

    @pytest.fixture
    async def income_category(self, db_session, owner_id):
        cat = Category(name="Salary", category_type=CategoryType.INCOME, owner_id=owner_id)
        db_session.add(cat)
        await db_session.flush()
        return cat

    @pytest.fixture
    async def account(self, db_session, owner_id):
        acc = Account(owner_id=owner_id, name="Checking", account_type=AccountType.CHECKING, currency="USD")
        db_session.add(acc)
        await db_session.flush()
        return acc

    @pytest.fixture
    async def jan_expenses(self, db_session, owner_id, expense_category, account):
        txns = [
            Transaction(owner_id=owner_id, account_id=account.id, category_id=expense_category.id,
                        amount=Decimal("100.00"), currency="USD", transaction_type=TransactionType.EXPENSE,
                        transaction_date=datetime(2026, 1, 10)),
            Transaction(owner_id=owner_id, account_id=account.id, category_id=expense_category.id,
                        amount=Decimal("50.00"), currency="USD", transaction_type=TransactionType.EXPENSE,
                        transaction_date=datetime(2026, 1, 20)),
        ]
        db_session.add_all(txns)
        await db_session.commit()
        return txns

    async def test_create_budget(self, service, expense_category):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        assert budget.id is not None
        assert budget.allocated_amount == Decimal("500.00")
        assert budget.actual_spending == Decimal("0.00")
        assert budget.remaining_amount == Decimal("500.00")
        assert budget.utilization_percent == Decimal("0.00")
        assert budget.is_overspent is False

    async def test_budget_with_actual_spending(self, service, expense_category, jan_expenses):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        assert budget.actual_spending == Decimal("150.00")
        assert budget.remaining_amount == Decimal("350.00")
        assert budget.utilization_percent == Decimal("30.00")
        assert budget.is_overspent is False

    async def test_overspending(self, service, expense_category, jan_expenses):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("100.00"),
        ))
        assert budget.is_overspent is True
        assert budget.remaining_amount == Decimal("-50.00")
        assert budget.utilization_percent == Decimal("150.00")

    async def test_zero_allocation_utilization_is_none(self, service, expense_category, jan_expenses):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("0.00"),
        ))
        assert budget.utilization_percent is None
        assert budget.is_overspent is True

    async def test_duplicate_budget_rejected(self, service, expense_category):
        await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        with pytest.raises(ValueError, match="already exists"):
            await service.create(BudgetCreate(
                category_id=expense_category.id, budget_year=2026, budget_month=1,
                allocated_amount=Decimal("600.00"),
            ))

    async def test_income_category_rejected(self, service, income_category):
        with pytest.raises(ValueError, match="expense categories"):
            await service.create(BudgetCreate(
                category_id=income_category.id, budget_year=2026, budget_month=1,
                allocated_amount=Decimal("500.00"),
            ))

    async def test_list_budgets(self, service, expense_category, jan_expenses):
        await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        budgets = await service.list(year=2026, month=1)
        assert len(budgets) == 1
        assert budgets[0].category_name == "Food"

    async def test_list_budgets_empty_month(self, service, expense_category):
        budgets = await service.list(year=2026, month=2)
        assert budgets == []

    async def test_update_budget(self, service, expense_category, jan_expenses):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        updated = await service.update(budget.id, BudgetUpdate(allocated_amount=Decimal("200.00")))
        assert updated.allocated_amount == Decimal("200.00")
        assert updated.remaining_amount == Decimal("50.00")

    async def test_delete_budget(self, service, expense_category):
        budget = await service.create(BudgetCreate(
            category_id=expense_category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        deleted = await service.delete(budget.id)
        assert deleted is True
        assert await service.get_by_id(budget.id) is None

    async def test_budget_isolation(self, db_session, owner_id):
        service1 = BudgetService(db_session, owner_id)
        service2 = BudgetService(db_session, "other-user")
        category = Category(name="Food", category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add(category)
        await db_session.flush()
        await service1.create(BudgetCreate(
            category_id=category.id, budget_year=2026, budget_month=1,
            allocated_amount=Decimal("500.00"),
        ))
        budgets2 = await service2.list(year=2026, month=1)
        assert budgets2 == []
