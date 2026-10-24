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
    Text,
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


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True)
    owner_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.id")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)
    content = Column(String(8192), nullable=False)
    structured_data = Column(String(16384), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    conversation_id = Column(String(36), nullable=True, index=True)
    model = Column(String(64), nullable=False)
    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    tool_calls_count = Column(Integer, nullable=False, default=0)
    duration_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CrashTestRun(Base):
    __tablename__ = "crash_test_runs"

    id = Column(String(36), primary_key=True)
    owner_id = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="completed")
    resilience_score = Column(Integer, nullable=False, default=70)
    scenarios_tested_count = Column(Integer, nullable=False, default=0)
    failures_detected_count = Column(Integer, nullable=False, default=0)
    context_snapshot = Column(Text, nullable=True)
    investigations_json = Column(Text, nullable=True)
    executive_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    scenarios = relationship("CrashTestScenario", back_populates="run", cascade="all, delete-orphan", order_by="CrashTestScenario.id")
    recommendations = relationship("CrashTestRecommendation", back_populates="run", cascade="all, delete-orphan", order_by="CrashTestRecommendation.priority_rank")


class CrashTestScenario(Base):
    __tablename__ = "crash_test_scenarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(36), ForeignKey("crash_test_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_key = Column(String(64), nullable=False)
    scenario_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    shocks_json = Column(Text, nullable=False)
    is_failure = Column(Boolean, nullable=False, default=False)
    cash_flow_impact_monthly = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    first_deficit_month = Column(Integer, nullable=True)
    minimum_reserve_reached = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    additional_funding_required = Column(Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    primary_constraint_violated = Column(String(128), nullable=True)
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    run = relationship("CrashTestRun", back_populates="scenarios")


class CrashTestRecommendation(Base):
    __tablename__ = "crash_test_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(36), ForeignKey("crash_test_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_id = Column(Integer, ForeignKey("crash_test_scenarios.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    problem_addressed = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    action_plan_json = Column(Text, nullable=False)
    expected_impact_json = Column(Text, nullable=False)
    trade_offs = Column(Text, nullable=False)
    confidence_score = Column(Numeric(5, 2), nullable=False, default=Decimal("0.90"))
    priority_rank = Column(Integer, nullable=False, default=1)
    verification_status = Column(String(32), nullable=False, default="verified")
    verification_details = Column(Text, nullable=True)
    requires_approval = Column(Boolean, nullable=False, default=True)
    status = Column(String(32), nullable=False, default="proposed")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    run = relationship("CrashTestRun", back_populates="recommendations")


class UserPlanDecision(Base):
    __tablename__ = "user_plan_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    run_id = Column(String(36), ForeignKey("crash_test_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id = Column(Integer, ForeignKey("crash_test_recommendations.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(32), nullable=False)
    modification_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class SpendLeakFindingRecord(Base):
    __tablename__ = "spend_leak_findings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(String(64), nullable=False, index=True)
    finding_key = Column(String(128), nullable=False, index=True)
    finding_type = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False, default="new")  # "new", "reviewed", "keep", "dismissed", "resolved"
    user_notes = Column(Text, nullable=True)
    first_detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_detected_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("owner_id", "finding_key", name="uq_spend_leak_finding_owner_key"),
        Index("ix_spend_leak_findings_owner_status", "owner_id", "status"),
    )
