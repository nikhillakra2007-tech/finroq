"""Deterministic financial crash-test and simulation engine.

Operates with decimal-safe arithmetic and zero floating-point drift.
Models multi-month liquidity trajectories, reserve depletion, debt obligations,
and constraint violations under adverse financial conditions.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

from app.features.crash_test.schemas import (
    FinancialContext,
    ShockDefinition,
    CrashTestScenarioResult,
)

ZERO = Decimal("0.00")
TWO_PLACES = Decimal("0.01")


def quant(val: Decimal) -> Decimal:
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def simulate_scenario(
    context: FinancialContext,
    scenario_key: str,
    scenario_name: str,
    category: str,
    shocks: List[ShockDefinition],
    horizon_months: int = 6,
    buffer_threshold_months: Decimal = Decimal("1.0"),
) -> CrashTestScenarioResult:
    """Run a deterministic month-by-month cash flow simulation over horizon_months.

    Safety cushion definition: buffer_threshold_months * essential_expenses.
    Failure definition: Liquid savings dip below ZERO, or liquid savings dip below
    safety cushion during an ongoing shock.
    """
    baseline_income = context.monthly_income
    baseline_essential = context.essential_expenses
    baseline_discretionary = context.discretionary_expenses
    baseline_debt = context.monthly_debt_obligations

    running_liquid_reserve = context.liquid_reserves
    monthly_balances: List[Decimal] = [quant(running_liquid_reserve)]

    first_deficit_month: Optional[int] = None
    minimum_reserve_reached: Decimal = running_liquid_reserve
    is_failure = False
    primary_constraint_violated: Optional[str] = None
    monthly_cash_flow_impacts: List[Decimal] = []

    # Minimum safety cushion user should retain
    safety_cushion = quant(baseline_essential * buffer_threshold_months)

    for month_idx in range(1, horizon_months + 1):
        # 1. Start with baseline
        current_income = baseline_income
        current_essential = baseline_essential
        current_discretionary = baseline_discretionary
        current_debt = baseline_debt
        one_time_outflow = ZERO

        # 2. Apply active shocks for this month
        for shock in shocks:
            start_m = shock.timing_month
            end_m = start_m + shock.duration_months - 1

            if start_m <= month_idx <= end_m:
                st = shock.shock_type.lower()
                if st in ("income_loss", "job_loss"):
                    # Complete or partial income loss
                    current_income = max(ZERO, current_income * (Decimal("1.00") - shock.magnitude))
                elif st in ("income_reduction", "salary_cut"):
                    current_income = max(ZERO, current_income * (Decimal("1.00") - shock.magnitude))
                elif st in ("essential_inflation", "living_cost_hike"):
                    current_essential = current_essential * (Decimal("1.00") + shock.magnitude)
                elif st in ("debt_rate_hike", "emi_surge"):
                    current_debt = current_debt * (Decimal("1.00") + shock.magnitude)
                elif st in ("expense_spike", "medical_emergency", "unplanned_outflow"):
                    # For one-time spikes, apply in timing_month
                    if month_idx == start_m:
                        one_time_outflow += shock.magnitude
                elif st in ("delayed_income",):
                    if month_idx == start_m:
                        current_income = ZERO

        # 3. Monthly Outflow and Net Cash Flow
        total_monthly_outflow = current_essential + current_discretionary + current_debt + one_time_outflow
        net_cash_flow = current_income - total_monthly_outflow

        # Impact compared to baseline surplus
        baseline_net = baseline_income - (baseline_essential + baseline_discretionary + baseline_debt)
        monthly_cash_flow_impacts.append(quant(baseline_net - net_cash_flow))

        # 4. Update Running Liquid Reserves
        running_liquid_reserve += net_cash_flow
        monthly_balances.append(quant(running_liquid_reserve))

        if running_liquid_reserve < minimum_reserve_reached:
            minimum_reserve_reached = running_liquid_reserve

        # 5. Evaluate Failure Conditions
        if running_liquid_reserve < ZERO:
            is_failure = True
            if first_deficit_month is None:
                first_deficit_month = month_idx
                primary_constraint_violated = "insolvency_liquid_exhaustion"
        elif running_liquid_reserve < safety_cushion and not is_failure:
            is_failure = True
            if first_deficit_month is None:
                first_deficit_month = month_idx
                primary_constraint_violated = "emergency_cushion_breached"

    # Additional funding required to avoid any deficit below zero
    additional_funding_required = max(ZERO, -minimum_reserve_reached)

    avg_monthly_impact = (
        quant(sum(monthly_cash_flow_impacts) / Decimal(str(len(monthly_cash_flow_impacts))))
        if monthly_cash_flow_impacts
        else ZERO
    )

    # Build clear explanation of the mechanism
    explanation = _build_failure_explanation(
        scenario_name=scenario_name,
        context=context,
        is_failure=is_failure,
        first_deficit_month=first_deficit_month,
        minimum_reserve=quant(minimum_reserve_reached),
        additional_funding=quant(additional_funding_required),
        avg_impact=avg_monthly_impact,
        primary_constraint=primary_constraint_violated,
    )

    return CrashTestScenarioResult(
        scenario_key=scenario_key,
        scenario_name=scenario_name,
        category=category,
        shocks=shocks,
        is_failure=is_failure,
        cash_flow_impact_monthly=avg_monthly_impact,
        first_deficit_month=first_deficit_month,
        minimum_reserve_reached=quant(minimum_reserve_reached),
        additional_funding_required=quant(additional_funding_required),
        primary_constraint_violated=primary_constraint_violated,
        monthly_balances=monthly_balances,
        explanation=explanation,
    )


def _build_failure_explanation(
    scenario_name: str,
    context: FinancialContext,
    is_failure: bool,
    first_deficit_month: Optional[int],
    minimum_reserve: Decimal,
    additional_funding: Decimal,
    avg_impact: Decimal,
    primary_constraint: Optional[str],
) -> str:
    curr = context.currency
    if not is_failure:
        return (
            f"Under the '{scenario_name}' stress test, your finances remained resilient throughout "
            f"the 6-month horizon. Minimum reserve stayed at {curr} {minimum_reserve:,.2f}. "
            f"Average monthly cash-flow compression was {curr} {avg_impact:,.2f}, which was fully absorbed "
            f"by your current liquid reserves and monthly surplus."
        )

    if primary_constraint == "insolvency_liquid_exhaustion":
        return (
            f"In '{scenario_name}', liquid reserves are completely exhausted in Month {first_deficit_month}. "
            f"The scenario produces an average monthly cash flow contraction of {curr} {avg_impact:,.2f}. "
            f"Cumulative reserves fall to {curr} {minimum_reserve:,.2f}, creating an unfunded deficit of "
            f"{curr} {additional_funding:,.2f}. The primary pressure originates from non-negotiable fixed living "
            f"costs and debt commitments ({curr} {(context.essential_expenses + context.monthly_debt_obligations):,.2f}/mo) "
            f"exceeding incoming cash flow."
        )

    return (
        f"In '{scenario_name}', your emergency cushion is breached in Month {first_deficit_month}. "
        f"Liquid reserves drop below the 1-month essential threshold ({curr} {context.essential_expenses:,.2f}) "
        f"to {curr} {minimum_reserve:,.2f}. While outright insolvency is avoided, your safety buffer becomes dangerously "
        f"depleted, leaving zero margin for secondary shocks."
    )
