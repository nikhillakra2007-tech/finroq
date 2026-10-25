'use client';

import React, { useState } from 'react';

export function SimulatorGoal() {
  const [targetAmount, setTargetAmount] = useState(1000000);
  const [monthlyContribution, setMonthlyContribution] = useState(25000);
  const [expectedReturn, setExpectedReturn] = useState(10); // 10% annual

  const fmtRupees = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  // Future value / months calculation with monthly compounding
  const monthlyRate = expectedReturn / 100 / 12;
  let months = 0;
  let accumulated = 0;
  if (monthlyContribution > 0) {
    if (monthlyRate > 0) {
      months = Math.ceil(
        Math.log(1 + (targetAmount * monthlyRate) / monthlyContribution) /
          Math.log(1 + monthlyRate)
      );
    } else {
      months = Math.ceil(targetAmount / monthlyContribution);
    }
  }
  months = isFinite(months) && months > 0 ? months : 1;
  const years = (months / 12).toFixed(1);
  const totalPrincipal = Math.min(targetAmount, months * monthlyContribution);
  const projectedGains = Math.max(0, targetAmount - totalPrincipal);

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-center">
      {/* Goal Sliders Input Panel */}
      <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono font-medium">
            <span className="text-[var(--muted)] uppercase">Target Goal Corpus</span>
            <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(targetAmount)}</span>
          </div>
          <input
            type="range"
            min="200000"
            max="5000000"
            step="50000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(Number(e.target.value))}
            className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
            <span>₹2,00,000</span>
            <span>₹25,00,000</span>
            <span>₹50,00,000</span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--line)]">
          <div className="flex justify-between items-center text-xs font-mono font-medium">
            <span className="text-[var(--muted)] uppercase">Monthly Contribution</span>
            <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(monthlyContribution)}</span>
          </div>
          <input
            type="range"
            min="5000"
            max="150000"
            step="2500"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
            <span>₹5,000</span>
            <span>₹75,000</span>
            <span>₹1,50,000</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono text-[var(--muted)]">
            <span>Annual Growth Assumption:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{expectedReturn}% p.a.</span>
          </div>
          <input
            type="range"
            min="4"
            max="16"
            step="1"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(Number(e.target.value))}
            className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer h-1.5 bg-[var(--soft)] rounded-lg"
          />
        </div>
      </div>

      {/* Goal Output Panel */}
      <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Deterministic Timeline</span>
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 block">
              {months} Mo
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              approx. {years} years to goal
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Projected Returns</span>
            <span className="font-mono text-2xl font-bold text-[var(--ink)] block">
              +{fmtRupees(projectedGains)}
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              Compound interest boost
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--soft)]/70 border border-[var(--line)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-medium">
            <span>Goal Velocity Milestone</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {Math.min(100, Math.round((totalPrincipal / targetAmount) * 100))}% Principal Funded
            </span>
          </div>
          <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--line)]">
            <div
              className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, (totalPrincipal / targetAmount) * 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--muted)] block">
            Finroq projects continuous milestones with mathematical compounding and dividend reinvestment.
          </span>
        </div>
      </div>
    </div>
  );
}
