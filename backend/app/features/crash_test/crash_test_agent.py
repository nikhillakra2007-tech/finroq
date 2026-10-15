"""Agent C: Financial Crash-Test Agent.

Signature capability of Finroq:
Executes a bounded, adaptive search across plausible financial shocks,
evaluates outcomes via deterministic simulation, deduplicates equivalent scenarios,
tests compound shock interactions, enforces a simulation budget, and discovers
consequential failure modes and constraint breaches.
"""

from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Dict, List, Optional, Set

from app.features.crash_test.engine import simulate_scenario
from app.features.crash_test.schemas import (
    FinancialContext,
    ShockDefinition,
    CrashTestScenarioResult,
)


class CrashTestAgent:
    def __init__(self, context: FinancialContext, simulation_budget: int = 8, horizon_months: int = 6):
        self.context = context
        self.simulation_budget = max(3, min(simulation_budget, 15))
        self.horizon_months = max(3, min(horizon_months, 12))
        self._evaluated_signatures: Set[str] = set()

    def _hash_shocks(self, shocks: List[ShockDefinition]) -> str:
        """Deduplication hash based on shock types, magnitudes, timings, and durations."""
        normalized = sorted(
            [
                {
                    "type": s.shock_type.lower(),
                    "mag": str(s.magnitude),
                    "dur": s.duration_months,
                    "t": s.timing_month,
                }
                for s in shocks
            ],
            key=lambda x: (x["type"], x["mag"], x["t"]),
        )
        return hashlib.sha256(json.dumps(normalized).encode("utf-8")).hexdigest()

    def run_crash_tests(
        self, custom_shocks: Optional[List[ShockDefinition]] = None
    ) -> List[CrashTestScenarioResult]:
        """Execute the bounded adaptive stress test search."""
        results: List[CrashTestScenarioResult] = []
        curr = self.context.currency

        # Step 1: Baseline Candidate Scenarios tailored to user's finances
        candidate_scenarios = self._generate_candidate_scenarios(custom_shocks)

        # Step 2: Iterative bounded execution
        for spec in candidate_scenarios:
            if len(results) >= self.simulation_budget:
                break

            sig = self._hash_shocks(spec["shocks"])
            if sig in self._evaluated_signatures:
                continue  # Deduplicated!

            self._evaluated_signatures.add(sig)

            scenario_result = simulate_scenario(
                context=self.context,
                scenario_key=spec["key"],
                scenario_name=spec["name"],
                category=spec["category"],
                shocks=spec["shocks"],
                horizon_months=self.horizon_months,
            )
            results.append(scenario_result)

        # Step 3: Adaptive Exploration - Test compound interactions if failures detected
        failures = [r for r in results if r.is_failure]
        if failures and len(results) < self.simulation_budget:
            adaptive_scenarios = self._generate_adaptive_combinations(failures)
            for spec in adaptive_scenarios:
                if len(results) >= self.simulation_budget:
                    break

                sig = self._hash_shocks(spec["shocks"])
                if sig in self._evaluated_signatures:
                    continue

                self._evaluated_signatures.add(sig)
                scenario_result = simulate_scenario(
                    context=self.context,
                    scenario_key=spec["key"],
                    scenario_name=spec["name"],
                    category=spec["category"],
                    shocks=spec["shocks"],
                    horizon_months=self.horizon_months,
                )
                results.append(scenario_result)

        # Sort results: Failures first (sorted by additional funding required, then first deficit month)
        results.sort(
            key=lambda r: (
                0 if r.is_failure else 1,
                -r.additional_funding_required,
                r.first_deficit_month or 999,
            )
        )

        return results

    def _generate_candidate_scenarios(
        self, custom_shocks: Optional[List[ShockDefinition]]
    ) -> List[Dict]:
        """Generate high-yield scenarios based on verified baseline facts."""
        curr = self.context.currency
        curr_symbol = "₹" if curr == "INR" else f"{curr} "
        scenarios = []

        # If user supplied custom shocks, prioritize them
        if custom_shocks:
            scenarios.append({
                "key": "custom_user_scenario",
                "name": "User-Defined Custom Shock",
                "category": "custom",
                "shocks": custom_shocks,
            })

        # Scenario 1: Temporary Sudden Job Loss (3 months total stoppage)
        scenarios.append({
            "key": "temporary_job_loss_3m",
            "name": "Temporary Career Pause (3-Month Income Loss)",
            "category": "income_shock",
            "shocks": [
                ShockDefinition(
                    shock_type="income_loss",
                    description="100% loss of take-home income for 3 months (Months 1-3)",
                    duration_months=3,
                    magnitude=Decimal("1.00"),
                    timing_month=1,
                )
            ],
        })

        # Scenario 2: Moderate Prolonged Salary Reduction (25% reduction for 6 months)
        scenarios.append({
            "key": "salary_reduction_25pct",
            "name": "Prolonged Salary Reduction (25% Cut)",
            "category": "income_shock",
            "shocks": [
                ShockDefinition(
                    shock_type="income_reduction",
                    description="25% salary or consulting pay cut for 6 months",
                    duration_months=6,
                    magnitude=Decimal("0.25"),
                    timing_month=1,
                )
            ],
        })

        # Scenario 3: Emergency Outflow Spike (Unplanned medical / structural expense)
        unplanned_cost = max(Decimal("50000.00"), self.context.essential_expenses * Decimal("1.5"))
        scenarios.append({
            "key": "emergency_outflow_spike",
            "name": f"Major Unplanned Expense ({curr_symbol}{unplanned_cost:,.0f})",
            "category": "expense_shock",
            "shocks": [
                ShockDefinition(
                    shock_type="expense_spike",
                    description=f"Immediate unplanned outflow of {curr_symbol}{unplanned_cost:,.2f} in Month 2",
                    duration_months=1,
                    magnitude=unplanned_cost,
                    timing_month=2,
                )
            ],
        })

        # Scenario 4: Essential Cost of Living Inflation (+20% on groceries & utilities)
        scenarios.append({
            "key": "cost_of_living_surge",
            "name": "Essential Living Cost Inflation (+20%)",
            "category": "inflation_shock",
            "shocks": [
                ShockDefinition(
                    shock_type="essential_inflation",
                    description="20% continuous inflation in groceries, utilities, and transport",
                    duration_months=6,
                    magnitude=Decimal("0.20"),
                    timing_month=1,
                )
            ],
        })

        # Scenario 5: Debt Service Surge / Rate Hike (if debt obligations exist)
        if self.context.monthly_debt_obligations > Decimal("0.00"):
            scenarios.append({
                "key": "debt_rate_surge",
                "name": "Loan Rate Hike & EMI Surge (+25%)",
                "category": "debt_shock",
                "shocks": [
                    ShockDefinition(
                        shock_type="debt_rate_hike",
                        description="25% hike in loan EMI or credit servicing obligations",
                        duration_months=6,
                        magnitude=Decimal("0.25"),
                        timing_month=1,
                    )
                ],
            })

        return scenarios

    def _generate_adaptive_combinations(
        self, failures: List[CrashTestScenarioResult]
    ) -> List[Dict]:
        """Synthesize realistic compound crisis scenarios from consequential failures."""
        curr = self.context.currency
        curr_symbol = "₹" if curr == "INR" else f"{curr} "
        adaptive = []

        unplanned_cost = max(Decimal("40000.00"), self.context.essential_expenses * Decimal("1.0"))

        # Compound Shock 1: 25% Salary Cut combined with an Unplanned Outflow Spike
        adaptive.append({
            "key": "compound_salary_cut_and_medical",
            "name": "Compound Crisis: Salary Cut (25%) + Emergency Outflow Spike",
            "category": "compound_crisis",
            "shocks": [
                ShockDefinition(
                    shock_type="income_reduction",
                    description="25% salary reduction across Months 1-6",
                    duration_months=6,
                    magnitude=Decimal("0.25"),
                    timing_month=1,
                ),
                ShockDefinition(
                    shock_type="expense_spike",
                    description=f"Simultaneous unexpected emergency hospital bill of {curr_symbol}{unplanned_cost:,.2f} in Month 2",
                    duration_months=1,
                    magnitude=unplanned_cost,
                    timing_month=2,
                ),
            ],
        })

        # Compound Shock 2: Delayed Income + Living Cost Surge
        adaptive.append({
            "key": "compound_delayed_income_inflation",
            "name": "Compound Crisis: Delayed Payment (1 Mo) + Living Cost Surge (+15%)",
            "category": "compound_crisis",
            "shocks": [
                ShockDefinition(
                    shock_type="delayed_income",
                    description="100% delay of Month 1 earnings",
                    duration_months=1,
                    magnitude=Decimal("1.00"),
                    timing_month=1,
                ),
                ShockDefinition(
                    shock_type="essential_inflation",
                    description="15% surge in essential living costs across Months 1-6",
                    duration_months=6,
                    magnitude=Decimal("0.15"),
                    timing_month=1,
                ),
            ],
        })

        return adaptive
