from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.summary.service import SummaryService
from app.shared.schemas import FinancialSummary


router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("", response_model=FinancialSummary)
async def get_financial_summary(
    db: DatabaseSession,
    user_id: CurrentUserId,
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
):
    service = SummaryService(db, str(user_id))
    return await service.get_summary(start_date=start_date, end_date=end_date)