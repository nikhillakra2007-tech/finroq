"""
Ingestion Service: Manages session lifecycle, atomic confirmation, idempotent import, and user edits.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional, List, Tuple
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Account, Category, Transaction, TransactionType, TransactionStatus
from app.features.document_ingestion.schemas import (
    IngestionSessionResponse,
    IngestionSessionStatus,
    IngestionItem,
    IngestionItemUpdateRequest,
    IngestionConfirmRequest,
    IngestionConfirmResponse,
    DocumentClassification,
    FieldConfidenceState,
    DuplicateStatus,
)
from app.features.document_ingestion.validator import (
    validate_file_security_and_format,
    classify_document,
)
from app.features.document_ingestion.statement_parser import (
    parse_csv_or_tsv_statement,
    parse_pdf_statement,
)
from app.features.document_ingestion.receipt_parser import (
    parse_receipt_text,
    assess_image_legibility,
)
from app.features.document_ingestion.duplicate_detector import detect_duplicates_for_items
from app.features.document_ingestion.normalizer import normalize_amount, parse_transaction_date


# In-memory store for active ingestion sessions
# Key: session_id -> IngestionSessionResponse
_ACTIVE_INGESTION_SESSIONS: Dict[str, IngestionSessionResponse] = {}
# Idempotency token cache to prevent duplicate submission on network retries
_CONFIRMED_IDEMPOTENCY_KEYS: Dict[str, IngestionConfirmResponse] = {}


class IngestionService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def process_upload(
        self,
        account_id: int,
        content_bytes: bytes,
        filename: str,
        document_type_hint: Optional[str] = None,
    ) -> IngestionSessionResponse:
        # Verify account ownership
        account = await self.db.get(Account, account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied.")

        # File security & format validation
        detected_format, val_err = validate_file_security_and_format(filename, content_bytes)
        if val_err:
            raise ValueError(val_err)

        # Fetch active categories for this owner & system
        cat_res = await self.db.execute(
            select(Category).where(
                or_(Category.owner_id == self.owner_id, Category.is_system == True)
            )
        )
        categories = cat_res.scalars().all()

        session_id = str(uuid.uuid4())
        currency = account.currency or "INR"
        items: List[IngestionItem] = []
        errors: List[str] = []
        reconciliation = None

        # Determine document type
        doc_type: DocumentClassification = DocumentClassification.UNSUPPORTED
        is_image = detected_format.startswith("image/")

        if document_type_hint == "receipt":
            doc_type = DocumentClassification.RECEIPT
        elif document_type_hint == "bank_statement":
            doc_type = DocumentClassification.BANK_STATEMENT
        else:
            # Auto-classify
            if detected_format in ("csv", "tsv", "txt"):
                try:
                    text_sample = content_bytes.decode("utf-8", errors="replace")[:4000]
                except Exception:
                    text_sample = ""
                doc_type = classify_document(text_sample, is_image=False)
            elif detected_format == "pdf":
                from pypdf import PdfReader
                import io
                try:
                    reader = PdfReader(io.BytesIO(content_bytes))
                    first_page_text = reader.pages[0].extract_text() if reader.pages else ""
                    doc_type = classify_document(first_page_text, is_image=False)
                except Exception:
                    doc_type = DocumentClassification.BANK_STATEMENT
            elif is_image:
                doc_type = DocumentClassification.RECEIPT

        # Execute extraction pipeline based on classification
        if doc_type == DocumentClassification.BANK_STATEMENT:
            if detected_format == "pdf":
                items, reconciliation, p_errors = parse_pdf_statement(content_bytes, categories, currency=currency)
                errors.extend(p_errors)
            else:
                text_content = content_bytes.decode("utf-8", errors="replace")
                items, reconciliation, p_errors = parse_csv_or_tsv_statement(text_content, categories, currency=currency)
                errors.extend(p_errors)

        elif doc_type in (DocumentClassification.RECEIPT, DocumentClassification.INVOICE):
            if is_image:
                is_legible, leg_err = assess_image_legibility(content_bytes)
                if not is_legible:
                    raise ValueError(f"Unreadable receipt image: {leg_err}")
                # For images in local environment without binary tesseract installed,
                # use filename/content tokens or e-invoice structure
                # We attempt to extract any plain text metadata, or fall back to structured prompt
                receipt_text = f"Receipt from {filename.rsplit('.', 1)[0]}\nTotal: 0.00"
                item, r_errors = parse_receipt_text(receipt_text, categories, currency=currency, is_image_source=True)
                if item:
                    item.amount_state = FieldConfidenceState.MISSING
                    item.is_valid = False
                    item.validation_error = "Image uploaded. Please verify or input the exact receipt amount paid."
                    items.append(item)
                errors.extend(r_errors)
            else:
                # Text-based receipt, e-bill, or digital invoice
                text_content = content_bytes.decode("utf-8", errors="replace")
                item, r_errors = parse_receipt_text(text_content, categories, currency=currency, is_image_source=False)
                if item:
                    items.append(item)
                errors.extend(r_errors)
        else:
            raise ValueError(
                f"Document could not be recognized as a valid bank statement or receipt. Please upload a supported CSV, PDF statement, or receipt file."
            )

        # Run multi-level duplicate detection
        await detect_duplicates_for_items(
            db=self.db,
            owner_id=self.owner_id,
            account_id=account_id,
            items=items,
        )

        # Calculate counts
        valid_count = sum(1 for it in items if it.is_valid and it.duplicate_status == DuplicateStatus.NONE)
        uncertain_count = sum(1 for it in items if it.amount_state in (FieldConfidenceState.UNCERTAIN, FieldConfidenceState.MISSING) or not it.is_valid)
        duplicate_count = sum(1 for it in items if it.duplicate_status != DuplicateStatus.NONE)

        session_status = IngestionSessionStatus.READY_FOR_CONFIRMATION if uncertain_count == 0 and valid_count > 0 else IngestionSessionStatus.NEEDS_REVIEW

        session = IngestionSessionResponse(
            session_id=session_id,
            owner_id=self.owner_id,
            account_id=account.id,
            account_name=account.name,
            filename=filename,
            file_type=detected_format,
            detected_document_type=doc_type,
            status=session_status,
            reconciliation=reconciliation,
            total_items=len(items),
            valid_items=valid_count,
            uncertain_items=uncertain_count,
            duplicate_items=duplicate_count,
            items=items,
            errors=errors,
        )

        _ACTIVE_INGESTION_SESSIONS[session_id] = session
        return session

    async def get_session(self, session_id: str) -> IngestionSessionResponse:
        session = _ACTIVE_INGESTION_SESSIONS.get(session_id)
        if not session or session.owner_id != self.owner_id:
            raise ValueError("Ingestion session not found or access denied.")
        return session

    async def update_item(
        self,
        session_id: str,
        item_id: str,
        updates: IngestionItemUpdateRequest,
    ) -> IngestionSessionResponse:
        session = await self.get_session(session_id)
        if session.status in (IngestionSessionStatus.CONFIRMED, IngestionSessionStatus.CANCELLED):
            raise ValueError(f"Cannot edit session in '{session.status.value}' status.")

        target_item: Optional[IngestionItem] = None
        for it in session.items:
            if it.id == item_id:
                target_item = it
                break

        if not target_item:
            raise ValueError(f"Item #{item_id} not found in this session.")

        # Apply updates
        if updates.transaction_date is not None:
            target_item.transaction_date = updates.transaction_date
            target_item.date_state = FieldConfidenceState.VERIFIED

        if updates.description is not None:
            target_item.description = updates.description.strip()

        if updates.amount is not None:
            if updates.amount <= Decimal("0.00"):
                raise ValueError("Amount must be greater than zero.")
            target_item.amount = updates.amount.quantize(Decimal("0.01"))
            target_item.amount_state = FieldConfidenceState.VERIFIED

        if updates.transaction_type is not None:
            if updates.transaction_type not in ("income", "expense", "transfer"):
                raise ValueError("Invalid transaction type.")
            target_item.transaction_type = updates.transaction_type

        if updates.category_id is not None:
            # Validate category
            category = await self.db.get(Category, updates.category_id)
            if not category or (category.owner_id and category.owner_id != self.owner_id):
                raise ValueError("Invalid category selected.")
            target_item.suggested_category_id = category.id
            target_item.suggested_category_name = category.name

        if updates.is_selected_for_import is not None:
            target_item.is_selected_for_import = updates.is_selected_for_import

        # Re-evaluate item validity
        if target_item.amount > Decimal("0.00") and target_item.transaction_date is not None:
            target_item.is_valid = True
            target_item.validation_error = None

        # Recompute session stats
        session.valid_items = sum(1 for it in session.items if it.is_valid and it.duplicate_status == DuplicateStatus.NONE)
        session.uncertain_items = sum(1 for it in session.items if it.amount_state in (FieldConfidenceState.UNCERTAIN, FieldConfidenceState.MISSING) or not it.is_valid)

        if session.uncertain_items == 0:
            session.status = IngestionSessionStatus.READY_FOR_CONFIRMATION

        return session

    async def confirm_session(
        self,
        session_id: str,
        request: IngestionConfirmRequest,
    ) -> IngestionConfirmResponse:
        # Idempotency check: if this idempotency key was already confirmed, return cached response
        if request.idempotency_key in _CONFIRMED_IDEMPOTENCY_KEYS:
            return _CONFIRMED_IDEMPOTENCY_KEYS[request.idempotency_key]

        session = await self.get_session(session_id)
        if session.status == IngestionSessionStatus.CONFIRMED:
            raise ValueError("This ingestion session has already been confirmed and imported.")
        if session.status == IngestionSessionStatus.CANCELLED:
            raise ValueError("This ingestion session has been cancelled.")

        account = await self.db.get(Account, request.account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied.")

        # Apply any item overrides included in confirmation request
        if request.item_overrides:
            for item_id, item_upd in request.item_overrides.items():
                await self.update_item(session_id, item_id, item_upd)

        # Filter items to import
        items_to_import = []
        skipped_duplicates = 0

        for it in session.items:
            # If explicit selected_item_ids passed, enforce it
            if request.selected_item_ids is not None:
                if it.id not in request.selected_item_ids:
                    continue
            else:
                if not it.is_selected_for_import:
                    if it.duplicate_status in (DuplicateStatus.EXACT_DUPLICATE, DuplicateStatus.STRONG_POTENTIAL_DUPLICATE):
                        skipped_duplicates += 1
                    continue

            # Must have valid positive amount and date
            if not it.is_valid or it.amount <= Decimal("0.00") or not it.transaction_date:
                continue

            items_to_import.append(it)

        if not items_to_import:
            raise ValueError("No valid transactions selected for import.")

        source_tag = "statement_import" if session.detected_document_type == DocumentClassification.BANK_STATEMENT else "receipt_import"

        created_txs = []
        for it in items_to_import:
            tx_type = TransactionType(it.transaction_type)
            tx = Transaction(
                owner_id=self.owner_id,
                account_id=account.id,
                category_id=it.suggested_category_id,
                amount=it.amount,
                currency=account.currency,
                transaction_type=tx_type,
                description=it.description,
                transaction_date=it.transaction_date,
                status=TransactionStatus.COMPLETED,
                source=source_tag,
            )
            self.db.add(tx)
            created_txs.append(tx)

        # Atomic commit
        await self.db.commit()

        session.status = IngestionSessionStatus.CONFIRMED

        response = IngestionConfirmResponse(
            session_id=session_id,
            imported_count=len(created_txs),
            skipped_duplicate_count=skipped_duplicates,
            account_id=account.id,
            message=f"Successfully imported {len(created_txs)} transactions into {account.name}. ({skipped_duplicates} duplicate(s) safely skipped).",
        )

        _CONFIRMED_IDEMPOTENCY_KEYS[request.idempotency_key] = response
        return response

    async def cancel_session(self, session_id: str) -> dict:
        session = await self.get_session(session_id)
        if session.status == IngestionSessionStatus.CONFIRMED:
            raise ValueError("Cannot cancel an already confirmed import.")
        session.status = IngestionSessionStatus.CANCELLED
        # Evict from active cache
        _ACTIVE_INGESTION_SESSIONS.pop(session_id, None)
        return {"session_id": session_id, "status": "cancelled", "message": "Import session cancelled without creating any financial transactions."}
