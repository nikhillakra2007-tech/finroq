from fastapi import APIRouter, Depends, status, HTTPException
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.readiness.service import ReadinessService
from app.features.readiness.schemas import (
    DataReadinessReport,
    SpendLeakAnalysisResponse,
    UpdateFindingStatusRequest,
    FindingLifecycleStatus,
)

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


@router.post("/refresh", response_model=SpendLeakAnalysisResponse, status_code=status.HTTP_200_OK)
async def refresh_spend_leak_detection(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    service = ReadinessService(db, str(current_user_id))
    return await service.detect_leaks()


@router.post("/findings/{finding_id}/status", status_code=status.HTTP_200_OK)
async def update_finding_status(
    finding_id: str,
    payload: UpdateFindingStatusRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    service = ReadinessService(db, str(current_user_id))
    record = await service.update_finding_status(
        finding_key=finding_id,
        status=payload.status,
        user_notes=payload.user_notes,
    )
    return {
        "finding_key": record.finding_key,
        "status": record.status,
        "user_notes": record.user_notes,
        "updated_at": record.updated_at,
    }
