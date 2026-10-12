'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { BookOpen, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AppMoneyGuidesPage() {
  const guides = [
    {
      title: 'The 50/30/20 Rule: Allocation Blueprint',
      summary: '50% on essential living needs, 30% on lifestyle wants, and 20% on guaranteed savings and debt principal payoff.',
      category: 'Budgeting & Allocations',
      steps: [
        'Calculate true after-tax monthly income.',
        'Cap essentials (rent, groceries, basic utilities) to half.',
        'Automate the 20% savings transfer on payday before spending.',
      ],
    },
    {
      title: 'Debt Avalanche vs. Debt Snowball',
      summary: 'Mathematical optimization (Avalanche: highest interest rate first) versus psychological momentum (Snowball: smallest balance first).',
      category: 'Debt Liquidation',
      steps: [
        'List all liabilities, balances, and APRs.',
        'Pay minimum payments on all accounts.',
        'Channel every extra surplus rupee to the highest APR liability.',
      ],
    },
    {
      title: 'Liquid Cushion vs. Invested Wealth',
      summary: 'Why emergency reserves must not be locked into market-volatile equities or illiquid retirement instruments.',
      category: 'Risk Management',
      steps: [
        'Keep 3-6 months in high-yield liquid accounts.',
        'Avoid withdrawing from long-term equity during market downturns.',
        'Replenish cushions immediately after an unexpected withdrawal.',
      ],
    },
  ];

  return (
    <ModuleShell
      title="Money Guides"
      category="Decide Before Spending"
      description="Practical financial education, allocation frameworks, and actionable rules to help you make sound money decisions."
    >
      <div className="grid md:grid-cols-3 gap-6">
        {guides.map((g, idx) => (
          <div
            key={idx}
            className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs"
          >
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                {g.category}
              </span>
              <h3 className="font-display font-bold text-lg text-[var(--ink)]">
                {g.title}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {g.summary}
              </p>

              <div className="space-y-2 pt-3 border-t border-[var(--line)] text-xs text-[var(--ink)]">
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Execution Checklist:
                </span>
                {g.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}
