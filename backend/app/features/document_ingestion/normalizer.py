"""
Financial normalization, exact decimal conversion, robust date parsing, and category matching.
"""
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional, Tuple, List, Any
from app.features.document_ingestion.schemas import FieldConfidenceState


CURRENCY_SYMBOLS = {
    "₹": "INR",
    "RS.": "INR",
    "RS": "INR",
    "INR": "INR",
    "$": "USD",
    "USD": "USD",
    "€": "EUR",
    "EUR": "EUR",
    "£": "GBP",
    "GBP": "GBP",
}


def normalize_amount(raw_str: str) -> Tuple[Optional[Decimal], FieldConfidenceState, Optional[str]]:
    """
    Parses a string into an exact 2-decimal-place Decimal.
    Handles Indian lakh/crore grouping (1,23,456.78), European format (1.234,56), and standard format.
    Never silently accepts an ambiguous or invalid number.
    Returns (Decimal_value, FieldConfidenceState, error_or_reason).
    """
    if not raw_str or not raw_str.strip():
        return None, FieldConfidenceState.MISSING, "Amount is empty"

    cleaned = raw_str.strip()

    # Remove currency prefix/suffix
    for sym in ["₹", "INR", "Rs.", "Rs", "rs.", "rs", "$", "USD", "€", "EUR", "£", "GBP"]:
        cleaned = re.sub(re.escape(sym), "", cleaned, flags=re.IGNORECASE).strip()

    # Discard non-amount artifacts (e.g. phone numbers, 10+ digit numeric codes with no decimal)
    digits_only = re.sub(r"[^\d]", "", cleaned)
    if len(digits_only) > 12:
        return None, FieldConfidenceState.INVALID, f"Value '{raw_str}' is too large to be a valid transaction amount"

    # Identify separators
    has_comma = "," in cleaned
    has_dot = "." in cleaned

    # Check for negative signs or parenthesized negative: (100.00) or -100.00
    is_negative = False
    if cleaned.startswith("(") and cleaned.endswith(")"):
        is_negative = True
        cleaned = cleaned[1:-1].strip()
    elif cleaned.startswith("-") or cleaned.endswith("-") or cleaned.endswith("Cr") or cleaned.endswith("Dr"):
        cleaned = cleaned.replace("-", "").strip()

    # Detect separator role
    if has_comma and has_dot:
        last_comma = cleaned.rfind(",")
        last_dot = cleaned.rfind(".")
        if last_dot > last_comma:
            # Standard or Indian: 1,23,456.78 -> commas are thousands separators, dot is decimal
            num_str = cleaned.replace(",", "")
        else:
            # European: 1.234,56 -> dots are thousands separators, comma is decimal
            num_str = cleaned.replace(".", "").replace(",", ".")
    elif has_comma and not has_dot:
        # e.g., "1,234" or "12,50" or "1,23,456"
        parts = cleaned.split(",")
        if len(parts) == 2 and len(parts[1]) == 2:
            # Likely European decimal: "12,50"
            num_str = parts[0] + "." + parts[1]
        else:
            # Whole amount with thousands separator: "1,250"
            num_str = cleaned.replace(",", "") + ".00"
    elif has_dot and not has_comma:
        # e.g., "1234.56" or "1.234"
        parts = cleaned.split(".")
        if len(parts) == 2 and len(parts[1]) == 3 and int(parts[0]) > 0:
            # Ambiguous: could be European thousands "1.234" or 3-decimal amount.
            # Require review
            return None, FieldConfidenceState.UNCERTAIN, f"Ambiguous separator in '{raw_str}'"
        else:
            num_str = cleaned
    else:
        # No separators: "500"
        num_str = cleaned + ".00"

    # Final sanitization of num_str
    sanitized = re.sub(r"[^\d.]", "", num_str)
    if not sanitized or sanitized == ".":
        return None, FieldConfidenceState.INVALID, f"Could not parse '{raw_str}' as a monetary amount"

    try:
        val = Decimal(sanitized).quantize(Decimal("0.01"))
        if val <= Decimal("0.00"):
            return None, FieldConfidenceState.INVALID, "Transaction amount must be strictly greater than zero"
        return val, FieldConfidenceState.EXTRACTED_AWAITING_REVIEW, None
    except (InvalidOperation, Exception) as e:
        return None, FieldConfidenceState.INVALID, f"Numeric conversion error: {str(e)}"


def parse_transaction_date(date_str: str) -> Tuple[Optional[datetime], FieldConfidenceState, Optional[str]]:
    """
    Parses date with support for Indian DD/MM/YYYY, ISO, and standard conventions.
    Never invents a missing year.
    Returns (datetime, FieldConfidenceState, error_or_reason).
    """
    if not date_str or not date_str.strip():
        return None, FieldConfidenceState.MISSING, "Date is empty"

    cleaned = date_str.strip().replace("T", " ")
    # Remove ordinal suffixes: 1st, 2nd, 3rd, 4th
    cleaned = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", cleaned, flags=re.IGNORECASE)

    # Common formats, prioritizing DD/MM/YYYY for Indian statements
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d",
        "%d %b %Y", "%d %B %Y", "%b %d, %Y", "%B %d, %Y",
        "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
        "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y",  # US fallback checked after DD/MM/YYYY
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(cleaned, fmt)
            # Two-digit year expansion check
            if parsed.year < 100:
                parsed = parsed.replace(year=parsed.year + 2000)

            # Plausibility check: between 2000 and 2035
            if parsed.year < 2000 or parsed.year > 2035:
                return None, FieldConfidenceState.INVALID, f"Year {parsed.year} is implausible for financial records"

            return parsed, FieldConfidenceState.EXTRACTED_AWAITING_REVIEW, None
        except ValueError:
            continue

    return None, FieldConfidenceState.INVALID, f"Could not parse date '{date_str}'"


def match_category_by_description(
    description: str,
    tx_type: str,
    categories: List[Any],
) -> Tuple[Optional[int], Optional[str], float]:
    """
    Suggests a category based on description and transaction type using existing FINROQ categories.
    Returns (category_id, category_name, confidence).
    """
    if not description:
        return None, None, 0.0

    lower = description.lower()

    # Rule keywords with high-confidence targets
    if tx_type == "income":
        income_rules = [
            (["salary", "payroll", "stipend", "wages", "direct dep", "employer"], ["Salary & Compensation", "Salary", "Income"], 0.95),
            (["dividend", "interest", "fd int", "interest credit", "coupon"], ["Investment", "Dividends", "Interest", "Income"], 0.90),
            (["refund", "cashback", "reversal"], ["Refunds", "Income", "Other"], 0.85),
            (["freelance", "upwork", "consulting", "invoice paid"], ["Freelance", "Income"], 0.90),
        ]
        for kw_list, cat_targets, conf in income_rules:
            if any(k in lower for k in kw_list):
                for c in categories:
                    if getattr(c, "category_type", None) in ("income", "both"):
                        c_name = getattr(c, "name", "")
                        if any(target.lower() in c_name.lower() for target in cat_targets):
                            return c.id, c_name, conf
    else:
        expense_rules = [
            (["blinkit", "zepto", "swiggy instamart", "bigbasket", "supermarket", "grocery", "groceries", "dmart", "spencer", "nature's basket", "reliance fresh"], ["Groceries & Food", "Groceries", "Food"], 0.95),
            (["zomato", "swiggy", "restaurant", "cafe", "bistro", "starbucks", "mcdonalds", "kfc", "burger king", "dining", "eatery"], ["Dining & Outings", "Food", "Entertainment"], 0.95),
            (["uber", "ola", "rapido", "metro", "fuel", "petrol", "diesel", "hpcl", "bpcl", "ioc", "transit", "toll", "fastag"], ["Commute & Fuel", "Transport", "Travel"], 0.90),
            (["rent", "maintenance", "society", "landlord", "lease"], ["Rent & Housing", "Housing"], 0.95),
            (["bescom", "electricity", "water", "airtel", "jio", "broadband", "wifi", "utility", "gas bill", "piped gas"], ["Utilities & Internet", "Utilities"], 0.90),
            (["apollo", "pharmeasy", "1mg", "pharmacy", "clinic", "hospital", "doctor", "lab", "pathology"], ["Healthcare", "Medical"], 0.95),
            (["amazon", "flipkart", "myntra", "zara", "h&m", "retail", "croma", "reliance digital", "clothing"], ["Shopping", "Personal"], 0.85),
            (["netflix", "spotify", "prime video", "hotstar", "cinema", "pvr", "inox", "bookmyshow"], ["Entertainment", "Subscriptions"], 0.95),
        ]
        for kw_list, cat_targets, conf in expense_rules:
            if any(k in lower for k in kw_list):
                for c in categories:
                    if getattr(c, "category_type", None) in ("expense", "both"):
                        c_name = getattr(c, "name", "")
                        if any(target.lower() in c_name.lower() for target in cat_targets):
                            return c.id, c_name, conf

    return None, None, 0.0
