'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { RecurringTransaction } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AppSpendLeakDetectorPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.listRecurring();
        setRecurring(res.data.filter((r) => r.transaction_type === 'expense' && r.status === 'active'));
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMonthlyCost = recurring.reduce((sum, r) => {
    const amt = parseFloat(r.amount);
    if (r.frequency === 'daily') return sum + amt * 30;
    if (r.frequency === 'weekly') return sum + amt * 4.33;
    if (r.frequency === 'yearly') return sum + amt / 12;
    return sum + amt;
  }, 0);

  const annualDrag = totalMonthlyCost * 12;

  return (
    <ModuleShell
      title="Spend Leak Detector"
      category="Decide Before Spending"
      description="Scan recurring contracts, subscriptions, and periodic auto-debits to expose silent annual cash drain."
    >
      <div className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Monthly Recurring Drag</span>
            <div className="font-mono text-3xl font-bold text-[var(--bad)]">
              {formatCurrency(totalMonthlyCost)}
            </div>
            <p className="text-xs text-[var(--muted)]">Across {recurring.length} active recurring commitments</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Annual Cumulative Drain</span>
            <div className="font-mono text-3xl font-bold text-[var(--ink)]">
              {formatCurrency(annualDrag)}
            </div>
            <p className="text-xs text-[var(--muted)]">Total cost over 12 billing cycles</p>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">Detected Recurring Commitments</h3>
            <span className="text-xs font-mono text-[var(--muted)]">Active Subscriptions</span>
          </div>

          {recurring.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              No active recurring transactions found. Set up recurring subscriptions in Module 1 to monitor auto-debits.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {recurring.map((r) => (
                <div key={r.id} className="py-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{r.description || r.category_name || 'Subscription'}</p>
                    <span className="text-xs text-[var(--muted)] font-mono capitalize">
                      {r.frequency} • Next: {r.next_occurrence || 'Upcoming'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-[var(--bad)]">
                      {formatCurrency(r.amount)}
                    </span>
                    <span className="text-xs text-[var(--muted)] block">per {r.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
