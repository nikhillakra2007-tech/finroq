"""
API routes for document ingestion, review, correction, and confirmation.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from app.api.deps import DatabaseSession, CurrentUserId
from app.features.document_ingestion.service import IngestionService
from app.features.document_ingestion.schemas import (
    IngestionSessionResponse,
    IngestionItemUpdateRequest,
    IngestionConfirmRequest,
    IngestionConfirmResponse,
)

router = APIRouter(prefix="/ingestion", tags=["document-ingestion"])


@router.post("/upload", response_model=IngestionSessionResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    db: DatabaseSession,
    user_id: CurrentUserId,
    account_id: int = Form(...),
    document_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    service = IngestionService(db, str(user_id))
    try:
        content_bytes = await file.read()
        return await service.process_upload(
            account_id=account_id,
            content_bytes=content_bytes,
            filename=file.filename or "uploaded_document",
            document_type_hint=document_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Document processing failed: {str(e)}")


@router.get("/sessions/{session_id}", response_model=IngestionSessionResponse)
async def get_session(
    session_id: str,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = IngestionService(db, str(user_id))
    try:
        return await service.get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/sessions/{session_id}/items/{item_id}", response_model=IngestionSessionResponse)
async def update_item(
    session_id: str,
    item_id: str,
    data: IngestionItemUpdateRequest,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = IngestionService(db, str(user_id))
    try:
        return await service.update_item(session_id, item_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/sessions/{session_id}/confirm", response_model=IngestionConfirmResponse)
async def confirm_session(
    session_id: str,
    data: IngestionConfirmRequest,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = IngestionService(db, str(user_id))
    try:
        return await service.confirm_session(session_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Confirmation failed: {str(e)}")


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(
    session_id: str,
    db: DatabaseSession,
    user_id: CurrentUserId,
):
    service = IngestionService(db, str(user_id))
    try:
        return await service.cancel_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
