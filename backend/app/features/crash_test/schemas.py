from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ShockDefinition(BaseModel):
    model_config = {"protected_namespaces": ()}
    shock_type: str = Field(description="e.g. income_loss, income_reduction, expense_spike, essential_inflation, debt_rate_hike, delayed_income")
    description: str
    duration_months: int = 3
    magnitude: Decimal = Field(description="Percentage (e.g. 0.25 for 25%) or absolute currency amount")
    timing_month: int = 1


class FinancialContext(BaseModel):
    model_config = {"protected_namespaces": ()}
    monthly_income: Decimal
    essential_expenses: Decimal
    discretionary_expenses: Decimal
    total_monthly_expenses: Decimal
    monthly_surplus: Decimal
    liquid_reserves: Decimal
    total_debt_balances: Decimal
    monthly_debt_obligations: Decimal
    emergency_runway_months: Decimal
    savings_rate_percent: Decimal
    debt_to_income_percent: Decimal
    currency: str = "USD"
    data_quality_warnings: List[str] = []
    known_constraints: List[str] = []
    observed_transaction_count: int = 0
    accounts_audited_count: int = 0


class ProactiveInvestigation(BaseModel):
    model_config = {"protected_namespaces": ()}
    id: str
    question: str
    hypothesis: str
    status: str = "Completed"  # Pending, Running, Completed, Needs clarification, Failed
    urgency: str = "medium"  # high, medium, low
    potential_impact: str = "medium"  # high, medium, low
    confidence: Decimal = Decimal("0.90")
    evidence_found: str
    observable_result: str


class CrashTestScenarioResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    scenario_key: str
    scenario_name: str
    category: str
    shocks: List[ShockDefinition]
    is_failure: bool
    cash_flow_impact_monthly: Decimal
    first_deficit_month: Optional[int] = None
    minimum_reserve_reached: Decimal
    additional_funding_required: Decimal
    primary_constraint_violated: Optional[str] = None
    monthly_balances: List[Decimal] = []
    explanation: str


class RecoveryPlanCandidate(BaseModel):
    model_config = {"protected_namespaces": ()}
    candidate_id: str
    scenario_key: str
    title: str
    strategy_type: str  # discretionary_freeze, buffer_rebuild, debt_prioritization, recurring_mandate_cut, balanced
    interventions: List[str]
    proposed_monthly_discretionary_cut: Decimal
    proposed_monthly_recurring_cut: Decimal
    monthly_budget_adjustment: Decimal
    projected_runway_extension_months: Decimal
    deficit_reduction_percent: Decimal
    trade_offs: str
    verified: bool = False
    verification_status: str = "unverified"  # verified, repaired_and_verified, rejected
    verification_reason: str = ""
    audit_math: Dict[str, Any] = {}


class VerificationResult(BaseModel):
    model_config = {"protected_namespaces": ()}
    passed: bool
    status: str  # verified, repaired_and_verified, rejected
    failed_constraints: List[str] = []
    repair_attempted: bool = False
    repair_notes: Optional[str] = None
    audit_math: Dict[str, Any] = {}


class RankedRecommendation(BaseModel):
    model_config = {"protected_namespaces": ()}
    id: Optional[int] = None
    scenario_key: str
    title: str
    problem_addressed: str
    why_it_matters: str
    action_steps: List[str]
    expected_impact: Dict[str, Any]
    trade_offs: str
    confidence_score: Decimal
    priority_rank: int
    verification_status: str
    requires_approval: bool = True
    status: str = "proposed"  # proposed, accepted, dismissed


class CrashTestRunRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    simulation_budget: Optional[int] = Field(default=8, ge=3, le=15)
    horizon_months: Optional[int] = Field(default=6, ge=3, le=12)
    custom_shocks: Optional[List[ShockDefinition]] = None


class RecommendationDecisionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    decision: str = Field(description="'accepted', 'dismissed', or 'modified'")
    modification_notes: Optional[str] = None


class CrashTestRunResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    id: str
    status: str
    resilience_score: int
    scenarios_tested_count: int
    failures_detected_count: int
    simulation_budget: int
    context: FinancialContext
    investigations: List[ProactiveInvestigation]
    scenarios: List[CrashTestScenarioResult]
    recommendations: List[RankedRecommendation]
    executive_summary: str
    agent_execution_summary: Optional[List[dict]] = None
    created_at: str


class CrashTestEvaluationBenchmark(BaseModel):
    model_config = {"protected_namespaces": ()}
    synthetic_profiles_tested: int
    agentic_failures_discovered: int
    baseline_failures_discovered: int
    agentic_time_to_first_failure_ms: float
    baseline_time_to_first_failure_ms: float
    duplicate_scenario_rate_percent: float
    recovery_plan_feasibility_rate_percent: float
    runtime_ms: float
    execution_summary: str
