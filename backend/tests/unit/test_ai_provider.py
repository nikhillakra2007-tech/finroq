import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.ai.provider import OpenAIProvider, AIProviderResult


@pytest.mark.asyncio
class TestAIProvider:
    async def test_unconfigured_api_key_returns_graceful_notice(self, db_session: AsyncSession):
        # When api_key is None or empty
        provider = OpenAIProvider(api_key=None)
        res = await provider.run_chat(
            messages=[{"role": "user", "content": "How much did I spend?"}],
            user_id="test-user",
            db=db_session,
        )

        assert res.is_live_ai is False
        assert res.error_code == "unconfigured_api_key"
        assert "not currently configured with an OpenAI API key" in res.content

    async def test_provider_direct_response_without_tools(self, db_session: AsyncSession):
        provider = OpenAIProvider(api_key="sk-mock-valid-key")

        # Mock OpenAI ChatCompletion response without tools
        mock_choice = MagicMock()
        mock_choice.message.tool_calls = None
        mock_choice.message.content = "Compound interest is the interest on savings calculated on both the initial principal and accumulated interest."
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_response.usage.prompt_tokens = 45
        mock_response.usage.completion_tokens = 25

        mock_openai_module = MagicMock()
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai_module.AsyncOpenAI.return_value = mock_client

        with patch.dict("sys.modules", {"openai": mock_openai_module}):
            res = await provider.run_chat(
                messages=[{"role": "user", "content": "What is compound interest?"}],
                user_id="test-user",
                db=db_session,
            )

            assert res.is_live_ai is True
            assert "Compound interest" in res.content
            assert len(res.tool_calls_executed) == 0
            assert res.total_tokens == 70

    async def test_provider_executes_financial_tool_call(self, db_session: AsyncSession):
        provider = OpenAIProvider(api_key="sk-mock-valid-key")

        # 1st call requests tool 'get_financial_summary'
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_abc123"
        mock_tool_call.function.name = "get_financial_summary"
        mock_tool_call.function.arguments = "{}"

        mock_choice_1 = MagicMock()
        mock_choice_1.message.tool_calls = [mock_tool_call]
        mock_choice_1.message.model_dump.return_value = {"role": "assistant", "content": None}

        mock_resp_1 = MagicMock()
        mock_resp_1.choices = [mock_choice_1]
        mock_resp_1.usage.prompt_tokens = 80
        mock_resp_1.usage.completion_tokens = 15

        # 2nd call provides final synthesis
        mock_choice_2 = MagicMock()
        mock_choice_2.message.tool_calls = None
        mock_choice_2.message.content = "Your verified net cash flow this month is ₹20,000.00."

        mock_resp_2 = MagicMock()
        mock_resp_2.choices = [mock_choice_2]
        mock_resp_2.usage.prompt_tokens = 150
        mock_resp_2.usage.completion_tokens = 30

        mock_openai_module = MagicMock()
        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = [mock_resp_1, mock_resp_2]
        mock_openai_module.AsyncOpenAI.return_value = mock_client

        with patch.dict("sys.modules", {"openai": mock_openai_module}):
            res = await provider.run_chat(
                messages=[{"role": "user", "content": "How is my cash flow?"}],
                user_id="test-user",
                db=db_session,
            )

            assert res.is_live_ai is True
            assert len(res.tool_calls_executed) == 1
            assert res.tool_calls_executed[0]["tool"] == "get_financial_summary"
            assert "₹20,000.00" in res.content

    async def test_provider_bounded_loop_terminates(self, db_session: AsyncSession):
        provider = OpenAIProvider(api_key="sk-mock-valid-key", max_iterations=2)

        # Continually requests tools
        mock_tool_call = MagicMock()
        mock_tool_call.id = "call_loop"
        mock_tool_call.function.name = "get_financial_summary"
        mock_tool_call.function.arguments = "{}"

        mock_choice = MagicMock()
        mock_choice.message.tool_calls = [mock_tool_call]
        mock_choice.message.model_dump.return_value = {"role": "assistant", "content": None}

        mock_resp = MagicMock()
        mock_resp.choices = [mock_choice]
        mock_resp.usage.prompt_tokens = 50
        mock_resp.usage.completion_tokens = 10

        mock_openai_module = MagicMock()
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_resp
        mock_openai_module.AsyncOpenAI.return_value = mock_client

        with patch.dict("sys.modules", {"openai": mock_openai_module}):
            res = await provider.run_chat(
                messages=[{"role": "user", "content": "Keep calling"}],
                user_id="test-user",
                db=db_session,
            )

            # Loop terminates at max_iterations (2)
            assert len(res.tool_calls_executed) == 2
            assert "Analysis completed based on your ledger data" in res.content
