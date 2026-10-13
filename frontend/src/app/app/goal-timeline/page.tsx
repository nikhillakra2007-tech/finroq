'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Target, Calendar, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';

export default function AppGoalTimelinePage() {
  const [goalName, setGoalName] = useState('Down Payment Fund');
  const [targetAmount, setTargetAmount] = useState(500000);
  const [currentSavings, setCurrentSavings] = useState(125000);
  const [monthlyContribution, setMonthlyContribution] = useState(25000);

  useEffect(() => {
    async function loadSavings() {
      try {
        const res = await apiClient.listAccounts();
        const savingsAccounts = (res.data.accounts || []).filter((a: any) => a.account_type === 'savings');
        if (savingsAccounts.length > 0) {
          const totalSaved = savingsAccounts.reduce(
            (sum: number, a: any) => sum + parseFloat(a.current_balance || a.initial_balance || '0'),
            0
          );
          if (totalSaved > 0) {
            setCurrentSavings(totalSaved);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadSavings();
  }, []);

  const remaining = Math.max(0, targetAmount - currentSavings);
  const monthsNeeded = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : 0;
  const progressPct = Math.min(100, Math.round((currentSavings / (targetAmount || 1)) * 100));

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsNeeded);

  return (
    <ModuleShell
      title="Goal Timeline Simulator"
      category="Build & Protect"
      description="Model savings milestones, calculate deterministic completion timelines, and evaluate contribution scenarios."
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="font-display font-bold text-lg pb-3 border-b border-[var(--line)]">
            Goal Configuration
          </h3>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">Target Amount (₹)</label>
            <input
              type="number"
              min="1000"
              step="5000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">Saved So Far (₹)</label>
            <input
              type="number"
              min="0"
              step="5000"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">Monthly Contribution (₹)</label>
            <input
              type="number"
              min="500"
              step="1000"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>
        </div>

        {/* Projection */}
        <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-display font-bold text-lg">{goalName}</h3>
              <p className="text-xs text-[var(--muted)]">Target: {formatCurrency(targetAmount)}</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--soft)] text-[var(--accent)]">
              {progressPct}% Reached
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
              <span>Saved: {formatCurrency(currentSavings)}</span>
              <span>Gap: {formatCurrency(remaining)}</span>
            </div>
            <div className="track">
              <i style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
            <div className="p-4 rounded-2xl bg-[var(--soft)]">
              <span className="text-xs text-[var(--muted)] block">Estimated Runway</span>
              <span className="font-mono text-2xl font-bold text-[var(--accent)] block mt-1">
                {monthsNeeded} Months
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--soft)]">
              <span className="text-xs text-[var(--muted)] block">Projected Completion</span>
              <span className="font-mono text-lg font-bold text-[var(--ink)] block mt-1">
                {targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)] text-xs text-[var(--ink)] leading-relaxed border border-[var(--line)]">
            🎯 <strong>Deterministic Assumption:</strong> Assuming zero investment variance and an exact steady contribution of{' '}
            <strong className="font-mono">{formatCurrency(monthlyContribution)}/mo</strong>, your goal of{' '}
            <strong className="font-mono">{formatCurrency(targetAmount)}</strong> will be completely achieved in{' '}
            <strong className="font-mono">{monthsNeeded} billing cycles</strong>.
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
