import pytest
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    User,
    Account,
    AccountType,
    Category,
    CategoryType,
    Transaction,
    TransactionType,
    TransactionStatus,
    Budget,
    RecurringTransaction,
    RecurrenceFrequency,
    RecurrenceStatus,
)
from app.features.ai.provider import AIProviderResult, OpenAIProvider


@pytest.mark.asyncio
class TestAIChatAPI:
    async def test_chat_requires_auth(self, async_client: AsyncClient):
        response = await async_client.post("/api/v1/ai/chat", json={"message": "Hello"})
        assert response.status_code == 401

    async def test_conversations_require_auth(self, async_client: AsyncClient):
        response = await async_client.get("/api/v1/ai/conversations")
        assert response.status_code == 401

    async def test_create_and_list_conversations(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        # Create conversation
        res = await async_client.post(
            "/api/v1/ai/conversations",
            json={"title": "October Spending Review"},
            headers=auth_headers,
        )
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "October Spending Review"
        conv_id = data["id"]

        # List conversations
        list_res = await async_client.get("/api/v1/ai/conversations", headers=auth_headers)
        assert list_res.status_code == 200
        conv_list = list_res.json()
        assert any(c["id"] == conv_id for c in conv_list)

        # Get conversation detail
        get_res = await async_client.get(
            f"/api/v1/ai/conversations/{conv_id}", headers=auth_headers
        )
        assert get_res.status_code == 200
        detail = get_res.json()
        assert detail["id"] == conv_id
        assert detail["title"] == "October Spending Review"
        assert len(detail["messages"]) == 0

    async def test_cross_user_conversation_isolation(
        self,
        async_client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
    ):
        # User 1 creates conversation
        res = await async_client.post(
            "/api/v1/ai/conversations",
            json={"title": "User 1 Private Notes"},
            headers=auth_headers,
        )
        conv_id = res.json()["id"]

        # User 2 tries to GET User 1's conversation -> 404
        forbidden_get = await async_client.get(
            f"/api/v1/ai/conversations/{conv_id}", headers=other_auth_headers
        )
        assert forbidden_get.status_code == 404

        # User 2 tries to DELETE User 1's conversation -> 404
        forbidden_del = await async_client.delete(
            f"/api/v1/ai/conversations/{conv_id}", headers=other_auth_headers
        )
        assert forbidden_del.status_code == 404

        # Confirm User 1 can still access and delete it
        del_res = await async_client.delete(
            f"/api/v1/ai/conversations/{conv_id}", headers=auth_headers
        )
        assert del_res.status_code == 200

    async def test_send_chat_message_flow(
        self, async_client: AsyncClient, auth_headers: dict
    ):
        # When unconfigured, it returns a controlled error state without crashing
        res = await async_client.post(
            "/api/v1/ai/chat",
            json={"message": "Analyze my spending this month"},
            headers=auth_headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert "conversation_id" in data
        assert "message" in data
        assert data["is_live_ai"] is False  # unconfigured key in test
        assert data["error_code"] == "unconfigured_api_key"

        # Check that conversation was created and saved
        conv_id = data["conversation_id"]
        conv_res = await async_client.get(
            f"/api/v1/ai/conversations/{conv_id}", headers=auth_headers
        )
        assert conv_res.status_code == 200
        detail = conv_res.json()
        assert len(detail["messages"]) == 2  # 1 user + 1 assistant
        assert detail["messages"][0]["role"] == "user"
        assert detail["messages"][0]["content"] == "Analyze my spending this month"
        assert detail["messages"][1]["role"] == "assistant"


@pytest.mark.asyncio
class TestAIChatAPIEndToEndScenarios:
    async def _setup_finances(self, db_session: AsyncSession, user_id: str):
        today = date.today()
        acc = Account(
            owner_id=user_id,
            name="Salary Checking",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("60000.00"),
        )
        db_session.add(acc)
        await db_session.flush()

        cat_dining = Category(name="Dining Out", category_type=CategoryType.EXPENSE, owner_id=user_id)
        cat_bills = Category(name="Internet & Utilities", category_type=CategoryType.EXPENSE, owner_id=user_id)
        db_session.add_all([cat_dining, cat_bills])
        await db_session.flush()

        # Spent 15,000 this month
        t = Transaction(
            owner_id=user_id,
            account_id=acc.id,
            category_id=cat_dining.id,
            amount=Decimal("15000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime(today.year, today.month, 10, 14, 0),
            description="Weekend Dinners",
        )
        db_session.add(t)

        # Budget of 25,000
        b = Budget(
            owner_id=user_id,
            category_id=cat_dining.id,
            allocated_amount=Decimal("25000.00"),
            budget_year=today.year,
            budget_month=today.month,
        )
        db_session.add(b)

        # Recurring bill 2,000
        r = RecurringTransaction(
            owner_id=user_id,
            account_id=acc.id,
            category_id=cat_bills.id,
            description="Fiber Internet 500Mbps",
            amount=Decimal("2000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            status=RecurrenceStatus.ACTIVE,
            start_date=today,
            next_occurrence=datetime(today.year, today.month, 25, 9, 0),
        )
        db_session.add(r)
        await db_session.flush()

    async def test_scenario_a_spending_question_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        await self._setup_finances(db_session, str(test_user.id))

        mock_result = AIProviderResult(
            content="Based on your ledger, your total expenses this month are ₹15,000.00.",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
            prompt_tokens=120,
            completion_tokens=25,
            total_tokens=145,
            duration_ms=45,
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "How much did I spend this month?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert data["is_live_ai"] is True
            assert "₹15,000.00" in data["message"]
            assert any(t["tool"] == "get_financial_summary" for t in data["tools_executed"])
            assert data["structured_data"] is not None
            assert data["structured_data"]["total_expenses"] == "15000.00"

            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "VERIFIED FINANCIAL CONTEXT" in passed_messages[-1]["content"]
            assert "Tool: get_financial_summary" in passed_messages[-1]["content"]

    async def test_scenario_b_budget_question_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        await self._setup_finances(db_session, str(test_user.id))

        mock_result = AIProviderResult(
            content="You have spent ₹15,000.00 of your ₹25,000.00 budget and are within your limit.",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "Am I over budget?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert any(t["tool"] == "get_budget_status" for t in data["tools_executed"])
            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "Tool: get_budget_status" in passed_messages[-1]["content"]
            assert "25000.00" in passed_messages[-1]["content"]

    async def test_scenario_c_upcoming_bills_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        await self._setup_finances(db_session, str(test_user.id))

        mock_result = AIProviderResult(
            content="Your upcoming bill is Fiber Internet 500Mbps for ₹2,000.00.",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "What bills are coming up?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert any(t["tool"] == "get_upcoming_bills" for t in data["tools_executed"])
            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "Tool: get_upcoming_bills" in passed_messages[-1]["content"]
            assert "Fiber Internet 500Mbps" in passed_messages[-1]["content"]

    async def test_scenario_d_purchase_affordability_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        await self._setup_finances(db_session, str(test_user.id))

        mock_result = AIProviderResult(
            content="A ₹15,000 purchase is comfortably affordable.",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "Can I afford a ₹15,000 purchase?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert any(t["tool"] == "calculate_purchase_affordability" for t in data["tools_executed"])
            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "Tool: calculate_purchase_affordability" in passed_messages[-1]["content"]
            assert "15000.0" in passed_messages[-1]["content"]

            # Safe skip when unquantified
            mock_run.reset_mock()
            res_vague = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "Can I afford a new car?"},
                headers=auth_headers,
            )
            assert res_vague.status_code == 200
            passed_vague = mock_run.call_args.kwargs["messages"]
            assert "calculate_purchase_affordability" not in passed_vague[-1]["content"]

    async def test_scenario_e_savings_scenario_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        await self._setup_finances(db_session, str(test_user.id))

        mock_result = AIProviderResult(
            content="Cutting dining by 20% will save ₹3,000.00 monthly.",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "What if I cut dining by 20%?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert any(t["tool"] == "calculate_savings_scenario" for t in data["tools_executed"])
            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "Tool: calculate_savings_scenario" in passed_messages[-1]["content"]
            assert "20.0" in passed_messages[-1]["content"]

    async def test_scenario_f_unrelated_question_end_to_end(
        self, async_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        mock_result = AIProviderResult(
            content="Hello! I am your Finroq financial assistant. How can I assist you today?",
            is_live_ai=True,
            model_used="gpt-4o-mini",
            tool_calls_executed=[],
        )

        with patch.object(OpenAIProvider, "run_chat", new_callable=AsyncMock) as mock_run:
            mock_run.return_value = mock_result
            res = await async_client.post(
                "/api/v1/ai/chat",
                json={"message": "Hi, how are you?"},
                headers=auth_headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert len(data["tools_executed"]) == 0
            passed_messages = mock_run.call_args.kwargs["messages"]
            assert "VERIFIED FINANCIAL CONTEXT" not in passed_messages[-1]["content"]

