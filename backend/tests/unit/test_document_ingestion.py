"""
Comprehensive unit tests for the document ingestion pipeline:
Bank statements, receipts, exact decimal arithmetic, reconciliation, and duplicate prevention.
"""
import pytest
from datetime import datetime
from decimal import Decimal
from app.features.document_ingestion.schemas import (
    FieldConfidenceState,
    DuplicateStatus,
    DocumentClassification,
)
from app.features.document_ingestion.normalizer import (
    normalize_amount,
    parse_transaction_date,
    match_category_by_description,
)
from app.features.document_ingestion.validator import (
    validate_file_security_and_format,
    classify_document,
)
from app.features.document_ingestion.statement_parser import (
    parse_csv_or_tsv_statement,
    build_statement_reconciliation,
)
from app.features.document_ingestion.receipt_parser import (
    parse_receipt_text,
    assess_image_legibility,
)
from app.features.document_ingestion.duplicate_detector import normalize_text_for_comparison
from app.db.models import Category, CategoryType


class DummyCategory:
    def __init__(self, id: int, name: str, category_type: CategoryType):
        self.id = id
        self.name = name
        self.category_type = category_type


@pytest.fixture
def dummy_categories():
    return [
        DummyCategory(1, "Salary & Compensation", CategoryType.INCOME),
        DummyCategory(2, "Groceries & Food", CategoryType.EXPENSE),
        DummyCategory(3, "Commute & Fuel", CategoryType.EXPENSE),
        DummyCategory(4, "Rent & Housing", CategoryType.EXPENSE),
        DummyCategory(5, "Utilities & Internet", CategoryType.EXPENSE),
        DummyCategory(6, "Dining & Outings", CategoryType.EXPENSE),
        DummyCategory(7, "Healthcare", CategoryType.EXPENSE),
    ]


class TestFinancialNormalizer:
    def test_indian_lakh_crore_amount_normalization(self):
        val, state, err = normalize_amount("₹ 1,23,456.78")
        assert val == Decimal("123456.78")
        assert state == FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
        assert err is None

    def test_standard_us_amount_normalization(self):
        val, state, err = normalize_amount("$1,234.50")
        assert val == Decimal("1234.50")
        assert state == FieldConfidenceState.EXTRACTED_AWAITING_REVIEW

    def test_european_format_normalization(self):
        val, state, err = normalize_amount("1.234,56")
        assert val == Decimal("1234.56")
        assert state == FieldConfidenceState.EXTRACTED_AWAITING_REVIEW

    def test_invalid_negative_or_zero_amount(self):
        val, state, err = normalize_amount("0.00")
        assert val is None
        assert state == FieldConfidenceState.INVALID
        assert "strictly greater than zero" in err

    def test_excessively_large_amount_rejected(self):
        val, state, err = normalize_amount("9876543210123456")
        assert val is None
        assert state == FieldConfidenceState.INVALID

    def test_indian_date_dd_mm_yyyy_parsing(self):
        dt, state, err = parse_transaction_date("18/10/2026")
        assert dt == datetime(2026, 10, 18)
        assert state == FieldConfidenceState.EXTRACTED_AWAITING_REVIEW
        assert err is None

    def test_iso_date_parsing(self):
        dt, state, err = parse_transaction_date("2026-10-18")
        assert dt == datetime(2026, 10, 18)

    def test_textual_month_date_parsing(self):
        dt, state, err = parse_transaction_date("18 Oct 2026")
        assert dt == datetime(2026, 10, 18)

    def test_implausible_year_rejected(self):
        dt, state, err = parse_transaction_date("18/10/1980")
        assert dt is None
        assert state == FieldConfidenceState.INVALID


class TestFileValidationAndClassification:
    def test_file_magic_bytes_detection(self):
        pdf_bytes = b"%PDF-1.4 header text"
        detected, err = validate_file_security_and_format("statement.pdf", pdf_bytes)
        assert detected == "pdf"

    def test_empty_file_rejected(self):
        detected, err = validate_file_security_and_format("empty.csv", b"")
        assert "empty" in err

    def test_statement_document_classification(self):
        sample = (
            "HDFC Bank Statement\n"
            "Account Number: XXXXXXXX1234\n"
            "Date | Description | Withdrawal | Deposit | Balance\n"
            "18/10/2026 | UPI/Swiggy | 450.00 | | 15200.00\n"
            "19/10/2026 | Salary Credit | | 85000.00 | 100200.00\n"
            "Closing Balance: 100200.00\n"
        )
        classification = classify_document(sample)
        assert classification == DocumentClassification.BANK_STATEMENT

    def test_receipt_document_classification(self):
        sample = (
            "BLUE TOKAI COFFEE ROASTERS\n"
            "Tax Invoice / Cash Memo\n"
            "Date: 18/10/2026\n"
            "1 x Cappuccino 250.00\n"
            "Subtotal: 250.00\n"
            "CGST (2.5%): 6.25\n"
            "SGST (2.5%): 6.25\n"
            "Grand Total: 262.50\n"
            "Thank you for visiting!\n"
        )
        classification = classify_document(sample)
        assert classification == DocumentClassification.RECEIPT


class TestBankStatementIngestion:
    def test_csv_statement_parsing_and_reconciliation(self, dummy_categories):
        csv_data = (
            "Opening Balance: 1000.00\n"
            "Date,Description,Debit,Credit,Balance\n"
            "10/10/2026,Monthly Salary,,50000.00,51000.00\n"
            "12/10/2026,Supermarket Grocery,3500.00,,47500.00\n"
            "15/10/2026,Electricity Board Bill,1200.00,,46300.00\n"
            "Closing Balance: 46300.00\n"
        )
        items, recon, errors = parse_csv_or_tsv_statement(csv_data, dummy_categories, currency="INR")
        assert len(items) == 3
        assert recon.can_reconcile is True
        assert recon.is_reconciled is True
        assert recon.total_credits == Decimal("50000.00")
        assert recon.total_debits == Decimal("4700.00")
        assert recon.calculated_closing_balance == Decimal("46300.00")

    def test_reconciliation_discrepancy_flagged(self):
        recon = build_statement_reconciliation(
            opening_balance=Decimal("1000.00"),
            closing_balance=Decimal("50000.00"),  # Stated is 50000, but 1000 + 40000 = 41000
            total_credits=Decimal("40000.00"),
            total_debits=Decimal("0.00"),
        )
        assert recon.can_reconcile is True
        assert recon.is_reconciled is False
        assert recon.discrepancy_amount == Decimal("-9000.00")
        assert "discrepancy" in recon.explanation.lower()


class TestReceiptIngestion:
    def test_receipt_extraction_with_taxes_and_discount(self, dummy_categories):
        receipt_text = (
            "NATURE'S BASKET SUPERMARKET\n"
            "Tax Invoice #NB-2026-9812\n"
            "Date: 18/10/2026\n"
            "Payment Method: UPI\n"
            "Organic Milk 2 x 60.00 120.00\n"
            "Almond Butter 1 x 450.00 450.00\n"
            "Subtotal: 570.00\n"
            "Discount: 50.00\n"
            "GST: 26.00\n"
            "Total Amount: 546.00\n"
            "Thank you! Visit again."
        )
        item, errors = parse_receipt_text(receipt_text, dummy_categories, currency="INR")
        assert item is not None
        assert "NATURE'S BASKET" in item.merchant
        assert item.transaction_date == datetime(2026, 10, 18)
        assert item.amount == Decimal("546.00")
        assert item.amount_state == FieldConfidenceState.VERIFIED  # 570 - 50 + 26 = 546
        assert item.receipt_number == "NB-2026-9812"
        assert item.suggested_category_name == "Groceries & Food"

    def test_unclear_receipt_amount_flagged_for_review(self, dummy_categories):
        receipt_text = (
            "Star Coffee House\n"
            "Date: 18/10/2026\n"
            "Order #12\n"
            "Total: \n"
        )
        item, errors = parse_receipt_text(receipt_text, dummy_categories, currency="INR")
        assert item is not None
        assert item.merchant == "Star Coffee House"
        assert item.amount_state == FieldConfidenceState.MISSING
        assert item.is_valid is False
        assert "Total amount is missing" in item.validation_error


class TestDuplicateNormalization:
    def test_banking_prefix_stripped_for_cross_source_matching(self):
        desc1 = "UPI/ABC SUPERMARKET/12345678/P2M"
        desc2 = "ABC Supermarket"
        norm1 = normalize_text_for_comparison(desc1)
        norm2 = normalize_text_for_comparison(desc2)
        assert norm2 in norm1 or norm1 == norm2
