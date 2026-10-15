from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import DatabaseSession, CurrentUserId
from app.features.crash_test.service import CrashTestService
from app.features.crash_test.schemas import (
    CrashTestRunRequest,
    CrashTestRunResponse,
    RecommendationDecisionRequest,
    CrashTestEvaluationBenchmark,
)

router = APIRouter(prefix="/crash-tests", tags=["crash-tests"])


@router.post("/run", response_model=CrashTestRunResponse, status_code=status.HTTP_200_OK)
async def run_crash_test(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
    request: Optional[CrashTestRunRequest] = None,
):
    """Execute autonomous agentic crash-testing, shock discovery, and recovery verification."""
    req = request or CrashTestRunRequest()
    service = CrashTestService(db, str(current_user_id))
    return await service.execute_crash_test_run(req)


@router.get("/runs", response_model=List[dict], status_code=status.HTTP_200_OK)
async def list_crash_test_runs(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
    limit: int = Query(10, ge=1, le=50),
):
    """List historical crash-test run summaries."""
    service = CrashTestService(db, str(current_user_id))
    return await service.list_runs(limit=limit)


@router.get("/runs/{run_id}", response_model=CrashTestRunResponse, status_code=status.HTTP_200_OK)
async def get_crash_test_run(
    run_id: str,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    """Retrieve details for a specific crash-test run."""
    service = CrashTestService(db, str(current_user_id))
    result = await service.get_run(run_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crash-test run '{run_id}' not found.",
        )
    return result


@router.post(
    "/runs/{run_id}/recommendations/{recommendation_id}/decision",
    status_code=status.HTTP_200_OK,
)
async def record_recommendation_decision(
    run_id: str,
    recommendation_id: int,
    decision_req: RecommendationDecisionRequest,
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    """Record user acceptance, dismissal, or modification of a verified recovery plan."""
    service = CrashTestService(db, str(current_user_id))
    try:
        return await service.record_decision(run_id, recommendation_id, decision_req)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/benchmarks", response_model=CrashTestEvaluationBenchmark, status_code=status.HTTP_200_OK)
async def get_crash_test_benchmarks(
    db: DatabaseSession,
    current_user_id: CurrentUserId,
):
    """Run reproducible benchmark comparing agentic scenario search against fixed baseline."""
    service = CrashTestService(db, str(current_user_id))
    return await service.run_evaluation_benchmarks()
