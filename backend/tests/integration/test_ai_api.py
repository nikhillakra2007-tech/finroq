import pytest
from httpx import AsyncClient
from app.features.entitlements.service import EntitlementService


@pytest.mark.asyncio
class TestAIAPI:
    async def test_ai_explain_requires_auth(self, async_client: AsyncClient):
        response = await async_client.post("/api/v1/ai/explain", json={})
        assert response.status_code == 401

    async def test_ai_explain_authenticated(self, async_client: AsyncClient, auth_headers: dict):
        EntitlementService.reset_usage_for_testing()
        response = await async_client.post("/api/v1/ai/explain", json={}, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "explanation" in data
        assert "verified_income" in data
        assert "verified_expenses" in data

    async def test_ai_assistant_query(self, async_client: AsyncClient, auth_headers: dict):
        EntitlementService.reset_usage_for_testing()
        response = await async_client.post(
            "/api/v1/ai/assistant",
            json={"question": "Where did I spend the most?"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["is_ai_generated"] is False  # Deterministic detection

    async def test_ai_classify_endpoint(self, async_client: AsyncClient, auth_headers: dict):
        response = await async_client.post(
            "/api/v1/ai/classify",
            json={"description": "Uber ride home from airport", "amount": "34.50"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggested_category_name" in data
        assert "confidence" in data

    async def test_ai_goal_simulation(self, async_client: AsyncClient, auth_headers: dict):
        response = await async_client.post(
            "/api/v1/ai/goals/simulate",
            json={
                "goal_name": "Down Payment Fund",
                "target_amount": "20000.00",
                "current_savings": "5000.00",
                "monthly_contribution": "1000.00",
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["funding_gap"] == "15000.00"
        assert data["projected_months_needed"] == 15
        assert data["feasibility_status"] == "Feasible"

    async def test_ai_entitlements_endpoint(self, async_client: AsyncClient, auth_headers: dict):
        response = await async_client.get("/api/v1/ai/entitlements", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "tier" in data
        assert "queries_allowed" in data
        assert "queries_used" in data
