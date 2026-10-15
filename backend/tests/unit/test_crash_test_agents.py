import pytest
from decimal import Decimal
from app.features.crash_test.schemas import (
    FinancialContext,
    ShockDefinition,
    CrashTestScenarioResult,
    RecoveryPlanCandidate,
)
from app.features.crash_test.investigation_agent import ProactiveInvestigationAgent
from app.features.crash_test.crash_test_agent import CrashTestAgent
from app.features.crash_test.recovery_planner_agent import RecoveryPlannerAgent
from app.features.crash_test.verifier import RecommendationVerifier
from app.features.crash_test.recommendation_agent import RecommendationAgent

ZERO = Decimal("0.00")


@pytest.fixture
def stress_context():
    return FinancialContext(
        monthly_income=Decimal("120000.00"),
        essential_expenses=Decimal("50000.00"),
        discretionary_expenses=Decimal("25000.00"),
        total_monthly_expenses=Decimal("85000.00"),
        monthly_surplus=Decimal("35000.00"),
        liquid_reserves=Decimal("60000.00"),  # 1.2 months runway
        total_debt_balances=Decimal("80000.00"),
        monthly_debt_obligations=Decimal("10000.00"),
        emergency_runway_months=Decimal("1.0"),
        savings_rate_percent=Decimal("29.2"),
        debt_to_income_percent=Decimal("8.3"),
        currency="INR",
    )


class TestCrashTestAgents:
    def test_agent_b_proactive_investigations(self, stress_context):
        agent = ProactiveInvestigationAgent(stress_context)
        investigations = agent.run_investigations()
        assert len(investigations) >= 4
        assert all(inv.status == "Completed" for inv in investigations)
        assert any("runway" in inv.id for inv in investigations)
        assert any("compound" in inv.id for inv in investigations)

    def test_agent_c_deduplication_and_budget(self, stress_context):
        # Test simulation budget cutoff
        agent = CrashTestAgent(stress_context, simulation_budget=4, horizon_months=6)
        results = agent.run_crash_tests()
        assert len(results) <= 4

        # Test deduplication
        duplicate_shocks = [
            ShockDefinition(
                shock_type="income_reduction",
                description="25% cut",
                duration_months=6,
                magnitude=Decimal("0.25"),
                timing_month=1,
            )
        ]
        agent2 = CrashTestAgent(stress_context, simulation_budget=8)
        results2 = agent2.run_crash_tests(custom_shocks=duplicate_shocks)
        scenario_keys = [r.scenario_key for r in results2]
        # Should contain custom shock
        assert "custom_user_scenario" in scenario_keys
        # Check no duplicate signatures were evaluated
        sigs = [agent2._hash_shocks(r.shocks) for r in results2]
        assert len(sigs) == len(set(sigs))

    def test_agent_d_recovery_planner_generates_alternatives(self, stress_context):
        planner = RecoveryPlannerAgent(stress_context)
        dummy_failure = CrashTestScenarioResult(
            scenario_key="test_failure",
            scenario_name="Test Failure",
            category="income_shock",
            shocks=[],
            is_failure=True,
            cash_flow_impact_monthly=Decimal("25000.00"),
            first_deficit_month=2,
            minimum_reserve_reached=Decimal("-20000.00"),
            additional_funding_required=Decimal("20000.00"),
            primary_constraint_violated="insolvency_liquid_exhaustion",
            explanation="Failed",
        )
        candidates = planner.generate_recovery_candidates(dummy_failure)
        assert len(candidates) >= 3
        types = {c.strategy_type for c in candidates}
        assert "discretionary_freeze" in types
        assert "balanced" in types

    def test_agent_e_verifier_rejects_deliberately_invalid_plans(self, stress_context):
        verifier = RecommendationVerifier(stress_context)

        # Case 1: Discretionary cut exceeding spend by >20% (Available: 25k, Plan proposes: 50k)
        invalid_plan_1 = RecoveryPlanCandidate(
            candidate_id="inv-1",
            scenario_key="scen",
            title="Over-budget Cut",
            strategy_type="discretionary_freeze",
            interventions=["Cut 50k"],
            proposed_monthly_discretionary_cut=Decimal("50000.00"),
            proposed_monthly_recurring_cut=ZERO,
            monthly_budget_adjustment=Decimal("50000.00"),
            projected_runway_extension_months=Decimal("1.0"),
            deficit_reduction_percent=Decimal("50.0"),
            trade_offs="None",
        )
        res_1 = verifier.verify_plan(invalid_plan_1)
        assert res_1.passed is False
        assert res_1.status == "rejected"
        assert any("exceeds" in c for c in res_1.failed_constraints)

        # Case 2: Attempting to default or skip mandatory loan/EMI
        invalid_plan_2 = RecoveryPlanCandidate(
            candidate_id="inv-2",
            scenario_key="scen",
            title="Default on EMI",
            strategy_type="debt",
            interventions=["Skip EMI payments for 3 months to conserve cash"],
            proposed_monthly_discretionary_cut=Decimal("10000.00"),
            proposed_monthly_recurring_cut=ZERO,
            monthly_budget_adjustment=Decimal("10000.00"),
            projected_runway_extension_months=Decimal("0.5"),
            deficit_reduction_percent=Decimal("20.0"),
            trade_offs="Default",
        )
        res_2 = verifier.verify_plan(invalid_plan_2)
        assert res_2.passed is False
        assert res_2.status == "rejected"
        assert any("mandatory" in c for c in res_2.failed_constraints)

        # Case 3: Negative adjustment
        invalid_plan_3 = RecoveryPlanCandidate(
            candidate_id="inv-3",
            scenario_key="scen",
            title="Negative Cut",
            strategy_type="discretionary_freeze",
            interventions=["Negative"],
            proposed_monthly_discretionary_cut=Decimal("-500.00"),
            proposed_monthly_recurring_cut=ZERO,
            monthly_budget_adjustment=Decimal("-500.00"),
            projected_runway_extension_months=Decimal("0.0"),
            deficit_reduction_percent=Decimal("0.0"),
            trade_offs="None",
        )
        res_3 = verifier.verify_plan(invalid_plan_3)
        assert res_3.passed is False
        assert res_3.status == "rejected"

    def test_agent_e_verifier_bounded_repair(self, stress_context):
        # Discretionary available is 25,000. Plan proposes 28,000 (12% overage, <= 20% limit)
        verifier = RecommendationVerifier(stress_context)
        repairable_plan = RecoveryPlanCandidate(
            candidate_id="rep-1",
            scenario_key="scen",
            title="Slight Overage",
            strategy_type="discretionary_freeze",
            interventions=["Trim 28k"],
            proposed_monthly_discretionary_cut=Decimal("28000.00"),
            proposed_monthly_recurring_cut=Decimal("1000.00"),
            monthly_budget_adjustment=Decimal("29000.00"),
            projected_runway_extension_months=Decimal("0.5"),
            deficit_reduction_percent=Decimal("40.0"),
            trade_offs="Lifestyle",
        )
        res = verifier.verify_plan(repairable_plan)
        assert res.passed is True
        assert res.status == "repaired_and_verified"
        assert res.repair_attempted is True
        # Clamped to 25k discretionary + 1k recurring = 26k
        assert repairable_plan.proposed_monthly_discretionary_cut == Decimal("25000.00")
        assert repairable_plan.monthly_budget_adjustment == Decimal("26000.00")

    def test_agent_f_recommendation_ranking(self, stress_context):
        planner = RecoveryPlannerAgent(stress_context)
        dummy_failure = CrashTestScenarioResult(
            scenario_key="test_failure",
            scenario_name="Test Failure",
            category="income_shock",
            shocks=[],
            is_failure=True,
            cash_flow_impact_monthly=Decimal("25000.00"),
            first_deficit_month=2,
            minimum_reserve_reached=Decimal("-20000.00"),
            additional_funding_required=Decimal("20000.00"),
            primary_constraint_violated="insolvency_liquid_exhaustion",
            explanation="Failed",
        )
        candidates = planner.generate_recovery_candidates(dummy_failure)
        verifier = RecommendationVerifier(stress_context)
        for c in candidates:
            verifier.verify_plan(c)

        rec_agent = RecommendationAgent(stress_context)
        recs = rec_agent.rank_and_structure_recommendations(
            failures=[dummy_failure],
            verified_candidates=candidates,
        )
        assert len(recs) > 0
        assert recs[0].priority_rank == 1
        assert recs[0].requires_approval is True
        assert recs[0].status == "proposed"
        assert "action_steps" in recs[0].model_dump()
