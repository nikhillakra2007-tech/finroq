import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.features.ai.service import (
    AIService,
    FinancialExplanationRequest,
    SpendingAssistantRequest,
    TransactionClassificationRequest,
    GoalSimulationRequest,
)
from app.features.ai.gemini import GeminiClient, GeminiResponse
from app.features.entitlements.service import EntitlementService, PlanTier


@pytest.mark.asyncio
class TestAIService:
    async def test_goal_simulation_math(self, db_session):
        service = AIService(db_session)
        req = GoalSimulationRequest(
            goal_name="Emergency Reserve",
            target_amount=Decimal("6000.00"),
            current_savings=Decimal("1500.00"),
            monthly_contribution=Decimal("500.00"),
        )
        res = await service.simulate_goal_scenario("1", req)
        assert res.funding_gap == "4500.00"
        assert res.projected_months_needed == 9
        assert res.feasibility_status == "Feasible"

    async def test_goal_simulation_zero_gap(self, db_session):
        service = AIService(db_session)
        req = GoalSimulationRequest(
            goal_name="Vacation",
            target_amount=Decimal("1000.00"),
            current_savings=Decimal("1000.00"),
            monthly_contribution=Decimal("100.00"),
        )
        res = await service.simulate_goal_scenario("1", req)
        assert res.funding_gap == "0.00"
        assert res.projected_months_needed == 0
        assert res.feasibility_status == "Goal Already Achieved"

    async def test_transaction_classification_heuristics(self, db_session, test_user):
        from app.features.categories.service import CategoryService
        from app.db.models import CategoryType

        from app.shared.schemas import CategoryCreate

        cat_service = CategoryService(db_session, str(test_user.id))
        await cat_service.create(
            CategoryCreate(
                name="Groceries",
                category_type=CategoryType.EXPENSE,
            )
        )

        service = AIService(db_session)
        req = TransactionClassificationRequest(description="Safeway Weekly Food Run")
        res = await service.classify_transaction(str(test_user.id), req)
        assert res.suggested_category_name == "Groceries"
        assert res.confidence >= 0.90
        assert res.is_ai_generated is False

    async def test_explain_finances_deterministic_fallback(self, db_session, test_user):
        # Client without API key
        mock_client = GeminiClient(api_key="")
        service = AIService(db_session, gemini_client=mock_client)

        req = FinancialExplanationRequest()
        res = await service.explain_finances(str(test_user.id), req)
        assert res.is_ai_generated is False
        assert "FINROQ Financial Intelligence Summary" in res.explanation
        assert res.provider_status == "unconfigured_api_key"

    async def test_explain_finances_with_mocked_gemini(self, db_session, test_user):
        mock_client = GeminiClient(api_key="valid-mock-key")
        mock_client.generate_insight = AsyncMock(
            return_value=GeminiResponse(
                content="Mocked Gemini insight: Cash flow is strongly positive.",
                is_live_ai=True,
                model_used="gemini-1.5-flash",
                provider_status="active",
            )
        )
        service = AIService(db_session, gemini_client=mock_client)

        req = FinancialExplanationRequest()
        res = await service.explain_finances(str(test_user.id), req)
        assert res.is_ai_generated is True
        assert "Mocked Gemini insight" in res.explanation
        assert res.model_used == "gemini-1.5-flash"

    async def test_spending_assistant_injection_sanitization(self, db_session, test_user):
        service = AIService(db_session)
        req = SpendingAssistantRequest(question="Where did I spend the most??? DROP TABLE users;--")
        res = await service.ask_spending_assistant(str(test_user.id), req)
        assert res.answer is not None
        # Does not fail, processes cleanly without running malicious directives


@pytest.mark.asyncio
class TestEntitlements:
    async def test_entitlement_tier_and_quota(self, db_session, test_user):
        entitlements = EntitlementService(db_session)
        EntitlementService.reset_usage_for_testing()

        tier = await entitlements.get_user_tier(str(test_user.id))
        assert tier == PlanTier.FREE

        limits = await entitlements.get_user_limits(str(test_user.id))
        assert limits.monthly_ai_queries > 0

        # Consume quota until limit is reached
        for i in range(limits.monthly_ai_queries):
            status = await entitlements.check_and_consume_ai_quota(str(test_user.id))
            assert status["queries_used"] == i + 1

        # Next consumption must raise 403 Forbidden
        with pytest.raises(HTTPException) as exc_info:
            await entitlements.check_and_consume_ai_quota(str(test_user.id))
        assert exc_info.value.status_code == 403
        assert "Monthly AI query quota" in exc_info.value.detail
