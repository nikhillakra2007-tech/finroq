from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.db.models import AccountType, TransactionType, TransactionStatus, CategoryType, RecurrenceFrequency, RecurrenceStatus


def validate_decimal_places(v: Decimal, max_places: int = 2) -> Decimal:
    if v is not None:
        exp = v.as_tuple().exponent
        if exp < -max_places:
            raise ValueError(f"Value must have at most {max_places} decimal places")
    return v


class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    account_type: AccountType = AccountType.CHECKING
    currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    initial_balance: Decimal = Field(default=Decimal("0.00"), ge=0)
    
    @field_validator("initial_balance")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    account_type: Optional[AccountType] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    initial_balance: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    
    @field_validator("initial_balance")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class AccountResponse(AccountBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AccountListResponse(BaseModel):
    accounts: List[AccountResponse]
    total: int
    page: int
    page_size: int


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    category_type: CategoryType = CategoryType.EXPENSE


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: Optional[str]
    is_system: bool
    created_at: datetime
    updated_at: datetime


class TransactionBase(BaseModel):
    account_id: int = Field(..., gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    transaction_type: TransactionType
    description: Optional[str] = Field(None, max_length=512)
    transaction_date: datetime
    
    @field_validator("amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    transaction_type: Optional[TransactionType] = None
    description: Optional[str] = Field(None, max_length=512)
    transaction_date: Optional[datetime] = None
    
    @field_validator("amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    status: Optional[TransactionStatus] = TransactionStatus.COMPLETED
    to_account_id: Optional[int] = None
    related_transaction_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime



class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int


class SummaryPeriod(BaseModel):
    start_date: datetime
    end_date: datetime


class FinancialSummary(BaseModel):
    period: SummaryPeriod
    total_income: Decimal
    total_expenses: Decimal
    net_cash_flow: Decimal
    account_balances: List["AccountBalance"]
    category_breakdown: List["CategoryBreakdown"]
    net_worth: Optional[Decimal] = None
    previous_period: Optional[SummaryPeriod] = None
    income_change_percent: Optional[Decimal] = None
    expense_change_percent: Optional[Decimal] = None
    net_cash_flow_change_percent: Optional[Decimal] = None


class AccountBalance(BaseModel):
    account_id: int
    account_name: str
    account_type: AccountType
    currency: str
    current_balance: Decimal
    period_income: Decimal
    period_expenses: Decimal


class CategoryBreakdown(BaseModel):
    category_id: Optional[int]
    category_name: str
    category_type: CategoryType
    total_amount: Decimal
    transaction_count: int


class BudgetBase(BaseModel):
    category_id: int = Field(..., gt=0)
    budget_year: int = Field(..., ge=1900, le=2100)
    budget_month: int = Field(..., ge=1, le=12)
    allocated_amount: Decimal = Field(..., ge=0)

    @field_validator("allocated_amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    allocated_amount: Optional[Decimal] = Field(None, ge=0)

    @field_validator("allocated_amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    category_id: int
    category_name: str
    budget_year: int
    budget_month: int
    allocated_amount: Decimal
    actual_spending: Decimal
    remaining_amount: Decimal
    utilization_percent: Optional[Decimal]
    is_overspent: bool
    created_at: datetime
    updated_at: datetime


class RecurringTransactionBase(BaseModel):
    account_id: int = Field(..., gt=0)
    to_account_id: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field("USD", min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    transaction_type: TransactionType
    frequency: RecurrenceFrequency
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=512)

    @field_validator("amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class RecurringTransactionCreate(RecurringTransactionBase):
    pass


class RecurringTransactionUpdate(BaseModel):
    account_id: Optional[int] = Field(None, gt=0)
    to_account_id: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    transaction_type: Optional[TransactionType] = None
    frequency: Optional[RecurrenceFrequency] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[RecurrenceStatus] = None
    description: Optional[str] = Field(None, max_length=512)

    @field_validator("amount")
    @classmethod
    def check_decimal_places(cls, v: Decimal) -> Decimal:
        return validate_decimal_places(v)


class RecurringTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    account_id: int
    account_name: str
    to_account_id: Optional[int] = None
    to_account_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    amount: Decimal
    currency: str
    transaction_type: TransactionType
    frequency: RecurrenceFrequency
    start_date: datetime
    end_date: Optional[datetime] = None
    next_occurrence: Optional[datetime] = None
    status: RecurrenceStatus
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RecurringRecordOccurrenceRequest(BaseModel):
    occurrence_date: Optional[datetime] = None


class RecurringRecordOccurrenceResponse(BaseModel):
    transaction: TransactionResponse
    already_recorded: bool
    next_occurrence: Optional[datetime] = None


FinancialSummary.model_rebuild()