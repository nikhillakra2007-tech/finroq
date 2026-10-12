'use client';

import React, { useState } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { formatCurrency } from '@/lib/utils';
import { ShieldAlert, Calendar, Plus, AlertCircle } from 'lucide-react';

interface DebtItem {
  id: string;
  name: string;
  principal: number;
  remaining: number;
  monthlyEMI: number;
  interestRate: number;
  dueDate: string;
}

export default function AppDebtWatchdogPage() {
  const [debts, setDebts] = useState<DebtItem[]>([
    {
      id: '1',
      name: 'Vehicle Auto Loan',
      principal: 650000,
      remaining: 420000,
      monthlyEMI: 14500,
      interestRate: 8.5,
      dueDate: '5th of every month',
    },
    {
      id: '2',
      name: 'Credit Card Revolving',
      principal: 75000,
      remaining: 22340,
      monthlyEMI: 3500,
      interestRate: 36.0,
      dueDate: '18th of every month',
    },
  ]);

  const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);
  const totalMonthlyObligation = debts.reduce((sum, d) => sum + d.monthlyEMI, 0);

  return (
    <ModuleShell
      title="EMI/Debt Watchdog"
      category="Manage Obligations"
      description="Track outstanding loan balances, recurring monthly EMIs, payment due dates, and interest drag without guessing."
    >
      <div className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Total Outstanding Debt</span>
            <div className="font-mono text-3xl font-bold text-[var(--bad)]">
              {formatCurrency(totalDebt)}
            </div>
            <p className="text-xs text-[var(--muted)]">Across {debts.length} active loan obligations</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Monthly EMI Burden</span>
            <div className="font-mono text-3xl font-bold text-[var(--ink)]">
              {formatCurrency(totalMonthlyObligation)}
            </div>
            <p className="text-xs text-[var(--muted)]">Committed monthly cash outflow</p>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">Active Debt Contracts</h3>
            <span className="text-xs font-mono text-[var(--muted)]">Fixed Amortization</span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {debts.map((d) => (
              <div key={d.id} className="py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-base text-[var(--ink)]">{d.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)]">
                    <span className="font-mono">Due: {d.dueDate}</span>
                    <span>•</span>
                    <span className="font-mono text-[var(--bad)] font-semibold">{d.interestRate}% APR</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[var(--muted)] block">Remaining Balance</span>
                  <span className="font-mono text-lg font-bold text-[var(--ink)]">
                    {formatCurrency(d.remaining)}
                  </span>
                  <span className="text-xs text-[var(--muted)] block mt-0.5">
                    EMI: <strong className="font-mono text-[var(--bad)]">{formatCurrency(d.monthlyEMI)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)] text-xs text-[var(--muted)] flex items-center gap-2 border border-[var(--line)]">
            <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>
              Tip: Prioritize paying down highest-interest obligations (Avalanche method) to minimize cumulative interest bleed.
            </span>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
