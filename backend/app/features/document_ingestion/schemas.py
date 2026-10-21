"""
Ingestion models, enums, and schemas for FINROQ bank statement and receipt ingestion.
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class DocumentClassification(str, Enum):
    BANK_STATEMENT = "bank_statement"
    RECEIPT = "receipt"
    INVOICE = "invoice"
    UNSUPPORTED = "unsupported"
    UNREADABLE = "unreadable"


class FieldConfidenceState(str, Enum):
    VERIFIED = "verified"                     # Deterministically validated (e.g., checksum or reconciliation confirmed)
    EXTRACTED_AWAITING_REVIEW = "extracted"   # Read successfully, awaits user confirmation
    UNCERTAIN = "uncertain"                   # Low confidence or ambiguous format
    MISSING = "missing"                       # Required field not present
    INVALID = "invalid"                       # Present but fails validation (e.g. negative amount, invalid date)


class DuplicateStatus(str, Enum):
    NONE = "none"
    EXACT_DUPLICATE = "exact_duplicate"                 # Already imported identical bank record / reference
    STRONG_POTENTIAL_DUPLICATE = "strong_duplicate"     # Matches manual or prior import on date + exact amount + description
    POSSIBLE_MATCH = "possible_match"                   # Cross-source match within posting tolerance window (e.g., receipt vs bank statement)


class IngestionSessionStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    NEEDS_REVIEW = "needs_review"
    READY_FOR_CONFIRMATION = "ready_for_confirmation"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class ExtractedField(BaseModel):
    value: Optional[Any] = None
    raw_text: Optional[str] = None
    confidence_score: float = 1.0
    state: FieldConfidenceState = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
    uncertainty_reason: Optional[str] = None


class ReceiptLineItem(BaseModel):
    description: str
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None


class StatementReconciliation(BaseModel):
    can_reconcile: bool = False
    opening_balance: Optional[Decimal] = None
    closing_balance: Optional[Decimal] = None
    calculated_closing_balance: Optional[Decimal] = None
    total_credits: Decimal = Decimal("0.00")
    total_debits: Decimal = Decimal("0.00")
    is_reconciled: bool = False
    discrepancy_amount: Optional[Decimal] = None
    explanation: Optional[str] = None


class IngestionItem(BaseModel):
    id: str
    row_index: int
    transaction_date: Optional[datetime] = None
    raw_date: Optional[str] = None
    date_state: FieldConfidenceState = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
    
    description: str
    raw_description: Optional[str] = None
    
    amount: Decimal = Decimal("0.00")
    raw_amount: Optional[str] = None
    amount_state: FieldConfidenceState = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
    
    currency: str = "INR"
    currency_state: FieldConfidenceState = FieldConfidenceState.VERIFIED
    
    transaction_type: str = "expense"  # 'income' | 'expense' | 'transfer'
    
    suggested_category_id: Optional[int] = None
    suggested_category_name: Optional[str] = None
    category_confidence: float = 0.0
    
    # Duplicate prevention info
    duplicate_status: DuplicateStatus = DuplicateStatus.NONE
    duplicate_reason: Optional[str] = None
    matched_transaction_id: Optional[int] = None
    
    # Field validation & inclusion
    is_valid: bool = True
    validation_error: Optional[str] = None
    is_selected_for_import: bool = True
    
    # Receipt-specific data
    merchant: Optional[str] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    tip_amount: Optional[Decimal] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    line_items: List[ReceiptLineItem] = Field(default_factory=list)


class IngestionSessionResponse(BaseModel):
    session_id: str
    owner_id: str
    account_id: int
    account_name: str
    filename: str
    file_type: str
    detected_document_type: DocumentClassification
    status: IngestionSessionStatus
    
    # Metadata
    masked_account_number: Optional[str] = None
    statement_start_date: Optional[datetime] = None
    statement_end_date: Optional[datetime] = None
    
    # Reconciliation
    reconciliation: Optional[StatementReconciliation] = None
    
    # Items summary
    total_items: int = 0
    valid_items: int = 0
    uncertain_items: int = 0
    duplicate_items: int = 0
    
    items: List[IngestionItem] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class IngestionItemUpdateRequest(BaseModel):
    transaction_date: Optional[datetime] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_type: Optional[str] = None
    category_id: Optional[int] = None
    is_selected_for_import: Optional[bool] = None


class IngestionConfirmRequest(BaseModel):
    account_id: int
    idempotency_key: str
    selected_item_ids: Optional[List[str]] = None  # If None, imports all valid non-excluded items
    item_overrides: Optional[Dict[str, IngestionItemUpdateRequest]] = None


class IngestionConfirmResponse(BaseModel):
    session_id: str
    imported_count: int
    skipped_duplicate_count: int
    account_id: int
    message: str
