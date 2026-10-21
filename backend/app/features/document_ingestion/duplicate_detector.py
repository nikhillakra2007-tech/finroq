"""
Multi-Level Duplicate Detection Engine across Manual, Bank Statement, and Receipt sources.
"""
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Tuple, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Transaction
from app.features.document_ingestion.schemas import (
    IngestionItem,
    DuplicateStatus,
)


def normalize_text_for_comparison(text: str) -> str:
    """
    Normalizes descriptions/merchants by removing UPI prefixes, card codes, payment gateways,
    and extraneous punctuation to enable cross-source matching.
    """
    if not text:
        return ""
    cleaned = text.upper()
    # Remove common banking payment prefixes
    cleaned = re.sub(r"^(UPI|POS|NEFT|RTGS|IMPS|ACH|CHQ|INB|BILLDESK|RAZORPAY|PAYTM)[/\s\-_]+", "", cleaned)
    # Remove reference numbers or trailing auth codes (e.g. /1234567890/ or -REF1234)
    cleaned = re.sub(r"[/@#][\w\d]+", " ", cleaned)
    # Remove non-alphanumeric except spaces
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    return " ".join(cleaned.split())


async def detect_duplicates_for_items(
    db: AsyncSession,
    owner_id: str,
    account_id: int,
    items: List[IngestionItem],
    date_window_days: int = 3,
) -> None:
    """
    Checks each ingestion item against existing transactions in the database and against
    prior items in the current batch.
    Mutates item.duplicate_status, item.duplicate_reason, and item.matched_transaction_id in place.
    """
    if not items:
        return

    # 1. Fetch relevant existing transactions for this owner
    # Determine date range to query from database efficiently
    valid_dates = [it.transaction_date for it in items if it.transaction_date is not None]
    if valid_dates:
        min_date = min(valid_dates) - timedelta(days=date_window_days + 1)
        max_date = max(valid_dates) + timedelta(days=date_window_days + 1)
    else:
        min_date = datetime.utcnow() - timedelta(days=365)
        max_date = datetime.utcnow() + timedelta(days=30)

    stmt = select(Transaction).where(
        and_(
            Transaction.owner_id == owner_id,
            Transaction.transaction_date >= min_date,
            Transaction.transaction_date <= max_date,
        )
    )
    result = await db.execute(stmt)
    existing_txs: List[Transaction] = result.scalars().all()

    # In-batch seen fingerprints for intra-batch duplicate tracking
    in_batch_fingerprints = set()

    for item in items:
        if not item.transaction_date or item.amount <= Decimal("0.00"):
            continue

        item_dt = item.transaction_date.date()
        item_amt = item.amount.quantize(Decimal("0.01"))
        item_type = item.transaction_type
        item_norm_desc = normalize_text_for_comparison(item.description)

        # Intra-batch check
        batch_key = (item_dt, item_amt, item_type, item_norm_desc)
        if batch_key in in_batch_fingerprints:
            item.duplicate_status = DuplicateStatus.STRONG_POTENTIAL_DUPLICATE
            item.duplicate_reason = "Identical transaction repeated multiple times in this uploaded statement/batch."
            continue
        in_batch_fingerprints.add(batch_key)

        matched_tx: Optional[Transaction] = None
        detected_status = DuplicateStatus.NONE
        detected_reason = None

        for tx in existing_txs:
            tx_dt = tx.transaction_date.date()
            tx_amt = tx.amount.quantize(Decimal("0.01"))
            tx_type = tx.transaction_type.value if hasattr(tx.transaction_type, "value") else str(tx.transaction_type)
            tx_norm_desc = normalize_text_for_comparison(tx.description or "")

            # Exact amount comparison is required
            if tx_amt != item_amt:
                continue

            # Direction check
            if tx_type != item_type:
                continue

            # Level 1 & 2: Same account + same date + exact amount
            if tx.account_id == account_id and tx_dt == item_dt:
                # Compare description similarity
                if tx_norm_desc == item_norm_desc or (item_norm_desc and item_norm_desc in tx_norm_desc) or (tx_norm_desc and tx_norm_desc in item_norm_desc):
                    detected_status = DuplicateStatus.EXACT_DUPLICATE
                    detected_reason = f"Exact duplicate of transaction #{tx.id} on {tx_dt} ({tx.description or 'Unlabeled'}) for {tx.currency} {tx_amt}."
                    matched_tx = tx
                    break
                else:
                    # Same date, same amount, but different descriptions:
                    # This could be two legitimate purchases on same day (e.g. ₹500 at Store A, ₹500 at Store B)
                    # Flag as strong potential duplicate ONLY if words overlap, otherwise let user review as possible match
                    overlap = set(item_norm_desc.split()) & set(tx_norm_desc.split())
                    if overlap:
                        detected_status = DuplicateStatus.STRONG_POTENTIAL_DUPLICATE
                        detected_reason = f"Strong potential duplicate of transaction #{tx.id} on {tx_dt} with similar merchant."
                        matched_tx = tx
                        break
                    else:
                        # Legitimate repeat possibility
                        detected_status = DuplicateStatus.POSSIBLE_MATCH
                        detected_reason = f"Transaction #{tx.id} on {tx_dt} has identical amount {tx.currency} {tx_amt}. Verified merchant differs: '{tx.description}' vs '{item.description}'."
                        matched_tx = tx
                        # Keep looking in case an exact match exists

            # Level 3: Cross-source matching with posting date tolerance (e.g. Receipt date vs Bank posting date ±3 days)
            elif abs((tx_dt - item_dt).days) <= date_window_days:
                # If merchant or description strongly matches
                if item_norm_desc and tx_norm_desc and (item_norm_desc in tx_norm_desc or tx_norm_desc in item_norm_desc):
                    detected_status = DuplicateStatus.POSSIBLE_MATCH
                    detected_reason = f"Cross-source match with transaction #{tx.id} from {tx.source} on {tx_dt} ({abs((tx_dt - item_dt).days)} days apart)."
                    matched_tx = tx
                    break

        if detected_status != DuplicateStatus.NONE:
            item.duplicate_status = detected_status
            item.duplicate_reason = detected_reason
            item.matched_transaction_id = matched_tx.id if matched_tx else None
            if detected_status in (DuplicateStatus.EXACT_DUPLICATE, DuplicateStatus.STRONG_POTENTIAL_DUPLICATE):
                # By default, do not pre-select exact duplicates for import
                item.is_selected_for_import = False
