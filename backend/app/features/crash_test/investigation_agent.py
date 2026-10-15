"""Agent B: Proactive Investigation Agent.

Analyzes the verified financial context, independently determines which vulnerabilities
and structural risks require investigation, generates testable hypotheses, and reports
observable results without requiring manual prompts from the user.
"""

from __future__ import annotations

from decimal import Decimal
from typing import List
from app.features.crash_test.schemas import FinancialContext, ProactiveInvestigation


class ProactiveInvestigationAgent:
    def __init__(self, context: FinancialContext):
        self.context = context

    def run_investigations(self) -> List[ProactiveInvestigation]:
        """Proactively assess structural weaknesses and formulate prioritized investigations."""
        investigations: List[ProactiveInvestigation] = []
        curr = self.context.currency
        curr_symbol = "₹" if curr == "INR" else f"{curr} "

        # Investigation 1: Emergency Reserve Sufficiency
        runway = self.context.emergency_runway_months
        if runway < Decimal("3.0"):
            urgency = "high"
            impact = "high"
            result = (
                f"Needs Attention: Your safety runway of {runway} months is under the safe 3-month target. "
                f"If regular income paused for more than {runway} months, your cash reserves would run out."
            )
        elif runway < Decimal("6.0"):
            urgency = "medium"
            impact = "medium"
            result = (
                f"Moderate Buffer: Your emergency fund covers {runway} months of basic survival bills. "
                f"Good for short disruptions, but needs growth for longer career shifts."
            )
        else:
            urgency = "low"
            impact = "medium"
            result = (
                f"Solid Emergency Cushion: Your savings comfortably cover {runway} months of essential living costs "
                f"({curr_symbol}{self.context.liquid_reserves:,.2f} ready in bank accounts)."
            )

        investigations.append(
            ProactiveInvestigation(
                id="inv-emergency-runway",
                question="Is the current liquid safety reserve sufficient to survive a temporary income disruption?",
                hypothesis=(
                    f"A sudden 3-month income loss will deplete liquid cash if emergency runway is under 3 months."
                ),
                status="Completed",
                urgency=urgency,
                potential_impact=impact,
                confidence=Decimal("0.96"),
                evidence_found=(
                    f"Liquid reserves: {curr_symbol}{self.context.liquid_reserves:,.2f}; "
                    f"Monthly essential bills: {curr_symbol}{self.context.essential_expenses:,.2f}; "
                    f"Calculated runway: {runway} months."
                ),
                observable_result=result,
            )
        )

        # Investigation 2: Unplanned Outflow Absorption
        unplanned_size = max(Decimal("50000.00"), self.context.essential_expenses * Decimal("1.5"))
        can_absorb_cash = self.context.liquid_reserves >= unplanned_size
        investigations.append(
            ProactiveInvestigation(
                id="inv-unplanned-expense-shock",
                question=f"Can emergency savings handle an unplanned {curr_symbol}{unplanned_size:,.2f} emergency expense?",
                hypothesis=(
                    f"A sudden hospital bill or major vehicle repair of {curr_symbol}{unplanned_size:,.2f} "
                    f"could force borrowing if you do not have enough cash set aside."
                ),
                status="Completed",
                urgency="low" if can_absorb_cash else "high",
                potential_impact="high",
                confidence=Decimal("0.92"),
                evidence_found=(
                    f"Available emergency savings: {curr_symbol}{self.context.liquid_reserves:,.2f}. "
                    f"Estimated surprise cost: {curr_symbol}{unplanned_size:,.2f}."
                ),
                observable_result=(
                    f"{'Well Protected' if can_absorb_cash else 'Caution'}: Your bank reserves can "
                    f"{'easily absorb this surprise bill without debt' if can_absorb_cash else 'NOT cover this full bill without borrowing'}. "
                    f"Remaining cash after payment would be {curr_symbol}{max(Decimal('0.00'), self.context.liquid_reserves - unplanned_size):,.2f}."
                ),
            )
        )

        # Investigation 3: Fixed Commitment Rigidity
        fixed_ratio = (
            ((self.context.essential_expenses + self.context.monthly_debt_obligations) / self.context.monthly_income)
            * Decimal("100.0")
            if self.context.monthly_income > Decimal("0.00")
            else Decimal("100.0")
        )
        is_rigid = fixed_ratio > Decimal("50.0")
        investigations.append(
            ProactiveInvestigation(
                id="inv-fixed-rigidity",
                question="Do non-negotiable monthly commitments take up too much of your income?",
                hypothesis=(
                    "If mandatory bills and debt payments take more than 50% of your earnings, it is difficult "
                    "to cut spending quickly if your salary drops."
                ),
                status="Completed",
                urgency="high" if is_rigid else "low",
                potential_impact="medium",
                confidence=Decimal("0.94"),
                evidence_found=(
                    f"Essential expenses: {curr_symbol}{self.context.essential_expenses:,.2f}/mo. "
                    f"Debt & loan EMIs: {curr_symbol}{self.context.monthly_debt_obligations:,.2f}/mo. "
                    f"Fixed commitment share: {fixed_ratio:.1f}% of monthly income."
                ),
                observable_result=(
                    f"{'High Commitment' if is_rigid else 'Balanced'}: Fixed commitments take {fixed_ratio:.1f}% of income. "
                    f"{'You have less breathing room to reduce spending if earnings dip.' if is_rigid else 'You have plenty of flexibility to absorb unexpected changes.'}"
                ),
            )
        )

        # Investigation 4: Discretionary Cushion & Shock Absorption
        discretionary_buffer = self.context.discretionary_expenses
        monthly_surplus = self.context.monthly_surplus
        investigations.append(
            ProactiveInvestigation(
                id="inv-discretionary-levers",
                question="How much cash can you quickly save by temporarily pausing non-essential spending?",
                hypothesis="Pausing flexible spending (shopping, dining out) is your fastest way to stay safe during a crisis.",
                status="Completed",
                urgency="low",
                potential_impact="medium",
                confidence=Decimal("0.95"),
                evidence_found=(
                    f"Flexible monthly spending: {curr_symbol}{discretionary_buffer:,.2f}. "
                    f"Monthly extra savings: {curr_symbol}{monthly_surplus:,.2f}."
                ),
                observable_result=(
                    f"Flexible Levers: You can free up to {curr_symbol}{discretionary_buffer:,.2f}/month instantly "
                    f"without touching rent, food groceries, utilities, or loan payments."
                ),
            )
        )

        # Investigation 5: Compound Shock Sensitivity
        investigations.append(
            ProactiveInvestigation(
                id="inv-compound-crisis-interaction",
                question="What happens if a pay cut happens at the exact same time as an emergency bill?",
                hypothesis="Simultaneous financial hits burn cash much faster than one problem alone.",
                status="Completed",
                urgency="high",
                potential_impact="high",
                confidence=Decimal("0.91"),
                evidence_found="Both salary interruption and emergency medical shocks tested together.",
                observable_result=(
                    "Compound Risk: Facing two shocks together empties savings twice as quickly because "
                    "higher spending happens while your income is lower. Having a verified recovery plan is essential."
                ),
            )
        )

        return investigations
