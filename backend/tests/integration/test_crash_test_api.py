import pytest
from httpx import AsyncClient
from decimal import Decimal
from app.db.models import User, Account, AccountType, Category, CategoryType, Transaction, TransactionType, TransactionStatus
from app.core.security import create_access_token


@pytest.fixture
def auth_headers(test_user: User):
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
class TestCrashTestAPI:
    async def test_run_crash_test_endpoint(
        self, async_client: AsyncClient, test_user: User, auth_headers: dict, db_session
    ):
        # Seed an account and transaction for test_user
        account = Account(
            owner_id=str(test_user.id),
            name="Main Checking",
            account_type=AccountType.CHECKING,
            initial_balance=Decimal("75000.00"),
            currency="USD",
        )
        db_session.add(account)
        await db_session.flush()

        cat = Category(name="Salary", category_type=CategoryType.INCOME, owner_id=str(test_user.id))
        db_session.add(cat)
        await db_session.flush()

        txn = Transaction(
            owner_id=str(test_user.id),
            account_id=account.id,
            category_id=cat.id,
            amount=Decimal("120000.00"),
            transaction_type=TransactionType.INCOME,
            status=TransactionStatus.COMPLETED,
            description="Monthly Paycheck",
        )
        db_session.add(txn)
        await db_session.flush()

        # Call POST /api/v1/crash-tests/run
        response = await async_client.post(
            "/api/v1/crash-tests/run",
            json={"simulation_budget": 6, "horizon_months": 6},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert "resilience_score" in data
        assert len(data["scenarios"]) > 0
        assert len(data["investigations"]) > 0
        assert len(data["recommendations"]) > 0
        run_id = data["id"]

        # Call GET /api/v1/crash-tests/runs
        list_resp = await async_client.get("/api/v1/crash-tests/runs", headers=auth_headers)
        assert list_resp.status_code == 200
        runs = list_resp.json()
        assert len(runs) >= 1
        assert runs[0]["id"] == run_id

        # Call GET /api/v1/crash-tests/runs/{run_id}
        get_resp = await async_client.get(f"/api/v1/crash-tests/runs/{run_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        detail = get_resp.json()
        assert detail["id"] == run_id
        assert len(detail["scenarios"]) == len(data["scenarios"])

        # Test approving the first recommendation
        rec_id = data["recommendations"][0]["id"]
        assert rec_id is not None
        dec_resp = await async_client.post(
            f"/api/v1/crash-tests/runs/{run_id}/recommendations/{rec_id}/decision",
            json={"decision": "accepted", "modification_notes": "User approved implementation."},
            headers=auth_headers,
        )
        assert dec_resp.status_code == 200
        assert dec_resp.json()["status"] == "success"
        assert dec_resp.json()["decision"] == "accepted"

    async def test_crash_test_benchmarks_endpoint(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        response = await async_client.get("/api/v1/crash-tests/benchmarks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["synthetic_profiles_tested"] == 3
        assert data["agentic_failures_discovered"] >= data["baseline_failures_discovered"]
        assert data["duplicate_scenario_rate_percent"] == 0.0
        assert data["recovery_plan_feasibility_rate_percent"] == 100.0
        assert "Agentic Crash-Test search discovered" in data["execution_summary"]

    async def test_cross_user_isolation(
        self, async_client: AsyncClient, test_user: User, auth_headers: dict, db_session
    ):
        # Create a run under test_user
        res = await async_client.post(
            "/api/v1/crash-tests/run",
            json={"simulation_budget": 4},
            headers=auth_headers,
        )
        run_id = res.json()["id"]

        # Create a second real user in database
        other_user = User(
            email="other_isolated@example.com",
            hashed_password="hashed_pwd",
            full_name="Other User",
        )
        db_session.add(other_user)
        await db_session.flush()

        other_token = create_access_token({"sub": str(other_user.id)})
        other_headers = {"Authorization": f"Bearer {other_token}"}

        # User 2 should get 404 when trying to fetch test_user's run
        other_resp = await async_client.get(f"/api/v1/crash-tests/runs/{run_id}", headers=other_headers)
        assert other_resp.status_code == 404
