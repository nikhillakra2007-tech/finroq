'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, CheckCircle2, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { useI18n } from '@/lib/i18n-context';

interface LandingHeroProps {
  onOpenDemo: () => void;
}

export function LandingHero({ onOpenDemo }: LandingHeroProps) {
  const { navigateWithCurtain } = useCurtain();
  const { t } = useI18n();

  const [transactions] = useState([
    { id: 1, desc: 'Salary Credited (Arbitrary Decimal)', amount: 145000, cat: 'Income · Liquid' },
    { id: 2, desc: 'Monthly SIP · Nifty 50 Index', amount: -25000, cat: 'Equity · Compounding' },
    { id: 3, desc: 'Apartment Lease Mandate', amount: -38000, cat: 'Housing · Verified' },
  ]);

  const fmtRupees = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  return (
    <section id="engine" className="pt-12 pb-16 md:pt-16 md:pb-20 border-b border-[var(--line)] relative overflow-hidden">
      {/* Soft Gradient Background Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center relative">
        {/* Left Column: Clear Core Positioning */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-[#173F2B] dark:text-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            <span>{t('hero.badge_tech', 'Fixed-Point NUMERIC(14,2) Architecture')}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.12] text-[#173F2B] dark:text-slate-50">
            {t('hero.title_line1', 'The ledger that refuses')}
            <br />
            <span className="text-emerald-700 dark:text-emerald-400">
              {t('hero.title_line2', 'to be wrong.')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#3D5245] dark:text-slate-300 max-w-xl leading-relaxed font-normal">
            {t(
              'hero.description',
              'Most personal finance apps rely on loose spreadsheets and hallucinated advice. Finroq unites double-entry accounting, dynamic budgets, and autonomous stress simulations with zero decimal drift.'
            )}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap gap-3.5 items-center">
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 px-6.5 py-3 font-semibold text-sm sm:text-base rounded-full shadow-sm cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105"
            >
              <span>{t('hero.cta_open', 'Start Building Wealth →')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenDemo}
              className="btn-pill secondary border border-emerald-600/40 hover:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 px-5.5 py-3 font-semibold text-sm sm:text-base rounded-full cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-xs"
            >
              <Play className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
              <span>Watch Demo Video</span>
            </button>

            <a
              href="#simulator"
              className="btn-pill secondary border border-[var(--line)] hover:border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] px-6 py-3 font-medium text-sm sm:text-base rounded-full cursor-pointer whitespace-nowrap transition-colors"
            >
              {t('hero.cta_simulator', 'Try live simulator ↓')}
            </a>
          </div>

          {/* Three Guarantees */}
          <div className="pt-3 border-t border-[var(--line)] flex flex-wrap gap-5 text-xs font-mono font-medium text-[#2E4035] dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Float Drift</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Argon2id Enclave</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Audited Math</span>
            </span>
          </div>
        </div>

        {/* Right Column: Clean Live Precision Ledger Card */}
        <div className="lg:col-span-6">
          <div className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl card-hover-lift">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-display font-medium text-sm text-[var(--ink)]">
                  Live Mathematical Engine
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                DR = CR · 0.00% Drift
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                Consolidated Liquid Net Worth
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-[#173F2B] dark:text-slate-100">
                ₹5,41,310.00
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-medium text-[var(--muted)] block">
                Recent Double-Entry Ledger Postings
              </span>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[var(--soft)]/50 border border-[var(--line)] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="font-medium text-[var(--ink)] block truncate">{tx.desc}</span>
                      <span className="text-[10px] font-mono text-[var(--muted)]">{tx.cat}</span>
                    </div>
                    <span
                      className={`font-mono font-semibold whitespace-nowrap ${
                        tx.amount > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#173F2B] dark:text-slate-200'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {fmtRupees(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
              <span>Checksum Verified</span>
              <button
                type="button"
                onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Sign In to Access Workspace →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
