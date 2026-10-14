"""Financial Chat Service for Finroq AI.

Orchestrates conversations, persists messages, validates user ownership,
records API usage telemetry, and interfaces with the AI provider.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.db.models import AIConversation, AIMessage, AIUsageLog
from app.features.ai.provider import BaseAIProvider, OpenAIProvider, AIProviderResult


# =====================================================================
# Request & Response Schemas
# =====================================================================

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The user's question or message.")
    conversation_id: Optional[str] = Field(default=None, description="Optional existing conversation ID.")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Optional client context metadata.")


class AIChatResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    conversation_id: str
    message: str
    is_live_ai: bool
    model_used: str
    structured_data: Optional[Dict[str, Any]] = None
    tools_executed: List[Dict[str, Any]] = []
    error_code: Optional[str] = None
    created_at: str


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class MessageItem(BaseModel):
    id: int
    role: str
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    created_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[MessageItem]


# =====================================================================
# Financial Chat Service Implementation
# =====================================================================

class FinancialChatService:
    def __init__(
        self,
        db: AsyncSession,
        owner_id: str,
        provider: Optional[BaseAIProvider] = None,
    ):
        self.db = db
        self.owner_id = str(owner_id)
        self.provider = provider or OpenAIProvider()

    async def list_conversations(self) -> List[ConversationSummary]:
        """List all conversations owned by the authenticated user."""
        stmt = (
            select(AIConversation)
            .where(AIConversation.owner_id == self.owner_id)
            .order_by(desc(AIConversation.updated_at))
        )
        res = await self.db.execute(stmt)
        conversations = res.scalars().all()

        summaries = []
        for conv in conversations:
            # Count messages
            msg_res = await self.db.execute(
                select(AIMessage.id).where(AIMessage.conversation_id == conv.id)
            )
            count = len(msg_res.scalars().all())
            summaries.append(
                ConversationSummary(
                    id=conv.id,
                    title=conv.title,
                    created_at=conv.created_at.isoformat(),
                    updated_at=conv.updated_at.isoformat(),
                    message_count=count,
                )
            )
        return summaries

    async def create_conversation(self, title: Optional[str] = None) -> ConversationSummary:
        """Create a new empty conversation for the user."""
        conv_id = str(uuid.uuid4())
        conv = AIConversation(
            id=conv_id,
            owner_id=self.owner_id,
            title=title or "New Conversation",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)

        return ConversationSummary(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
            message_count=0,
        )

    async def get_conversation(self, conversation_id: str) -> Optional[ConversationDetail]:
        """Retrieve a specific conversation with all its messages, verifying ownership."""
        stmt = select(AIConversation).where(
            and_(
                AIConversation.id == conversation_id,
                AIConversation.owner_id == self.owner_id,
            )
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return None

        # Fetch messages
        msg_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conv.id)
            .order_by(AIMessage.id)
        )
        msg_res = await self.db.execute(msg_stmt)
        msgs = msg_res.scalars().all()

        items = []
        for m in msgs:
            parsed_struct = None
            if m.structured_data:
                try:
                    parsed_struct = json.loads(m.structured_data)
                except Exception:
                    pass
            items.append(
                MessageItem(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    structured_data=parsed_struct,
                    created_at=m.created_at.isoformat(),
                )
            )

        return ConversationDetail(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
            messages=items,
        )

    async def delete_conversation(self, conversation_id: str) -> bool:
        """Delete conversation and its associated messages, verifying ownership."""
        stmt = select(AIConversation).where(
            and_(
                AIConversation.id == conversation_id,
                AIConversation.owner_id == self.owner_id,
            )
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            return False

        await self.db.delete(conv)
        await self.db.commit()
        return True

    async def send_chat_message(self, request: AIChatRequest) -> AIChatResponse:
        """
        Processes a user message:
        1. Validates or creates conversation.
        2. Records user message.
        3. Invokes AI provider with tool execution.
        4. Saves assistant response & structured data.
        5. Records usage telemetry.
        """
        # Validate or create conversation
        conv = None
        if request.conversation_id:
            stmt = select(AIConversation).where(
                and_(
                    AIConversation.id == request.conversation_id,
                    AIConversation.owner_id == self.owner_id,
                )
            )
            res = await self.db.execute(stmt)
            conv = res.scalar_one_or_none()

        if not conv:
            # Generate a title from the first 40 chars of question
            clean_title = request.message.strip().replace("\n", " ")[:40]
            if len(request.message.strip()) > 40:
                clean_title += "…"
            conv = AIConversation(
                id=str(uuid.uuid4()),
                owner_id=self.owner_id,
                title=clean_title or "Financial Conversation",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(conv)
            await self.db.flush()

        # Save user message
        user_msg = AIMessage(
            conversation_id=conv.id,
            role="user",
            content=request.message.strip(),
            created_at=datetime.utcnow(),
        )
        self.db.add(user_msg)
        await self.db.flush()

        # Load recent conversation history
        history_stmt = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conv.id)
            .order_by(AIMessage.id)
        )
        history_res = await self.db.execute(history_stmt)
        history_msgs = [
            {"role": m.role, "content": m.content}
            for m in history_res.scalars().all()
        ]

        # Execute provider chat
        result: AIProviderResult = await self.provider.run_chat(
            messages=history_msgs,
            user_id=self.owner_id,
            db=self.db,
        )

        # Save assistant message
        struct_json = json.dumps(result.structured_data, default=str) if result.structured_data else None
        assistant_msg = AIMessage(
            conversation_id=conv.id,
            role="assistant",
            content=result.content,
            structured_data=struct_json,
            created_at=datetime.utcnow(),
        )
        self.db.add(assistant_msg)

        # Update conversation timestamp
        conv.updated_at = datetime.utcnow()

        # Log AI Usage Telemetry
        usage = AIUsageLog(
            owner_id=self.owner_id,
            conversation_id=conv.id,
            model=result.model_used,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            total_tokens=result.total_tokens,
            tool_calls_count=len(result.tool_calls_executed),
            duration_ms=result.duration_ms,
            created_at=datetime.utcnow(),
        )
        self.db.add(usage)

        await self.db.commit()

        return AIChatResponse(
            conversation_id=conv.id,
            message=result.content,
            is_live_ai=result.is_live_ai,
            model_used=result.model_used,
            structured_data=result.structured_data,
            tools_executed=result.tool_calls_executed,
            error_code=result.error_code,
            created_at=assistant_msg.created_at.isoformat(),
        )
