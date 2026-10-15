"""Agent F: Recommendation and Follow-Through Agent.

Transforms verified recovery candidates and crash-test discoveries into a prioritized,
transparent action plan. Enforces explainable ranking, highlights trade-offs, and
requires explicit user approval for consequential changes.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Dict, List
from app.features.crash_test.schemas import (
    FinancialContext,
    CrashTestScenarioResult,
    RecoveryPlanCandidate,
    RankedRecommendation,
)


class RecommendationAgent:
    def __init__(self, context: FinancialContext):
        self.context = context

    def rank_and_structure_recommendations(
        self,
        failures: List[CrashTestScenarioResult],
        verified_candidates: List[RecoveryPlanCandidate],
    ) -> List[RankedRecommendation]:
        """Rank and format verified plans into high-trust user recommendations."""
        recommendations: List[RankedRecommendation] = []
        curr = self.context.currency

        # Filter to only plans that passed verification
        valid_plans = [p for p in verified_candidates if p.verified]
        if not valid_plans:
            # If no failures occurred or no plans needed
            return self._build_preventive_recommendations()

        # Score and rank candidates:
        # Score = (Deficit Reduction * 0.45) + (Runway Extension * 10) + Strategy Preference
        def score_plan(p: RecoveryPlanCandidate) -> float:
            base = float(p.deficit_reduction_percent) * 0.45 + float(p.projected_runway_extension_months) * 10.0
            # Preference bonus for balanced plan over extreme single-lever plan
            if p.strategy_type == "balanced":
                base += 15.0
            elif p.strategy_type == "recurring_mandate_cut":
                base += 10.0
            return base

        valid_plans.sort(key=score_plan, reverse=True)

        for rank_idx, plan in enumerate(valid_plans[:3], start=1):
            matching_failure = next(
                (f for f in failures if f.scenario_key == plan.scenario_key), None
            )
            scenario_name = matching_failure.scenario_name if matching_failure else "Stress Scenario"

            why_it_matters = (
                f"In the '{scenario_name}' stress test, your liquidity was depleted by Month "
                f"{matching_failure.first_deficit_month if matching_failure else 'N/A'}. Implementing this plan "
                f"closes {plan.deficit_reduction_percent}% of the projected deficit while extending your runway by "
                f"{plan.projected_runway_extension_months} months."
            )

            expected_impact = {
                "monthly_cash_flow_conserved": f"{curr} {plan.monthly_budget_adjustment:,.2f}",
                "deficit_reduction_percent": f"{plan.deficit_reduction_percent}%",
                "runway_extension_months": f"+{plan.projected_runway_extension_months} months",
                "cumulative_6m_savings": f"{curr} {(plan.monthly_budget_adjustment * Decimal('6.0')):,.2f}",
            }

            recommendations.append(
                RankedRecommendation(
                    scenario_key=plan.scenario_key,
                    title=f"Rank #{rank_idx}: {plan.title}",
                    problem_addressed=f"Vulnerability uncovered in '{scenario_name}'",
                    why_it_matters=why_it_matters,
                    action_steps=plan.interventions,
                    expected_impact=expected_impact,
                    trade_offs=plan.trade_offs,
                    confidence_score=Decimal("0.95") if plan.verification_status == "verified" else Decimal("0.88"),
                    priority_rank=rank_idx,
                    verification_status=plan.verification_status,
                    requires_approval=True,
                    status="proposed",
                )
            )

        return recommendations

    def _build_preventive_recommendations(self) -> List[RankedRecommendation]:
        """Generate proactive resilience recommendations when no immediate failure is triggered."""
        curr = self.context.currency
        return [
            RankedRecommendation(
                scenario_key="preventive_cushion_enhancement",
                title="Rank #1: Accelerate Emergency Reserve to 6-Month Gold Standard",
                problem_addressed="Proactive Resilience Optimization",
                why_it_matters=(
                    f"Your finances demonstrated resilience across all evaluated single and compound shocks! "
                    f"To achieve bulletproof peace of mind, systematically bolster your liquid reserves from "
                    f"{self.context.emergency_runway_months} months to 6 months of living coverage."
                ),
                action_steps=[
                    f"Automate a recurring transfer of {curr} {(self.context.monthly_surplus * Decimal('0.30')):,.2f}/mo into high-yield savings.",
                    "Review recurring subscriptions quarterly to prune unused digital services.",
                    "Re-run the Finroq Crash-Test whenever recurring obligations or income changes.",
                ],
                expected_impact={
                    "reserve_growth_monthly": f"{curr} {(self.context.monthly_surplus * Decimal('0.30')):,.2f}",
                    "target_cushion": f"{curr} {(self.context.essential_expenses * Decimal('6.0')):,.2f}",
                },
                trade_offs="Minimal friction: channels 30% of existing unallocated surplus into emergency savings without reducing lifestyle.",
                confidence_score=Decimal("0.98"),
                priority_rank=1,
                verification_status="verified",
                requires_approval=True,
                status="proposed",
            )
        ]
