from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.accounts.service import AccountService
from app.shared.schemas import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountListResponse,
)


router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = AccountService(db, str(user_id))
    return await service.create(data)


@router.get("", response_model=AccountListResponse)
async def list_accounts(
    db: DatabaseSession,
    user_id: CurrentUserId,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: bool | None = Query(None),
):
    service = AccountService(db, str(user_id))
    accounts, total = await service.list(page=page, page_size=page_size, is_active=is_active)
    return AccountListResponse(
        accounts=accounts,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = AccountService(db, str(user_id))
    account = await service.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    data: AccountUpdate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = AccountService(db, str(user_id))
    account = await service.update(account_id, data)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account