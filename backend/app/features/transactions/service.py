import csv
import io
import re
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import Transaction, TransactionType, TransactionStatus, Category, CategoryType, Account
from app.shared.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    StatementImportPreviewItem,
    StatementImportPreviewResponse,
    StatementImportConfirmRequest,
    StatementImportConfirmResponse,
)


class TransactionService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def create(self, data: TransactionCreate) -> TransactionResponse:
        # Verify account ownership
        account = await self.db.get(Account, data.account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied")

        # Verify transfer destination if transfer
        to_account_id = None
        if data.transaction_type == TransactionType.TRANSFER:
            if not data.to_account_id:
                raise ValueError("Destination account is required for transfers")
            if data.to_account_id == data.account_id:
                raise ValueError("Source and destination accounts must be different")
            to_account = await self.db.get(Account, data.to_account_id)
            if not to_account or to_account.owner_id != self.owner_id:
                raise ValueError("Destination account not found or access denied")
            to_account_id = data.to_account_id

        # Verify category if provided
        if data.category_id:
            category = await self.db.get(Category, data.category_id)
            if not category or (category.owner_id and category.owner_id != self.owner_id):
                raise ValueError("Category not found or access denied")
            if category.category_type != CategoryType.BOTH and category.category_type != data.transaction_type:
                raise ValueError(f"Category type mismatch: expected {data.transaction_type.value}, got {category.category_type.value}")

        transaction = Transaction(
            owner_id=self.owner_id,
            account_id=data.account_id,
            to_account_id=to_account_id,
            category_id=data.category_id,
            amount=data.amount,
            currency=data.currency,
            transaction_type=data.transaction_type,
            description=data.description,
            transaction_date=data.transaction_date,
            source=getattr(data, "source", None) or "manual",
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        return TransactionResponse.model_validate(transaction)

    async def get_by_id(self, transaction_id: int) -> Optional[TransactionResponse]:
        result = await self.db.execute(
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(
                and_(Transaction.id == transaction_id, Transaction.owner_id == self.owner_id)
            )
        )
        transaction = result.scalar_one_or_none()
        if not transaction:
            return None
        return TransactionResponse.model_validate(transaction)

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        account_id: Optional[int] = None,
        transaction_type: Optional[TransactionType] = None,
        category_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> tuple[List[TransactionResponse], int]:
        conditions = [Transaction.owner_id == self.owner_id]

        if account_id:
            conditions.append(Transaction.account_id == account_id)
        if transaction_type:
            conditions.append(Transaction.transaction_type == transaction_type)
        if category_id:
            conditions.append(Transaction.category_id == category_id)
        if start_date:
            conditions.append(Transaction.transaction_date >= start_date)
        if end_date:
            conditions.append(Transaction.transaction_date <= end_date)

        count_query = select(func.count(Transaction.id)).where(and_(*conditions))
        total = await self.db.scalar(count_query) or 0

        query = (
            select(Transaction)
            .options(selectinload(Transaction.category))
            .where(and_(*conditions))
            .order_by(desc(Transaction.transaction_date), desc(Transaction.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        transactions = result.scalars().all()

        return [TransactionResponse.model_validate(t) for t in transactions], total

    async def update(self, transaction_id: int, data: TransactionUpdate) -> Optional[TransactionResponse]:
        result = await self.db.execute(
            select(Transaction).where(
                and_(Transaction.id == transaction_id, Transaction.owner_id == self.owner_id)
            )
        )
        transaction = result.scalar_one_or_none()
        if not transaction:
            return None

        update_data = data.model_dump(exclude_unset=True)

        if "account_id" in update_data:
            account = await self.db.get(Account, update_data["account_id"])
            if not account or account.owner_id != self.owner_id:
                raise ValueError("Account not found or access denied")

        if "category_id" in update_data and update_data["category_id"]:
            category = await self.db.get(Category, update_data["category_id"])
            if not category or (category.owner_id and category.owner_id != self.owner_id):
                raise ValueError("Category not found or access denied")
            txn_type = update_data.get("transaction_type", transaction.transaction_type)
            if category.category_type != CategoryType.BOTH and category.category_type != txn_type:
                raise ValueError(f"Category type mismatch: expected {txn_type.value}, got {category.category_type.value}")

        for field, value in update_data.items():
            setattr(transaction, field, value)

        await self.db.commit()
        await self.db.refresh(transaction)
        return TransactionResponse.model_validate(transaction)

    async def delete(self, transaction_id: int) -> bool:
        result = await self.db.execute(
            select(Transaction).where(
                and_(Transaction.id == transaction_id, Transaction.owner_id == self.owner_id)
            )
        )
        transaction = result.scalar_one_or_none()
        if not transaction:
            return False

        await self.db.delete(transaction)
        await self.db.commit()
        return True

    async def preview_import(
        self,
        account_id: int,
        file_content: str,
        filename: str,
    ) -> StatementImportPreviewResponse:
        account = await self.db.get(Account, account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied")

        # Fetch categories for deterministic matching
        cat_res = await self.db.execute(
            select(Category).where(
                or_(Category.owner_id == self.owner_id, Category.is_system == True)
            )
        )
        categories = cat_res.scalars().all()

        # Category keyword index
        def match_category(desc_text: str, tx_type: TransactionType) -> tuple[Optional[int], Optional[str]]:
            lower = (desc_text or "").lower()
            if tx_type == TransactionType.INCOME:
                for c in categories:
                    if c.category_type in (CategoryType.INCOME, CategoryType.BOTH) and any(
                        k in lower for k in ["salary", "payroll", "dividend", "interest", "deposit", "transfer in"]
                    ):
                        return c.id, c.name
            else:
                keyword_rules = [
                    (["grocery", "supermarket", "food", "whole foods", "trader", "safeway", "walmart", "market"], ["Groceries", "Food"]),
                    (["uber", "lyft", "metro", "transit", "fuel", "gas", "petrol", "parking"], ["Transport"]),
                    (["rent", "apartment", "lease", "mortgage", "housing"], ["Housing"]),
                    (["electric", "power", "water", "wifi", "internet", "utility", "utilities", "broadband"], ["Utilities"]),
                    (["netflix", "spotify", "hulu", "cinema", "entertainment", "prime", "movie"], ["Entertainment"]),
                    (["clinic", "pharmacy", "doctor", "health", "hospital", "medical"], ["Healthcare"]),
                ]
                for kw_list, cat_target in keyword_rules:
                    if any(k in lower for k in kw_list):
                        for c in categories:
                            if any(target.lower() in c.name.lower() for target in cat_target):
                                return c.id, c.name
            return None, None

        # Fetch existing transactions on this account for duplicate detection
        existing_tx_res = await self.db.execute(
            select(Transaction).where(
                and_(Transaction.owner_id == self.owner_id, Transaction.account_id == account_id)
            )
        )
        existing_txs = existing_tx_res.scalars().all()
        existing_keys = {
            (t.transaction_date.date(), t.amount, t.transaction_type)
            for t in existing_txs
        }

        # Date parsing helper
        def parse_date(date_str: str) -> Optional[datetime]:
            cleaned = date_str.strip()
            formats = [
                "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y",
                "%Y/%m/%d", "%d.%m.%Y", "%Y-%m-%d %H:%M:%S",
                "%b %d, %Y", "%d %b %Y", "%B %d, %Y"
            ]
            for fmt in formats:
                try:
                    return datetime.strptime(cleaned, fmt)
                except ValueError:
                    continue
            return None

        # Amount parsing helper
        def parse_amount(amt_str: str) -> Optional[Decimal]:
            if not amt_str:
                return None
            cleaned = re.sub(r"[^\d.-]", "", amt_str.strip())
            if not cleaned or cleaned == "-":
                return None
            try:
                val = Decimal(cleaned).quantize(Decimal("0.01"))
                return val
            except Exception:
                return None

        # Parse CSV
        lines = [line.strip() for line in file_content.splitlines() if line.strip()]
        if not lines:
            raise ValueError("Uploaded statement file is empty")

        reader = csv.reader(lines)
        rows = list(reader)
        if not rows:
            raise ValueError("No parseable rows found in statement")

        # Header detection
        header_row = None
        data_rows = []
        col_indices = {"date": -1, "desc": -1, "amount": -1, "debit": -1, "credit": -1, "type": -1}

        first_row_lower = [c.strip().lower() for c in rows[0]]
        has_header = any(
            any(k in c for k in ["date", "desc", "amount", "debit", "credit", "narrative", "payee"])
            for c in first_row_lower
        )

        if has_header:
            header_row = first_row_lower
            data_rows = rows[1:]
            for idx, col in enumerate(header_row):
                if any(k in col for k in ["date", "txn_date", "transaction date"]):
                    col_indices["date"] = idx
                elif any(k in col for k in ["desc", "narrative", "payee", "particular", "merchant", "details"]):
                    col_indices["desc"] = idx
                elif any(k in col for k in ["debit", "withdrawal"]):
                    col_indices["debit"] = idx
                elif any(k in col for k in ["credit", "deposit"]):
                    col_indices["credit"] = idx
                elif any(k in col for k in ["amount", "txn_amount"]):
                    col_indices["amount"] = idx
                elif any(k in col for k in ["type", "direction"]):
                    col_indices["type"] = idx
        else:
            data_rows = rows
            # Default fallback positions: col 0 = date, col 1 = desc, col 2 = amount
            col_indices["date"] = 0
            col_indices["desc"] = 1 if len(rows[0]) > 1 else -1
            col_indices["amount"] = 2 if len(rows[0]) > 2 else (1 if len(rows[0]) == 2 else -1)

        preview_items: List[StatementImportPreviewItem] = []
        seen_in_batch = set()

        for idx, row in enumerate(data_rows):
            if not row or all(not cell.strip() for cell in row):
                continue

            # Extract date
            raw_date = row[col_indices["date"]] if col_indices["date"] >= 0 and col_indices["date"] < len(row) else ""
            parsed_dt = parse_date(raw_date)

            # Extract description
            raw_desc = (
                row[col_indices["desc"]] if col_indices["desc"] >= 0 and col_indices["desc"] < len(row) else f"Imported Row #{idx + 1}"
            ).strip()

            # Extract amount and direction
            tx_type = TransactionType.EXPENSE
            final_amount: Optional[Decimal] = None
            is_valid = True
            error_msg: Optional[str] = None

            if col_indices["debit"] >= 0 and col_indices["credit"] >= 0:
                raw_debit = row[col_indices["debit"]] if col_indices["debit"] < len(row) else ""
                raw_credit = row[col_indices["credit"]] if col_indices["credit"] < len(row) else ""
                debit_amt = parse_amount(raw_debit)
                credit_amt = parse_amount(raw_credit)

                if credit_amt and credit_amt > 0:
                    final_amount = credit_amt
                    tx_type = TransactionType.INCOME
                elif debit_amt and debit_amt > 0:
                    final_amount = debit_amt
                    tx_type = TransactionType.EXPENSE
                else:
                    is_valid = False
                    error_msg = "No debit or credit amount detected"
            elif col_indices["amount"] >= 0 and col_indices["amount"] < len(row):
                raw_amt = row[col_indices["amount"]]
                parsed_amt = parse_amount(raw_amt)
                if parsed_amt is not None:
                    if parsed_amt < 0:
                        final_amount = abs(parsed_amt)
                        tx_type = TransactionType.EXPENSE
                    else:
                        final_amount = parsed_amt
                        # If type column is available
                        if col_indices["type"] >= 0 and col_indices["type"] < len(row):
                            t_val = row[col_indices["type"]].lower()
                            if any(k in t_val for k in ["cr", "credit", "income", "deposit"]):
                                tx_type = TransactionType.INCOME
                            else:
                                tx_type = TransactionType.EXPENSE
                        else:
                            tx_type = TransactionType.EXPENSE
                else:
                    is_valid = False
                    error_msg = "Invalid or missing amount"
            else:
                is_valid = False
                error_msg = "No amount column found"

            if not parsed_dt:
                is_valid = False
                error_msg = error_msg or "Invalid date format"
                parsed_dt = datetime.utcnow()

            if final_amount is None or final_amount <= 0:
                is_valid = False
                error_msg = error_msg or "Amount must be greater than zero"
                final_amount = Decimal("0.00")

            # Duplicate check against existing DB transactions & previous rows in batch
            batch_key = (parsed_dt.date(), final_amount, tx_type)
            is_dup = (batch_key in existing_keys) or (batch_key in seen_in_batch)
            if is_valid:
                seen_in_batch.add(batch_key)

            # Match category
            cat_id, cat_name = match_category(raw_desc, tx_type)

            preview_items.append(
                StatementImportPreviewItem(
                    row_index=idx,
                    transaction_date=parsed_dt,
                    description=raw_desc,
                    amount=final_amount,
                    transaction_type=tx_type,
                    suggested_category_id=cat_id,
                    suggested_category_name=cat_name,
                    is_duplicate=is_dup,
                    is_valid=is_valid,
                    error=error_msg,
                )
            )

        valid_count = sum(1 for it in preview_items if it.is_valid and not it.is_duplicate)
        duplicate_count = sum(1 for it in preview_items if it.is_duplicate)

        return StatementImportPreviewResponse(
            account_id=account.id,
            account_name=account.name,
            total_rows=len(preview_items),
            valid_count=valid_count,
            duplicate_count=duplicate_count,
            items=preview_items,
        )

    async def confirm_import(
        self,
        request: StatementImportConfirmRequest,
    ) -> StatementImportConfirmResponse:
        account = await self.db.get(Account, request.account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied")

        if not request.transactions:
            raise ValueError("No transactions provided to import")

        created_txs = []
        for it in request.transactions:
            if it.amount <= 0:
                continue

            tx = Transaction(
                owner_id=self.owner_id,
                account_id=request.account_id,
                category_id=it.category_id,
                amount=it.amount,
                currency=account.currency,
                transaction_type=it.transaction_type,
                description=it.description,
                transaction_date=it.transaction_date,
                status=TransactionStatus.COMPLETED,
                source="statement_import",
            )
            self.db.add(tx)
            created_txs.append(tx)

        await self.db.commit()
        return StatementImportConfirmResponse(
            imported_count=len(created_txs),
            message=f"Successfully imported {len(created_txs)} transactions into {account.name}.",
        )