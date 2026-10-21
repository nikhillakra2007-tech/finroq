"""
Bank Statement ingestion pipeline for CSV, TSV, and text-based PDF files.
Includes statement reconciliation and multi-column parsing.
"""
import csv
import io
import re
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Tuple, Optional, Dict, Any
from pypdf import PdfReader

from app.features.document_ingestion.schemas import (
    IngestionItem,
    StatementReconciliation,
    FieldConfidenceState,
)
from app.features.document_ingestion.normalizer import (
    normalize_amount,
    parse_transaction_date,
    match_category_by_description,
)


def parse_csv_or_tsv_statement(
    text_content: str,
    categories: List[Any],
    currency: str = "INR",
) -> Tuple[List[IngestionItem], StatementReconciliation, List[str]]:
    """
    Parses a CSV or TSV bank statement.
    Handles multiple column naming schemes (Date, Description, Debit, Credit, Balance, Type).
    """
    lines = [line.strip() for line in text_content.splitlines() if line.strip()]
    errors: List[str] = []
    if not lines:
        return [], StatementReconciliation(), ["Statement is completely empty."]

    # Dialect sniffer or default comma/tab
    sample = "\n".join(lines[:10])
    delimiter = "\t" if "\t" in sample and "," not in sample else ","
    if ";" in sample and "," not in sample:
        delimiter = ";"

    reader = csv.reader(lines, delimiter=delimiter)
    all_rows = list(reader)
    if not all_rows:
        return [], StatementReconciliation(), ["No parseable rows found in CSV."]

    # Scan for opening/closing balance in preamble/metadata lines
    opening_balance: Optional[Decimal] = None
    closing_balance: Optional[Decimal] = None
    for row in all_rows[:15]:
        line_str = " ".join(row).lower()
        if "opening balance" in line_str or "balance b/f" in line_str:
            for cell in reversed(row):
                val, state, _ = normalize_amount(cell)
                if val is not None and state != FieldConfidenceState.INVALID:
                    opening_balance = val
                    break
        elif "closing balance" in line_str or "balance c/f" in line_str:
            for cell in reversed(row):
                val, state, _ = normalize_amount(cell)
                if val is not None and state != FieldConfidenceState.INVALID:
                    closing_balance = val
                    break

    # Locate header row
    header_idx = -1
    col_map = {"date": -1, "desc": -1, "debit": -1, "credit": -1, "amount": -1, "balance": -1, "type": -1}

    for idx, row in enumerate(all_rows[:20]):
        row_lower = [c.strip().lower() for c in row]
        matches = sum(
            1 for c in row_lower
            if any(k in c for k in ["date", "desc", "narrative", "particular", "debit", "credit", "amount", "withdrawal", "deposit", "balance"])
        )
        if matches >= 2:
            header_idx = idx
            for c_idx, col in enumerate(row_lower):
                if any(k in col for k in ["date", "txn date", "value date", "post date"]):
                    if col_map["date"] == -1 or "txn" in col or "transaction" in col:
                        col_map["date"] = c_idx
                elif any(k in col for k in ["particular", "narrative", "description", "details", "remark", "payee"]):
                    col_map["desc"] = c_idx
                elif any(k in col for k in ["debit", "withdrawal", "dr"]):
                    col_map["debit"] = c_idx
                elif any(k in col for k in ["credit", "deposit", "cr"]):
                    col_map["credit"] = c_idx
                elif any(k in col for k in ["amount", "txn amount", "net amount"]):
                    col_map["amount"] = c_idx
                elif any(k in col for k in ["balance", "closing"]):
                    col_map["balance"] = c_idx
                elif any(k in col for k in ["type", "dr/cr"]):
                    col_map["type"] = c_idx
            break

    if header_idx >= 0:
        data_rows = all_rows[header_idx + 1 :]
    else:
        # Fallback position assumption
        data_rows = all_rows
        col_map["date"] = 0
        col_map["desc"] = 1 if len(all_rows[0]) > 1 else -1
        col_map["amount"] = 2 if len(all_rows[0]) > 2 else -1

    items: List[IngestionItem] = []
    total_debits = Decimal("0.00")
    total_credits = Decimal("0.00")
    last_row_balance: Optional[Decimal] = None
    seen_row_signatures = set()

    for r_idx, row in enumerate(data_rows):
        if not row or all(not cell.strip() for cell in row):
            continue

        raw_date = row[col_map["date"]] if 0 <= col_map["date"] < len(row) else ""
        raw_desc = row[col_map["desc"]] if 0 <= col_map["desc"] < len(row) else f"Transaction Row #{r_idx + 1}"
        raw_debit = row[col_map["debit"]] if 0 <= col_map["debit"] < len(row) else ""
        raw_credit = row[col_map["credit"]] if 0 <= col_map["credit"] < len(row) else ""
        raw_amount = row[col_map["amount"]] if 0 <= col_map["amount"] < len(row) else ""
        raw_balance = row[col_map["balance"]] if 0 <= col_map["balance"] < len(row) else ""

        # Skip footer or summary lines like "Total", "Grand Total", "Closing Balance"
        full_row_lower = " ".join(row).strip().lower()
        if (
            "closing balance" in full_row_lower
            or "opening balance" in full_row_lower
            or full_row_lower.startswith("total")
            or full_row_lower.startswith("grand total")
        ):
            if "closing balance" in full_row_lower and closing_balance is None:
                for cell in reversed(row):
                    val, st, _ = normalize_amount(cell)
                    if val is not None and st != FieldConfidenceState.INVALID:
                        closing_balance = val
                        break
            continue

        desc_lower = raw_desc.strip().lower()

        dt, dt_state, dt_err = parse_transaction_date(raw_date)
        is_valid = True
        err_msg: Optional[str] = None
        tx_type = "expense"
        final_amount: Optional[Decimal] = None
        amt_state = FieldConfidenceState.EXTRACTED_AWAITING_REVIEW

        # Determine amount and direction
        if col_map["debit"] >= 0 and col_map["credit"] >= 0:
            d_amt, d_st, _ = normalize_amount(raw_debit)
            c_amt, c_st, _ = normalize_amount(raw_credit)

            if d_amt is not None and c_amt is not None and d_amt > 0 and c_amt > 0:
                is_valid = False
                err_msg = "Both debit and credit amounts are populated on the same row"
                final_amount = d_amt
            elif c_amt is not None and c_amt > 0:
                final_amount = c_amt
                tx_type = "income"
                amt_state = c_st
                total_credits += c_amt
            elif d_amt is not None and d_amt > 0:
                final_amount = d_amt
                tx_type = "expense"
                amt_state = d_st
                total_debits += d_amt
            else:
                is_valid = False
                err_msg = "Neither debit nor credit contained a valid non-zero amount"
                final_amount = Decimal("0.00")
                amt_state = FieldConfidenceState.MISSING
        elif col_map["amount"] >= 0:
            a_val, a_st, a_err = normalize_amount(raw_amount)
            if a_val is not None:
                final_amount = a_val
                amt_state = a_st
                # Check for sign or type column
                if "-" in raw_amount or (col_map["type"] >= 0 and "dr" in row[col_map["type"]].lower()):
                    tx_type = "expense"
                    total_debits += a_val
                elif col_map["type"] >= 0 and any(k in row[col_map["type"]].lower() for k in ["cr", "credit", "deposit"]):
                    tx_type = "income"
                    total_credits += a_val
                else:
                    # Default: positive amount in single amount column without type column is categorized by keyword or treated as expense
                    tx_type = "expense"
                    total_debits += a_val
            else:
                is_valid = False
                err_msg = a_err or "Invalid amount format"
                final_amount = Decimal("0.00")
                amt_state = a_st
        else:
            is_valid = False
            err_msg = "No amount, debit, or credit column detected"
            final_amount = Decimal("0.00")
            amt_state = FieldConfidenceState.MISSING

        if not dt:
            is_valid = False
            err_msg = (err_msg + "; " if err_msg else "") + (dt_err or "Invalid date")

        # Running balance capture
        if raw_balance:
            bal_val, bal_st, _ = normalize_amount(raw_balance)
            if bal_val is not None:
                last_row_balance = bal_val

        # Check internal duplicate within statement file
        row_sig = (dt.date() if dt else raw_date, final_amount, tx_type, raw_desc.strip())
        if row_sig in seen_row_signatures:
            err_msg = (err_msg + "; " if err_msg else "") + "Duplicate row repeated inside uploaded statement"
            # It's an internal repeat, keep is_valid flag to alert user
        seen_row_signatures.add(row_sig)

        cat_id, cat_name, cat_conf = match_category_by_description(raw_desc, tx_type, categories)

        item = IngestionItem(
            id=str(uuid.uuid4()),
            row_index=r_idx + 1,
            transaction_date=dt,
            raw_date=raw_date,
            date_state=dt_state,
            description=raw_desc.strip(),
            raw_description=raw_desc,
            amount=final_amount or Decimal("0.00"),
            raw_amount=raw_amount or (raw_debit or raw_credit),
            amount_state=amt_state,
            currency=currency,
            currency_state=FieldConfidenceState.VERIFIED,
            transaction_type=tx_type,
            suggested_category_id=cat_id,
            suggested_category_name=cat_name,
            category_confidence=cat_conf,
            is_valid=is_valid,
            validation_error=err_msg,
            is_selected_for_import=is_valid,
        )
        items.append(item)

    # Reconciliation
    reconciliation = build_statement_reconciliation(
        opening_balance=opening_balance,
        closing_balance=closing_balance or last_row_balance,
        total_credits=total_credits,
        total_debits=total_debits,
    )

    return items, reconciliation, errors


def parse_pdf_statement(
    pdf_bytes: bytes,
    categories: List[Any],
    currency: str = "INR",
) -> Tuple[List[IngestionItem], StatementReconciliation, List[str]]:
    """
    Parses a text-based PDF bank statement by extracting text lines and tabular rows.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    full_text = ""
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            full_text += txt + "\n"

    if not full_text.strip():
        return [], StatementReconciliation(), ["PDF does not contain extractable text (it may be a scanned image)."]

    lines = [line.strip() for line in full_text.splitlines() if line.strip()]

    # Extract opening/closing balances from text
    opening_balance: Optional[Decimal] = None
    closing_balance: Optional[Decimal] = None
    for line in lines:
        line_l = line.lower()
        if "opening balance" in line_l or "balance b/f" in line_l:
            m = re.findall(r"(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})", line)
            if m:
                val, st, _ = normalize_amount(m[-1])
                if val:
                    opening_balance = val
        elif "closing balance" in line_l or "balance c/f" in line_l:
            m = re.findall(r"(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})", line)
            if m:
                val, st, _ = normalize_amount(m[-1])
                if val:
                    closing_balance = val

    # Regex for standard statement rows: Date at beginning, followed by description and amounts
    row_regex = re.compile(
        r"^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\s+(.*?)\s+((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})\s*(Cr|Dr|cr|dr)?$"
    )

    # Multi-amount regex: Date + description + debit/credit + balance
    multi_amount_regex = re.compile(
        r"^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\s+(.*?)\s+((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})\s+((?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2})"
    )

    items: List[IngestionItem] = []
    total_debits = Decimal("0.00")
    total_credits = Decimal("0.00")
    last_balance: Optional[Decimal] = None
    seen_row_signatures = set()

    for idx, line in enumerate(lines):
        m_multi = multi_amount_regex.match(line)
        m_single = row_regex.match(line)

        if m_multi:
            raw_date, raw_desc, amt_str, bal_str = m_multi.groups()
            dt, dt_st, dt_err = parse_transaction_date(raw_date)
            val, amt_st, amt_err = normalize_amount(amt_str)
            bal_val, _, _ = normalize_amount(bal_str)
            if bal_val:
                last_balance = bal_val

            tx_type = "expense"
            # Infer direction from balance change if previous balance exists
            if last_balance is not None and bal_val is not None and val is not None:
                if bal_val > last_balance:
                    tx_type = "income"
                    total_credits += val
                else:
                    tx_type = "expense"
                    total_debits += val
            elif val is not None:
                total_debits += val

            cat_id, cat_name, cat_conf = match_category_by_description(raw_desc, tx_type, categories)

            is_valid = dt is not None and val is not None and val > 0
            err_msg = dt_err or amt_err

            item = IngestionItem(
                id=str(uuid.uuid4()),
                row_index=idx + 1,
                transaction_date=dt,
                raw_date=raw_date,
                date_state=dt_st,
                description=raw_desc.strip(),
                raw_description=raw_desc,
                amount=val or Decimal("0.00"),
                raw_amount=amt_str,
                amount_state=amt_st,
                currency=currency,
                currency_state=FieldConfidenceState.VERIFIED,
                transaction_type=tx_type,
                suggested_category_id=cat_id,
                suggested_category_name=cat_name,
                category_confidence=cat_conf,
                is_valid=is_valid,
                validation_error=err_msg,
                is_selected_for_import=is_valid,
            )
            items.append(item)

        elif m_single:
            raw_date, raw_desc, amt_str, cr_dr = m_single.groups()
            dt, dt_st, dt_err = parse_transaction_date(raw_date)
            val, amt_st, amt_err = normalize_amount(amt_str)

            tx_type = "expense"
            if cr_dr and "cr" in cr_dr.lower():
                tx_type = "income"
                if val:
                    total_credits += val
            else:
                if val:
                    total_debits += val

            cat_id, cat_name, cat_conf = match_category_by_description(raw_desc, tx_type, categories)
            is_valid = dt is not None and val is not None and val > 0
            err_msg = dt_err or amt_err

            item = IngestionItem(
                id=str(uuid.uuid4()),
                row_index=idx + 1,
                transaction_date=dt,
                raw_date=raw_date,
                date_state=dt_st,
                description=raw_desc.strip(),
                raw_description=raw_desc,
                amount=val or Decimal("0.00"),
                raw_amount=amt_str,
                amount_state=amt_st,
                currency=currency,
                currency_state=FieldConfidenceState.VERIFIED,
                transaction_type=tx_type,
                suggested_category_id=cat_id,
                suggested_category_name=cat_name,
                category_confidence=cat_conf,
                is_valid=is_valid,
                validation_error=err_msg,
                is_selected_for_import=is_valid,
            )
            items.append(item)

    reconciliation = build_statement_reconciliation(
        opening_balance=opening_balance,
        closing_balance=closing_balance or last_balance,
        total_credits=total_credits,
        total_debits=total_debits,
    )

    return items, reconciliation, []


def build_statement_reconciliation(
    opening_balance: Optional[Decimal],
    closing_balance: Optional[Decimal],
    total_credits: Decimal,
    total_debits: Decimal,
) -> StatementReconciliation:
    """
    Calculates statement reconciliation:
    calculated_closing = opening_balance + total_credits - total_debits
    Flags discrepancies transparently without fabricating numbers.
    """
    if opening_balance is None or closing_balance is None:
        return StatementReconciliation(
            can_reconcile=False,
            opening_balance=opening_balance,
            closing_balance=closing_balance,
            total_credits=total_credits,
            total_debits=total_debits,
            is_reconciled=False,
            explanation="Statement did not provide both opening and closing balances required for full reconciliation.",
        )

    calculated = (opening_balance + total_credits - total_debits).quantize(Decimal("0.01"))
    diff = (calculated - closing_balance).quantize(Decimal("0.01"))
    is_reconciled = (diff == Decimal("0.00"))

    explanation = None
    if is_reconciled:
        explanation = f"Statement reconciled: Opening ({opening_balance}) + Credits ({total_credits}) - Debits ({total_debits}) = Closing ({closing_balance})."
    else:
        explanation = (
            f"Reconciliation discrepancy detected! Expected closing balance {calculated} differs from stated closing balance {closing_balance} by {abs(diff)}."
        )

    return StatementReconciliation(
        can_reconcile=True,
        opening_balance=opening_balance,
        closing_balance=closing_balance,
        calculated_closing_balance=calculated,
        total_credits=total_credits,
        total_debits=total_debits,
        is_reconciled=is_reconciled,
        discrepancy_amount=diff if not is_reconciled else None,
        explanation=explanation,
    )
