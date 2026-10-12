import calendar
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import (
    RecurringTransaction,
    RecurringOccurrence,
    Transaction,
    Account,
    Category,
    CategoryType,
    TransactionType,
    TransactionStatus,
    RecurrenceFrequency,
    RecurrenceStatus,
)
from app.shared.schemas import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionResponse,
    RecurringRecordOccurrenceResponse,
    TransactionResponse,
)


def compute_next_occurrence(
    frequency: RecurrenceFrequency | str,
    current_occurrence: datetime,
    start_date: datetime,
    end_date: Optional[datetime] = None,
) -> Optional[datetime]:
    """Calculate the next scheduled occurrence after current_occurrence.

    Rules:
    - Daily: current + 1 day
    - Weekly: current + 1 week
    - Monthly: advances one month while preserving start_date's day of month.
      If the target month has fewer days (e.g. 28, 29, 30 vs 31), clamps to the
      last day of that month without mutating future months.
    - Yearly: advances one year. For Feb 29 leap years, clamps to Feb 28 on
      non-leap years.
    - If the resulting date exceeds end_date, returns None.
    - Preserves time from start_date.
    """
    freq = frequency.value if isinstance(frequency, RecurrenceFrequency) else frequency

    if freq == RecurrenceFrequency.DAILY.value:
        next_dt = current_occurrence + timedelta(days=1)
    elif freq == RecurrenceFrequency.WEEKLY.value:
        next_dt = current_occurrence + timedelta(weeks=1)
    elif freq == RecurrenceFrequency.MONTHLY.value:
        cur_year = current_occurrence.year
        cur_month = current_occurrence.month
        if cur_month == 12:
            next_year = cur_year + 1
            next_month = 1
        else:
            next_year = cur_year
            next_month = cur_month + 1

        max_day = calendar.monthrange(next_year, next_month)[1]
        target_day = min(start_date.day, max_day)
        next_dt = current_occurrence.replace(
            year=next_year,
            month=next_month,
            day=target_day,
            hour=start_date.hour,
            minute=start_date.minute,
            second=start_date.second,
            microsecond=start_date.microsecond,
        )
    elif freq == RecurrenceFrequency.YEARLY.value:
        next_year = current_occurrence.year + 1
        target_month = start_date.month
        max_day = calendar.monthrange(next_year, target_month)[1]
        target_day = min(start_date.day, max_day)
        next_dt = current_occurrence.replace(
            year=next_year,
            month=target_month,
            day=target_day,
            hour=start_date.hour,
            minute=start_date.minute,
            second=start_date.second,
            microsecond=start_date.microsecond,
        )
    else:
        raise ValueError(f"Unsupported recurrence frequency: {frequency}")

    if end_date and next_dt > end_date:
        return None

    return next_dt


class RecurringService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def _validate_accounts(
        self,
        account_id: int,
        to_account_id: Optional[int],
        transaction_type: TransactionType,
    ) -> Account:
        account = await self.db.get(Account, account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied")
        if not account.is_active:
            raise ValueError("Cannot use inactive account")

        if transaction_type == TransactionType.TRANSFER:
            if not to_account_id:
                raise ValueError("Destination account required for transfer")
            if to_account_id == account_id:
                raise ValueError("Source and destination accounts must differ")
            to_account = await self.db.get(Account, to_account_id)
            if not to_account or to_account.owner_id != self.owner_id:
                raise ValueError("Destination account not found or access denied")
            if not to_account.is_active:
                raise ValueError("Destination account is inactive")
        return account

    async def _validate_category(
        self,
        category_id: Optional[int],
        transaction_type: TransactionType,
    ) -> Optional[Category]:
        if not category_id:
            return None
        category = await self.db.get(Category, category_id)
        if not category or (category.owner_id and category.owner_id != self.owner_id):
            raise ValueError("Category not found or access denied")

        if transaction_type == TransactionType.INCOME and category.category_type == CategoryType.EXPENSE:
            raise ValueError("Category is for expenses only, but transaction is income")
        if transaction_type == TransactionType.EXPENSE and category.category_type == CategoryType.INCOME:
            raise ValueError("Category is for income only, but transaction is expense")
        return category

    async def _to_response(self, recurring: RecurringTransaction) -> RecurringTransactionResponse:
        account = await self.db.get(Account, recurring.account_id)
        to_account = await self.db.get(Account, recurring.to_account_id) if recurring.to_account_id else None
        category = await self.db.get(Category, recurring.category_id) if recurring.category_id else None

        return RecurringTransactionResponse(
            id=recurring.id,
            owner_id=recurring.owner_id,
            account_id=recurring.account_id,
            account_name=account.name if account else "Unknown",
            to_account_id=recurring.to_account_id,
            to_account_name=to_account.name if to_account else None,
            category_id=recurring.category_id,
            category_name=category.name if category else None,
            amount=recurring.amount,
            currency=recurring.currency,
            transaction_type=recurring.transaction_type,
            frequency=recurring.frequency,
            start_date=recurring.start_date,
            end_date=recurring.end_date,
            next_occurrence=recurring.next_occurrence,
            status=recurring.status,
            description=recurring.description,
            created_at=recurring.created_at,
            updated_at=recurring.updated_at,
        )

    async def create(self, data: RecurringTransactionCreate) -> RecurringTransactionResponse:
        if data.end_date and data.end_date < data.start_date:
            raise ValueError("End date cannot be earlier than start date")

        await self._validate_accounts(data.account_id, data.to_account_id, data.transaction_type)
        await self._validate_category(data.category_id, data.transaction_type)

        recurring = RecurringTransaction(
            owner_id=self.owner_id,
            account_id=data.account_id,
            to_account_id=data.to_account_id if data.transaction_type == TransactionType.TRANSFER else None,
            category_id=data.category_id,
            amount=data.amount,
            currency=data.currency,
            transaction_type=data.transaction_type,
            frequency=data.frequency,
            start_date=data.start_date,
            end_date=data.end_date,
            next_occurrence=data.start_date,
            status=RecurrenceStatus.ACTIVE,
            description=data.description,
        )
        self.db.add(recurring)
        await self.db.commit()
        await self.db.refresh(recurring)
        return await self._to_response(recurring)

    async def list(
        self,
        status: Optional[RecurrenceStatus] = None,
        account_id: Optional[int] = None,
    ) -> List[RecurringTransactionResponse]:
        query = select(RecurringTransaction).where(RecurringTransaction.owner_id == self.owner_id)
        if status:
            query = query.where(RecurringTransaction.status == status)
        if account_id:
            query = query.where(RecurringTransaction.account_id == account_id)
        query = query.order_by(RecurringTransaction.created_at.desc())

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        responses = []
        for item in items:
            responses.append(await self._to_response(item))
        return responses

    async def get_by_id(self, recurring_id: int) -> Optional[RecurringTransactionResponse]:
        result = await self.db.execute(
            select(RecurringTransaction).where(
                and_(
                    RecurringTransaction.id == recurring_id,
                    RecurringTransaction.owner_id == self.owner_id,
                )
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        return await self._to_response(item)

    async def update(self, recurring_id: int, data: RecurringTransactionUpdate) -> Optional[RecurringTransactionResponse]:
        result = await self.db.execute(
            select(RecurringTransaction).where(
                and_(
                    RecurringTransaction.id == recurring_id,
                    RecurringTransaction.owner_id == self.owner_id,
                )
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return None

        update_data = data.model_dump(exclude_unset=True)

        account_id = update_data.get("account_id", item.account_id)
        to_account_id = update_data.get("to_account_id", item.to_account_id)
        transaction_type = update_data.get("transaction_type", item.transaction_type)
        category_id = update_data.get("category_id", item.category_id)
        start_date = update_data.get("start_date", item.start_date)
        end_date = update_data.get("end_date", item.end_date)

        if end_date and end_date < start_date:
            raise ValueError("End date cannot be earlier than start date")

        if "account_id" in update_data or "to_account_id" in update_data or "transaction_type" in update_data:
            await self._validate_accounts(account_id, to_account_id, transaction_type)
        if "category_id" in update_data or "transaction_type" in update_data:
            await self._validate_category(category_id, transaction_type)

        for key, value in update_data.items():
            setattr(item, key, value)

        await self.db.commit()
        await self.db.refresh(item)
        return await self._to_response(item)

    async def pause(self, recurring_id: int) -> Optional[RecurringTransactionResponse]:
        return await self.update(recurring_id, RecurringTransactionUpdate(status=RecurrenceStatus.PAUSED))

    async def resume(self, recurring_id: int) -> Optional[RecurringTransactionResponse]:
        return await self.update(recurring_id, RecurringTransactionUpdate(status=RecurrenceStatus.ACTIVE))

    async def delete(self, recurring_id: int) -> bool:
        result = await self.db.execute(
            select(RecurringTransaction).where(
                and_(
                    RecurringTransaction.id == recurring_id,
                    RecurringTransaction.owner_id == self.owner_id,
                )
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return False
        await self.db.delete(item)
        await self.db.commit()
        return True

    async def record_occurrence(
        self,
        recurring_id: int,
        occurrence_date: Optional[datetime] = None,
    ) -> RecurringRecordOccurrenceResponse:
        result = await self.db.execute(
            select(RecurringTransaction).where(
                and_(
                    RecurringTransaction.id == recurring_id,
                    RecurringTransaction.owner_id == self.owner_id,
                )
            )
        )
        recurring = result.scalar_one_or_none()
        if not recurring:
            raise ValueError("Recurring transaction not found")

        if recurring.status == RecurrenceStatus.PAUSED:
            raise ValueError("Cannot record occurrence for a paused recurring transaction")

        target_date = occurrence_date or recurring.next_occurrence
        if not target_date:
            raise ValueError("No scheduled occurrence date to record")

        # Check idempotency
        occ_result = await self.db.execute(
            select(RecurringOccurrence).where(
                and_(
                    RecurringOccurrence.recurring_id == recurring.id,
                    RecurringOccurrence.occurrence_date == target_date,
                )
            )
        )
        existing_occ = occ_result.scalar_one_or_none()
        if existing_occ:
            existing_txn = await self.db.get(Transaction, existing_occ.transaction_id)
            return RecurringRecordOccurrenceResponse(
                transaction=TransactionResponse.model_validate(existing_txn),
                already_recorded=True,
                next_occurrence=recurring.next_occurrence,
            )

        # Create real transaction
        desc = recurring.description or f"Recurring {recurring.frequency.value}"
        txn = Transaction(
            owner_id=self.owner_id,
            account_id=recurring.account_id,
            to_account_id=recurring.to_account_id,
            category_id=recurring.category_id,
            amount=recurring.amount,
            currency=recurring.currency,
            transaction_type=recurring.transaction_type,
            status=TransactionStatus.COMPLETED,
            description=desc,
            transaction_date=target_date,
            recurring_transaction_id=recurring.id,
        )
        self.db.add(txn)
        await self.db.flush()

        occ = RecurringOccurrence(
            recurring_id=recurring.id,
            transaction_id=txn.id,
            occurrence_date=target_date,
        )
        self.db.add(occ)

        # Advance next occurrence
        if recurring.next_occurrence and target_date >= recurring.next_occurrence:
            recurring.next_occurrence = compute_next_occurrence(
                recurring.frequency,
                target_date,
                recurring.start_date,
                recurring.end_date,
            )

        await self.db.commit()
        await self.db.refresh(txn)

        return RecurringRecordOccurrenceResponse(
            transaction=TransactionResponse.model_validate(txn),
            already_recorded=False,
            next_occurrence=recurring.next_occurrence,
        )
