from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.ai.service import (
    AIService,
    FinancialExplanationRequest,
    FinancialExplanationResponse,
    SpendingAssistantRequest,
    SpendingAssistantResponse,
    TransactionClassificationRequest,
    TransactionClassificationResponse,
    GoalSimulationRequest,
    GoalSimulationResponse,
)
from app.features.ai.chat_service import (
    FinancialChatService,
    AIChatRequest,
    AIChatResponse,
    PublicAIChatRequest,
    PublicAIChatResponse,
    ConversationSummary,
    ConversationDetail,
    get_public_guidance,
)
from app.features.entitlements.service import EntitlementService

router = APIRouter(prefix="/ai", tags=["ai"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None


@router.post("/public-chat", response_model=PublicAIChatResponse, status_code=status.HTTP_200_OK)
async def public_visitor_chat(request: PublicAIChatRequest):
    """Public guide endpoint for unauthenticated landing page visitors across 18 languages."""
    return await get_public_guidance(request.message, request.language)


@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_financial_agent(
    request: AIChatRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    chat_service = FinancialChatService(db, str(current_user_id))
    return await chat_service.send_chat_message(request)


@router.get("/conversations", response_model=List[ConversationSummary], status_code=status.HTTP_200_OK)
async def list_ai_conversations(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    chat_service = FinancialChatService(db, str(current_user_id))
    return await chat_service.list_conversations()


@router.post("/conversations", response_model=ConversationSummary, status_code=status.HTTP_201_CREATED)
async def create_ai_conversation(
    request: CreateConversationRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    chat_service = FinancialChatService(db, str(current_user_id))
    return await chat_service.create_conversation(title=request.title)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail, status_code=status.HTTP_200_OK)
async def get_ai_conversation(
    conversation_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    chat_service = FinancialChatService(db, str(current_user_id))
    detail = await chat_service.get_conversation(conversation_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )
    return detail


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_ai_conversation(
    conversation_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    chat_service = FinancialChatService(db, str(current_user_id))
    deleted = await chat_service.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )
    return {"status": "success", "message": "Conversation deleted."}


@router.post("/explain", response_model=FinancialExplanationResponse, status_code=status.HTTP_200_OK)
async def explain_finances(
    request: FinancialExplanationRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    ai_service = AIService(db)
    return await ai_service.explain_finances(str(current_user_id), request)


@router.post("/assistant", response_model=SpendingAssistantResponse, status_code=status.HTTP_200_OK)
async def ask_spending_assistant(
    request: SpendingAssistantRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    ai_service = AIService(db)
    return await ai_service.ask_spending_assistant(str(current_user_id), request)


@router.post("/classify", response_model=TransactionClassificationResponse, status_code=status.HTTP_200_OK)
async def classify_transaction(
    request: TransactionClassificationRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    ai_service = AIService(db)
    return await ai_service.classify_transaction(str(current_user_id), request)


@router.post("/goals/simulate", response_model=GoalSimulationResponse, status_code=status.HTTP_200_OK)
async def simulate_goal(
    request: GoalSimulationRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    ai_service = AIService(db)
    return await ai_service.simulate_goal_scenario(str(current_user_id), request)


@router.get("/entitlements", status_code=status.HTTP_200_OK)
async def get_entitlements(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    entitlements = EntitlementService(db)
    return await entitlements.get_ai_quota_status(str(current_user_id))

