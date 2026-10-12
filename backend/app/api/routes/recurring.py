from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.recurring.service import RecurringService
from app.db.models import RecurrenceStatus
from app.shared.schemas import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionResponse,
    RecurringRecordOccurrenceRequest,
    RecurringRecordOccurrenceResponse,
)

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.post("", response_model=RecurringTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    data: RecurringTransactionCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    try:
        return await service.create(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=List[RecurringTransactionResponse])
async def list_recurring(
    db: DatabaseSession,
    user_id: CurrentUserId,
    status: Optional[RecurrenceStatus] = Query(None),
    account_id: Optional[int] = Query(None, gt=0),
):
    service = RecurringService(db, str(user_id))
    return await service.list(status=status, account_id=account_id)


@router.get("/{recurring_id}", response_model=RecurringTransactionResponse)
async def get_recurring(
    recurring_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    item = await service.get_by_id(recurring_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    return item


@router.patch("/{recurring_id}", response_model=RecurringTransactionResponse)
async def update_recurring(
    recurring_id: int,
    data: RecurringTransactionUpdate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    try:
        item = await service.update(recurring_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    return item


@router.post("/{recurring_id}/pause", response_model=RecurringTransactionResponse)
async def pause_recurring(
    recurring_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    item = await service.pause(recurring_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    return item


@router.post("/{recurring_id}/resume", response_model=RecurringTransactionResponse)
async def resume_recurring(
    recurring_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    item = await service.resume(recurring_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
    return item


@router.post("/{recurring_id}/record", response_model=RecurringRecordOccurrenceResponse)
async def record_occurrence(
    recurring_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
    data: Optional[RecurringRecordOccurrenceRequest] = None,
):
    service = RecurringService(db, str(user_id))
    occ_date = data.occurrence_date if data else None
    try:
        return await service.record_occurrence(recurring_id, occurrence_date=occ_date)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    recurring_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = RecurringService(db, str(user_id))
    deleted = await service.delete(recurring_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")
