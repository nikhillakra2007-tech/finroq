'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SimulatorSolvency } from './simulator/SimulatorSolvency';
import { SimulatorGoal } from './simulator/SimulatorGoal';
import { SimulatorCrashTest } from './simulator/SimulatorCrashTest';

export function LandingSimulator() {
  const [activeTab, setActiveTab] = useState<'solvency' | 'goal' | 'crashtest'>('solvency');

  return (
    <section id="simulator" className="py-16 md:py-24 border-b border-[var(--line)] bg-[var(--soft)]/20 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Interactive Financial Simulators</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              Real-time solvency, goal, and crash-test models.
            </h2>
            <p className="text-base text-[var(--muted)] leading-relaxed font-normal">
              Zero guesswork. Finroq tests your liquid buffer, future compounding milestones, and macro shock resilience deterministically.
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex items-center p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('solvency')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'solvency'
                  ? 'bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Solvency Runway</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'goal'
                  ? 'bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goal Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crashtest')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'crashtest'
                  ? 'bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Crash Test</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'solvency' && <SimulatorSolvency />}
        {activeTab === 'goal' && <SimulatorGoal />}
        {activeTab === 'crashtest' && <SimulatorCrashTest />}
      </div>
    </section>
  );
}
