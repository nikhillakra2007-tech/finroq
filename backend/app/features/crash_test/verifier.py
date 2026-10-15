"""Agent E: Independent Verification Agent.

Enforces deterministic mathematical validation on all candidate recovery plans.
Independent of LLM narrative claims. Validates arithmetic, mandatory debt protection,
solvency feasibility, and executes bounded repairs.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Tuple
from app.features.crash_test.schemas import (
    FinancialContext,
    RecoveryPlanCandidate,
    VerificationResult,
)

ZERO = Decimal("0.00")


class RecommendationVerifier:
    def __init__(self, context: FinancialContext):
        self.context = context

    def verify_plan(self, candidate: RecoveryPlanCandidate) -> VerificationResult:
        """Run strict deterministic constraint checks against candidate plan."""
        failed_constraints = []
        repair_attempted = False
        repair_notes = None

        disc_available = self.context.discretionary_expenses
        monthly_income = self.context.monthly_income
        debt_due = self.context.monthly_debt_obligations

        proposed_disc_cut = candidate.proposed_monthly_discretionary_cut
        proposed_rec_cut = candidate.proposed_monthly_recurring_cut
        total_adjustment = candidate.monthly_budget_adjustment

        # -------------------------------------------------------------
        # Constraint 1: Discretionary Spending Feasibility Check
        # -------------------------------------------------------------
        if proposed_disc_cut < ZERO:
            failed_constraints.append("Proposed discretionary cut cannot be negative.")
        elif proposed_disc_cut > disc_available:
            # Check if within bounded repair threshold (<= 20% overage)
            overage_ratio = (proposed_disc_cut - disc_available) / max(Decimal("1.00"), disc_available)
            if overage_ratio <= Decimal("0.20"):
                repair_attempted = True
                repair_notes = (
                    f"Clamped discretionary cut from {self.context.currency} {proposed_disc_cut:,.2f} "
                    f"to maximum observed discretionary spend of {self.context.currency} {disc_available:,.2f}."
                )
                proposed_disc_cut = disc_available
                total_adjustment = proposed_disc_cut + proposed_rec_cut
            else:
                failed_constraints.append(
                    f"Proposed discretionary cut ({self.context.currency} {proposed_disc_cut:,.2f}) "
                    f"exceeds total discretionary outflow ({self.context.currency} {disc_available:,.2f}) by >20%."
                )

        # -------------------------------------------------------------
        # Constraint 2: Mandatory Debt Obligation Non-Violation
        # -------------------------------------------------------------
        # Plans must never propose skipping or defunding mandatory debt payments
        interventions_text = " ".join(candidate.interventions).lower()
        if "skip emi" in interventions_text or "stop loan" in interventions_text or "default" in interventions_text:
            failed_constraints.append("Recovery plan attempts to skip or default on mandatory loan/EMI obligations.")

        # -------------------------------------------------------------
        # Constraint 3: Income & Budget Arithmetic Consistency
        # -------------------------------------------------------------
        if total_adjustment > monthly_income:
            failed_constraints.append(
                f"Total proposed recovery adjustment ({self.context.currency} {total_adjustment:,.2f}) "
                f"exceeds total monthly income ({self.context.currency} {monthly_income:,.2f})."
            )

        if total_adjustment <= ZERO:
            failed_constraints.append("Total proposed recovery adjustment must be strictly positive.")

        # -------------------------------------------------------------
        # Audit Math Record
        # -------------------------------------------------------------
        audit_math = {
            "baseline_income": float(monthly_income),
            "baseline_discretionary": float(disc_available),
            "baseline_debt_obligation": float(debt_due),
            "verified_discretionary_cut": float(proposed_disc_cut),
            "verified_recurring_cut": float(proposed_rec_cut),
            "verified_total_adjustment": float(total_adjustment),
            "repair_applied": repair_attempted,
        }

        # Determine final status
        if failed_constraints:
            candidate.verified = False
            candidate.verification_status = "rejected"
            candidate.verification_reason = "; ".join(failed_constraints)
            return VerificationResult(
                passed=False,
                status="rejected",
                failed_constraints=failed_constraints,
                repair_attempted=repair_attempted,
                repair_notes=repair_notes,
                audit_math=audit_math,
            )

        if repair_attempted:
            candidate.verified = True
            candidate.verification_status = "repaired_and_verified"
            candidate.proposed_monthly_discretionary_cut = proposed_disc_cut
            candidate.monthly_budget_adjustment = total_adjustment
            candidate.verification_reason = f"Verified after bounded repair: {repair_notes}"
            candidate.audit_math = audit_math
            return VerificationResult(
                passed=True,
                status="repaired_and_verified",
                failed_constraints=[],
                repair_attempted=True,
                repair_notes=repair_notes,
                audit_math=audit_math,
            )

        candidate.verified = True
        candidate.verification_status = "verified"
        candidate.verification_reason = "Passed all deterministic arithmetic and obligation protection constraints."
        candidate.audit_math = audit_math

        return VerificationResult(
            passed=True,
            status="verified",
            failed_constraints=[],
            repair_attempted=False,
            repair_notes=None,
            audit_math=audit_math,
        )
