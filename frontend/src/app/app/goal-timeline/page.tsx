'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { formatCurrency } from '@/lib/utils';
import { Target, Calendar, CheckCircle2, ArrowRight, Wallet, Shuffle, Layers, Plus, Sparkles } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  priority: number;
}

const INITIAL_GOALS: Goal[] = [
  { id: 1, name: '6-Month Emergency Cushion', category: 'Safety Net', targetAmount: 300000, currentAmount: 180000, priority: 1 },
  { id: 2, name: 'Flat Down Payment & Registry', category: 'Real Estate', targetAmount: 1500000, currentAmount: 420000, priority: 2 },
  { id: 3, name: 'Annual Family Vacation Fund', category: 'Lifestyle', targetAmount: 200000, currentAmount: 60000, priority: 3 },
];

export default function AppGoalTimelinePage() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(45000); // ₹45,000 / mo
  const [strategy, setStrategy] = useState<'simultaneous' | 'sequential'>('sequential');

  // Calculate timelines under both strategies
  // 1. Simultaneous: distribute surplus proportional to remaining balances
  const totalRemaining = goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.currentAmount), 0);

  const simultaneousResults = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const weight = totalRemaining > 0 ? remaining / totalRemaining : 0;
    const allocatedMonthly = Math.round(monthlySurplus * weight);
    const months = allocatedMonthly > 0 ? Math.ceil(remaining / allocatedMonthly) : 0;
    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + months);
    return {
      ...g,
      remaining,
      allocatedMonthly,
      months,
      finishDate,
    };
  });

  // 2. Sequential: channel 100% of surplus to Goal 1, then Goal 2, then Goal 3
  let cumulativeMonths = 0;
  const sequentialResults = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const monthsForThisGoal = monthlySurplus > 0 ? Math.ceil(remaining / monthlySurplus) : 0;
    cumulativeMonths += monthsForThisGoal;
    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + cumulativeMonths);
    return {
      ...g,
      remaining,
      allocatedMonthly: monthlySurplus,
      months: cumulativeMonths,
      finishDate,
    };
  });

  const activeResults = strategy === 'simultaneous' ? simultaneousResults : sequentialResults;

  return (
    <ModuleShell
      title="Goal Timeline Simulator"
      category="Build & Protect"
      description="Simulate multiple simultaneous savings targets with deterministic timeline comparisons between Parallel Split and Sequential Waterfall."
    >
      <div className="space-y-8">
        {/* Strategy Control & Surplus Slider */}
        <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE4DC] dark:border-[var(--line)]">
            <div>
              <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                Allocation Strategy Engine
              </h3>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                Compare simultaneous multi-tasking versus sequential avalanche focus
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="p-1 rounded-2xl bg-[#EEF3EE] dark:bg-[#1A2C22] border border-[#DCE4DC] dark:border-[var(--line)] grid grid-cols-2 text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setStrategy('sequential')}
                className={`px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  strategy === 'sequential'
                    ? 'bg-[#173F2B] text-white shadow-xs'
                    : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sequential Waterfall</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategy('simultaneous')}
                className={`px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  strategy === 'simultaneous'
                    ? 'bg-[#173F2B] text-white shadow-xs'
                    : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Simultaneous Split</span>
              </button>
            </div>
          </div>

          {/* Monthly Surplus Allocation Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <label className="font-bold text-[#173F2B] dark:text-slate-200">
                Monthly Available Savings Pool (Surplus):
              </label>
              <span className="font-mono text-xl font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(monthlySurplus)}/month
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={150000}
              step={5000}
              value={monthlySurplus}
              onChange={(e) => setMonthlySurplus(Number(e.target.value))}
              className="w-full accent-[#173F2B] h-2 bg-[#E5EDE5] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#4D5D51] dark:text-slate-400">
              <span>₹10,000/mo</span>
              <span>₹75,000/mo</span>
              <span>₹1,50,000/mo</span>
            </div>
          </div>

          {/* Strategy Insight Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
              {strategy === 'sequential' ? (
                <>
                  <strong className="text-[#173F2B] dark:text-emerald-300 block">
                    Sequential Focus Advantage:
                  </strong>
                  By funding Goal 1 (Emergency Cushion) first, it finishes in just{' '}
                  <strong className="text-[#173F2B] dark:text-emerald-200">
                    {sequentialResults[0].months} months
                  </strong>{' '}
                  (vs {simultaneousResults[0].months} months under Simultaneous), securing your household rapidly against panic!
                </>
              ) : (
                <>
                  <strong className="text-[#173F2B] dark:text-emerald-300 block">
                    Simultaneous Split Dynamics:
                  </strong>
                  All 3 goals make progress each month. However, your critical Emergency Cushion takes{' '}
                  <strong className="text-[#173F2B] dark:text-emerald-200">
                    {simultaneousResults[0].months} months
                  </strong>{' '}
                  to fully fund instead of {sequentialResults[0].months} months.
                </>
              )}
            </div>
          </div>
        </div>

        {/* Goals Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {activeResults.map((g, idx) => {
            const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
            return (
              <div
                key={g.id}
                className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300 bg-[#EEF5EE] dark:bg-[#1A2C22] px-2.5 py-0.5 rounded-full border border-[#DCE4DC] dark:border-[var(--line)]">
                      Priority #{idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {pct}% funded
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                    {g.name}
                  </h4>
                  <p className="text-xs text-[#4D5D51] dark:text-slate-400 font-medium">
                    {g.category}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#4D5D51] dark:text-slate-400">Saved:</span>
                      <span className="font-bold text-[#173F2B] dark:text-slate-100">
                        {formatCurrency(g.currentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#4D5D51] dark:text-slate-400">Target:</span>
                      <span className="font-bold text-[#173F2B] dark:text-slate-100">
                        {formatCurrency(g.targetAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono border-t border-[#DCE4DC] dark:border-[var(--line)] pt-1">
                      <span className="text-[#4D5D51] dark:text-slate-400">Remaining:</span>
                      <span className="font-bold text-[#B43838] dark:text-rose-400">
                        {formatCurrency(g.remaining)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E5EDE5] dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-[#173F2B] dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4D5D51] dark:text-slate-400 font-medium">Estimated Completion:</span>
                    <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                      {g.finishDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-[#4D5D51] dark:text-slate-400">
                    <span>Timeline:</span>
                    <span>{g.months} month{g.months !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModuleShell>
  );
}
