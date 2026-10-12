from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import Transaction, TransactionType, Category, CategoryType, Account
from app.shared.schemas import TransactionCreate, TransactionUpdate, TransactionResponse


class TransactionService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def create(self, data: TransactionCreate) -> TransactionResponse:
        # Verify account ownership
        account = await self.db.get(Account, data.account_id)
        if not account or account.owner_id != self.owner_id:
            raise ValueError("Account not found or access denied")

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
            category_id=data.category_id,
            amount=data.amount,
            currency=data.currency,
            transaction_type=data.transaction_type,
            description=data.description,
            transaction_date=data.transaction_date,
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