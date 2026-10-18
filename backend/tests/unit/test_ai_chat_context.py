"""Regression tests for verified financial context integration in FinancialChatService.

Verifies:
- Test A: Spending context retrieval and injection into provider request
- Test B: Budget context retrieval and injection
- Test C: Upcoming bills context retrieval and injection
- Test D: Purchase affordability argument extraction and safe skipping
- Test E: Savings scenario argument extraction and safe skipping
- Test F: Irrelevant greetings and general questions do not trigger tools
- Test G: Multiple relevant categories without duplicate execution
- Test H: Tool failure resilience without fabricated values
- Test I: Authenticated user data isolation
- Test J: Preservation of original provider tool-calling loop
- Test K: Unconfigured provider fallback and truthful metadata
- Test L: Clean conversation history persistence without context duplication
"""

import pytest
from decimal import Decimal
from datetime import datetime, date
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import (
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
    AIMessage,
)
from app.features.ai.chat_service import FinancialChatService, AIChatRequest
from app.features.ai.provider import BaseAIProvider, OpenAIProvider, AIProviderResult
from app.features.ai.tools import FinancialToolRegistry


class MockProvider(BaseAIProvider):
    """Test AI provider that records the exact messages and kwargs passed to it."""
    def __init__(self, response_text: str = "Verified financial response based on ledger."):
        self.response_text = response_text
        self.call_history = []

    async def run_chat(
        self,
        messages,
        user_id,
        db,
        language="en",
    ) -> AIProviderResult:
        self.call_history.append({
            "messages": messages,
            "user_id": user_id,
            "language": language,
        })
        return AIProviderResult(
            content=self.response_text,
            is_live_ai=True,
            model_used="gpt-4o-mini-mock",
            tool_calls_executed=[],
            structured_data=None,
            prompt_tokens=100,
            completion_tokens=25,
            total_tokens=125,
            duration_ms=50,
        )



@pytest.mark.asyncio
class TestFinancialChatContextIntegration:

    async def _setup_user_finances(self, db_session: AsyncSession, uid: str):
        """Helper to create accounts, transactions, budgets, and bills for a user."""
        today = date.today()
        # Checking account
        acc = Account(
            owner_id=uid,
            name="Primary Checking",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("50000.00"),
        )
        db_session.add(acc)
        await db_session.flush()

        # Categories
        cat_food = Category(name="Food & Dining", category_type=CategoryType.EXPENSE, owner_id=uid)
        cat_bills = Category(name="Utilities", category_type=CategoryType.EXPENSE, owner_id=uid)
        db_session.add_all([cat_food, cat_bills])
        await db_session.flush()

        # Transactions
        t1 = Transaction(
            owner_id=uid,
            account_id=acc.id,
            category_id=cat_food.id,
            amount=Decimal("12000.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            status=TransactionStatus.COMPLETED,
            transaction_date=datetime(today.year, today.month, 5, 12, 0),
            description="Grocery & Dining Run",
        )
        db_session.add(t1)

        # Budget
        b1 = Budget(
            owner_id=uid,
            category_id=cat_food.id,
            allocated_amount=Decimal("20000.00"),
            budget_year=today.year,
            budget_month=today.month,
        )
        db_session.add(b1)

        # Recurring bill
        r1 = RecurringTransaction(
            owner_id=uid,
            account_id=acc.id,
            category_id=cat_bills.id,
            description="Broadband Internet Bill",
            amount=Decimal("1500.00"),
            currency="INR",
            transaction_type=TransactionType.EXPENSE,
            frequency=RecurrenceFrequency.MONTHLY,
            status=RecurrenceStatus.ACTIVE,
            start_date=today,
            next_occurrence=datetime(today.year, today.month, 28, 10, 0),
        )
        db_session.add(r1)
        await db_session.flush()
        return acc, cat_food, cat_bills

    # ------------------------------------------------------------------
    # Test A: Spending context
    # ------------------------------------------------------------------
    async def test_a_spending_context_retrieval(self, db_session: AsyncSession, owner_id: str):
        """Assert spending question selects financial summary and injects verified data into provider request."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        req = AIChatRequest(message="How much did I spend this month?")
        resp = await service.send_chat_message(req)

        assert len(mock_provider.call_history) == 1
        provider_call = mock_provider.call_history[0]
        passed_messages = provider_call["messages"]
        last_msg = passed_messages[-1]

        # Verified context section present
        assert "VERIFIED FINANCIAL CONTEXT" in last_msg["content"]
        assert "Tool: get_financial_summary" in last_msg["content"]
        assert "12000.00" in last_msg["content"]
        assert "How much did I spend this month?" in last_msg["content"]
        assert resp.is_live_ai is True
        assert any(t["tool"] == "get_financial_summary" for t in resp.tools_executed)

    # ------------------------------------------------------------------
    # Test B: Budget context
    # ------------------------------------------------------------------
    async def test_b_budget_context_retrieval(self, db_session: AsyncSession, owner_id: str):
        """Assert budget question selects budget tool and passes result to provider."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        req = AIChatRequest(message="Am I over budget?")
        resp = await service.send_chat_message(req)

        last_msg = mock_provider.call_history[0]["messages"][-1]
        assert "Tool: get_budget_status" in last_msg["content"]
        assert "20000.00" in last_msg["content"]
        assert any(t["tool"] == "get_budget_status" for t in resp.tools_executed)

    # ------------------------------------------------------------------
    # Test C: Upcoming bills context
    # ------------------------------------------------------------------
    async def test_c_upcoming_bills_context_retrieval(self, db_session: AsyncSession, owner_id: str):
        """Assert question about upcoming bills selects bill tool and supplies returned data."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        req = AIChatRequest(message="What bills are coming up?")
        resp = await service.send_chat_message(req)

        last_msg = mock_provider.call_history[0]["messages"][-1]
        assert "Tool: get_upcoming_bills" in last_msg["content"]
        assert "Broadband Internet Bill" in last_msg["content"]
        assert "1500.00" in last_msg["content"]
        assert any(t["tool"] == "get_upcoming_bills" for t in resp.tools_executed)

    # ------------------------------------------------------------------
    # Test D: Affordability
    # ------------------------------------------------------------------
    async def test_d_affordability_with_and_without_amount(self, db_session: AsyncSession, owner_id: str):
        """Assert purchase affordability tool is invoked only when purchase amount can be safely obtained."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        # 1. With explicit valid amount: ₹15,000
        req_with_amt = AIChatRequest(message="Can I afford a ₹15,000 purchase?")
        await service.send_chat_message(req_with_amt)

        last_msg = mock_provider.call_history[0]["messages"][-1]
        assert "Tool: calculate_purchase_affordability" in last_msg["content"]
        assert "15000.0" in last_msg["content"]

        # 2. Without amount: "Can I afford a new car?" -> do not fabricate missing arguments
        mock_provider.call_history.clear()
        req_without_amt = AIChatRequest(message="Can I afford a new car?")
        await service.send_chat_message(req_without_amt)

        last_msg_no_amt = mock_provider.call_history[0]["messages"][-1]
        assert "calculate_purchase_affordability" not in last_msg_no_amt["content"]

    # ------------------------------------------------------------------
    # Test E: Savings scenario
    # ------------------------------------------------------------------
    async def test_e_savings_scenario_argument_handling(self, db_session: AsyncSession, owner_id: str):
        """Assert savings scenario is selected only when required inputs (target or reduction %) are available."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        # 1. With explicit target: "Can I save ₹5,000 each month?"
        req_with_target = AIChatRequest(message="Can I save ₹5,000 each month?")
        await service.send_chat_message(req_with_target)

        last_msg = mock_provider.call_history[0]["messages"][-1]
        assert "Tool: calculate_savings_scenario" in last_msg["content"]
        assert "5000.0" in last_msg["content"]

        # 2. With reduction percentage: "What if I cut dining by 20%?"
        mock_provider.call_history.clear()
        req_with_pct = AIChatRequest(message="What if I cut dining by 20%?")
        await service.send_chat_message(req_with_pct)

        last_msg_pct = mock_provider.call_history[0]["messages"][-1]
        assert "Tool: calculate_savings_scenario" in last_msg_pct["content"]
        assert "20.0" in last_msg_pct["content"]

        # 3. Without required inputs: "How much should I save each month?"
        mock_provider.call_history.clear()
        req_vague = AIChatRequest(message="How much should I save each month?")
        await service.send_chat_message(req_vague)

        last_msg_vague = mock_provider.call_history[0]["messages"][-1]
        assert "calculate_savings_scenario" not in last_msg_vague["content"]

    # ------------------------------------------------------------------
    # Test F: Irrelevant questions
    # ------------------------------------------------------------------
    async def test_f_irrelevant_questions_do_not_trigger_tools(self, db_session: AsyncSession, owner_id: str):
        """Assert greetings and general definitions do not trigger financial tool execution."""
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        # Greeting
        resp_greeting = await service.send_chat_message(AIChatRequest(message="Hi, how are you?"))
        assert len(resp_greeting.tools_executed) == 0
        assert "VERIFIED FINANCIAL CONTEXT" not in mock_provider.call_history[0]["messages"][-1]["content"]

        # General definition without personal ledger context
        mock_provider.call_history.clear()
        resp_def = await service.send_chat_message(AIChatRequest(message="Explain what a budget is."))
        assert len(resp_def.tools_executed) == 0
        assert "VERIFIED FINANCIAL CONTEXT" not in mock_provider.call_history[0]["messages"][-1]["content"]

    # ------------------------------------------------------------------
    # Test G: Multiple relevant categories
    # ------------------------------------------------------------------
    async def test_g_multiple_relevant_categories(self, db_session: AsyncSession, owner_id: str):
        """Assert a multi-intent question retrieves both tools without duplicate execution."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        req = AIChatRequest(message="How much did I spend this month and what bills are coming up?")
        resp = await service.send_chat_message(req)

        last_msg = mock_provider.call_history[0]["messages"][-1]["content"]
        assert "Tool: get_financial_summary" in last_msg
        assert "Tool: get_upcoming_bills" in last_msg

        # Verify each tool was executed exactly once
        executed_names = [t["tool"] for t in resp.tools_executed]
        assert executed_names.count("get_financial_summary") == 1
        assert executed_names.count("get_upcoming_bills") == 1

    # ------------------------------------------------------------------
    # Test H: Tool failure resilience
    # ------------------------------------------------------------------
    async def test_h_tool_failure_does_not_fabricate_or_crash(self, db_session: AsyncSession, owner_id: str):
        """Assert that if a tool fails, the service handles it gracefully without fabricating values."""
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        with patch.object(FinancialToolRegistry, "execute_tool", side_effect=RuntimeError("Database lock failure")):
            resp = await service.send_chat_message(AIChatRequest(message="How much did I spend this month?"))

            assert resp.is_live_ai is True
            last_msg = mock_provider.call_history[0]["messages"][-1]["content"]
            assert "Limitation / Notice" in last_msg
            assert "Database lock failure" in last_msg
            assert "do not invent a financial result" in last_msg

    # ------------------------------------------------------------------
    # Test I: Authenticated user isolation
    # ------------------------------------------------------------------
    async def test_i_authenticated_user_isolation(self, db_session: AsyncSession):
        """Assert tool registry is executed strictly with authenticated user's identity."""
        user_alpha = "user-alpha-999"
        user_beta = "user-beta-888"

        # User Alpha has 75,000 balance
        acc_alpha = Account(
            owner_id=user_alpha,
            name="Alpha Bank",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("75000.00"),
        )
        # User Beta has 2,500 balance
        acc_beta = Account(
            owner_id=user_beta,
            name="Beta Bank",
            account_type=AccountType.CHECKING,
            currency="INR",
            initial_balance=Decimal("2500.00"),
        )
        db_session.add_all([acc_alpha, acc_beta])
        await db_session.flush()

        # Query as User Beta
        mock_provider_beta = MockProvider()
        service_beta = FinancialChatService(db_session, user_beta, provider=mock_provider_beta)
        await service_beta.send_chat_message(AIChatRequest(message="How much is in my account?"))

        last_msg_beta = mock_provider_beta.call_history[0]["messages"][-1]["content"]
        assert "2500.00" in last_msg_beta
        assert "75000.00" not in last_msg_beta

    # ------------------------------------------------------------------
    # Test J: Existing provider tool calling loop
    # ------------------------------------------------------------------
    async def test_j_provider_tool_calling_loop_remains_functional(self, db_session: AsyncSession, owner_id: str):
        """Assert provider's tool-calling loop executes when the model requests tools."""
        await self._setup_user_finances(db_session, owner_id)
        provider = OpenAIProvider(api_key="sk-mock-valid-key")

        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_xyz123"
        mock_tool_call.function.name = "get_financial_summary"
        mock_tool_call.function.arguments = "{}"

        mock_choice_1 = MagicMock()
        mock_choice_1.message.tool_calls = [mock_tool_call]
        mock_choice_1.message.model_dump.return_value = {"role": "assistant", "content": None}

        mock_choice_2 = MagicMock()
        mock_choice_2.message.tool_calls = None
        mock_choice_2.message.content = "Based on your verified ledger, you have ₹50,000.00 liquid cash."

        resp_1 = MagicMock(choices=[mock_choice_1], usage=MagicMock(prompt_tokens=50, completion_tokens=10))
        resp_2 = MagicMock(choices=[mock_choice_2], usage=MagicMock(prompt_tokens=100, completion_tokens=20))

        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = [resp_1, resp_2]
        mock_openai_module = MagicMock()
        mock_openai_module.AsyncOpenAI.return_value = mock_client

        with patch.dict("sys.modules", {"openai": mock_openai_module}):
            service = FinancialChatService(db_session, owner_id, provider=provider)
            res = await service.send_chat_message(AIChatRequest(message="What is my financial status?"))

            assert res.is_live_ai is True
            assert "₹50,000.00" in res.message
            assert any(t["tool"] == "get_financial_summary" for t in res.tools_executed)

    # ------------------------------------------------------------------
    # Test K: Fallback metadata
    # ------------------------------------------------------------------
    async def test_k_unconfigured_fallback_truthful_metadata(self, db_session: AsyncSession, owner_id: str):
        """Assert unconfigured provider fallback remains truthful (is_live_ai=False, model_used=unconfigured)."""
        await self._setup_user_finances(db_session, owner_id)
        unconfigured_provider = OpenAIProvider(api_key=None)
        service = FinancialChatService(db_session, owner_id, provider=unconfigured_provider)

        resp = await service.send_chat_message(AIChatRequest(message="How much did I spend this month?"))

        assert resp.is_live_ai is False
        assert resp.model_used == "unconfigured"
        assert resp.error_code == "unconfigured_api_key"
        assert "not currently configured with an OpenAI API key" in resp.message

    # ------------------------------------------------------------------
    # Test L: History integrity
    # ------------------------------------------------------------------
    async def test_l_history_integrity_no_context_pollution(self, db_session: AsyncSession, owner_id: str):
        """Assert that injected context is not persisted as repeated user messages in database history."""
        await self._setup_user_finances(db_session, owner_id)
        mock_provider = MockProvider()
        service = FinancialChatService(db_session, owner_id, provider=mock_provider)

        # 1st turn
        resp1 = await service.send_chat_message(AIChatRequest(message="How much did I spend this month?"))
        conv_id = resp1.conversation_id

        # Check DB messages
        stmt = select(AIMessage).where(AIMessage.conversation_id == conv_id).order_by(AIMessage.id)
        res = await db_session.execute(stmt)
        msgs = res.scalars().all()

        assert len(msgs) == 2
        user_msg = msgs[0]
        assistant_msg = msgs[1]

        # In DB, user_msg.content MUST be clean, without injected context
        assert user_msg.content == "How much did I spend this month?"
        assert "VERIFIED FINANCIAL CONTEXT" not in user_msg.content

        # 2nd turn
        await service.send_chat_message(AIChatRequest(
            conversation_id=conv_id,
            message="Can you explain that?",
        ))

        # Inspect messages sent to provider in 2nd turn
        second_call = mock_provider.call_history[1]
        second_call_messages = second_call["messages"]

        # The 1st turn message in the provider history MUST be the clean user question, not duplicated context
        first_turn_in_history = second_call_messages[0]
        assert first_turn_in_history["role"] == "user"
        assert first_turn_in_history["content"] == "How much did I spend this month?"
        assert "VERIFIED FINANCIAL CONTEXT" not in first_turn_in_history["content"]
