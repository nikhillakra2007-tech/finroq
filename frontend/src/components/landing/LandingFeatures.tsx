'use client';

import React from 'react';
import { Database, ShieldAlert, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { useCurtain } from '@/components/layout/CurtainTransition';

export function LandingFeatures() {
  const { navigateWithCurtain } = useCurtain();

  const features = [
    {
      id: 'ledger',
      icon: Database,
      badge: 'Zero Float Drift',
      title: 'Mathematical Precision Ledger',
      desc: 'Enforces strict double-entry bookkeeping with NUMERIC(14,2) decimal registers. Debit always equals Credit with zero roundoff errors.',
      metric: 'DR = CR Checksum',
      linkText: 'Sign in to Explore Ledger',
    },
    {
      id: 'leaks',
      icon: ShieldAlert,
      badge: 'Autonomous Audit',
      title: 'Spend Leak & Duplicate Detector',
      desc: 'Proactively identifies creeping recurring mandates, dormant subscriptions, and double-charges with evidence-driven verification.',
      metric: '₹48,600 / yr Saved',
      linkText: 'Sign in to Inspect Leaks',
    },
    {
      id: 'multiverse',
      icon: TrendingUp,
      badge: '30-Year Horizon',
      title: '30-Year Wealth Forecast',
      desc: 'Simulates parallel wealth trajectories across career paths, SIP escalators, and FIRE milestones with inflation-adjusted compounding.',
      metric: '4.2x Terminal Edge',
      linkText: 'Sign in to Simulate Wealth',
    },
    {
      id: 'crashtest',
      icon: Activity,
      badge: '6-Agent Pipeline',
      title: 'Autonomous Solvency Crash-Testing',
      desc: 'Stress-tests your personal runway against realistic economic shocks: sudden medical spikes, job transitions, and market downturns.',
      metric: '100% Deterministic',
      linkText: 'Sign in for Crash Testing',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 border-b border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-5 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <span>Core Capabilities</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Four autonomous systems. Complete financial clarity.
          </h2>
          <p className="text-base text-[var(--muted)] leading-relaxed font-normal">
            Every feature connects directly into your central accounting ledger. Zero floating-point drift, zero generic advice, and full verifiable audit trails.
          </p>
        </div>

        {/* 4 Clean Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-7 sm:p-8 space-y-5 shadow-xs hover:border-emerald-600/50 transition-all card-hover-lift flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[var(--soft)] text-emerald-800 dark:text-emerald-300 border border-[var(--line)]">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-xl text-[var(--ink)]">
                    {feat.title}
                  </h3>

                  <p className="text-sm text-[var(--muted)] leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {feat.metric}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
                    className="text-[var(--ink)] hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{feat.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
