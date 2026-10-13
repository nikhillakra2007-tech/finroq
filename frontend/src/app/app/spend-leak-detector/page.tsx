'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import type {
  SpendLeakInsight,
  DataReadinessReport,
  SpendLeakAnalysisResponse,
} from '@/lib/api-types';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Database,
  Calendar,
  Layers,
  Activity,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Upload,
  Plus,
} from 'lucide-react';

export default function AppSpendLeakDetectorPage() {
  const [analysisData, setAnalysisData] = useState<SpendLeakAnalysisResponse | null>(null);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const res = await apiClient.getSpendLeakInsights();
        if (!cancelled && res?.data) {
          setAnalysisData(res.data);
        }
      } catch (err) {
        console.warn('Spend leak detector using fallback data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const readiness = analysisData?.readiness;
  const insights = analysisData?.insights || [];

  // Filter out cancelled insights for active calculations
  const activeInsights = insights.filter((i) => !cancelledIds.has(i.id));
  const cancelledInsights = insights.filter((i) => cancelledIds.has(i.id));

  // Dynamic totals based on insights and user cancellation
  const monthlySavingsRecovered = cancelledInsights.reduce(
    (sum, i) => sum + parseFloat(i.potential_monthly_savings || '0'),
    0
  );

  const totalMonthlyDrain = activeInsights
    .filter((i) => i.insight_type === 'recurring_subscription' || i.insight_type === 'dormant_recurring')
    .reduce((sum, i) => sum + parseFloat(i.potential_monthly_savings || '0'), 0);

  const totalAnnualDrain = totalMonthlyDrain * 12;

  // 5-Year SIP compound calculation at 12% p.a.
  // Formula: P * [((1 + r)^n - 1) / r] * (1 + r)
  const r = 0.12 / 12;
  const n = 60;
  const projected5YearWealth = monthlySavingsRecovered > 0
    ? Math.round(monthlySavingsRecovered * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)))
    : 0;

  const handleToggleCancel = (id: string) => {
    setCancelledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'sufficiently_supported':
        return {
          label: 'Sufficient Evidence (90+ Days)',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        };
      case 'provisional':
        return {
          label: 'Provisional Trends (30–89 Days)',
          bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        };
      case 'preliminary':
        return {
          label: 'Preliminary Observations (7–29 Days)',
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        };
      case 'limited_evidence':
      default:
        return {
          label: 'Limited Evidence (< 7 Days)',
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sufficiently_supported':
        return {
          label: 'Sufficient Evidence',
          className: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300',
        };
      case 'provisional':
        return {
          label: 'Provisional Confidence',
          className: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border-teal-300',
        };
      case 'preliminary':
        return {
          label: 'Preliminary Observation',
          className: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300',
        };
      case 'insufficient_evidence':
      default:
        return {
          label: 'Insufficient Evidence',
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
        };
    }
  };

  const tierBadge = getTierBadge(readiness?.readiness_tier);

  return (
    <ModuleShell
      title="Spend Leak Detector"
      category="Decide Before Spending"
      description="Evidence-driven financial health audit scanning recurring plans, dormant subscriptions, and cost leaks against verified historical baselines."
    >
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-44 bg-[var(--soft)] rounded-3xl animate-pulse" />
          <div className="grid sm:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[var(--soft)] rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* DATA READINESS & COVERAGE PANEL */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE4DC] dark:border-[var(--line)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    Data Readiness & History Coverage
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${tierBadge.bg}`}
                  >
                    {tierBadge.label}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                  {readiness?.readiness_explanation}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F5EE] hover:bg-[#E0EBE0] dark:bg-[#1A2C22] dark:hover:bg-[#253D30] text-[#173F2B] dark:text-emerald-300 border border-[#DCE4DC] dark:border-[#2A3D33] transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Statement CSV
                </Link>
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#173F2B] hover:bg-[#123322] text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Transactions
                </Link>
              </div>
            </div>

            {/* 4-Item Coverage Grid with Active vs Calendar distinction */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Available History
                </div>
                <div className="font-mono text-2xl font-bold text-[#173F2B] dark:text-slate-100">
                  {readiness?.available_history_days ?? 0}{' '}
                  <span className="text-xs font-normal">days</span>
                </div>
                <p className="text-[11px] text-[#5E6B65] dark:text-slate-400">
                  Calendar span of eligible records
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  Observed Activity
                </div>
                <div className="font-mono text-2xl font-bold text-[#173F2B] dark:text-slate-100">
                  {readiness?.observed_active_days ?? 0}{' '}
                  <span className="text-xs font-normal">active days</span>
                </div>
                <p className="text-[11px] text-[#5E6B65] dark:text-slate-400">
                  Distinct days with completed txns
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Verified Coverage
                </div>
                <div className="font-mono text-sm font-bold text-[#173F2B] dark:text-slate-100 truncate">
                  {readiness?.verified_coverage_status === 'verified_statement'
                    ? 'Statement Import'
                    : 'Self-Reported'}
                </div>
                <p className="text-[11px] text-[#5E6B65] dark:text-slate-400 truncate">
                  {readiness?.imported_transactions_count ?? 0} imported • {readiness?.manual_transactions_count ?? 0} manual
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Data Freshness
                </div>
                <div className="font-mono text-2xl font-bold text-[#173F2B] dark:text-slate-100">
                  {readiness?.data_freshness_days != null
                    ? `${readiness.data_freshness_days}d ago`
                    : 'N/A'}
                </div>
                <p className="text-[11px] text-[#5E6B65] dark:text-slate-400">
                  {readiness?.accounts_included.length ?? 0} active account(s) analyzed
                </p>
              </div>
            </div>

            {/* Synthetic Demo Warning */}
            {readiness?.is_synthetic_demo_data && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
                <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Demo Seed Dataset Active:</strong> You are viewing simulated sample records. Real user leak detection requires importing your personal statement CSV.
                </span>
              </div>
            )}

            {/* Missing Period Detected */}
            {readiness?.missing_periods && readiness.missing_periods.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1 text-xs text-rose-900 dark:text-rose-200">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Detectable Coverage Gaps Observed
                </div>
                {readiness.missing_periods.map((gap, idx) => (
                  <p key={idx} className="pl-5 text-[11px] text-rose-800 dark:text-rose-300">
                    • {gap.description}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* TOP SUMMARY METRICS CARDS */}
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                Recurring Mandates Drag
              </span>
              <div className="font-mono text-3xl font-bold text-[#B43838] dark:text-rose-400">
                {formatCurrency(totalMonthlyDrain)}
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                Across {activeInsights.length} evaluated pattern{activeInsights.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                Annual Projected Drain
              </span>
              <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(totalAnnualDrain)}
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                Uncommitted cost if unmonitored for 12 months
              </p>
            </div>

            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-emerald-300 dark:border-emerald-800/80 rounded-3xl p-6 space-y-2 shadow-xs bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#157A42] dark:text-emerald-400">
                Recovered Cash Flow
              </span>
              <div className="font-mono text-3xl font-bold text-[#157A42] dark:text-emerald-400">
                +{formatCurrency(monthlySavingsRecovered)}
                <span className="text-xs font-normal">/mo</span>
              </div>
              <p className="text-xs font-medium text-[#157A42] dark:text-emerald-300">
                {cancelledInsights.length} leak{cancelledInsights.length !== 1 ? 's' : ''} marked for cancellation
              </p>
            </div>
          </div>

          {/* COMPOUND WEALTH ACCELERATOR */}
          {monthlySavingsRecovered > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-[#EEF5EE] dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-300 dark:border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#173F2B] dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Wealth Accelerator: Cancelled Outflows Compounding</span>
                </div>
                <p className="text-xs text-[#2A4736] dark:text-slate-300 max-w-xl">
                  By investing your intercepted <strong>{formatCurrency(monthlySavingsRecovered)}/month</strong> into a disciplined 12% Nifty Index SIP instead of leaking it:
                </p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#157A42] block">
                  5-Year Projected Corpus
                </span>
                <span className="font-mono text-2xl font-black text-[#173F2B] dark:text-emerald-300">
                  {formatCurrency(projected5YearWealth)}
                </span>
              </div>
            </div>
          )}

          {/* DETECTED INSIGHTS & EVIDENCE LIST */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCE4DC] dark:border-[var(--line)] gap-2">
              <div>
                <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                  Evidence-Driven Findings & Subscriptions
                </h3>
                <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                  Every finding requires verifiable transaction repetitions, merchant identities, or budget ceilings
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                {insights.length} Total Findings
              </span>
            </div>

            {insights.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-display font-bold text-base text-[#173F2B] dark:text-slate-100">
                  No Spend Leaks Detected
                </h4>
                <p className="text-xs text-[#4D5D51] dark:text-slate-400 max-w-md mx-auto">
                  Either your financial history shows no recurring waste, or history is insufficient to establish repeating patterns.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#DCE4DC] dark:divide-[var(--line)]">
                {insights.map((item) => {
                  const isCancelled = cancelledIds.has(item.id);
                  const isExpanded = expandedInsightId === item.id;
                  const statusBadge = getStatusBadge(item.status);
                  const monthlyVal = parseFloat(item.potential_monthly_savings || '0');

                  return (
                    <div
                      key={item.id}
                      className={`py-5 space-y-3 transition-all ${
                        isCancelled ? 'opacity-65 bg-emerald-50/20 rounded-2xl px-3' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <p
                              className={`font-bold text-sm ${
                                isCancelled
                                  ? 'line-through text-slate-500'
                                  : 'text-[#173F2B] dark:text-slate-100'
                              }`}
                            >
                              {item.title}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                            {isCancelled && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                                ✓ Intercepted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#4D5D51] dark:text-slate-300">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-start shrink-0">
                          {monthlyVal > 0 && (
                            <div className="text-right">
                              <span
                                className={`font-mono font-bold text-base ${
                                  isCancelled
                                    ? 'text-slate-400'
                                    : 'text-[#B43838] dark:text-rose-400'
                                }`}
                              >
                                {formatCurrency(monthlyVal)}
                              </span>
                              <span className="text-[11px] text-[#4D5D51] dark:text-slate-400 block font-medium">
                                /month
                              </span>
                            </div>
                          )}

                          {monthlyVal > 0 && (
                            <button
                              onClick={() => handleToggleCancel(item.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                                !isCancelled
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                                  : 'text-[#173F2B] dark:text-slate-300 border border-[#DCE4DC] hover:bg-slate-100'
                              }`}
                            >
                              {!isCancelled ? 'Cancel Plan' : 'Undo'}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setExpandedInsightId(isExpanded ? null : item.id)
                            }
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            title="Toggle Evidence Details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Evidence & Methodology Drill-down */}
                      {isExpanded && (
                        <div className="p-4 rounded-2xl bg-[#F5F8F5] dark:bg-[#15231B] border border-[#DCE4DC] dark:border-[#22352A] space-y-3 text-xs animate-in fade-in duration-200">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                Supporting Evidence
                              </span>
                              <p className="text-[#173F2B] dark:text-slate-200">
                                {item.evidence_summary}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                Calculation Method
                              </span>
                              <p className="text-[#173F2B] dark:text-slate-200">
                                {item.calculation_method}
                              </p>
                            </div>
                          </div>

                          {item.supporting_transactions && item.supporting_transactions.length > 0 && (
                            <div className="space-y-1 pt-2 border-t border-[#DCE4DC] dark:border-[#22352A]">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                Underlying Recorded Transactions ({item.supporting_transactions.length})
                              </span>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {item.supporting_transactions.map((tx) => (
                                  <div
                                    key={tx.id}
                                    className="flex items-center justify-between font-mono text-[11px] text-[#2A4736] dark:text-slate-300 py-0.5"
                                  >
                                    <span>
                                      {new Date(tx.transaction_date).toLocaleDateString()} • {tx.description || 'Debit'}
                                    </span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                      {formatCurrency(parseFloat(tx.amount))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-[#DCE4DC] dark:border-[#22352A] text-[11px] text-[#4D5D51] dark:text-slate-400">
                            <div>
                              <strong>Assumptions:</strong> {item.assumptions}
                            </div>
                            <div>
                              <strong>Limitations:</strong> {item.limitations}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-[#101B14] border border-[#DCE4DC] dark:border-[#22352A] flex items-center justify-between text-xs">
                            <span className="text-[#173F2B] dark:text-slate-200 font-medium">
                              <strong>Recommended Action:</strong> {item.recommended_action}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Statutory Disclaimer */}
            <div className="pt-4 border-t border-[#DCE4DC] dark:border-[var(--line)] flex items-start gap-2 text-xs text-[#5E6B65] dark:text-slate-400">
              <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Methodology & Confidence Disclosure:</strong> {analysisData?.disclaimer || 'All savings projections represent uncommitted mathematical estimates based on recurring pattern elimination and are not guaranteed money recovered.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
