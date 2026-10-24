from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ReadinessTier(str, Enum):
    LIMITED_EVIDENCE = "limited_evidence"      # < 7 days
    PRELIMINARY = "preliminary"                # 7 - 29 days
    PROVISIONAL = "provisional"                # 30 - 89 days
    SUFFICIENTLY_SUPPORTED = "sufficiently_supported"  # >= 90 days


class InsightType(str, Enum):
    RECURRING_SUBSCRIPTION = "recurring_subscription"
    DORMANT_RECURRING = "dormant_recurring"
    EXCESSIVE_CATEGORY_SPEND = "excessive_category_spend"
    RECURRING_COST_INFLATION = "recurring_cost_inflation"
    DUPLICATE_CHARGE_LEAKAGE = "duplicate_charge_leakage"
    ANNUAL_SUBSCRIPTION_EVALUATION = "annual_subscription_evaluation"
    MISSING_RECURRING_PAYMENT = "missing_recurring_payment"


class InsightStatus(str, Enum):
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    PRELIMINARY = "preliminary"
    PROVISIONAL = "provisional"
    SUFFICIENTLY_SUPPORTED = "sufficiently_supported"


class FindingLifecycleStatus(str, Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    KEEP = "keep"
    DISMISSED = "dismissed"
    RESOLVED = "resolved"


class AccountCoverageItem(BaseModel):
    account_id: int
    account_name: str
    account_type: str
    currency: str
    is_active: bool
    transaction_count: int
    earliest_transaction_date: Optional[datetime] = None
    latest_transaction_date: Optional[datetime] = None


class MissingPeriodGap(BaseModel):
    start_date: datetime
    end_date: datetime
    gap_days: int
    description: str


class SupportingTransaction(BaseModel):
    id: int
    transaction_date: datetime
    amount: Decimal
    currency: str = "INR"
    description: Optional[str] = None
    source: str = "manual"


class DataReadinessReport(BaseModel):
    account_age_days: int
    available_history_days: int
    observed_active_days: int
    calendar_days_in_window: int
    earliest_transaction_date: Optional[datetime] = None
    latest_transaction_date: Optional[datetime] = None
    data_freshness_days: Optional[int] = None

    # Provenance counts
    manual_transactions_count: int = 0
    imported_transactions_count: int = 0
    seed_transactions_count: int = 0
    provider_sync_transactions_count: int = 0
    total_eligible_transactions: int = 0

    # Verification & Provider
    verified_coverage_status: str  # "verified_statement", "verified_provider", "unverified_self_reported", "no_history"
    verified_coverage_notes: str
    statement_coverage_start: Optional[datetime] = None
    statement_coverage_end: Optional[datetime] = None
    provider_sync_start: Optional[datetime] = None
    provider_last_sync: Optional[datetime] = None

    # Isolation & Accounts
    is_synthetic_demo_data: bool = False
    accounts_included: List[AccountCoverageItem] = []
    accounts_excluded: List[AccountCoverageItem] = []
    missing_periods: List[MissingPeriodGap] = []

    # Readiness Tier
    readiness_tier: ReadinessTier
    readiness_headline: str
    readiness_explanation: str
    recommended_action: str


class SpendLeakInsight(BaseModel):
    id: str
    insight_type: InsightType
    status: InsightStatus
    title: str
    description: str
    severity: str = "medium"  # "high", "medium", "low"

    # Lifecycle & Auditability
    lifecycle_status: FindingLifecycleStatus = FindingLifecycleStatus.NEW
    user_notes: Optional[str] = None
    first_detected_at: Optional[datetime] = None
    last_detected_at: Optional[datetime] = None

    # Currency isolation
    currency: str = "INR"

    analysis_start_date: Optional[datetime] = None
    analysis_end_date: Optional[datetime] = None
    first_observed_date: Optional[datetime] = None
    last_observed_date: Optional[datetime] = None
    relevant_transaction_count: int = 0
    supporting_transactions: List[SupportingTransaction] = []

    # Price increase details
    previous_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    price_increase_amount: Optional[Decimal] = None
    price_increase_percentage: Optional[Decimal] = None
    price_increase_date: Optional[datetime] = None

    evidence_summary: str
    calculation_method: str
    assumptions: str
    limitations: str
    recommended_action: str

    potential_monthly_savings: Decimal = Decimal("0.00")
    projected_annual_savings: Decimal = Decimal("0.00")
    is_savings_projected: bool = True
    disclaimer: str = "Savings projections represent uncommitted estimates based on recurring pattern elimination and are not guaranteed money recovered."


class SpendLeakSummaryStats(BaseModel):
    total_potential_recurring_count: int = 0
    findings_awaiting_review_count: int = 0
    potential_monthly_savings: Decimal = Decimal("0.00")
    potential_annual_savings: Decimal = Decimal("0.00")
    recently_detected_changes_count: int = 0


class SpendLeakAnalysisResponse(BaseModel):
    readiness: DataReadinessReport
    insights: List[SpendLeakInsight]
    total_monthly_leak: Decimal
    total_annual_leak: Decimal
    recoverable_monthly_estimate: Decimal
    recoverable_annual_estimate: Decimal
    summary_stats: Optional[SpendLeakSummaryStats] = None
    disclaimer: str


class UpdateFindingStatusRequest(BaseModel):
    status: FindingLifecycleStatus
    user_notes: Optional[str] = None
