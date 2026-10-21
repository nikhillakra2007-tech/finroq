"""
Receipt, bill, and invoice ingestion pipeline.
Extracts merchant, total paid, tax, discount, date, and line items with field-level confidence states.
"""
import io
import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple, Any
from PIL import Image, ImageStat

from app.features.document_ingestion.schemas import (
    IngestionItem,
    ReceiptLineItem,
    FieldConfidenceState,
)
from app.features.document_ingestion.normalizer import (
    normalize_amount,
    parse_transaction_date,
    match_category_by_description,
)


def assess_image_legibility(image_bytes: bytes) -> Tuple[bool, Optional[str]]:
    """
    Analyzes image resolution, contrast, and variance using Pillow.
    Flags overly blurry, tiny, or corrupted images before extraction.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            width, height = img.size
            if width < 150 or height < 150:
                return False, f"Image resolution ({width}x{height}) is too small to reliably read receipt text."

            # Convert to grayscale and check contrast variance
            gray = img.convert("L")
            stat = ImageStat.Stat(gray)
            std_dev = stat.stddev[0]
            if std_dev < 10.0:
                return False, "Image has extremely low contrast or appears completely blank/washed out."

            return True, None
    except Exception as e:
        return False, f"Could not inspect receipt image: {str(e)}"


def parse_receipt_text(
    text_content: str,
    categories: List[Any],
    currency: str = "INR",
    is_image_source: bool = False,
) -> Tuple[Optional[IngestionItem], List[str]]:
    """
    Parses receipt text (from plain text, e-invoice text, or OCR output).
    Extracts merchant, date, total amount, taxes, discounts, tip, and line items.
    """
    errors: List[str] = []
    lines = [line.strip() for line in text_content.splitlines() if line.strip()]

    if not lines:
        return None, ["No readable text found on receipt document."]

    # 1. Extract Merchant Name (usually first 1-3 non-empty lines, ignoring common keywords)
    merchant: Optional[str] = None
    merchant_state = FieldConfidenceState.MISSING
    merchant_candidates = []

    for line in lines[:6]:
        lower = line.lower()
        if any(k in lower for k in [
            "tax invoice", "receipt", "cash memo", "bill", "gstin", "pan", "phone",
            "tel", "date", "time", "welcome", "order", "table", "pos"
        ]):
            continue
        # If line contains letters and reasonable length
        if re.search(r"[a-zA-Z]", line) and 3 <= len(line) <= 60:
            merchant_candidates.append(line)

    if merchant_candidates:
        merchant = merchant_candidates[0]
        merchant_state = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
    else:
        merchant = "Unknown Merchant"
        merchant_state = FieldConfidenceState.UNCERTAIN

    # 2. Extract Purchase Date
    purchase_date: Optional[datetime] = None
    raw_date: Optional[str] = None
    date_state = FieldConfidenceState.MISSING

    # Search for date pattern in text
    date_match = re.search(
        r"(?:date|dt|dated)?[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3,9}\s+\d{2,4})",
        text_content,
        re.IGNORECASE,
    )
    if date_match:
        raw_date = date_match.group(1)
        dt, dt_st, _ = parse_transaction_date(raw_date)
        if dt:
            purchase_date = dt
            date_state = dt_st
        else:
            date_state = FieldConfidenceState.INVALID
    else:
        # Fallback search anywhere in lines
        for line in lines:
            dt, dt_st, _ = parse_transaction_date(line)
            if dt:
                purchase_date = dt
                raw_date = line
                date_state = dt_st
                break

    # 3. Extract Amounts: Total, Subtotal, Tax, Discount, Tip
    total_amount: Optional[Decimal] = None
    raw_total: Optional[str] = None
    amount_state = FieldConfidenceState.MISSING

    subtotal_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    tip_amount: Optional[Decimal] = None
    receipt_number: Optional[str] = None
    payment_method: Optional[str] = None

    # Search for receipt / invoice number
    inv_match = re.search(r"(?:invoice|receipt|bill|order|token)\s*(?:no|number|#)?[:\s]*([A-Za-z0-9\-_/]+)", text_content, re.IGNORECASE)
    if inv_match:
        receipt_number = inv_match.group(1).strip()

    # Search for payment method
    for method in ["UPI", "CREDIT CARD", "DEBIT CARD", "CASH", "NET BANKING", "WALLET"]:
        if method in text_content.upper():
            payment_method = method
            break

    # Analyze lines for financial totals
    amount_pattern = re.compile(r"((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})")

    # Search from bottom up for total amount
    for line in reversed(lines):
        lower = line.lower()
        amounts = amount_pattern.findall(line)
        if not amounts:
            continue

        last_amt_str = amounts[-1]
        val, st, _ = normalize_amount(last_amt_str)
        if not val or val <= 0:
            continue

        if any(k in lower for k in ["subtotal", "sub total", "item total", "net amount"]):
            if subtotal_amount is None:
                subtotal_amount = val
        elif any(k in lower for k in ["tax", "gst", "cgst", "sgst", "igst", "vat"]):
            if tax_amount is None:
                tax_amount = val
        elif any(k in lower for k in ["discount", "disc", "saving"]):
            if discount_amount is None:
                discount_amount = val
        elif any(k in lower for k in ["tip", "gratuity", "service charge"]):
            if tip_amount is None:
                tip_amount = val
        elif (
            any(k in lower for k in ["grand total", "net payable", "total payable", "total amount", "amount paid", "total due", "final total", "total"])
            and "subtotal" not in lower
            and "sub total" not in lower
        ):
            if total_amount is None:
                total_amount = val
                raw_total = last_amt_str
                amount_state = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW

    # If total_amount was not found with explicit 'total' label, pick the largest plausible amount near the end
    if total_amount is None:
        candidates = []
        for line in lines[-10:]:
            # Avoid phone numbers or tax ids
            if any(k in line.lower() for k in ["gstin", "pan", "phone", "tel"]):
                continue
            for amt_str in amount_pattern.findall(line):
                val, st, _ = normalize_amount(amt_str)
                if val and val > 0:
                    candidates.append((val, amt_str))
        if candidates:
            # Sort by value
            candidates.sort(key=lambda x: x[0], reverse=True)
            total_amount, raw_total = candidates[0]
            amount_state = FieldConfidenceState.UNCERTAIN  # Uncertain because no explicit "Total" label
        else:
            amount_state = FieldConfidenceState.MISSING
            errors.append("Receipt total amount could not be reliably extracted.")

    # Consistency check: If subtotal + tax - discount == total, verify deterministically
    if total_amount and subtotal_amount:
        expected = subtotal_amount
        if tax_amount:
            expected += tax_amount
        if discount_amount:
            expected -= discount_amount
        if tip_amount:
            expected += tip_amount

        if expected.quantize(Decimal("0.01")) == total_amount.quantize(Decimal("0.01")):
            amount_state = FieldConfidenceState.VERIFIED

    # 4. Extract Line Items (if table present)
    line_items: List[ReceiptLineItem] = []
    for line in lines:
        # Match pattern: Description ... Qty x Price ... Amount
        m_item = re.match(r"^([A-Za-z0-9\s\-_&]+?)\s+(\d+)\s+[xX@]\s+((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})\s+((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})$", line)
        if m_item:
            desc, qty_str, uprice_str, tot_str = m_item.groups()
            uprice, _, _ = normalize_amount(uprice_str)
            tot, _, _ = normalize_amount(tot_str)
            line_items.append(
                ReceiptLineItem(
                    description=desc.strip(),
                    quantity=Decimal(qty_str),
                    unit_price=uprice,
                    total_price=tot,
                )
            )

    # 5. Suggested Category
    cat_id, cat_name, cat_conf = match_category_by_description(merchant or "Receipt", "expense", categories)

    is_valid = (total_amount is not None and total_amount > 0 and purchase_date is not None)
    val_error = None
    if total_amount is None:
        val_error = "Total amount is missing or unreadable"
    elif purchase_date is None:
        val_error = "Purchase date is missing or unreadable"

    item = IngestionItem(
        id=str(uuid.uuid4()),
        row_index=1,
        transaction_date=purchase_date,
        raw_date=raw_date,
        date_state=date_state,
        description=merchant or "Receipt Purchase",
        raw_description=merchant,
        amount=total_amount or Decimal("0.00"),
        raw_amount=raw_total,
        amount_state=amount_state,
        currency=currency,
        currency_state=FieldConfidenceState.VERIFIED,
        transaction_type="expense",
        suggested_category_id=cat_id,
        suggested_category_name=cat_name,
        category_confidence=cat_conf,
        is_valid=is_valid,
        validation_error=val_error,
        is_selected_for_import=is_valid,
        merchant=merchant,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        tip_amount=tip_amount,
        payment_method=payment_method,
        receipt_number=receipt_number,
        line_items=line_items,
    )

    return item, errors
