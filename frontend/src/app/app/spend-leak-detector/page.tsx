'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Zap, AlertTriangle, ShieldCheck, CheckCircle2, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';

interface LeakItem {
  id: number;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  lastUsedDaysAgo: number;
  status: 'active' | 'cancelled';
  leakSeverity: 'high' | 'medium' | 'low';
}

const DEFAULT_LEAKS: LeakItem[] = [
  { id: 1, name: 'Netflix Premium (Ultra HD 4K)', category: 'Streaming & OTT', amount: 649, frequency: 'monthly', lastUsedDaysAgo: 48, status: 'active', leakSeverity: 'high' },
  { id: 2, name: 'Cult.fit Elite Gym & Sport', category: 'Fitness & Health', amount: 2499, frequency: 'monthly', lastUsedDaysAgo: 62, status: 'active', leakSeverity: 'high' },
  { id: 3, name: 'Adobe Creative Cloud Pro', category: 'SaaS Software', amount: 1675, frequency: 'monthly', lastUsedDaysAgo: 35, status: 'active', leakSeverity: 'high' },
  { id: 4, name: 'Spotify Individual Premium', category: 'Music Streaming', amount: 119, frequency: 'monthly', lastUsedDaysAgo: 14, status: 'active', leakSeverity: 'medium' },
  { id: 5, name: 'Cloud Storage 2TB Tier', category: 'Cloud Backup', amount: 650, frequency: 'monthly', lastUsedDaysAgo: 29, status: 'active', leakSeverity: 'medium' },
  { id: 6, name: 'LinkedIn Premium Career', category: 'Professional SaaS', amount: 1499, frequency: 'monthly', lastUsedDaysAgo: 41, status: 'active', leakSeverity: 'high' },
  { id: 7, name: 'Disney+ Hotstar Premium', category: 'Streaming & OTT', amount: 299, frequency: 'monthly', lastUsedDaysAgo: 55, status: 'active', leakSeverity: 'high' },
  { id: 8, name: 'Amazon Prime Membership', category: 'Shopping & Delivery', amount: 299, frequency: 'monthly', lastUsedDaysAgo: 38, status: 'active', leakSeverity: 'medium' },
  { id: 9, name: 'Gym Membership (Anytime Fitness)', category: 'Fitness & Health', amount: 1899, frequency: 'monthly', lastUsedDaysAgo: 70, status: 'active', leakSeverity: 'high' },
  { id: 10, name: 'Notion Pro Workspace', category: 'SaaS Software', amount: 400, frequency: 'monthly', lastUsedDaysAgo: 45, status: 'active', leakSeverity: 'medium' },
  { id: 11, name: 'iCloud Storage 200GB', category: 'Cloud Backup', amount: 219, frequency: 'monthly', lastUsedDaysAgo: 20, status: 'active', leakSeverity: 'low' },
  { id: 12, name: 'Zomato Gold Membership', category: 'Food Delivery', amount: 129, frequency: 'monthly', lastUsedDaysAgo: 33, status: 'active', leakSeverity: 'medium' },
];

export default function AppSpendLeakDetectorPage() {
  const [leaks, setLeaks] = useState<LeakItem[]>(DEFAULT_LEAKS);
  const [cancelledCount, setCancelledCount] = useState(0);

  const activeLeaks = leaks.filter((l) => l.status === 'active');
  const cancelledLeaks = leaks.filter((l) => l.status === 'cancelled');

  const totalMonthlyDrain = activeLeaks.reduce((sum, l) => sum + l.amount, 0);
  const totalAnnualDrain = totalMonthlyDrain * 12;

  const monthlySavingsRecovered = cancelledLeaks.reduce((sum, l) => sum + l.amount, 0);
  const annualSavingsRecovered = monthlySavingsRecovered * 12;

  // 5-Year SIP compound calculation at 12% p.a.
  // Formula: P * [((1 + r)^n - 1) / r] * (1 + r)
  const r = 0.12 / 12;
  const n = 60;
  const projected5YearWealth = monthlySavingsRecovered > 0
    ? Math.round(monthlySavingsRecovered * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)))
    : 0;

  const handleCancelSubscription = (id: number) => {
    setLeaks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item))
    );
    setCancelledCount((c) => c + 1);
  };

  const handleRestoreSubscription = (id: number) => {
    setLeaks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'active' } : item))
    );
  };

  return (
    <ModuleShell
      title="Spend Leak Detector"
      category="Decide Before Spending"
      description="Scan dormant OTT subscriptions, recurring app fees, and unused SaaS memberships to halt silent wealth erosion."
    >
      <div className="space-y-8">
        {/* Top Summary Metrics Cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">Monthly Subscriptions Drag</span>
            <div className="font-mono text-3xl font-bold text-[#B43838] dark:text-rose-400">
              {formatCurrency(totalMonthlyDrain)}
            </div>
            <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">Across {activeLeaks.length} active recurring plans</p>
          </div>

          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">Annual Cumulative Drain</span>
            <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
              {formatCurrency(totalAnnualDrain)}
            </div>
            <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">Cost if left unmonitored for 12 months</p>
          </div>

          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-emerald-300 dark:border-emerald-800/80 rounded-3xl p-6 space-y-2 shadow-xs bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#157A42] dark:text-emerald-400">Recovered Cash Flow</span>
            <div className="font-mono text-3xl font-bold text-[#157A42] dark:text-emerald-400">
              +{formatCurrency(monthlySavingsRecovered)}<span className="text-xs font-normal">/mo</span>
            </div>
            <p className="text-xs font-medium text-[#157A42] dark:text-emerald-300">
              {cancelledLeaks.length} subscription{cancelledLeaks.length !== 1 ? 's' : ''} intercepted
            </p>
          </div>
        </div>

        {/* Compound Wealth Calculator Banner */}
        {monthlySavingsRecovered > 0 && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-[#EEF5EE] dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-300 dark:border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs animate-in fade-in duration-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[#173F2B] dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Wealth Accelerator: Cancelled Subscriptions Compounding</span>
              </div>
              <p className="text-xs text-[#2A4736] dark:text-slate-300 max-w-xl">
                By investing your recovered <strong>{formatCurrency(monthlySavingsRecovered)}/month</strong> into a disciplined 12% Nifty Index SIP instead of leaking it to unused apps:
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#157A42] block">5-Year Projected Corpus</span>
              <span className="font-mono text-2xl font-black text-[#173F2B] dark:text-emerald-300">
                {formatCurrency(projected5YearWealth)}
              </span>
            </div>
          </div>
        )}

        {/* Subscriptions Detection Box */}
        <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCE4DC] dark:border-[var(--line)] gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                Detected App, Streaming & SaaS Subscriptions
              </h3>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                Identified based on card mandate recurrences and lack of user logins
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold font-mono">
              <AlertTriangle className="w-3.5 h-3.5" /> {activeLeaks.length} Active Leaks
            </span>
          </div>

          <div className="divide-y divide-[#DCE4DC] dark:divide-[var(--line)]">
            {leaks.map((item) => {
              const isCancelled = item.status === 'cancelled';
              return (
                <div
                  key={item.id}
                  className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isCancelled ? 'opacity-60 bg-emerald-50/20 rounded-xl px-2' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <p className={`font-bold text-sm ${isCancelled ? 'line-through text-slate-500' : 'text-[#173F2B] dark:text-slate-100'}`}>
                        {item.name}
                      </p>
                      {item.lastUsedDaysAgo > 40 && !isCancelled && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono uppercase">
                          Dormant {item.lastUsedDaysAgo}d
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          ✓ Cancelled & Saved
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                      {item.category} • Billed {item.frequency} • Last active {item.lastUsedDaysAgo} days ago
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className={`font-mono font-bold text-base ${isCancelled ? 'text-slate-400' : 'text-[#B43838] dark:text-rose-400'}`}>
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[11px] text-[#4D5D51] dark:text-slate-400 block font-medium">/{item.frequency}</span>
                    </div>

                    {!isCancelled ? (
                      <button
                        onClick={() => handleCancelSubscription(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors shadow-xs"
                      >
                        Cancel Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreSubscription(item.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#173F2B] dark:text-slate-300 border border-[#DCE4DC] hover:bg-slate-100 transition-colors"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
