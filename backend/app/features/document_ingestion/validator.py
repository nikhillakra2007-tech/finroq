"""
File validation, MIME / magic byte detection, and document classification.
"""
import io
import re
from typing import Tuple, Optional
from pypdf import PdfReader
from PIL import Image

from app.features.document_ingestion.schemas import DocumentClassification

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_PDF_PAGES = 15


def validate_file_security_and_format(filename: str, content: bytes) -> Tuple[str, Optional[str]]:
    """
    Validates file size, extension, and magic bytes.
    Returns (detected_format, error_message).
    """
    if not content or len(content) == 0:
        return "", "Uploaded file is empty (0 bytes)."

    if len(content) > MAX_FILE_SIZE_BYTES:
        return "", f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # 1. Magic bytes detection
    if content.startswith(b"%PDF-"):
        # Check PDF page limit and validity
        try:
            reader = PdfReader(io.BytesIO(content))
            num_pages = len(reader.pages)
            if num_pages > MAX_PDF_PAGES:
                return "pdf", f"PDF exceeds maximum page limit of {MAX_PDF_PAGES} pages (found {num_pages})."
            if num_pages == 0:
                return "pdf", "PDF file contains no readable pages."
            return "pdf", None
        except Exception as e:
            return "pdf", f"Corrupt or malformed PDF file: {str(e)}"

    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        try:
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
            return "image/png", None
        except Exception as e:
            return "image/png", f"Corrupted PNG image file: {str(e)}"

    if content.startswith(b"\xff\xd8\xff"):
        try:
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
            return "image/jpeg", None
        except Exception as e:
            return "image/jpeg", f"Corrupted JPEG image file: {str(e)}"

    if content.startswith(b"RIFF") and b"WEBP" in content[:16]:
        try:
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
            return "image/webp", None
        except Exception as e:
            return "image/webp", f"Corrupted WEBP image file: {str(e)}"

    # 2. Text / CSV / TSV check
    if b"\x00" in content[:4096]:
        return "binary", "Binary or unsupported executable file signature detected."

    # Try decoding text
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text_content = content.decode("latin-1")
        except Exception:
            return "unknown", "File encoding could not be decoded as text or supported image."

    # Verify if valid CSV/TSV/text
    if ext in ("csv", "tsv", "txt"):
        return ext, None

    # Fallback to csv if tabular-like
    if "\n" in text_content and ("," in text_content or "\t" in text_content or ";" in text_content):
        return "csv", None

    return "text", None


def classify_document(text_sample: str, is_image: bool = False) -> DocumentClassification:
    """
    Classifies whether document text indicates a bank statement or a purchase receipt/invoice.
    Uses structural signals, keyword distributions, and layout tokens.
    """
    if not text_sample or len(text_sample.strip()) < 10:
        return DocumentClassification.UNREADABLE

    lower = text_sample.lower()

    # Statement signals
    statement_indicators = [
        "account number", "account no", "statement period", "opening balance",
        "closing balance", "withdrawal", "deposit", "credit limit", "available balance",
        "chq no", "cheque", "utr no", "particulars", "value date", "post date",
        "debit amount", "credit amount", "debit", "credit", "transaction details", "balance b/f",
        "cr/dr", "neft", "rtgs", "imps", "bank statement"
    ]
    statement_score = sum(2 for ind in statement_indicators if ind in lower)

    # Check for tabular statement headers
    first_few_lines = "\n".join(lower.splitlines()[:5])
    if "date" in first_few_lines and any(k in first_few_lines for k in ["debit", "credit", "withdrawal", "deposit", "balance", "amount"]):
        statement_score += 4

    # Multi-row tabular signal: count lines that match date + amount pattern
    date_amount_pattern = re.compile(
        r"(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}).*?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})"
    )
    matching_rows = len(date_amount_pattern.findall(text_sample))
    if matching_rows >= 2:
        statement_score += 4
    elif matching_rows == 1 and statement_score >= 2:
        statement_score += 2

    # Receipt signals
    receipt_indicators = [
        "tax invoice", "receipt", "cash memo", "subtotal", "sub total", "cgst", "sgst", "igst",
        "vat", "sales tax", "bill to", "ship to", "qty", "quantity", "unit price",
        "grand total", "total amount", "net payable", "cashier", "pos slip",
        "change due", "tendered", "thank you", "visit again", "tip", "gratuity",
        "order #", "table #"
    ]
    receipt_score = sum(2 for ind in receipt_indicators if ind in lower)

    # Single total presence strongly characterizes receipts
    if "grand total" in lower or "net payable" in lower or "total payable" in lower:
        receipt_score += 3

    if statement_score > receipt_score and statement_score >= 3:
        return DocumentClassification.BANK_STATEMENT

    if receipt_score > statement_score and receipt_score >= 2:
        return DocumentClassification.RECEIPT

    # If matching rows >= 2 and contains debit/credit/balance
    if matching_rows >= 2 and any(k in lower for k in ["balance", "debit", "credit", "cr", "dr", "deposit"]):
        return DocumentClassification.BANK_STATEMENT

    # If it's an image and has total/amount tokens
    if is_image and any(k in lower for k in ["total", "amount", "rs", "inr", "$"]):
        return DocumentClassification.RECEIPT

    return DocumentClassification.UNSUPPORTED
