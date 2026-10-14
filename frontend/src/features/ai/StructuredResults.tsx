'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart,
  ShoppingBag,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

interface StructuredResultsProps {
  data: Record<string, any>;
  currency?: string;
}

export function StructuredResults({ data, currency = 'INR' }: StructuredResultsProps) {
  if (!data || Object.keys(data).length === 0) return null;

  // 1. Financial Summary Overview
  if (data.total_income && data.total_expenses && data.liquid_cash_available) {
    return (
      <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Ledger Overview
          </span>
          <span className="text-[11px] font-mono text-[var(--muted)]">{data.data_freshness || 'Verified'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
      </div>
    );
  }

  return null;
}
