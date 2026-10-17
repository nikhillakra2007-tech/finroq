import pytest
from decimal import Decimal
from datetime import datetime, date, timedelta
from app.features.accounts.service import AccountService
from app.features.transactions.service import TransactionService
from app.features.categories.service import CategoryService
from app.features.summary.service import SummaryService
from app.shared.schemas import AccountCreate, AccountUpdate, TransactionCreate, TransactionUpdate, CategoryCreate
from app.db.models import Account, AccountType, Transaction, TransactionType, Category, CategoryType


class TestAccountService:
    @pytest.fixture
    def service(self, db_session, owner_id):
        return AccountService(db_session, owner_id)

    async def test_create_account(self, service):
        data = AccountCreate(name='Test Account', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        account = await service.create(data)

        assert account.id is not None
        assert account.name == 'Test Account'
        assert account.account_type == AccountType.CHECKING
        assert account.initial_balance == Decimal('1000.00')

    async def test_list_accounts(self, service):
        await service.create(AccountCreate(name='Account 1', account_type=AccountType.CHECKING, currency='USD'))
        await service.create(AccountCreate(name='Account 2', account_type=AccountType.SAVINGS, currency='USD'))

        accounts, total = await service.list(page=1, page_size=10)
        assert total == 2
        assert len(accounts) == 2

    async def test_list_accounts_pagination(self, service):
        for i in range(5):
            await service.create(AccountCreate(name=f'Account {i}', account_type=AccountType.CHECKING, currency='USD'))

        accounts, total = await service.list(page=1, page_size=2)
        assert total == 5
        assert len(accounts) == 2

        accounts2, _ = await service.list(page=2, page_size=2)
        assert len(accounts2) == 2

    async def test_get_account_by_id(self, service):
        created = await service.create(AccountCreate(name='Test', account_type=AccountType.CHECKING, currency='USD'))
        account = await service.get_by_id(created.id)

        assert account is not None
        assert account.id == created.id

    async def test_get_nonexistent_account(self, service):
        account = await service.get_by_id(99999)
        assert account is None

    async def test_update_account(self, service):
        created = await service.create(AccountCreate(name='Original', account_type=AccountType.CHECKING, currency='USD'))
        updated = await service.update(created.id, AccountUpdate(name='Updated'))

        assert updated is not None
        assert updated.name == 'Updated'

    async def test_update_nonexistent_account(self, service):
        updated = await service.update(99999, AccountUpdate(name='Updated'))
        assert updated is None

    async def test_account_isolation(self, db_session, owner_id):
        service1 = AccountService(db_session, owner_id)
        service2 = AccountService(db_session, 'other-user')

        await service1.create(AccountCreate(name='User 1 Account', account_type=AccountType.CHECKING, currency='USD'))
        accounts1, _ = await service1.list()
        accounts2, _ = await service2.list()

        assert len(accounts1) == 1
        assert len(accounts2) == 0


class TestTransactionService:
    @pytest.fixture
    def service(self, db_session, owner_id):
        return TransactionService(db_session, owner_id)

    @pytest.fixture
    async def setup_data(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        db_session.add(account)
        await db_session.flush()

        cat_income = Category(name='Salary', category_type=CategoryType.INCOME, owner_id=owner_id)
        cat_expense = Category(name='Food', category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add_all([cat_income, cat_expense])
        await db_session.flush()

        return account, cat_income, cat_expense

    async def test_create_income_transaction(self, service, setup_data):
        account, cat_income, _ = setup_data
        data = TransactionCreate(
            account_id=account.id,
            category_id=cat_income.id,
            amount=Decimal('5000.00'),
            currency='USD',
            transaction_type=TransactionType.INCOME,
            description='Salary',
            transaction_date=datetime.now(),
        )
        txn = await service.create(data)

        assert txn.id is not None
        assert txn.transaction_type == TransactionType.INCOME
        assert txn.amount == Decimal('5000.00')

    async def test_create_expense_transaction(self, service, setup_data):
        account, _, cat_expense = setup_data
        data = TransactionCreate(
            account_id=account.id,
            category_id=cat_expense.id,
            amount=Decimal('100.00'),
            currency='USD',
            transaction_type=TransactionType.EXPENSE,
            description='Groceries',
            transaction_date=datetime.now(),
        )
        txn = await service.create(data)

        assert txn.transaction_type == TransactionType.EXPENSE

    async def test_create_transaction_invalid_account(self, service, setup_data):
        _, cat_income, _ = setup_data
        data = TransactionCreate(
            account_id=99999,
            category_id=cat_income.id,
            amount=Decimal('100.00'),
            currency='USD',
            transaction_type=TransactionType.INCOME,
            transaction_date=datetime.now(),
        )
        with pytest.raises(ValueError, match='Account not found'):
            await service.create(data)

    async def test_create_transaction_category_type_mismatch(self, service, setup_data):
        account, _, cat_expense = setup_data
        data = TransactionCreate(
            account_id=account.id,
            category_id=cat_expense.id,
            amount=Decimal('100.00'),
            currency='USD',
            transaction_type=TransactionType.INCOME,  # Mismatch: expense category for income
            transaction_date=datetime.now(),
        )
        with pytest.raises(ValueError, match='Category type mismatch'):
            await service.create(data)

    async def test_list_transactions_with_filters(self, service, setup_data):
        account, cat_income, cat_expense = setup_data
        now = datetime.now()

        await service.create(TransactionCreate(
            account_id=account.id, category_id=cat_income.id, amount=Decimal('5000.00'),
            currency='USD', transaction_type=TransactionType.INCOME, transaction_date=now - timedelta(days=10)
        ))
        await service.create(TransactionCreate(
            account_id=account.id, category_id=cat_expense.id, amount=Decimal('100.00'),
            currency='USD', transaction_type=TransactionType.EXPENSE, transaction_date=now - timedelta(days=5)
        ))
        await service.create(TransactionCreate(
            account_id=account.id, category_id=cat_expense.id, amount=Decimal('50.00'),
            currency='USD', transaction_type=TransactionType.EXPENSE, transaction_date=now
        ))

        # Filter by type
        income_txns, total = await service.list(transaction_type=TransactionType.INCOME)
        assert total == 1
        assert income_txns[0].transaction_type == TransactionType.INCOME

        # Filter by date range
        recent_txns, total = await service.list(start_date=now - timedelta(days=3))
        assert total == 1

    async def test_update_transaction(self, service, setup_data):
        account, cat_income, _ = setup_data
        created = await service.create(TransactionCreate(
            account_id=account.id, category_id=cat_income.id, amount=Decimal('100.00'),
            currency='USD', transaction_type=TransactionType.INCOME, transaction_date=datetime.now()
        ))
        updated = await service.update(created.id, TransactionUpdate(amount=Decimal('200.00')))
        assert updated.amount == Decimal('200.00')

    async def test_delete_transaction(self, service, setup_data):
        account, cat_income, _ = setup_data
        created = await service.create(TransactionCreate(
            account_id=account.id, category_id=cat_income.id, amount=Decimal('100.00'),
            currency='USD', transaction_type=TransactionType.INCOME, transaction_date=datetime.now()
        ))
        deleted = await service.delete(created.id)
        assert deleted is True

        txn = await service.get_by_id(created.id)
        assert txn is None


class TestCategoryService:
    @pytest.fixture
    def service(self, db_session, owner_id):
        return CategoryService(db_session, owner_id)

    async def test_create_category(self, service):
        data = CategoryCreate(name='Custom Category', category_type=CategoryType.EXPENSE)
        category = await service.create(data)

        assert category.id is not None
        assert category.name == 'Custom Category'
        assert category.owner_id is not None  # User-specific

    async def test_list_categories_includes_system(self, service):
        await service.seed_defaults()
        categories = await service.list(include_system=True)
        # Should include seeded system categories
        assert len(categories) > 0
        assert any(c.is_system for c in categories)

    async def test_list_categories_by_type(self, service):
        income_cats = await service.list(category_type=CategoryType.INCOME)
        expense_cats = await service.list(category_type=CategoryType.EXPENSE)

        assert all(c.category_type in [CategoryType.INCOME, CategoryType.BOTH] for c in income_cats)
        assert all(c.category_type in [CategoryType.EXPENSE, CategoryType.BOTH] for c in expense_cats)

    async def test_seed_defaults(self, service):
        created = await service.seed_defaults()
        assert len(created) > 0
        assert all(c.is_system for c in created)


class TestSummaryService:
    @pytest.fixture
    def service(self, db_session, owner_id):
        return SummaryService(db_session, owner_id)

    async def test_get_summary_empty(self, service):
        summary = await service.get_summary()
        assert summary.total_income == Decimal('0.00')
        assert summary.total_expenses == Decimal('0.00')
        assert summary.net_cash_flow == Decimal('0.00')

    async def test_get_summary_with_transactions(self, db_session, owner_id):
        # Setup
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        db_session.add(account)
        await db_session.flush()

        cat_income = Category(name='Salary', category_type=CategoryType.INCOME, owner_id=owner_id)
        cat_expense = Category(name='Food', category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add_all([cat_income, cat_expense])
        await db_session.flush()

        now = datetime.now()
        txns = [
            Transaction(owner_id=owner_id, account_id=account.id, category_id=cat_income.id,
                        amount=Decimal('5000.00'), currency='USD', transaction_type=TransactionType.INCOME,
                        transaction_date=now),
            Transaction(owner_id=owner_id, account_id=account.id, category_id=cat_expense.id,
                        amount=Decimal('100.00'), currency='USD', transaction_type=TransactionType.EXPENSE,
                        transaction_date=now),
        ]
        db_session.add_all(txns)
        await db_session.commit()

        service = SummaryService(db_session, owner_id)
        summary = await service.get_summary()

        assert summary.total_income == Decimal('5000.00')
        assert summary.total_expenses == Decimal('100.00')
        assert summary.net_cash_flow == Decimal('4900.00')

    async def test_account_balances_in_summary(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        db_session.add(account)
        await db_session.flush()

        cat_income = Category(name='Salary', category_type=CategoryType.INCOME, owner_id=owner_id)
        db_session.add(cat_income)
        await db_session.flush()

        txn = Transaction(owner_id=owner_id, account_id=account.id, category_id=cat_income.id,
                          amount=Decimal('500.00'), currency='USD', transaction_type=TransactionType.INCOME,
                          transaction_date=datetime.now())
        db_session.add(txn)
        await db_session.commit()

        service = SummaryService(db_session, owner_id)
        summary = await service.get_summary()

        assert len(summary.account_balances) == 1
        balance = summary.account_balances[0]
        assert balance.current_balance == Decimal('1500.00')  # 1000 initial + 500 income
        assert balance.period_income == Decimal('500.00')

    async def test_historical_transaction_affects_balance_without_inflating_period_income(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        db_session.add(account)
        await db_session.flush()

        cat_income = Category(name='Salary', category_type=CategoryType.INCOME, owner_id=owner_id)
        cat_expense = Category(name='Food', category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add_all([cat_income, cat_expense])
        await db_session.flush()

        # September 2026: Income 5000.00
        txn_sep = Transaction(
            owner_id=owner_id, account_id=account.id, category_id=cat_income.id,
            amount=Decimal('5000.00'), currency='USD', transaction_type=TransactionType.INCOME,
            transaction_date=datetime(2026, 9, 15, 12, 0, 0)
        )
        # October 2026: Expense 200.00
        txn_oct = Transaction(
            owner_id=owner_id, account_id=account.id, category_id=cat_expense.id,
            amount=Decimal('200.00'), currency='USD', transaction_type=TransactionType.EXPENSE,
            transaction_date=datetime(2026, 10, 15, 12, 0, 0)
        )
        db_session.add_all([txn_sep, txn_oct])
        await db_session.commit()

        service = SummaryService(db_session, owner_id)
        # Request October summary: 2026-10-01 to 2026-10-31
        start_oct = datetime(2026, 10, 1, 0, 0, 0)
        end_oct = datetime(2026, 10, 31, 23, 59, 59)
        summary = await service.get_summary(start_date=start_oct, end_date=end_oct)

        # Period metrics: strictly October (Sept income must NOT inflate October)
        assert summary.total_income == Decimal('0.00')
        assert summary.total_expenses == Decimal('200.00')
        assert summary.net_cash_flow == Decimal('-200.00')

        # Balance metrics: includes all transactions through October 31
        # Initial 1000 + 5000 (Sept) - 200 (Oct) = 5800.00
        assert summary.account_balances[0].period_income == Decimal('0.00')
        assert summary.account_balances[0].period_expenses == Decimal('200.00')
        assert summary.account_balances[0].current_balance == Decimal('5800.00')
        assert summary.net_worth == Decimal('5800.00')

    async def test_date_range_change_produces_correct_balance_as_of_requested_end_date(self, db_session, owner_id):
        account = Account(owner_id=owner_id, name='Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('1000.00'))
        db_session.add(account)
        await db_session.flush()

        cat_income = Category(name='Consulting', category_type=CategoryType.INCOME, owner_id=owner_id)
        cat_expense = Category(name='Supplies', category_type=CategoryType.EXPENSE, owner_id=owner_id)
        db_session.add_all([cat_income, cat_expense])
        await db_session.flush()

        # Month 1 (Jan 2026): +3000
        t1 = Transaction(
            owner_id=owner_id, account_id=account.id, category_id=cat_income.id,
            amount=Decimal('3000.00'), currency='USD', transaction_type=TransactionType.INCOME,
            transaction_date=datetime(2026, 1, 10)
        )
        # Month 2 (Feb 2026): -500
        t2 = Transaction(
            owner_id=owner_id, account_id=account.id, category_id=cat_expense.id,
            amount=Decimal('500.00'), currency='USD', transaction_type=TransactionType.EXPENSE,
            transaction_date=datetime(2026, 2, 10)
        )
        # Month 3 (Mar 2026): +2000
        t3 = Transaction(
            owner_id=owner_id, account_id=account.id, category_id=cat_income.id,
            amount=Decimal('2000.00'), currency='USD', transaction_type=TransactionType.INCOME,
            transaction_date=datetime(2026, 3, 10)
        )
        db_session.add_all([t1, t2, t3])
        await db_session.commit()

        service = SummaryService(db_session, owner_id)

        # 1. View as of Jan 31: 1000 + 3000 = 4000.00
        s_jan = await service.get_summary(start_date=datetime(2026, 1, 1), end_date=datetime(2026, 1, 31, 23, 59, 59))
        assert s_jan.account_balances[0].current_balance == Decimal('4000.00')

        # 2. View as of Feb 28: 1000 + 3000 - 500 = 3500.00 (Mar transaction excluded!)
        s_feb = await service.get_summary(start_date=datetime(2026, 2, 1), end_date=datetime(2026, 2, 28, 23, 59, 59))
        assert s_feb.total_income == Decimal('0.00')
        assert s_feb.total_expenses == Decimal('500.00')
        assert s_feb.account_balances[0].current_balance == Decimal('3500.00')
        assert s_feb.net_worth == Decimal('3500.00')

        # 3. View as of Mar 31: 1000 + 3000 - 500 + 2000 = 5500.00
        s_mar = await service.get_summary(start_date=datetime(2026, 3, 1), end_date=datetime(2026, 3, 31, 23, 59, 59))
        assert s_mar.account_balances[0].current_balance == Decimal('5500.00')
        assert s_mar.net_worth == Decimal('5500.00')

    async def test_transfers_preserve_net_worth_across_historical_periods(self, db_session, owner_id):
        acc1 = Account(owner_id=owner_id, name='Primary Checking', account_type=AccountType.CHECKING, currency='USD', initial_balance=Decimal('10000.00'))
        acc2 = Account(owner_id=owner_id, name='Emergency Savings', account_type=AccountType.SAVINGS, currency='USD', initial_balance=Decimal('5000.00'))
        db_session.add_all([acc1, acc2])
        await db_session.flush()

        # Jan 2026: Transfer 3000 from acc1 to acc2
        t_transfer = Transaction(
            owner_id=owner_id, account_id=acc1.id, to_account_id=acc2.id,
            amount=Decimal('3000.00'), currency='USD', transaction_type=TransactionType.TRANSFER,
            transaction_date=datetime(2026, 1, 15)
        )
        db_session.add(t_transfer)
        await db_session.commit()

        service = SummaryService(db_session, owner_id)
        # Query February summary (no transactions in Feb)
        s_feb = await service.get_summary(start_date=datetime(2026, 2, 1), end_date=datetime(2026, 2, 28, 23, 59, 59))
        assert s_feb.total_income == Decimal('0.00')
        assert s_feb.total_expenses == Decimal('0.00')
        assert s_feb.net_cash_flow == Decimal('0.00')

        balances = {b.account_id: b.current_balance for b in s_feb.account_balances}
        assert balances[acc1.id] == Decimal('7000.00')   # 10000 - 3000
        assert balances[acc2.id] == Decimal('8000.00')   # 5000 + 3000
        assert s_feb.net_worth == Decimal('15000.00')    # 7000 + 8000 = 15000 (conserved!)

    async def test_credit_card_net_worth_and_payment_in_summary_service(self, db_session, owner_id):
        # Scenario 4 via real DB session in SummaryService:
        # Cash: 100,000; Credit Card debt: 50,000 -> Net worth: 50,000.
        checking = Account(owner_id=owner_id, name='Primary Checking', account_type=AccountType.CHECKING, currency='INR', initial_balance=Decimal('100000.00'))
        credit = Account(owner_id=owner_id, name='Prime Credit', account_type=AccountType.CREDIT, currency='INR', initial_balance=Decimal('50000.00'))
        db_session.add_all([checking, credit])
        await db_session.flush()

        service = SummaryService(db_session, owner_id)
        # Check before payment
        s_initial = await service.get_summary()
        assert s_initial.net_worth == Decimal('50000.00')
        b_init = {b.account_id: b.current_balance for b in s_initial.account_balances}
        assert b_init[checking.id] == Decimal('100000.00')
        assert b_init[credit.id] == Decimal('-50000.00')

        # Payment: Transfer of 10,000 from Checking to Credit Card
        pay_txn = Transaction(
            owner_id=owner_id, account_id=checking.id, to_account_id=credit.id,
            amount=Decimal('10000.00'), currency='INR', transaction_type=TransactionType.TRANSFER,
            transaction_date=datetime.utcnow()
        )
        db_session.add(pay_txn)
        await db_session.commit()

        s_after = await service.get_summary()
        # Transfers do not create income or expenses
        assert s_after.total_income == Decimal('0.00')
        assert s_after.total_expenses == Decimal('0.00')
        assert s_after.net_cash_flow == Decimal('0.00')

        b_after = {b.account_id: b.current_balance for b in s_after.account_balances}
        assert b_after[checking.id] == Decimal('90000.00')
        assert b_after[credit.id] == Decimal('-40000.00')  # Debt reduced by 10,000
        assert s_after.net_worth == Decimal('50000.00')    # Net worth fully conserved
