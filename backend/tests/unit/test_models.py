import pytest
from decimal import Decimal
from app.db.models import Account, AccountType, Transaction, TransactionType, Category, CategoryType


class TestAccountModel:
    async def test_create_account(self, db_session, owner_id):
        account = Account(
            owner_id=owner_id,
            name='Test Checking',
            account_type=AccountType.CHECKING,
            currency='USD',
            initial_balance=Decimal('1000.00'),
        )
        db_session.add(account)
        await db_session.flush()

        assert account.id is not None
        assert account.name == 'Test Checking'
        assert account.account_type == AccountType.CHECKING
        assert account.initial_balance == Decimal('1000.00')
        assert account.is_active is True

    async def test_account_initial_balance_nonnegative(self, db_session, owner_id):
        account = Account(
            owner_id=owner_id,
            name='Test',
            account_type=AccountType.CHECKING,
            currency='USD',
            initial_balance=Decimal('-100.00'),
        )
        db_session.add(account)
        with pytest.raises(Exception):  # Check constraint violation
            await db_session.flush()

    async def test_account_unique_name_per_owner(self, db_session, owner_id):
        account1 = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD')
        account2 = Account(owner_id=owner_id, name='Checking', account_type=AccountType.SAVINGS, currency='USD')
        db_session.add_all([account1, account2])
        with pytest.raises(Exception):  # Unique constraint violation
            await db_session.flush()


class TestCategoryModel:
    async def test_create_category(self, db_session, owner_id):
        category = Category(
            name='Food',
            category_type=CategoryType.EXPENSE,
            owner_id=owner_id,
        )
        db_session.add(category)
        await db_session.flush()

        assert category.id is not None
        assert category.name == 'Food'
        assert category.category_type == CategoryType.EXPENSE

    async def test_system_category_no_owner(self, db_session):
        category = Category(
            name='Salary',
            category_type=CategoryType.INCOME,
            owner_id=None,
            is_system=True,
        )
        db_session.add(category)
        await db_session.flush()

        assert category.owner_id is None
        assert category.is_system is True


class TestTransactionModel:
    async def test_create_income_transaction(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD')
        db_session.add(account)
        await db_session.flush()

        category = Category(name='Salary', category_type=CategoryType.INCOME, owner_id=owner_id)
        db_session.add(category)
        await db_session.flush()

        transaction = Transaction(
            owner_id=owner_id,
            account_id=account.id,
            category_id=category.id,
            amount=Decimal('5000.00'),
            currency='USD',
            transaction_type=TransactionType.INCOME,
            description='Monthly salary',
        )
        db_session.add(transaction)
        await db_session.flush()

        assert transaction.id is not None
        assert transaction.amount == Decimal('5000.00')
        assert transaction.transaction_type == TransactionType.INCOME

    async def test_create_expense_transaction(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD')
        db_session.add(account)
        await db_session.flush()

        category = Category(name='Food', category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add(category)
        await db_session.flush()

        transaction = Transaction(
            owner_id=owner_id,
            account_id=account.id,
            category_id=category.id,
            amount=Decimal('100.00'),
            currency='USD',
            transaction_type=TransactionType.EXPENSE,
            description='Groceries',
        )
        db_session.add(transaction)
        await db_session.flush()

        assert transaction.transaction_type == TransactionType.EXPENSE

    async def test_transaction_amount_positive(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD')
        db_session.add(account)
        await db_session.flush()

        transaction = Transaction(
            owner_id=owner_id,
            account_id=account.id,
            amount=Decimal('-50.00'),
            currency='USD',
            transaction_type=TransactionType.EXPENSE,
        )
        db_session.add(transaction)
        with pytest.raises(Exception):  # Check constraint violation
            await db_session.flush()

    async def test_transaction_foreign_key_account(self, db_session, owner_id):
        transaction = Transaction(
            owner_id=owner_id,
            account_id=99999,  # Non-existent account
            amount=Decimal('100.00'),
            currency='USD',
            transaction_type=TransactionType.EXPENSE,
        )
        db_session.add(transaction)
        with pytest.raises(Exception):  # Foreign key violation
            await db_session.flush()
