'use client';

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export function LandingSimulator() {
  const [income, setIncome] = useState(120000);
  const [expenses, setExpenses] = useState(55000);

  const surplus = Math.max(0, income - expenses);
  const emergencyTarget = expenses * 6;
  const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
  const monthsToTarget = surplus > 0 ? (emergencyTarget / surplus).toFixed(1) : '∞';
  const resilienceScore = Math.min(100, Math.max(20, Math.round(savingsRate * 1.2 + 25)));

  const fmtRupees = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section id="simulator" className="py-16 md:py-24 border-b border-[var(--line)] bg-[var(--soft)]/20 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Solvency Simulator</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Simulate household resilience in real time.
          </h2>
          <p className="text-base text-[var(--muted)] leading-relaxed font-normal">
            Adjust your monthly numbers below. Finroq’s deterministic formulas calculate your liquid savings capacity, emergency runway, and resilience score instantly.
          </p>
        </div>

        {/* Workbench Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Sliders Input Panel */}
          <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
            {/* Slider 1: Income */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono font-medium">
                <span className="text-[var(--muted)] uppercase">Monthly Take-Home Income</span>
                <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(income)}</span>
              </div>
              <input
                type="range"
                min="30000"
                max="400000"
                step="5000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                <span>₹30,000</span>
                <span>₹2,00,000</span>
                <span>₹4,00,000</span>
              </div>
            </div>

            {/* Slider 2: Fixed Obligations */}
            <div className="space-y-3 pt-4 border-t border-[var(--line)]">
              <div className="flex justify-between items-center text-xs font-mono font-medium">
                <span className="text-[var(--muted)] uppercase">Fixed Expenses &amp; EMIs</span>
                <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(expenses)}</span>
              </div>
              <input
                type="range"
                min="15000"
                max="250000"
                step="5000"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                <span>₹15,000</span>
                <span>₹1,25,000</span>
                <span>₹2,50,000</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Output Panel */}
          <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Monthly Surplus</span>
                <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 block">
                  {fmtRupees(surplus)}
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">
                  {savingsRate}% savings capacity
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">6-Mo Emergency Goal</span>
                <span className="font-mono text-2xl font-bold text-[var(--ink)] block">
                  {fmtRupees(emergencyTarget)}
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">
                  {monthsToTarget} months to fund
                </span>
              </div>
            </div>

            {/* Resilience Score */}
            <div className="p-4 rounded-2xl bg-[var(--soft)]/70 border border-[var(--line)] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-medium">
                <span>Household Resilience Score</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{resilienceScore} / 100</span>
              </div>
              <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--line)]">
                <div
                  className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${resilienceScore}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)] block">
                Deterministic calculation based on liquidity surplus ratio and fixed obligation coverage.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
