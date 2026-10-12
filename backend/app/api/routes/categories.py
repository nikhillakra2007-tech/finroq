from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.categories.service import CategoryService
from app.shared.schemas import CategoryCreate, CategoryResponse
from app.db.models import CategoryType


router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = CategoryService(db, str(user_id))
    return await service.create(data)


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: DatabaseSession,
    user_id: CurrentUserId,
    category_type: CategoryType | None = Query(None),
    include_system: bool = Query(True),
):
    service = CategoryService(db, str(user_id))
    return await service.list(category_type=category_type, include_system=include_system)


@router.post("/seed-defaults", response_model=list[CategoryResponse])
async def seed_default_categories(
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = CategoryService(db, str(user_id))
    return await service.seed_defaults()