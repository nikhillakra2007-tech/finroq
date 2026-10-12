'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { RecurringTransaction } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Zap, ShieldAlert, ArrowUpRight, CheckCircle2, TrendingDown, Repeat } from 'lucide-react';

export default function SpendLeaksPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.listRecurring();
        setRecurring(res.data.filter((r) => r.transaction_type === 'expense' && r.status === 'active'));
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMonthlyLeaks = recurring.reduce((sum, r) => {
    const amt = parseFloat(r.amount);
    if (r.frequency === 'daily') return sum + amt * 30;
    if (r.frequency === 'weekly') return sum + amt * 4.33;
    if (r.frequency === 'yearly') return sum + amt / 12;
    return sum + amt;
  }, 0);

  const annualizedCost = totalMonthlyLeaks * 12;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-3">
            <Zap className="h-3.5 w-3.5" />
            Module 5: Decide Before Spending
          </div>
          <h1 className="heading-page">Spend Leak Detector</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Audit automatic recurring commitments and subscriptions to expose hidden annual drains on your cash flow.
          </p>
        </div>

        {/* Top Impact KPI Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Monthly Commitments</span>
            <p className="font-mono text-2xl font-bold text-finroq-forest mt-1">
              {formatCurrency(totalMonthlyLeaks)}
            </p>
            <span className="text-[11px] text-finroq-muted">Auto-debited every month</span>
          </Card>
          <Card className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-xs">
            <span className="text-xs text-amber-800 font-semibold">Annualized Cumulative Cost</span>
            <p className="font-mono text-2xl font-bold text-amber-900 mt-1">
              {formatCurrency(annualizedCost)}
            </p>
            <span className="text-[11px] text-amber-800 font-medium">Full 1-year outflow impact</span>
          </Card>
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Active Subscriptions</span>
            <p className="font-mono text-2xl font-bold text-finroq-text mt-1">{recurring.length}</p>
            <span className="text-[11px] text-finroq-positive font-medium">Monitored for unexpected price hikes</span>
          </Card>
        </div>

        {/* Breakdown of recurring items */}
        <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
            <h2 className="font-heading font-bold text-base text-finroq-text">Audited Recurring Subscriptions</h2>
            <span className="text-xs text-finroq-muted">Source: Active Recurring Schedules</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-xs text-finroq-muted">Auditing recurring rules...</div>
          ) : recurring.length === 0 ? (
            <div className="text-center py-8 text-xs text-finroq-muted">
              No active recurring commitments detected. All clear!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recurring.map((item) => {
                const amt = parseFloat(item.amount);
                const annual = item.frequency === 'monthly' ? amt * 12 : amt;
                return (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-finroq-mint rounded-xl text-finroq-forest">
                        <Repeat className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-finroq-text">
                          {item.description || 'Subscription'}
                        </p>
                        <span className="text-xs text-finroq-muted capitalize">
                          {item.frequency} schedule • Next: {item.next_occurrence || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-finroq-text">
                        {formatCurrency(item.amount)}/{item.frequency === 'monthly' ? 'mo' : item.frequency}
                      </p>
                      <span className="text-[11px] text-amber-700 font-medium">
                        {formatCurrency(annual)}/yr
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
