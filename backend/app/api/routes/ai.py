from fastapi import APIRouter, Depends, status
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
from app.features.entitlements.service import EntitlementService

router = APIRouter(prefix="/ai", tags=["ai"])


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
