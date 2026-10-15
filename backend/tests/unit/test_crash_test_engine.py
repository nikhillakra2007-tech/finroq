import pytest
from decimal import Decimal
from app.features.crash_test.engine import simulate_scenario
from app.features.crash_test.schemas import FinancialContext, ShockDefinition

ZERO = Decimal("0.00")


@pytest.fixture
def sample_context():
    return FinancialContext(
        monthly_income=Decimal("100000.00"),
        essential_expenses=Decimal("30000.00"),
        discretionary_expenses=Decimal("20000.00"),
        total_monthly_expenses=Decimal("50000.00"),
        monthly_surplus=Decimal("50000.00"),
        liquid_reserves=Decimal("100000.00"),
        total_debt_balances=Decimal("0.00"),
        monthly_debt_obligations=Decimal("0.00"),
        emergency_runway_months=Decimal("3.3"),
        savings_rate_percent=Decimal("50.0"),
        debt_to_income_percent=Decimal("0.0"),
        currency="USD",
    )


class TestCrashTestEngine:
    def test_no_shock_remains_solvent(self, sample_context):
        result = simulate_scenario(
            context=sample_context,
            scenario_key="baseline_no_shock",
            scenario_name="Baseline Stability",
            category="baseline",
            shocks=[],
            horizon_months=6,
        )
        assert result.is_failure is False
        assert result.additional_funding_required == ZERO
        assert result.first_deficit_month is None
        # Month 6 balance should be 100k + (6 * 50k) = 400k
        assert result.monthly_balances[-1] == Decimal("400000.00")

    def test_severe_job_loss_depletes_reserves(self, sample_context):
        # 100% loss of income for 6 months
        shocks = [
            ShockDefinition(
                shock_type="income_loss",
                description="Total income stoppage for 6 months",
                duration_months=6,
                magnitude=Decimal("1.00"),
                timing_month=1,
            )
        ]
        result = simulate_scenario(
            context=sample_context,
            scenario_key="job_loss_6m",
            scenario_name="6-Month Career Interruption",
            category="income_shock",
            shocks=shocks,
            horizon_months=6,
        )
        assert result.is_failure is True
        # Monthly outflow is 50k. Starting balance 100k.
        # Month 1: 50k left. Month 2: 0k left. Month 3: -50k.
        assert result.first_deficit_month in (2, 3)
        assert result.additional_funding_required > ZERO
        assert result.minimum_reserve_reached < ZERO

    def test_essential_inflation_shock(self, sample_context):
        # 25% inflation on 30k essentials = +7.5k/mo
        shocks = [
            ShockDefinition(
                shock_type="essential_inflation",
                description="25% inflation on essential costs",
                duration_months=6,
                magnitude=Decimal("0.25"),
                timing_month=1,
            )
        ]
        result = simulate_scenario(
            context=sample_context,
            scenario_key="inflation_test",
            scenario_name="Inflation Test",
            category="inflation",
            shocks=shocks,
            horizon_months=6,
        )
        # Baseline surplus was 50k. Increased cost is 7.5k. Net is still +42.5k.
        assert result.is_failure is False
        assert result.cash_flow_impact_monthly == Decimal("7500.00")

    def test_one_time_unplanned_expense_spike(self, sample_context):
        # 150k medical expense in Month 2 (exceeds 100k reserve + month 1 surplus 50k)
        shocks = [
            ShockDefinition(
                shock_type="expense_spike",
                description="Emergency hospital bill",
                duration_months=1,
                magnitude=Decimal("180000.00"),
                timing_month=2,
            )
        ]
        result = simulate_scenario(
            context=sample_context,
            scenario_key="medical_spike",
            scenario_name="Medical Emergency",
            category="expense_shock",
            shocks=shocks,
            horizon_months=6,
        )
        # Balance Month 1: 100k + 50k = 150k
        # Month 2: 150k + 50k - 180k = 20k (< 30k 1-month cushion)
        assert result.is_failure is True
        assert result.first_deficit_month == 2
        assert "cushion" in result.explanation.lower() or "breached" in result.explanation.lower()
