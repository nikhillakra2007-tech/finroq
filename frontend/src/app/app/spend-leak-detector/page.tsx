'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import type {
  SpendLeakInsight,
  DataReadinessReport,
  SpendLeakAnalysisResponse,
  FindingLifecycleStatus,
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
  RefreshCw,
  TrendingUp,
  Copy,
  Clock,
  Filter,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';

export default function AppSpendLeakDetectorPage() {
  const { t } = useI18n();
  const [analysisData, setAnalysisData] = useState<SpendLeakAnalysisResponse | null>(null);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'keep' | 'dismissed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'recurring' | 'inflation' | 'duplicate' | 'missing'>('all');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.getSpendLeakInsights();
      if (res?.data) {
        setAnalysisData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load spend leak insights:', err);
      setErrorMessage(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to reach the spend leak detection service. Please verify your ledger connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.refreshSpendLeakInsights();
      if (res?.data) {
        setAnalysisData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to refresh spend leaks:', err);
      setErrorMessage(
        err?.response?.data?.detail ||
          err?.message ||
          'Refresh request failed. Please check network connectivity or ledger state.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (findingId: string, newStatus: FindingLifecycleStatus) => {
    try {
      await apiClient.updateFindingStatus(findingId, newStatus);
      setAnalysisData((prev) => {
        if (!prev) return prev;
        const updatedInsights = prev.insights.map((item) =>
          item.id === findingId ? { ...item, lifecycle_status: newStatus } : item
        );
        return { ...prev, insights: updatedInsights };
      });
    } catch (err) {
      console.error('Failed to update finding status:', err);
    }
  };

  const readiness = analysisData?.readiness;
  const insights = analysisData?.insights || [];

  // Filter insights based on status and category
  const filteredInsights = insights.filter((item) => {
    const itemStatus = item.lifecycle_status || 'new';
    if (statusFilter !== 'all') {
      if (statusFilter === 'new' && itemStatus !== 'new') return false;
      if (statusFilter === 'keep' && itemStatus !== 'keep') return false;
      if (statusFilter === 'dismissed' && itemStatus !== 'dismissed') return false;
    }

    if (categoryFilter === 'recurring') {
      if (item.insight_type !== 'recurring_subscription' && item.insight_type !== 'dormant_recurring') return false;
    } else if (categoryFilter === 'inflation') {
      if (item.insight_type !== 'recurring_cost_inflation') return false;
    } else if (categoryFilter === 'duplicate') {
      if (item.insight_type !== 'duplicate_charge_leakage') return false;
    } else if (categoryFilter === 'missing') {
      if (item.insight_type !== 'missing_recurring_payment') return false;
    }

    return true;
  });

  // Calculate dynamic totals excluding dismissed items
  const activeInsights = insights.filter((i) => (i.lifecycle_status || 'new') !== 'dismissed');
  const dismissedInsights = insights.filter((i) => i.lifecycle_status === 'dismissed');
  const needsReviewCount = insights.filter((i) => (i.lifecycle_status || 'new') === 'new').length;

  const monthlySavingsIntercepted = dismissedInsights.reduce(
    (sum, i) => sum + parseFloat(i.potential_monthly_savings || '0'),
    0
  );

  const totalMonthlyDrain = parseFloat(analysisData?.total_monthly_leak || '0');
  const totalAnnualDrain = parseFloat(analysisData?.total_annual_leak || '0');

  // Count changes: price inflation or missing recurring payment
  const recentChangesCount =
    analysisData?.summary_stats?.recently_detected_changes_count ??
    insights.filter(
      (i) => i.insight_type === 'recurring_cost_inflation' || i.insight_type === 'missing_recurring_payment'
    ).length;

  // 5-Year SIP compound calculation at 12% p.a. (Hypothetical model)
  // Formula: P * [((1 + r)^n - 1) / r] * (1 + r)
  const r = 0.12 / 12;
  const n = 60;
  const projected5YearWealth =
    monthlySavingsIntercepted > 0
      ? Math.round(monthlySavingsIntercepted * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)))
      : 0;

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'sufficiently_supported':
        return {
          label: t('spend_leak.tier.sufficient', 'Sufficient Evidence (90+ Days)'),
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        };
      case 'provisional':
        return {
          label: t('spend_leak.tier.provisional', 'Provisional Baseline (30–89 Days)'),
          bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
        };
      case 'preliminary':
        return {
          label: t('spend_leak.tier.preliminary', 'Preliminary Baseline (7–29 Days)'),
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        };
      case 'limited_evidence':
      default:
        return {
          label: t('spend_leak.tier.limited', 'Limited Evidence (< 7 Days)'),
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sufficiently_supported':
        return {
          label: t('spend_leak.status.sufficient', 'Verified Pattern'),
          className: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300',
        };
      case 'provisional':
        return {
          label: t('spend_leak.status.provisional', 'Provisional Match'),
          className: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 border-teal-300',
        };
      case 'preliminary':
        return {
          label: t('spend_leak.status.preliminary', 'Preliminary Signal'),
          className: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300',
        };
      case 'insufficient_evidence':
      default:
        return {
          label: t('spend_leak.status.insufficient', 'Uncertain Pattern'),
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
        };
    }
  };

  const getInsightCategoryBadge = (type: string) => {
    switch (type) {
      case 'recurring_cost_inflation':
        return {
          icon: TrendingUp,
          label: t('spend_leak.type.inflation', 'Price Increase'),
          className: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'duplicate_charge_leakage':
        return {
          icon: Copy,
          label: t('spend_leak.type.duplicate', 'Duplicate Charge Candidate'),
          className: 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      case 'missing_recurring_payment':
        return {
          icon: Clock,
          label: t('spend_leak.type.missing', 'Missing Expected Charge'),
          className: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'dormant_recurring':
        return {
          icon: AlertTriangle,
          label: t('spend_leak.type.dormant', 'Dormant Subscription'),
          className: 'bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        };
      case 'recurring_subscription':
      default:
        return {
          icon: Activity,
          label: t('spend_leak.type.recurring', 'Recurring Plan'),
          className: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
    }
  };

  const tierBadge = getTierBadge(readiness?.readiness_tier);

  return (
    <ModuleShell
      title={t('mod.spend_leak_detector', 'Spend Leak Detector')}
      category={t('cat.decide_before', 'Decide Before Spending')}
      description={t(
        'mod.spend_leak_detector.desc',
        'Evidence-driven financial health audit scanning recurring plans, price hikes, duplicate charges, and cost leaks against verified historical baselines.'
      )}
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-20 bg-[var(--soft)] rounded-2xl animate-pulse" />
          <div className="grid sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[var(--soft)] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-[var(--soft)] rounded-3xl animate-pulse" />
        </div>
      ) : errorMessage ? (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-4">
          <div className="flex items-center gap-3 text-rose-900 dark:text-rose-200 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{t('spend_leak.error_title', 'Ledger Analysis Unavailable')}</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300">{errorMessage}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('common.retry', 'Retry Analysis')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* COMPACT READINESS & SHARED-LEDGER STATUS BAR */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs text-[#173F2B] dark:text-slate-100 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    {t('spend_leak.ledger_data_source', 'Shared FINROQ Ledger')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${tierBadge.bg}`}>
                    {tierBadge.label}
                  </span>
                  <span className="text-[11px] text-[#4D5D51] dark:text-slate-400">
                    • {readiness?.available_history_days ?? 0} {t('common.days_history', 'days history')} ({readiness?.observed_active_days ?? 0} {t('common.active_days', 'active days')})
                  </span>
                </div>
                <p className="text-xs text-[#4D5D51] dark:text-slate-400">
                  {t('spend_leak.shared_ledger_hint', 'Detection automatically audits your unified transaction records.')}{' '}
                  <Link
                    href="/transactions"
                    className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    {t('spend_leak.manage_ledger_link', 'Import bank statements or add transactions in Transactions')}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F5EE] hover:bg-[#E0EBE0] dark:bg-[#1A2C22] dark:hover:bg-[#253D30] text-[#173F2B] dark:text-emerald-300 border border-[#DCE4DC] dark:border-[#2A3D33] transition-colors shadow-xs cursor-pointer"
                  title="Re-run spend leak detection against active ledger"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? t('common.scanning', 'Scanning...') : t('spend_leak.re_scan', 'Re-scan Ledger')}
                </button>
              </div>
            </div>

            {/* Simulated Demo Dataset Banner (Honest Labeling) */}
            {readiness?.is_synthetic_demo_data && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
                <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>{t('spend_leak.demo_mode_label', 'Demo Simulation Mode:')}</strong>{' '}
                  {t(
                    'spend_leak.demo_mode_desc',
                    'Displaying simulated test fixtures. Connect real accounts or import CSV statements in your transactions tab to audit personal finances.'
                  )}
                </span>
              </div>
            )}
          </div>

          {/* KEY FINANCIAL INSIGHT METRICS CARDS (ABOVE THE FOLD) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Estimated Monthly Recurring Outflow */}
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400 block">
                {t('spend_leak.metrics.monthly_drag', 'Estimated Recurring Outflow')}
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#B43838] dark:text-rose-400">
                {formatCurrency(totalMonthlyDrain)}
                <span className="text-xs font-normal text-slate-500">/{t('common.mo', 'mo')}</span>
              </div>
              <p className="text-[11px] font-medium text-[#4D5D51] dark:text-slate-400">
                {activeInsights.length} {t('spend_leak.active_mandates', 'active recurring mandate(s)')}
              </p>
            </div>

            {/* Card 2: Estimated Annual Outflow */}
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400 block">
                {t('spend_leak.metrics.annual_drain', 'Estimated Annual Outflow')}
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(totalAnnualDrain)}
              </div>
              <p className="text-[11px] font-medium text-[#4D5D51] dark:text-slate-400">
                {t('spend_leak.uncommitted_cost_12m', 'Projected 12-month unmonitored outflow')}
              </p>
            </div>

            {/* Card 3: Potential Monthly Savings (Supported by Evidence) */}
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xs bg-emerald-50/30 dark:bg-emerald-950/20">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#157A42] dark:text-emerald-400 block">
                {t('spend_leak.metrics.potential_savings', 'Potential Monthly Savings')}
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#157A42] dark:text-emerald-400">
                +{formatCurrency(monthlySavingsIntercepted)}
                <span className="text-xs font-normal">/{t('common.mo', 'mo')}</span>
              </div>
              <p className="text-[11px] font-medium text-[#157A42] dark:text-emerald-300">
                {dismissedInsights.length > 0
                  ? `${dismissedInsights.length} ${t('spend_leak.leaks_dismissed', 'leak(s) intercepted / dismissed')}`
                  : t('spend_leak.dismiss_to_calculate', 'Dismiss unnecessary leaks below')}
              </p>
            </div>

            {/* Card 4: Price Hikes & Anomalies */}
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-2xl p-4 sm:p-5 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400 block">
                {t('spend_leak.metrics.changes_detected', 'Price Hikes & Anomalies')}
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {recentChangesCount}
              </div>
              <p className="text-[11px] font-medium text-[#4D5D51] dark:text-slate-400">
                {needsReviewCount > 0
                  ? `${needsReviewCount} ${t('spend_leak.awaiting_review', 'finding(s) awaiting review')}`
                  : t('spend_leak.all_reviewed', 'All findings reviewed')}
              </p>
            </div>
          </div>

          {/* COMPOUND WEALTH ACCELERATOR (CONDITIONAL HIGHLIGHT) */}
          {monthlySavingsIntercepted > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-[#EEF5EE] dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-300 dark:border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#173F2B] dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t('spend_leak.wealth_accelerator', 'Wealth Accelerator: Compounding Intercepted Leaks')}</span>
                </div>
                <p className="text-xs text-[#2A4736] dark:text-slate-300 max-w-xl">
                  {t(
                    'spend_leak.wealth_accelerator_desc',
                    `Hypothetical projection: By redirecting ${formatCurrency(monthlySavingsIntercepted)}/month of intercepted leaks into a disciplined 12% annual growth index fund:`
                  )}
                </p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#157A42] block">
                  {t('spend_leak.5_year_corpus', '5-Year Hypothetical Corpus')}
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#173F2B] dark:text-emerald-300">
                  {formatCurrency(projected5YearWealth)}
                </span>
              </div>
            </div>
          )}

          {/* MAIN FINDINGS & REVIEW LEDGER (PROMINENT, ABOVE THE FOLD) */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs">
            {/* Header & Filter Controls */}
            <div className="space-y-4 pb-4 border-b border-[#DCE4DC] dark:border-[var(--line)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                    {t('spend_leak.findings_header', 'Evidence-Driven Findings & Review')}
                  </h3>
                  <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                    {t(
                      'spend_leak.findings_subtitle',
                      'Scan results derived from verified transaction cadences, duplicate debits, and price hikes. Keep useful plans or dismiss leaks without altering underlying transactions.'
                    )}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono self-start sm:self-auto">
                  {filteredInsights.length} / {insights.length} {t('spend_leak.findings_count', 'Findings')}
                </span>
              </div>

              {/* Filter Chips Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#4D5D51] dark:text-slate-400 uppercase flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    {t('spend_leak.filter.status', 'Status:')}
                  </span>
                  {[
                    { key: 'all', label: t('spend_leak.filter.all', 'All') },
                    { key: 'new', label: `${t('spend_leak.filter.new', 'Needs Review')} (${needsReviewCount})` },
                    { key: 'keep', label: t('spend_leak.filter.keep', 'Kept') },
                    { key: 'dismissed', label: t('spend_leak.filter.dismissed', 'Dismissed') },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key as any)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        statusFilter === tab.key
                          ? 'bg-[#173F2B] text-white dark:bg-emerald-600 shadow-xs'
                          : 'bg-[#F0F5EE] dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-300 hover:bg-[#E0EBE0]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#4D5D51] dark:text-slate-400 uppercase mr-1">
                    {t('spend_leak.filter.category', 'Type:')}
                  </span>
                  {[
                    { key: 'all', label: t('spend_leak.filter.all_types', 'All Types') },
                    { key: 'recurring', label: t('spend_leak.filter.subscriptions', 'Subscriptions') },
                    { key: 'inflation', label: t('spend_leak.filter.price_hikes', 'Price Hikes') },
                    { key: 'duplicate', label: t('spend_leak.filter.duplicates', 'Duplicates') },
                    { key: 'missing', label: t('spend_leak.filter.missing_charges', 'Missing Charges') },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setCategoryFilter(tab.key as any)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        categoryFilter === tab.key
                          ? 'bg-emerald-700 text-white dark:bg-emerald-700 shadow-xs'
                          : 'bg-[#F0F5EE] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-400 hover:bg-[#E0EBE0]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings Rendering */}
            {filteredInsights.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-display font-bold text-base text-[#173F2B] dark:text-slate-100">
                  {t('spend_leak.no_leaks_found', 'No Matching Findings')}
                </h4>
                <p className="text-xs text-[#4D5D51] dark:text-slate-400 max-w-md mx-auto">
                  {t(
                    'spend_leak.no_leaks_desc',
                    'No transaction patterns matched your active filter. All records are currently reviewed or conform to baseline expectations.'
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#DCE4DC] dark:divide-[var(--line)]">
                {filteredInsights.map((item) => {
                  const lifecycleStatus = item.lifecycle_status || 'new';
                  const isDismissed = lifecycleStatus === 'dismissed';
                  const isKept = lifecycleStatus === 'keep';
                  const isExpanded = expandedInsightId === item.id;
                  const statusBadge = getStatusBadge(item.status);
                  const categoryBadge = getInsightCategoryBadge(item.insight_type);
                  const CategoryIcon = categoryBadge.icon;
                  const monthlyVal = parseFloat(item.potential_monthly_savings || '0');

                  return (
                    <div
                      key={item.id}
                      className={`py-4 space-y-2.5 transition-all ${
                        isDismissed
                          ? 'opacity-65 bg-slate-50/60 dark:bg-slate-900/30 rounded-2xl px-3 my-1'
                          : isKept
                          ? 'bg-emerald-50/25 dark:bg-emerald-950/20 rounded-2xl px-3 my-1'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${categoryBadge.className}`}
                            >
                              <CategoryIcon className="w-3 h-3" />
                              {categoryBadge.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                            {isKept && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold font-mono border border-emerald-300">
                                ✓ {t('spend_leak.marked_useful', 'Marked Useful')}
                              </span>
                            )}
                            {isDismissed && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono">
                                ✕ {t('spend_leak.dismissed', 'Dismissed / Intercepted')}
                              </span>
                            )}
                          </div>

                          <p
                            className={`font-bold text-sm ${
                              isDismissed ? 'line-through text-slate-500' : 'text-[#173F2B] dark:text-slate-100'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-[#4D5D51] dark:text-slate-300">
                            {item.description}
                          </p>

                          {/* Price Increase Details Box */}
                          {item.insight_type === 'recurring_cost_inflation' && item.previous_amount && item.current_amount && (
                            <div className="inline-flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-mono text-amber-900 dark:text-amber-200">
                              <span>
                                {formatCurrency(parseFloat(item.previous_amount))} → {formatCurrency(parseFloat(item.current_amount))}
                              </span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                (+{formatCurrency(parseFloat(item.price_increase_amount || '0'))}, +{item.price_increase_percentage}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right side: Amount and Review Actions */}
                        <div className="flex items-center gap-3 self-end sm:self-start shrink-0 flex-wrap">
                          {monthlyVal > 0 && (
                            <div className="text-right">
                              <span
                                className={`font-mono font-bold text-base ${
                                  isDismissed ? 'text-slate-400 line-through' : 'text-[#B43838] dark:text-rose-400'
                                }`}
                              >
                                {formatCurrency(monthlyVal)}
                              </span>
                              <span className="text-[10px] text-[#4D5D51] dark:text-slate-400 block font-medium">
                                /{t('common.month', 'month')}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons: Keep, Dismiss, Undo, Toggle Details */}
                          <div className="flex items-center gap-1.5">
                            {lifecycleStatus === 'new' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'keep')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0F5EE] hover:bg-[#E0EBE0] dark:bg-[#1A2C22] dark:hover:bg-[#253D30] text-[#173F2B] dark:text-emerald-300 border border-[#DCE4DC] transition-colors shadow-xs cursor-pointer"
                                  title="Mark this recurring payment as intentional and keep"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  {t('spend_leak.btn_keep', 'Keep')}
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'dismissed')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors shadow-xs cursor-pointer"
                                  title="Dismiss or mark for cancellation to intercept leak"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  {t('spend_leak.btn_dismiss', 'Dismiss')}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'new')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 transition-colors shadow-xs cursor-pointer"
                                title="Reset finding to needs review"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t('common.undo', 'Undo')}
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedInsightId(isExpanded ? null : item.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title={t('spend_leak.toggle_details', 'Toggle Evidence Details')}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Evidence & Methodology Details */}
                      {isExpanded && (
                        <div className="mt-2 p-3.5 rounded-2xl bg-[#F5F8F5] dark:bg-[#15231B] border border-[#DCE4DC] dark:border-[#22352A] space-y-2.5 text-xs animate-in fade-in duration-200">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                {t('spend_leak.evidence_summary', 'Supporting Evidence')}
                              </span>
                              <p className="text-[#173F2B] dark:text-slate-200">
                                {item.evidence_summary}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                {t('spend_leak.calculation_method', 'Calculation Method')}
                              </span>
                              <p className="text-[#173F2B] dark:text-slate-200">
                                {item.calculation_method}
                              </p>
                            </div>
                          </div>

                          {/* Underlying Recorded Transactions */}
                          {item.supporting_transactions && item.supporting_transactions.length > 0 && (
                            <div className="space-y-1 pt-2 border-t border-[#DCE4DC] dark:border-[#22352A]">
                              <span className="font-mono text-[10px] uppercase font-bold text-[#4D5D51] dark:text-slate-400">
                                {t('spend_leak.recorded_txns', 'Underlying Recorded Transactions')} ({item.supporting_transactions.length})
                              </span>
                              <div className="space-y-1 max-h-36 overflow-y-auto">
                                {item.supporting_transactions.map((tx) => (
                                  <div
                                    key={tx.id}
                                    className="flex items-center justify-between font-mono text-[11px] text-[#2A4736] dark:text-slate-300 py-0.5"
                                  >
                                    <span>
                                      {new Date(tx.transaction_date).toLocaleDateString()} • {tx.description || t('common.debit', 'Debit')}
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
                              <strong>{t('spend_leak.assumptions', 'Assumptions')}:</strong> {item.assumptions}
                            </div>
                            <div>
                              <strong>{t('spend_leak.limitations', 'Limitations')}:</strong> {item.limitations}
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-[#101B14] border border-[#DCE4DC] dark:border-[#22352A] text-xs">
                            <span className="text-[#173F2B] dark:text-slate-200 font-medium">
                              <strong>{t('spend_leak.recommended_action', 'Recommended Action')}:</strong> {item.recommended_action}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LOWER-PRIORITY COVERAGE DIAGNOSTICS & AUDIT METRICS (COLLAPSIBLE ACCORDION) */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <button
              onClick={() => setShowDiagnostics((prev) => !prev)}
              className="w-full flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <h4 className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100 group-hover:text-emerald-700 transition-colors">
                  {t('spend_leak.diagnostics_title', 'Ledger Coverage Diagnostics & Audit Metrics')}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5E6B65] dark:text-slate-400 font-mono">
                <span>{showDiagnostics ? t('common.collapse', 'Hide Details') : t('common.expand', 'Show Details')}</span>
                {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showDiagnostics && (
              <div className="space-y-4 pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)] animate-in fade-in duration-200">
                <p className="text-xs text-[#4D5D51] dark:text-slate-400">
                  {readiness?.readiness_explanation}
                </p>

                {/* 4-Item Coverage Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {t('spend_leak.available_history', 'Available History')}
                    </div>
                    <div className="font-mono text-xl font-bold text-[#173F2B] dark:text-slate-100">
                      {readiness?.available_history_days ?? 0}{' '}
                      <span className="text-xs font-normal">{t('common.days', 'days')}</span>
                    </div>
                    <p className="text-[10px] text-[#5E6B65] dark:text-slate-400">
                      {t('spend_leak.calendar_span', 'Calendar span of eligible records')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                      {t('spend_leak.observed_activity', 'Observed Activity')}
                    </div>
                    <div className="font-mono text-xl font-bold text-[#173F2B] dark:text-slate-100">
                      {readiness?.observed_active_days ?? 0}{' '}
                      <span className="text-xs font-normal">{t('spend_leak.active_days', 'active days')}</span>
                    </div>
                    <p className="text-[10px] text-[#5E6B65] dark:text-slate-400">
                      {t('spend_leak.distinct_days', 'Distinct days with completed debits')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      {t('spend_leak.verified_coverage', 'Verified Coverage')}
                    </div>
                    <div className="font-mono text-sm font-bold text-[#173F2B] dark:text-slate-100 truncate">
                      {readiness?.verified_coverage_status === 'verified_statement'
                        ? t('spend_leak.statement_import', 'Statement Import')
                        : t('spend_leak.self_reported', 'Self-Reported')}
                    </div>
                    <p className="text-[10px] text-[#5E6B65] dark:text-slate-400 truncate">
                      {readiness?.imported_transactions_count ?? 0} {t('common.imported', 'imported')} • {readiness?.manual_transactions_count ?? 0} {t('common.manual', 'manual')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F7FAF7] dark:bg-[#15231B] border border-[#E3ECE3] dark:border-[#22352A] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-[#4D5D51] dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {t('spend_leak.data_freshness', 'Data Freshness')}
                    </div>
                    <div className="font-mono text-xl font-bold text-[#173F2B] dark:text-slate-100">
                      {readiness?.data_freshness_days != null
                        ? `${readiness.data_freshness_days}${t('spend_leak.days_ago', 'd ago')}`
                        : 'N/A'}
                    </div>
                    <p className="text-[10px] text-[#5E6B65] dark:text-slate-400">
                      {readiness?.accounts_included?.length ?? 0} {t('spend_leak.active_accounts_analyzed', 'account(s) audited')}
                    </p>
                  </div>
                </div>

                {/* Detectable Coverage Gaps */}
                {readiness?.missing_periods && readiness.missing_periods.length > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1 text-xs text-rose-900 dark:text-rose-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      {t('spend_leak.coverage_gaps_observed', 'Detectable Coverage Gaps Observed')}
                    </div>
                    {readiness.missing_periods.map((gap, idx) => (
                      <p key={idx} className="pl-5 text-[11px] text-rose-800 dark:text-rose-300">
                        • {gap.description}
                      </p>
                    ))}
                  </div>
                )}

                {/* Statutory Disclaimer */}
                <div className="pt-2 flex items-start gap-2 text-[11px] text-[#5E6B65] dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{t('spend_leak.disclosure_title', 'Methodology & Disclosure:')}</strong>{' '}
                    {analysisData?.disclaimer ||
                      t(
                        'spend_leak.default_disclaimer',
                        'All savings projections represent mathematical estimates based on recurring pattern cancellation and do not represent guaranteed cash deposits.'
                      )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
