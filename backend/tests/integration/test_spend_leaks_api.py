import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from httpx import AsyncClient
from app.db.models import Account, AccountType, Transaction, TransactionType, TransactionStatus


@pytest.mark.asyncio
class TestSpendLeaksAPI:
    async def test_get_readiness_authenticated(self, async_client: AsyncClient, auth_headers):
        response = await async_client.get("/api/v1/spend-leaks/readiness", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "readiness_tier" in data
        assert "available_history_days" in data
        assert "accounts_included" in data

    async def test_get_readiness_unauthenticated(self, async_client: AsyncClient):
        response = await async_client.get("/api/v1/spend-leaks/readiness")
        assert response.status_code == 401

    async def test_get_insights_and_refresh(self, async_client: AsyncClient, auth_headers):
        # Create an account
        acc_resp = await async_client.post(
            "/api/v1/accounts",
            json={"name": "Leaks Checking", "account_type": "checking", "currency": "INR", "initial_balance": "50000.00"},
            headers=auth_headers,
        )
        assert acc_resp.status_code == 201
        acc_id = acc_resp.json()["id"]

        # Call insights
        resp = await async_client.get("/api/v1/spend-leaks/insights", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "insights" in data
        assert "total_monthly_leak" in data
        assert "summary_stats" in data

        # Call refresh
        ref_resp = await async_client.post("/api/v1/spend-leaks/refresh", headers=auth_headers)
        assert ref_resp.status_code == 200
        assert "insights" in ref_resp.json()

    async def test_update_finding_lifecycle_status(self, async_client: AsyncClient, auth_headers):
        finding_id = "test-finding-key-101"

        # Update status to keep
        update_resp = await async_client.post(
            f"/api/v1/spend-leaks/findings/{finding_id}/status",
            json={"status": "keep", "user_notes": "Essential expense verified by user"},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        res_data = update_resp.json()
        assert res_data["finding_key"] == finding_id
        assert res_data["status"] == "keep"
        assert res_data["user_notes"] == "Essential expense verified by user"

        # Update status to dismissed
        update_resp2 = await async_client.post(
            f"/api/v1/spend-leaks/findings/{finding_id}/status",
            json={"status": "dismissed", "user_notes": "Not a leak"},
            headers=auth_headers,
        )
        assert update_resp2.status_code == 200
        assert update_resp2.json()["status"] == "dismissed"
