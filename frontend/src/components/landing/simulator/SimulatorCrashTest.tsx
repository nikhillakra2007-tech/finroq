'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export function SimulatorCrashTest() {
  const [shockType, setShockType] = useState<'income' | 'medical' | 'inflation'>('income');
  const [liquidReserves, setLiquidReserves] = useState(300000);
  const [monthlyBurn, setMonthlyBurn] = useState(50000);

  const fmtRupees = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  // Crash test math
  let adjustedBurn = monthlyBurn;
  let remainingReserves = liquidReserves;
  let shockDescription = '';

  if (shockType === 'income') {
    adjustedBurn = monthlyBurn * 1.35; // 35% shortfall impact
    shockDescription = 'Income cut by 35%. Deficit absorbed exclusively by cash reserves.';
  } else if (shockType === 'medical') {
    remainingReserves = Math.max(0, liquidReserves - 120000); // 1.2L immediate hit
    shockDescription = 'Sudden ₹1,20,000 emergency medical expense deducted from liquid reserve.';
  } else {
    adjustedBurn = monthlyBurn * 1.4; // 40% inflation spike
    shockDescription = 'Living costs surge by 40% across fuel, utilities, groceries, and debt.';
  }

  const runwayMonths = adjustedBurn > 0 ? (remainingReserves / adjustedBurn).toFixed(1) : '∞';
  const isResilient = Number(runwayMonths) >= 6;

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-center">
      {/* Shock Selector & Controls */}
      <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
        <div className="space-y-2">
          <label className="text-xs font-mono font-medium text-[var(--muted)] uppercase block">
            Select Economic Shock Scenario
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => setShockType('income')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                shockType === 'income'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
              }`}
            >
              -35% Pay Cut
            </button>
            <button
              type="button"
              onClick={() => setShockType('medical')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                shockType === 'medical'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
              }`}
            >
              ₹1.2L Medical
            </button>
            <button
              type="button"
              onClick={() => setShockType('inflation')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                shockType === 'inflation'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
              }`}
            >
              +40% Inflation
            </button>
          </div>
          <p className="text-[11px] font-mono text-[var(--muted)] pt-1">{shockDescription}</p>
        </div>

        <div className="space-y-3 pt-3 border-t border-[var(--line)]">
          <div className="flex justify-between items-center text-xs font-mono font-medium">
            <span className="text-[var(--muted)] uppercase">Current Liquid Reserves</span>
            <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(liquidReserves)}</span>
          </div>
          <input
            type="range"
            min="50000"
            max="1200000"
            step="25000"
            value={liquidReserves}
            onChange={(e) => setLiquidReserves(Number(e.target.value))}
            className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs font-mono font-medium">
            <span className="text-[var(--muted)] uppercase">Baseline Monthly Burn</span>
            <span className="text-base font-bold text-[var(--ink)]">{fmtRupees(monthlyBurn)}</span>
          </div>
          <input
            type="range"
            min="20000"
            max="200000"
            step="5000"
            value={monthlyBurn}
            onChange={(e) => setMonthlyBurn(Number(e.target.value))}
            className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
          />
        </div>
      </div>

      {/* Stress Results Panel */}
      <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs card-hover-lift">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Surviving Runway</span>
            <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 block">
              {runwayMonths} Mo
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              Before zero liquidity
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Post-Shock Burn Rate</span>
            <span className="font-mono text-2xl font-bold text-[var(--ink)] block">
              {fmtRupees(adjustedBurn)}/mo
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              Stressed monthly outflow
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--soft)]/70 border border-[var(--line)] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-medium">
            <span className="flex items-center gap-1.5">
              {isResilient ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              <span>Crash Test Verdict:</span>
            </span>
            <span
              className={`font-bold ${
                isResilient ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isResilient ? 'PASSED · Solvency Intact' : 'VULNERABLE · Cushion Needed'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--muted)] block">
            Finroq’s crash test agent checks your reserve depth against historical tail-risk liquidity shocks.
          </span>
        </div>
      </div>
    </div>
  );
}
