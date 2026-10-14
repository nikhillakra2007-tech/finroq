import pytest
from httpx import AsyncClient
from app.db.models import User


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
