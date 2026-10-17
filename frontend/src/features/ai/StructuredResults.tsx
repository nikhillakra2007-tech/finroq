'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import {
  PieChart,
  ShoppingBag,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Target,
  ShieldAlert,
  Check,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface StructuredResultsProps {
  data: Record<string, any>;
  currency?: string;
}

function BudgetProposalCard({ data, currency = 'INR' }: { data: Record<string, any>; currency: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApply = async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);

      const proposed = parseFloat(data.proposed_allocated);
      if (data.budget_id) {
        await apiClient.updateBudget(data.budget_id, {
          allocated_amount: proposed.toFixed(2),
        });
      } else {
        await apiClient.createBudget({
          category_id: data.category_id,
          budget_year: data.year,
          budget_month: data.month,
          allocated_amount: proposed.toFixed(2),
        });
      }
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to apply budget adjustment.');
    }
  };

  const diffNum = parseFloat(data.difference || '0');

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Proposed Budget Adjustment
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Requires Confirmation
        </span>
      </div>

      <div className="text-xs text-[var(--muted)]">
        {data.impact_summary || `Proposed adjustment for ${data.category_name}`}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Current Cap</span>
          <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
            {formatCurrency(parseFloat(data.current_allocated || '0'), currency)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Proposed Cap</span>
          <span className="font-mono font-bold text-[#173F2B] dark:text-emerald-300">
            {formatCurrency(parseFloat(data.proposed_allocated || '0'), currency)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Net Adjustment</span>
          <span className={`font-mono font-bold ${diffNum > 0 ? 'text-emerald-700 dark:text-emerald-400' : diffNum < 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600'}`}>
            {diffNum > 0 ? '+' : ''}{formatCurrency(diffNum, currency)}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <span>{data.consequential_action_notice || 'Consequential change: Clicking Confirm will update your active budget cap in the verified ledger.'}</span>
      </div>

      {status === 'success' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Ledger Updated: Successfully applied {data.category_name} budget adjustment.</span>
          </div>
          <div className="flex justify-end">
            <Link
              href="/app/budgeting"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
            >
              <span>View Active Budgets in Ledger</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            href="/app/budgeting"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors group"
          >
            <span>Current Budgets</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <div className="flex items-center gap-2">
            {errorMessage && (
              <span className="text-xs text-red-600 font-mono mr-2">{errorMessage}</span>
            )}
            <button
              onClick={handleApply}
              disabled={status === 'loading'}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#173F2B] hover:bg-[#102F21] dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span>Applying...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Apply Budget Cap</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecurringProposalCard({ data, currency = 'INR' }: { data: Record<string, any>; currency: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSchedule = async () => {
    try {
      setStatus('loading');
      setErrorMessage(null);

      await apiClient.createRecurring({
        account_id: data.account_id,
        category_id: data.category_id,
        amount: parseFloat(data.amount).toFixed(2),
        currency: data.currency || currency,
        frequency: data.frequency || 'monthly',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        description: data.description,
        transaction_type: 'expense',
      });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to schedule recurring commitment.');
    }
  };

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Proposed Recurring Commitment
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Requires Confirmation
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Commitment</span>
          <span className="font-semibold text-[#173F2B] dark:text-slate-100">{data.description}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Obligation Amount</span>
          <span className="font-mono font-bold text-red-600 dark:text-red-400">
            {formatCurrency(parseFloat(data.amount || '0'), data.currency || currency)}
            <span className="text-[10px] text-[var(--muted)] font-normal ml-1">/{data.frequency}</span>
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[var(--muted)] font-mono block">Category</span>
          <span className="font-semibold text-[#173F2B] dark:text-slate-100">{data.category_name || 'Unassigned'}</span>
        </div>
      </div>

      <div className="text-[11px] text-amber-900 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <span>{data.consequential_action_notice || 'Consequential change: Scheduling will create an active recurring commitment in your ledger.'}</span>
      </div>

      {status === 'success' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified Ledger Updated: Successfully scheduled &apos;{data.description}&apos; as an active recurring bill.</span>
          </div>
          <div className="flex justify-end">
            <Link
              href="/app/debt-watchdog"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
            >
              <span>View Obligations in Debt Watchdog</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 pt-1">
          <Link
            href="/app/debt-watchdog"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors group"
          >
            <span>Active Obligations</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <div className="flex items-center gap-2">
            {errorMessage && (
              <span className="text-xs text-red-600 font-mono mr-2">{errorMessage}</span>
            )}
            <button
              onClick={handleSchedule}
              disabled={status === 'loading'}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#173F2B] hover:bg-[#102F21] dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span>Scheduling...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Schedule Recurring Bill</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StructuredResults({ data, currency = 'INR' }: StructuredResultsProps) {
  if (!data || Object.keys(data).length === 0) return null;

  const isSimulated = Boolean(
    data.is_simulated ||
    (typeof data.data_freshness === 'string' && (data.data_freshness.toLowerCase().includes('demo') || data.data_freshness.toLowerCase().includes('simulated')))
  );

  const isVerified = Boolean(
    !isSimulated &&
    typeof data.data_freshness === 'string' &&
    data.data_freshness.toLowerCase().includes('verified')
  );

  // Proposal: Budget Adjustment
  if (data.type === 'budget_adjustment_proposal') {
    return <BudgetProposalCard data={data} currency={currency} />;
  }

  // Proposal: Recurring Bill
  if (data.type === 'recurring_bill_proposal') {
    return <RecurringProposalCard data={data} currency={currency} />;
  }

  // Goal Timeline Simulation
  if (data.type === 'goal_timeline_simulation' || (data.projected_months_needed !== undefined && data.goal_name)) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Goal Timeline Projection
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
            {data.feasibility_status || 'Projection Model'}
          </span>
        </div>
        <div className="text-xs font-semibold text-[#173F2B] dark:text-slate-100">
          {data.goal_name}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Target</span>
            <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
              {formatCurrency(parseFloat(data.target_amount || '0'), currency)}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Saved</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(parseFloat(data.current_savings || '0'), currency)}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Monthly</span>
            <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
              {formatCurrency(parseFloat(data.monthly_contribution || '0'), currency)}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono block">Timeline</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {data.projected_completion_timeline || `${data.projected_months_needed} mos`}
            </span>
          </div>
        </div>
        {data.explanation && (
          <p className="text-[11px] text-[var(--muted)] font-mono">
            {data.explanation}
          </p>
        )}
        <div className="pt-1.5 flex justify-end">
          <Link
            href="/app/goal-timeline"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Open Goal Simulator</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 1. Financial Summary Overview
  if (data.total_income && data.total_expenses && data.liquid_cash_available) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {isSimulated
              ? 'Simulated Demo Overview'
              : isVerified
              ? 'Verified Ledger Overview'
              : 'Ledger Summary Overview'}
          </span>
          <span className={`text-[11px] font-mono ${
            isSimulated
              ? 'text-amber-700 dark:text-amber-400 font-bold'
              : isVerified
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-[var(--muted)]'
          }`}>
            {data.data_freshness || (isSimulated ? 'Simulated Demo' : 'Summary')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Liquid Cash</span>
            <span className="font-mono font-bold text-[#173F2B] dark:text-emerald-300">
              {formatCurrency(parseFloat(data.liquid_cash_available), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-mono block">Inflow</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              +{formatCurrency(parseFloat(data.total_income), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
            <span className="text-[10px] text-red-800 dark:text-red-400 font-mono block">Outflow</span>
            <span className="font-mono font-bold text-red-700 dark:text-red-300">
              -{formatCurrency(parseFloat(data.total_expenses), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Net Cash Flow</span>
            <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
              {formatCurrency(parseFloat(data.net_cash_flow), currency)}
            </span>
          </div>
        </div>
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/expense-tracking"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Explore Cash Flow in Expense Tracking</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. Purchase Affordability Evaluation
  if (data.affordability_rating && data.purchase_amount) {
    const isAffordable = data.affordability_rating.includes('Comfortably');
    const isCaution = data.affordability_rating.includes('Caution');

    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Affordability Assessment
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              isAffordable
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                : isCaution
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
            }`}
          >
            {data.affordability_rating}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Purchase Cost</span>
            <span className="font-mono font-bold text-red-600 dark:text-red-400">
              {formatCurrency(parseFloat(data.purchase_amount), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Available Cash</span>
            <span className="font-mono font-bold text-[#173F2B] dark:text-emerald-300">
              {formatCurrency(parseFloat(data.available_liquid_cash || '0'), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)]/50 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Upcoming Scheduled Bills</span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(parseFloat(data.upcoming_known_bills || '0'), currency)}
            </span>
          </div>
        </div>

        {data.category_budget_assessment && (
          <div className="p-2.5 rounded-xl bg-[var(--soft)]/80 border border-[var(--line)] text-xs space-y-1.5">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-[#173F2B] dark:text-slate-100 flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-[var(--accent)]" />
                Category Budget: {data.category_budget_assessment.category_name}
              </span>
              <span className={data.category_budget_assessment.will_overspend_category_budget ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                {data.category_budget_assessment.will_overspend_category_budget
                  ? `Exceeds cap by ${formatCurrency(parseFloat(data.category_budget_assessment.overrun_amount), currency)}`
                  : `Within remaining cap (${formatCurrency(parseFloat(data.category_budget_assessment.remaining_before_purchase), currency)})`}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[var(--muted)] font-mono">
              <span>Allocated: {formatCurrency(parseFloat(data.category_budget_assessment.allocated_amount), currency)}</span>
              <span>Spent so far: {formatCurrency(parseFloat(data.category_budget_assessment.spent_to_date), currency)}</span>
            </div>
          </div>
        )}
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/pre-spend-check"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Run Scenario in Pre-Spend Check</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Category Spending Breakdown
  if (data.breakdown_by_category && Array.isArray(data.breakdown_by_category)) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5" />
            Top Category Outflow
          </span>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            Total: {formatCurrency(parseFloat(data.total_expenses || '0'), currency)}
          </span>
        </div>
        <div className="space-y-2">
          {data.breakdown_by_category.slice(0, 4).map((cat: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[var(--soft)]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span className="font-semibold text-[#173F2B] dark:text-slate-100">{cat.category_name}</span>
                <span className="text-[10px] text-[var(--muted)] font-mono">({cat.nature})</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                  {formatCurrency(parseFloat(cat.amount), currency)}
                </span>
                <span className="text-[10px] text-[var(--muted)] ml-1.5">({cat.percentage_of_total})</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/expense-tracking"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>View Full Ledger Breakdown</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Budget Status
  if (data.budgets && Array.isArray(data.budgets)) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5" />
            Category Budget Performance
          </span>
          <span className="text-[11px] font-mono text-[var(--muted)]">{data.overall_utilization} spent</span>
        </div>
        <div className="space-y-2">
          {data.budgets.slice(0, 4).map((b: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[var(--soft)]/60 text-xs space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-[#173F2B] dark:text-slate-100">{b.category_name}</span>
                <span className={b.is_overspent ? 'text-red-600 font-bold' : 'text-[#173F2B] dark:text-slate-200'}>
                  {formatCurrency(parseFloat(b.spent_to_date), currency)} / {formatCurrency(parseFloat(b.budget_limit), currency)}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${b.is_overspent ? 'bg-red-500' : 'bg-[var(--accent)]'}`}
                  style={{ width: `${Math.min(100, parseFloat(b.percentage_used || '0'))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/budgeting"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Manage All Category Budgets</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 5. Savings Scenario
  if (data.monthly_target || data.estimated_monthly_savings) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Savings Scenario Model
          </span>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">
            {data.feasibility || 'Projected Scenario'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--soft)]">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Monthly Savings</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              +{formatCurrency(parseFloat(data.monthly_target || data.estimated_monthly_savings || '0'), currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--soft)]">
            <span className="text-[10px] text-[var(--muted)] font-mono block">Annual Impact</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              +{formatCurrency(parseFloat(data.annual_savings_impact || data.estimated_annual_savings || '0'), currency)}
            </span>
          </div>
        </div>
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/goal-timeline"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Simulate in Goal Timeline</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 6. Upcoming Bills
  if (data.bills && Array.isArray(data.bills)) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled Recurring Bills
          </span>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            Total: {formatCurrency(parseFloat(data.upcoming_commitment_sum || '0'), currency)}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          {data.bills.slice(0, 3).map((b: any, idx: number) => (
            <div key={idx} className="flex justify-between p-2 rounded-xl bg-[var(--soft)]/60">
              <div>
                <span className="font-semibold text-[#173F2B] dark:text-slate-100">{b.description}</span>
                <span className="text-[10px] text-[var(--muted)] block font-mono">Due: {b.expected_due_date}</span>
              </div>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(parseFloat(b.expected_amount), b.currency || currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-1 flex justify-end">
          <Link
            href="/app/debt-watchdog"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors group"
          >
            <span>Manage Obligations in Debt Watchdog</span>
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

