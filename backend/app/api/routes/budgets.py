from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.budget.service import BudgetService
from app.shared.schemas import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
)


router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = BudgetService(db, str(user_id))
    try:
        return await service.create(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    db: DatabaseSession,
    user_id: CurrentUserId,
    year: int = Query(..., ge=1900, le=2100),
    month: int = Query(..., ge=1, le=12),
):
    service = BudgetService(db, str(user_id))
    return await service.list(year=year, month=month)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = BudgetService(db, str(user_id))
    budget = await service.get_by_id(budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    data: BudgetUpdate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = BudgetService(db, str(user_id))
    budget = await service.update(budget_id, data)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = BudgetService(db, str(user_id))
    deleted = await service.delete(budget_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
