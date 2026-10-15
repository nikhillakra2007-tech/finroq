"""Agent D: Recovery Planner Agent.

Formulates realistic, actionable recovery candidates when crash-tests uncover
deficits or buffer breaches. Balances essential living costs, mandatory debt service,
and user lifestyle trade-offs.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import List
from app.features.crash_test.schemas import (
    FinancialContext,
    CrashTestScenarioResult,
    RecoveryPlanCandidate,
)

ZERO = Decimal("0.00")


class RecoveryPlannerAgent:
    def __init__(self, context: FinancialContext):
        self.context = context

    def generate_recovery_candidates(
        self, failure: CrashTestScenarioResult
    ) -> List[RecoveryPlanCandidate]:
        """Generate alternative candidate recovery plans for a specific failure."""
        candidates: List[RecoveryPlanCandidate] = []
        curr = self.context.currency
        disc = self.context.discretionary_expenses
        monthly_deficit = failure.additional_funding_required / Decimal("6.0")

        # -------------------------------------------------------------
        # Candidate 1: Targeted Discretionary Lockdown (50% cut)
        # -------------------------------------------------------------
        disc_cut_1 = (disc * Decimal("0.50")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        rec_cut_1 = ZERO
        total_adj_1 = disc_cut_1 + rec_cut_1
        deficit_red_1 = min(Decimal("100.0"), (total_adj_1 / max(Decimal("1.00"), monthly_deficit)) * Decimal("100.0")) if monthly_deficit > ZERO else Decimal("100.0")
        runway_ext_1 = (total_adj_1 / max(Decimal("1.00"), self.context.essential_expenses)).quantize(Decimal("0.1"))

        candidates.append(
            RecoveryPlanCandidate(
                candidate_id=f"plan-disc-{failure.scenario_key}",
                scenario_key=failure.scenario_key,
                title="Targeted Discretionary Spending Lockdown",
                strategy_type="discretionary_freeze",
                interventions=[
                    f"Trim flexible dining, leisure, and shopping outflows by 50% ({curr} {disc_cut_1:,.2f}/month conserved).",
                    "Protect all mandatory housing, utilities, groceries, and debt payments intact.",
                    f"Conserve {curr} {(disc_cut_1 * Decimal('6.0')):,.2f} over a 6-month shock horizon.",
                ],
                proposed_monthly_discretionary_cut=disc_cut_1,
                proposed_monthly_recurring_cut=rec_cut_1,
                monthly_budget_adjustment=total_adj_1,
                projected_runway_extension_months=runway_ext_1,
                deficit_reduction_percent=deficit_red_1.quantize(Decimal("0.1")),
                trade_offs="Reduces dining, entertainment, and personal shopping for 6 months. High lifestyle friction, zero debt risk.",
            )
        )

        # -------------------------------------------------------------
        # Candidate 2: Recurring Mandates & Subscription Optimization
        # -------------------------------------------------------------
        disc_cut_2 = (disc * Decimal("0.20")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        rec_cut_2 = Decimal("1500.00")  # Pause OTT, optimize utility packages
        total_adj_2 = disc_cut_2 + rec_cut_2
        deficit_red_2 = min(Decimal("100.0"), (total_adj_2 / max(Decimal("1.00"), monthly_deficit)) * Decimal("100.0")) if monthly_deficit > ZERO else Decimal("100.0")
        runway_ext_2 = (total_adj_2 / max(Decimal("1.00"), self.context.essential_expenses)).quantize(Decimal("0.1"))

        candidates.append(
            RecoveryPlanCandidate(
                candidate_id=f"plan-recurring-{failure.scenario_key}",
                scenario_key=failure.scenario_key,
                title="Recurring Mandates & Non-Essential Subscription Pause",
                strategy_type="recurring_mandate_cut",
                interventions=[
                    "Temporarily pause non-essential digital memberships and video streaming subscriptions.",
                    f"Apply a light 20% trim on discretionary weekend outings ({curr} {disc_cut_2:,.2f}/month).",
                    f"Conserve total {curr} {total_adj_2:,.2f}/month without drastic lifestyle shock.",
                ],
                proposed_monthly_discretionary_cut=disc_cut_2,
                proposed_monthly_recurring_cut=rec_cut_2,
                monthly_budget_adjustment=total_adj_2,
                projected_runway_extension_months=runway_ext_2,
                deficit_reduction_percent=deficit_red_2.quantize(Decimal("0.1")),
                trade_offs="Mild convenience friction. Eliminates recurring automated leaks while keeping core lifestyle intact.",
            )
        )

        # -------------------------------------------------------------
        # Candidate 3: Balanced Resilience Shield
        # -------------------------------------------------------------
        disc_cut_3 = (disc * Decimal("0.35")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        rec_cut_3 = Decimal("1000.00")
        total_adj_3 = disc_cut_3 + rec_cut_3
        deficit_red_3 = min(Decimal("100.0"), (total_adj_3 / max(Decimal("1.00"), monthly_deficit)) * Decimal("100.0")) if monthly_deficit > ZERO else Decimal("100.0")
        runway_ext_3 = (total_adj_3 / max(Decimal("1.00"), self.context.essential_expenses)).quantize(Decimal("0.1"))

        candidates.append(
            RecoveryPlanCandidate(
                candidate_id=f"plan-balanced-{failure.scenario_key}",
                scenario_key=failure.scenario_key,
                title="Balanced Resilience Shield (Pragmatic Hybrid)",
                strategy_type="balanced",
                interventions=[
                    f"Moderate 35% reduction on discretionary outflow ({curr} {disc_cut_3:,.2f}/month).",
                    "Audit recurring auto-debits to capture ₹1,000 / $50 in monthly subscription savings.",
                    "Direct 100% of realized savings into high-yield liquid emergency reserves.",
                    "Re-evaluate recovery status after Month 3 to ease constraints as income stabilizes.",
                ],
                proposed_monthly_discretionary_cut=disc_cut_3,
                proposed_monthly_recurring_cut=rec_cut_3,
                monthly_budget_adjustment=total_adj_3,
                projected_runway_extension_months=runway_ext_3,
                deficit_reduction_percent=deficit_red_3.quantize(Decimal("0.1")),
                trade_offs="Optimal balance: sustainable moderate lifestyle adjustment paired with progressive buffer rebuilding.",
            )
        )

        return candidates
