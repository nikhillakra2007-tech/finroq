import { apiClient, DEMO_CRASH_TEST_RUN, DEMO_CRASH_TEST_BENCHMARKS } from './api-client';

describe('Crash-Test & Resilience Engine', () => {
  beforeAll(() => {
    apiClient.setToken('demo-token-test');
  });

  afterAll(() => {
    apiClient.setToken(null);
  });

  it('returns valid demo crash-test data when offline or in demo mode', async () => {
    const res = await apiClient.runCrashTest();
    expect(res.data).toBeDefined();
    expect(res.data.status).toBe('completed');
    expect(res.data.resilience_score).toBeGreaterThanOrEqual(0);
    expect(res.data.resilience_score).toBeLessThanOrEqual(100);
    expect(res.data.scenarios.length).toBeGreaterThan(0);
    expect(res.data.investigations.length).toBeGreaterThan(0);
    expect(res.data.recommendations.length).toBeGreaterThan(0);
  });

  it('validates scenario results have deterministic metrics', () => {
    const failureScen = DEMO_CRASH_TEST_RUN.scenarios.find((s) => s.is_failure);
    expect(failureScen).toBeDefined();
    if (failureScen) {
      expect(failureScen.first_deficit_month).toBeDefined();
      expect(parseFloat(failureScen.cash_flow_impact_monthly)).toBeGreaterThan(0);
      expect(failureScen.explanation).toContain('stress test');
    }
  });

  it('validates recommendations have required verification status and approval flags', () => {
    DEMO_CRASH_TEST_RUN.recommendations.forEach((rec) => {
      expect(rec.verification_status).toBe('verified');
      expect(rec.requires_approval).toBe(true);
      expect(rec.action_steps.length).toBeGreaterThan(0);
      expect(rec.expected_impact.monthly_cash_flow_conserved).toBeDefined();
    });
  });

  it('records user approval decision without throwing', async () => {
    const res = await apiClient.recordRecommendationDecision('demo-run-1', 1, {
      decision: 'accepted',
      modification_notes: 'User approved hybrid plan',
    });
    expect(res.data.status).toBe('success');
    expect(res.data.decision).toBe('accepted');
  });

  it('evaluates reproducible benchmark metrics', async () => {
    const bench = await apiClient.getCrashTestBenchmarks();
    expect(bench.data.synthetic_profiles_tested).toBe(3);
    expect(bench.data.agentic_failures_discovered).toBeGreaterThan(bench.data.baseline_failures_discovered);
    expect(bench.data.duplicate_scenario_rate_percent).toBe(0.0);
    expect(bench.data.recovery_plan_feasibility_rate_percent).toBe(100.0);
  });
});
