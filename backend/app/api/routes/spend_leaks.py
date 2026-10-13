from fastapi import APIRouter, Depends, status
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.readiness.service import ReadinessService
from app.features.readiness.schemas import DataReadinessReport, SpendLeakAnalysisResponse

router = APIRouter(prefix="/spend-leaks", tags=["spend-leaks"])


@router.get("/readiness", response_model=DataReadinessReport, status_code=status.HTTP_200_OK)
async def get_spend_leak_readiness(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    service = ReadinessService(db, str(current_user_id))
    return await service.get_readiness_report()


@router.get("/insights", response_model=SpendLeakAnalysisResponse, status_code=status.HTTP_200_OK)
async def get_spend_leak_insights(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    service = ReadinessService(db, str(current_user_id))
    return await service.detect_leaks()
