from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Index,
    CheckConstraint,
    UniqueConstraint,
    Boolean,
)
from sqlalchemy.orm import relationship, declared_attr
from app.db.session import Base


def _enum_values(enum_cls):
    return [member.value for member in enum_cls]


class AccountType(str, PyEnum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    CASH = "cash"
    OTHER = "other"


class TransactionType(str, PyEnum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class TransactionStatus(str, PyEnum):
    COMPLETED = "completed"
    PENDING = "pending"
    CANCELLED = "cancelled"


class CategoryType(str, PyEnum):
    INCOME = "income"
    EXPENSE = "expense"
    BOTH = "both"


class RecurrenceFrequency(str, PyEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class RecurrenceStatus(str, PyEnum):
    ACTIVE = "active"
    PAUSED = "paused"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_superuser = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    account_type = Column(SQLEnum(AccountType, values_callable=_enum_values), nullable=False, default=AccountType.CHECKING)
    currency = Column(String(3), nullable=False, default="USD")
    initial_balance = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship(
        "Transaction",
        back_populates="account",
        foreign_keys="Transaction.account_id",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("owner_id", "name", name="uq_accounts_owner_id_name"),
        CheckConstraint("initial_balance >= 0", name="ck_accounts_initial_balance_nonnegative"),
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False)
    category_type = Column(SQLEnum(CategoryType, values_callable=_enum_values), nullable=False, default=CategoryType.EXPENSE)
    owner_id = Column(String(64), nullable=True, index=True)
    is_system = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="category")

    __table_args__ = (
        UniqueConstraint("name", "owner_id", "category_type", name="uq_category_name_owner_type"),
        Index("ix_categories_owner_id_type", "owner_id", "category_type"),
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    transaction_type = Column(SQLEnum(TransactionType, values_callable=_enum_values), nullable=False)
    status = Column(SQLEnum(TransactionStatus, values_callable=_enum_values), nullable=False, default=TransactionStatus.COMPLETED)
    description = Column(String(512), nullable=True)
    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    recurring_transaction_id = Column(Integer, ForeignKey("recurring_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    source = Column(String(32), nullable=False, default="manual")

    account = relationship("Account", back_populates="transactions", foreign_keys=[account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
    category = relationship("Category", back_populates="transactions")
    recurring_transaction = relationship("RecurringTransaction", foreign_keys=[recurring_transaction_id])

    __table_args__ = (
        Index("ix_transactions_owner_account_date", "owner_id", "account_id", "transaction_date"),
        Index("ix_transactions_owner_type_date", "owner_id", "transaction_type", "transaction_date"),
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        CheckConstraint(
            "(transaction_type = 'transfer' AND to_account_id IS NOT NULL) OR (transaction_type <> 'transfer')",
            name="ck_transactions_transfer_requires_destination",
        ),
    )


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    budget_year = Column(Integer, nullable=False)
    budget_month = Column(Integer, nullable=False)
    allocated_amount = Column(Numeric(14, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category")

    __table_args__ = (
        UniqueConstraint(
            "owner_id", "category_id", "budget_year", "budget_month",
            name="uq_budget_owner_category_period",
        ),
        CheckConstraint("budget_month BETWEEN 1 AND 12", name="ck_budgets_month_range"),
        CheckConstraint("allocated_amount >= 0", name="ck_budgets_allocated_nonnegative"),
    )


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    transaction_type = Column(SQLEnum(TransactionType, values_callable=_enum_values), nullable=False)
    frequency = Column(SQLEnum(RecurrenceFrequency, values_callable=_enum_values), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    next_occurrence = Column(DateTime, nullable=True, index=True)
    status = Column(SQLEnum(RecurrenceStatus, values_callable=_enum_values), nullable=False, default=RecurrenceStatus.ACTIVE)
    description = Column(String(512), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", foreign_keys=[account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
    category = relationship("Category")
    occurrences = relationship("RecurringOccurrence", back_populates="recurring_transaction", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_recurring_amount_positive"),
        CheckConstraint(
            "(transaction_type = 'transfer' AND to_account_id IS NOT NULL) OR (transaction_type <> 'transfer')",
            name="ck_recurring_transfer_requires_destination",
        ),
    )


class RecurringOccurrence(Base):
    __tablename__ = "recurring_occurrences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recurring_id = Column(Integer, ForeignKey("recurring_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    occurrence_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    recurring_transaction = relationship("RecurringTransaction", back_populates="occurrences")
    transaction = relationship("Transaction")

    __table_args__ = (
        UniqueConstraint("recurring_id", "occurrence_date", name="uq_recurring_occurrence_date"),
    )