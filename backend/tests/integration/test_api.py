import pytest
from decimal import Decimal
from datetime import datetime
from httpx import AsyncClient
from app.main import app
from app.db.models import Account, AccountType, Transaction, TransactionType, Category, CategoryType


class TestHealthEndpoints:
    async def test_health_check(self, async_client):
        response = await async_client.get('/api/v1/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'finroq-api'

    async def test_readiness_check(self, async_client):
        response = await async_client.get('/api/v1/health/ready')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'ready'
        assert data['database'] == 'connected'


class TestAccountsAPI:
    async def test_create_account(self, async_client, auth_headers):
        response = await async_client.post(
            '/api/v1/accounts',
            json={'name': 'Test Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'Test Checking'
        assert data['account_type'] == 'checking'
        assert data['initial_balance'] == '1000.00'
        assert 'id' in data

    async def test_create_account_validation_error(self, async_client, auth_headers):
        response = await async_client.post(
            '/api/v1/accounts',
            json={'name': '', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_account_missing_auth(self, async_client):
        response = await async_client.post(
            '/api/v1/accounts',
            json={'name': 'Test', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'},
        )
        assert response.status_code == 401

    async def test_list_accounts(self, async_client, auth_headers):
        # Create test accounts via API
        await async_client.post('/api/v1/accounts', json={'name': 'Account 1', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        await async_client.post('/api/v1/accounts', json={'name': 'Account 2', 'account_type': 'savings', 'currency': 'USD', 'initial_balance': '2000.00'}, headers=auth_headers)

        response = await async_client.get('/api/v1/accounts', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 2
        assert len(data['accounts']) == 2

    async def test_get_account(self, async_client, auth_headers):
        # Create account via API
        create_resp = await async_client.post('/api/v1/accounts', json={'name': 'Test Account', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        acc = create_resp.json()

        response = await async_client.get(f'/api/v1/accounts/{acc["id"]}', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == acc['id']
        assert data['name'] == 'Test Account'

    async def test_get_account_not_found(self, async_client, auth_headers):
        response = await async_client.get('/api/v1/accounts/99999', headers=auth_headers)
        assert response.status_code == 404

    async def test_update_account(self, async_client, auth_headers):
        # Create account via API
        create_resp = await async_client.post('/api/v1/accounts', json={'name': 'Original', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        acc = create_resp.json()

        response = await async_client.patch(
            f'/api/v1/accounts/{acc["id"]}',
            json={'name': 'Updated'},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == 'Updated'

    async def test_account_isolation(self, async_client, auth_headers, other_auth_headers):
        # Create account for another user via API
        await async_client.post('/api/v1/accounts', json={'name': 'Other User Account', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=other_auth_headers)

        response = await async_client.get('/api/v1/accounts', headers=auth_headers)
        data = response.json()
        assert data['total'] == 0


class TestTransactionsAPI:
    async def test_create_transaction(self, async_client, auth_headers):
        # Setup account and category via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        # Seed categories first
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        category = next(c for c in categories if c['name'] == 'Salary')

        response = await async_client.post(
            '/api/v1/transactions',
            json={
                'account_id': account['id'],
                'category_id': category['id'],
                'amount': '5000.00',
                'currency': 'USD',
                'transaction_type': 'income',
                'description': 'Monthly salary',
                'transaction_date': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data['amount'] == '5000.00'
        assert data['transaction_type'] == 'income'

    async def test_create_transaction_invalid_account(self, async_client, auth_headers):
        response = await async_client.post(
            '/api/v1/transactions',
            json={
                'account_id': 99999,
                'amount': '100.00',
                'currency': 'USD',
                'transaction_type': 'expense',
                'transaction_date': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert 'Account not found' in response.json()['detail']

    async def test_create_transaction_category_mismatch(self, async_client, auth_headers):
        # Setup account via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        # Create expense category via API
        cat_resp = await async_client.post('/api/v1/categories', json={'name': 'Food', 'category_type': 'expense'}, headers=auth_headers)
        category = cat_resp.json()

        response = await async_client.post(
            '/api/v1/transactions',
            json={
                'account_id': account['id'],
                'category_id': category['id'],
                'amount': '100.00',
                'currency': 'USD',
                'transaction_type': 'income',  # Mismatch!
                'transaction_date': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert 'Category type mismatch' in response.json()['detail']

    async def test_list_transactions(self, async_client, auth_headers):
        # Create account and transactions via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        cat_income = next(c for c in categories if c['name'] == 'Salary')
        cat_expense = next(c for c in categories if c['name'] == 'Food')

        # Create transactions
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_income['id'], 'amount': '5000.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_expense['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'expense', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)

        response = await async_client.get('/api/v1/transactions', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 2
        assert len(data['transactions']) == 2

    async def test_list_transactions_with_filters(self, async_client, auth_headers):
        # Create account and transactions via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        cat_income = next(c for c in categories if c['name'] == 'Salary')
        cat_expense = next(c for c in categories if c['name'] == 'Food')

        # Create transactions
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_income['id'], 'amount': '5000.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_expense['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'expense', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)

        # Filter by type
        response = await async_client.get('/api/v1/transactions?transaction_type=income', headers=auth_headers)
        data = response.json()
        assert data['total'] == 1
        assert data['transactions'][0]['transaction_type'] == 'income'

    async def test_get_transaction(self, async_client, auth_headers):
        # Create account and transaction via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        category = next(c for c in categories if c['name'] == 'Food')

        txn_resp = await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': category['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'expense', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        txn = txn_resp.json()

        response = await async_client.get(f'/api/v1/transactions/{txn["id"]}', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == txn['id']

    async def test_update_transaction(self, async_client, auth_headers):
        # Create account and transaction via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        category = next(c for c in categories if c['name'] == 'Salary')

        txn_resp = await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': category['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        txn = txn_resp.json()

        response = await async_client.patch(
            f'/api/v1/transactions/{txn["id"]}',
            json={'amount': '200.00'},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data['amount'] == '200.00'

    async def test_delete_transaction(self, async_client, auth_headers):
        # Create account and transaction via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        category = next(c for c in categories if c['name'] == 'Salary')

        txn_resp = await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': category['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        txn = txn_resp.json()

        response = await async_client.delete(f'/api/v1/transactions/{txn["id"]}', headers=auth_headers)
        assert response.status_code == 204

        # Verify deleted
        response = await async_client.get(f'/api/v1/transactions/{txn["id"]}', headers=auth_headers)
        assert response.status_code == 404

    async def test_create_transfer_transaction(self, async_client, auth_headers):
        acc1 = (await async_client.post('/api/v1/accounts', json={'name': 'Checking 1', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)).json()
        acc2 = (await async_client.post('/api/v1/accounts', json={'name': 'Savings 1', 'account_type': 'savings', 'currency': 'USD', 'initial_balance': '500.00'}, headers=auth_headers)).json()

        # Valid transfer
        res = await async_client.post(
            '/api/v1/transactions',
            json={
                'account_id': acc1['id'],
                'to_account_id': acc2['id'],
                'amount': '250.00',
                'currency': 'USD',
                'transaction_type': 'transfer',
                'transaction_date': datetime.now().isoformat(),
                'description': 'Transfer to savings',
            },
            headers=auth_headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data['transaction_type'] == 'transfer'
        assert data['to_account_id'] == acc2['id']

        # Transfer missing to_account_id
        res_err = await async_client.post(
            '/api/v1/transactions',
            json={
                'account_id': acc1['id'],
                'amount': '50.00',
                'currency': 'USD',
                'transaction_type': 'transfer',
                'transaction_date': datetime.now().isoformat(),
            },
            headers=auth_headers,
        )
        assert res_err.status_code == 400

    async def test_statement_import_preview_and_confirm(self, async_client, auth_headers):
        account = (await async_client.post('/api/v1/accounts', json={'name': 'Import Account', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)).json()
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)

        csv_content = (
            "Date,Description,Amount,Type\n"
            "2026-10-01,Acme Payroll Deposit,3500.00,income\n"
            "2026-10-02,Trader Joe Food Market,85.20,expense\n"
            "2026-10-03,Uber Ride Transit,24.50,expense\n"
        )

        files = {"file": ("statement.csv", csv_content.encode("utf-8"), "text/csv")}
        data = {"account_id": account["id"]}

        preview_res = await async_client.post(
            "/api/v1/transactions/import/preview",
            data=data,
            files=files,
            headers=auth_headers,
        )
        assert preview_res.status_code == 200
        preview_data = preview_res.json()
        assert preview_data["total_rows"] == 3
        assert preview_data["valid_count"] == 3
        assert preview_data["duplicate_count"] == 0

        # Confirm import
        confirm_res = await async_client.post(
            "/api/v1/transactions/import/confirm",
            json={
                "account_id": account["id"],
                "transactions": [
                    {
                        "transaction_date": item["transaction_date"],
                        "description": item["description"],
                        "amount": item["amount"],
                        "transaction_type": item["transaction_type"],
                        "category_id": item["suggested_category_id"],
                    }
                    for item in preview_data["items"]
                ],
            },
            headers=auth_headers,
        )
        assert confirm_res.status_code == 200
        confirm_data = confirm_res.json()
        assert confirm_data["imported_count"] == 3

        # Verify listed transactions
        list_res = await async_client.get(f"/api/v1/transactions?account_id={account['id']}", headers=auth_headers)
        assert list_res.json()["total"] == 3


class TestCategoriesAPI:
    async def test_list_categories(self, async_client, auth_headers):
        response = await async_client.get('/api/v1/categories', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # System categories should be returned

    async def test_create_category(self, async_client, auth_headers):
        response = await async_client.post(
            '/api/v1/categories',
            json={'name': 'Custom Category', 'category_type': 'expense'},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data['name'] == 'Custom Category'
        assert data['category_type'] == 'expense'
        assert data['is_system'] is False

    async def test_seed_defaults(self, async_client, auth_headers):
        response = await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestSummaryAPI:
    async def test_get_summary(self, async_client, auth_headers):
        # Setup data via API
        account_resp = await async_client.post('/api/v1/accounts', json={'name': 'Checking', 'account_type': 'checking', 'currency': 'USD', 'initial_balance': '1000.00'}, headers=auth_headers)
        account = account_resp.json()
        
        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        cat_income = next(c for c in categories if c['name'] == 'Salary')
        cat_expense = next(c for c in categories if c['name'] == 'Food')

        # Create transactions
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_income['id'], 'amount': '5000.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)
        await async_client.post('/api/v1/transactions', json={'account_id': account['id'], 'category_id': cat_expense['id'], 'amount': '100.00', 'currency': 'USD', 'transaction_type': 'expense', 'transaction_date': datetime.now().isoformat()}, headers=auth_headers)

        response = await async_client.get('/api/v1/summary', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['total_income'] == '5000.00'
        assert data['total_expenses'] == '100.00'
        assert data['net_cash_flow'] == '4900.00'
        assert 'account_balances' in data
        assert 'category_breakdown' in data

    async def test_get_summary_with_historical_balance_and_period_isolation(self, async_client, auth_headers):
        # Create Account with 2000 initial balance
        acc_resp = await async_client.post(
            '/api/v1/accounts',
            json={'name': 'Savings-Hist', 'account_type': 'savings', 'currency': 'USD', 'initial_balance': '2000.00'},
            headers=auth_headers
        )
        acc_id = acc_resp.json()['id']

        await async_client.post('/api/v1/categories/seed-defaults', headers=auth_headers)
        cat_resp = await async_client.get('/api/v1/categories', headers=auth_headers)
        categories = cat_resp.json()
        cat_income = next(c for c in categories if c['name'] == 'Salary')
        cat_expense = next(c for c in categories if c['name'] == 'Food')

        # Previous month: 2026-08-15 (+4000 income)
        await async_client.post(
            '/api/v1/transactions',
            json={'account_id': acc_id, 'category_id': cat_income['id'], 'amount': '4000.00', 'currency': 'USD', 'transaction_type': 'income', 'transaction_date': '2026-08-15T12:00:00'},
            headers=auth_headers
        )
        # Current reporting month: 2026-09-10 (-300 expense)
        await async_client.post(
            '/api/v1/transactions',
            json={'account_id': acc_id, 'category_id': cat_expense['id'], 'amount': '300.00', 'currency': 'USD', 'transaction_type': 'expense', 'transaction_date': '2026-09-10T12:00:00'},
            headers=auth_headers
        )

        # Query September 2026 summary
        resp = await async_client.get(
            '/api/v1/summary?start_date=2026-09-01T00:00:00&end_date=2026-09-30T23:59:59',
            headers=auth_headers
        )
        assert resp.status_code == 200
        data = resp.json()

        # Period metrics: strictly September
        assert data['total_income'] == '0.00'
        assert data['total_expenses'] == '300.00'
        assert data['net_cash_flow'] == '-300.00'

        # Balance metrics: 2000 initial + 4000 (Aug) - 300 (Sept) = 5700.00
        acc_balance = next(b for b in data['account_balances'] if b['account_id'] == acc_id)
        assert acc_balance['period_income'] == '0.00'
        assert acc_balance['period_expenses'] == '300.00'
        assert acc_balance['current_balance'] == '5700.00'


class TestAuthAPI:
    async def test_register(self, async_client):
        response = await async_client.post(
            '/api/v1/auth/register',
            json={'email': 'newuser@example.com', 'password': 'password123', 'full_name': 'New User'},
        )
        assert response.status_code == 201
        data = response.json()
        assert data['email'] == 'newuser@example.com'
        assert data['full_name'] == 'New User'

    async def test_login(self, async_client, db_session):
        from app.core.security import get_password_hash
        from app.db.models import User
        
        # Create a user first
        user = User(email='logintest@example.com', hashed_password=get_password_hash('password123'), full_name='Login Test')
        db_session.add(user)
        await db_session.commit()
        
        response = await async_client.post(
            '/api/v1/auth/login',
            json={'email': 'logintest@example.com', 'password': 'password123'},
        )
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data
        assert data['token_type'] == 'bearer'

    async def test_login_invalid_credentials(self, async_client):
        response = await async_client.post(
            '/api/v1/auth/login',
            json={'email': 'nonexistent@example.com', 'password': 'wrongpassword'},
        )
        assert response.status_code == 401

    async def test_get_me(self, async_client, auth_headers, test_user):
        response = await async_client.get('/api/v1/auth/me', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_user.id
        assert data['email'] == test_user.email

    async def test_cross_user_access_denied(self, async_client, auth_headers, other_auth_headers, db_session, test_user, other_user):
        # Create account for user 1
        acc1 = Account(owner_id=str(test_user.id), name='User 1 Account', account_type=AccountType.CHECKING, currency='USD')
        db_session.add(acc1)
        await db_session.commit()
        await db_session.refresh(acc1)

        # User 2 tries to access user 1's account
        response = await async_client.get(f'/api/v1/accounts/{acc1.id}', headers=other_auth_headers)
        assert response.status_code == 404  # Should not find account (belongs to different user)


class TestBudgetAPI:
    async def _seed_expense_category(self, async_client, auth_headers):
        response = await async_client.post('/api/v1/categories', json={'name': 'Food', 'category_type': 'expense'}, headers=auth_headers)
        return response.json()

    async def test_create_budget(self, async_client, auth_headers):
        category = await self._seed_expense_category(async_client, auth_headers)
        response = await async_client.post(
            '/api/v1/budgets',
            json={'category_id': category['id'], 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data['allocated_amount'] == '500.00'
        assert data['actual_spending'] == '0.00'
        assert data['is_overspent'] is False

    async def test_create_budget_missing_auth(self, async_client):
        response = await async_client.post(
            '/api/v1/budgets',
            json={'category_id': 1, 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'},
        )
        assert response.status_code == 401

    async def test_create_budget_duplicate(self, async_client, auth_headers):
        category = await self._seed_expense_category(async_client, auth_headers)
        payload = {'category_id': category['id'], 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'}
        await async_client.post('/api/v1/budgets', json=payload, headers=auth_headers)
        response = await async_client.post('/api/v1/budgets', json=payload, headers=auth_headers)
        assert response.status_code == 400
        assert 'already exists' in response.json()['detail']

    async def test_list_budgets(self, async_client, auth_headers):
        category = await self._seed_expense_category(async_client, auth_headers)
        await async_client.post(
            '/api/v1/budgets',
            json={'category_id': category['id'], 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'},
            headers=auth_headers,
        )
        response = await async_client.get('/api/v1/budgets?year=2026&month=1', headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['category_name'] == 'Food'

    async def test_update_and_delete_budget(self, async_client, auth_headers):
        category = await self._seed_expense_category(async_client, auth_headers)
        create_resp = await async_client.post(
            '/api/v1/budgets',
            json={'category_id': category['id'], 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'},
            headers=auth_headers,
        )
        budget_id = create_resp.json()['id']

        update_resp = await async_client.patch(
            f'/api/v1/budgets/{budget_id}',
            json={'allocated_amount': '200.00'},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()['allocated_amount'] == '200.00'

        delete_resp = await async_client.delete(f'/api/v1/budgets/{budget_id}', headers=auth_headers)
        assert delete_resp.status_code == 204

        get_resp = await async_client.get(f'/api/v1/budgets/{budget_id}', headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_budget_isolation(self, async_client, auth_headers, other_auth_headers):
        category = await self._seed_expense_category(async_client, auth_headers)
        await async_client.post(
            '/api/v1/budgets',
            json={'category_id': category['id'], 'budget_year': 2026, 'budget_month': 1, 'allocated_amount': '500.00'},
            headers=auth_headers,
        )
        response = await async_client.get('/api/v1/budgets?year=2026&month=1', headers=other_auth_headers)
        assert response.status_code == 200
        assert response.json() == []


class TestRecurringAPI:
    async def _create_account(self, async_client, auth_headers, name="Main Checking"):
        resp = await async_client.post(
            "/api/v1/accounts",
            json={"name": name, "account_type": "checking", "currency": "USD", "initial_balance": "2000.00"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        return resp.json()

    async def _create_category(self, async_client, auth_headers, name="Rent"):
        resp = await async_client.post(
            "/api/v1/categories",
            json={"name": name, "category_type": "expense"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        return resp.json()

    async def test_create_recurring_transaction(self, async_client, auth_headers):
        account = await self._create_account(async_client, auth_headers, "Recurring Account 1")
        category = await self._create_category(async_client, auth_headers, "Sub Category 1")

        resp = await async_client.post(
            "/api/v1/recurring",
            json={
                "account_id": account["id"],
                "category_id": category["id"],
                "amount": "1200.00",
                "currency": "USD",
                "transaction_type": "expense",
                "frequency": "monthly",
                "start_date": "2026-02-01T00:00:00",
                "description": "Monthly Rent",
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["amount"] == "1200.00"
        assert data["frequency"] == "monthly"
        assert data["status"] == "active"
        assert data["account_name"] == "Recurring Account 1"

    async def test_create_recurring_missing_auth(self, async_client):
        resp = await async_client.post("/api/v1/recurring", json={})
        assert resp.status_code == 401

    async def test_list_and_filter_recurring(self, async_client, auth_headers):
        account = await self._create_account(async_client, auth_headers, "Recurring Account 2")
        await async_client.post(
            "/api/v1/recurring",
            json={
                "account_id": account["id"],
                "amount": "50.00",
                "currency": "USD",
                "transaction_type": "expense",
                "frequency": "weekly",
                "start_date": "2026-02-01T00:00:00",
            },
            headers=auth_headers,
        )
        resp = await async_client.get(f"/api/v1/recurring?account_id={account['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_pause_resume_update_and_delete(self, async_client, auth_headers):
        account = await self._create_account(async_client, auth_headers, "Recurring Account 3")
        create_resp = await async_client.post(
            "/api/v1/recurring",
            json={
                "account_id": account["id"],
                "amount": "40.00",
                "currency": "USD",
                "transaction_type": "expense",
                "frequency": "daily",
                "start_date": "2026-02-01T00:00:00",
            },
            headers=auth_headers,
        )
        recurring_id = create_resp.json()["id"]

        # Pause
        pause_resp = await async_client.post(f"/api/v1/recurring/{recurring_id}/pause", headers=auth_headers)
        assert pause_resp.status_code == 200
        assert pause_resp.json()["status"] == "paused"

        # Resume
        resume_resp = await async_client.post(f"/api/v1/recurring/{recurring_id}/resume", headers=auth_headers)
        assert resume_resp.status_code == 200
        assert resume_resp.json()["status"] == "active"

        # Update
        patch_resp = await async_client.patch(
            f"/api/v1/recurring/{recurring_id}",
            json={"amount": "45.00"},
            headers=auth_headers,
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["amount"] == "45.00"

        # Delete
        del_resp = await async_client.delete(f"/api/v1/recurring/{recurring_id}", headers=auth_headers)
        assert del_resp.status_code == 204

        # Verify gone
        get_resp = await async_client.get(f"/api/v1/recurring/{recurring_id}", headers=auth_headers)
        assert get_resp.status_code == 404

    async def test_record_occurrence_idempotent(self, async_client, auth_headers):
        account = await self._create_account(async_client, auth_headers, "Recurring Account 4")
        create_resp = await async_client.post(
            "/api/v1/recurring",
            json={
                "account_id": account["id"],
                "amount": "100.00",
                "currency": "USD",
                "transaction_type": "expense",
                "frequency": "monthly",
                "start_date": "2026-03-01T10:00:00",
            },
            headers=auth_headers,
        )
        recurring_id = create_resp.json()["id"]

        # Record occurrence
        rec1 = await async_client.post(f"/api/v1/recurring/{recurring_id}/record", json={}, headers=auth_headers)
        assert rec1.status_code == 200
        rec1_data = rec1.json()
        assert rec1_data["already_recorded"] is False
        assert rec1_data["transaction"]["amount"] == "100.00"

        # Verify transaction now exists in /transactions
        txn_id = rec1_data["transaction"]["id"]
        txn_resp = await async_client.get(f"/api/v1/transactions/{txn_id}", headers=auth_headers)
        assert txn_resp.status_code == 200

        # Record again with the same occurrence_date -> idempotent, already_recorded=True
        rec2 = await async_client.post(
            f"/api/v1/recurring/{recurring_id}/record",
            json={"occurrence_date": "2026-03-01T10:00:00"},
            headers=auth_headers,
        )
        assert rec2.status_code == 200
        rec2_data = rec2.json()
        assert rec2_data["already_recorded"] is True
        assert rec2_data["transaction"]["id"] == txn_id

    async def test_recurring_isolation(self, async_client, auth_headers, other_auth_headers):
        account = await self._create_account(async_client, auth_headers, "Recurring Account 5")
        create_resp = await async_client.post(
            "/api/v1/recurring",
            json={
                "account_id": account["id"],
                "amount": "60.00",
                "currency": "USD",
                "transaction_type": "expense",
                "frequency": "weekly",
                "start_date": "2026-03-01T00:00:00",
            },
            headers=auth_headers,
        )
        recurring_id = create_resp.json()["id"]

        # Other user cannot list it
        list_resp = await async_client.get("/api/v1/recurring", headers=other_auth_headers)
        assert list_resp.status_code == 200
        ids = [item["id"] for item in list_resp.json()]
        assert recurring_id not in ids

        # Other user cannot get, pause, resume, delete, or record
        assert (await async_client.get(f"/api/v1/recurring/{recurring_id}", headers=other_auth_headers)).status_code == 404
        assert (await async_client.post(f"/api/v1/recurring/{recurring_id}/pause", headers=other_auth_headers)).status_code == 404
        assert (await async_client.post(f"/api/v1/recurring/{recurring_id}/record", json={}, headers=other_auth_headers)).status_code == 400
        assert (await async_client.delete(f"/api/v1/recurring/{recurring_id}", headers=other_auth_headers)).status_code == 404