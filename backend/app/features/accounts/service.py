from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import Account, AccountType
from app.shared.schemas import AccountCreate, AccountUpdate, AccountResponse


class AccountService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def create(self, data: AccountCreate) -> AccountResponse:
        account = Account(
            owner_id=self.owner_id,
            name=data.name,
            account_type=data.account_type,
            currency=data.currency,
            initial_balance=data.initial_balance,
        )
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        return AccountResponse.model_validate(account)

    async def get_by_id(self, account_id: int) -> Optional[AccountResponse]:
        result = await self.db.execute(
            select(Account).where(
                and_(Account.id == account_id, Account.owner_id == self.owner_id)
            )
        )
        account = result.scalar_one_or_none()
        if not account:
            return None
        return AccountResponse.model_validate(account)

    async def list(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
        account_type: Optional[AccountType] = None,
    ) -> tuple[List[AccountResponse], int]:
        conditions = [Account.owner_id == self.owner_id]
        if is_active is not None:
            conditions.append(Account.is_active == is_active)
        if account_type is not None:
            conditions.append(Account.account_type == account_type)

        count_query = select(func.count(Account.id)).where(and_(*conditions))
        total = await self.db.scalar(count_query) or 0

        query = (
            select(Account)
            .where(and_(*conditions))
            .order_by(Account.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        accounts = result.scalars().all()

        return [AccountResponse.model_validate(a) for a in accounts], total

    async def update(self, account_id: int, data: AccountUpdate) -> Optional[AccountResponse]:
        result = await self.db.execute(
            select(Account).where(
                and_(Account.id == account_id, Account.owner_id == self.owner_id)
            )
        )
        account = result.scalar_one_or_none()
        if not account:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)

        await self.db.commit()
        await self.db.refresh(account)
        return AccountResponse.model_validate(account)

    async def get_balance(self, account_id: int) -> Optional[Decimal]:
        from app.db.models import Transaction, TransactionType
        result = await self.db.execute(
            select(
                func.sum(
                    func.CASE(
                        (Transaction.transaction_type == TransactionType.INCOME, Transaction.amount),
                        else_=-Transaction.amount,
                    )
                )
            ).where(
                and_(
                    Transaction.account_id == account_id,
                    Transaction.owner_id == self.owner_id,
                )
            )
        )
        transaction_sum = result.scalar() or Decimal("0.00")

        account = await self.get_by_id(account_id)
        if not account:
            return None

        return account.initial_balance + transaction_sum