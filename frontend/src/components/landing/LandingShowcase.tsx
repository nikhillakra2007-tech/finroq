'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCurtain } from '@/components/layout/CurtainTransition';
import {
  CreditCard,
  PieChart,
  Users,
  ShoppingBag,
  Zap,
  BookOpen,
  TrendingUp,
  Target,
  Umbrella,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

/* Money formatting in integer paise */
function fmt(paise: number): string {
  const isNeg = paise < 0;
  const abs = Math.abs(paise) / 100;
  return (
    (isNeg ? '−' : '') +
    '₹' +
    abs.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtSigned(paise: number): string {
  return (paise > 0 ? '+' : '') + fmt(paise);
}

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const { navigateWithCurtain } = useCurtain();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Theme management
  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // 1. Spend Tracker Interactive Demo State
  const [ledgerRows, setLedgerRows] = useState<
    Array<{ id: number; d: string; s: 'Completed' | 'Pending' | 'Cancelled'; t: 'income' | 'expense' | 'transfer'; a: number }>
  >([
    { id: 1, d: 'Salary', s: 'Completed', t: 'income', a: 8500000 },
    { id: 2, d: 'Freelance invoice', s: 'Pending', t: 'income', a: 1200000 },
    { id: 3, d: 'Rent', s: 'Completed', t: 'expense', a: 2200000 },
    { id: 4, d: 'Move to investments', s: 'Completed', t: 'transfer', a: 1000000 },
    { id: 5, d: 'Headphones', s: 'Completed', t: 'expense', a: 799900 },
  ]);

  const cycleStatus = (id: number) => {
    setLedgerRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextStatus =
          row.s === 'Completed' ? 'Pending' : row.s === 'Pending' ? 'Cancelled' : 'Completed';
        return { ...row, s: nextStatus };
      })
    );
  };

  const netCashFlow = useMemo(() => {
    return ledgerRows.reduce((sum, r) => {
      if (r.s !== 'Completed') return sum;
      if (r.t === 'income') return sum + r.a;
      if (r.t === 'expense') return sum - r.a;
      return sum;
    }, 0);
  }, [ledgerRows]);

  // 2. Safe Recurrence Demo
  const [recEntriesCount, setRecEntriesCount] = useState<number>(0);
  const [recMessage, setRecMessage] = useState<string>(
    'Ledger entries for 15 Oct: 0. Press the button twice to see duplicate prevention in action.'
  );

  const handleRecordRec = () => {
    if (recEntriesCount === 0) {
      setRecEntriesCount(1);
      setRecMessage('Recorded for 15 Oct. Ledger entries for this date: 1. Entry verified.');
    } else {
      setRecMessage('Already recorded for 15 Oct. Ledger entries for this date: 1. Safe idempotency: zero duplicates.');
    }
  };

  // 3. Interactive Budget Comparison Graph State
  const [budgetCat, setBudgetCat] = useState<'Food' | 'Shopping' | 'Transport' | 'Entertainment'>('Food');
  const [budgetCaps, setBudgetCaps] = useState({
    Food: 25000,
    Shopping: 15000,
    Transport: 8000,
    Entertainment: 10000,
  });
  const [budgetSpends, setBudgetSpends] = useState({
    Food: 21500,
    Shopping: 18200,
    Transport: 6400,
    Entertainment: 7500,
  });

  const activeCap = budgetCaps[budgetCat];
  const activeSpend = budgetSpends[budgetCat];
  const activeRemaining = activeCap - activeSpend;
  const isBudgetOver = activeRemaining < 0;
  const budgetUtilization = Math.round((activeSpend / (activeCap || 1)) * 100);

  // 4. Interactive Savings-Goal Timeline Simulator State
  const [goalTarget, setGoalTarget] = useState<number>(150000);
  const [goalCurrent, setGoalCurrent] = useState<number>(35000);
  const [baseContribution, setBaseContribution] = useState<number>(12000);
  const [spendCutRedirect, setSpendCutRedirect] = useState<number>(4000);

  const totalMonthlySavings = baseContribution + spendCutRedirect;
  const goalRemaining = Math.max(0, goalTarget - goalCurrent);
  const baseMonthsNeeded = baseContribution > 0 ? Math.ceil(goalRemaining / baseContribution) : 0;
  const acceleratedMonthsNeeded = totalMonthlySavings > 0 ? Math.ceil(goalRemaining / totalMonthlySavings) : 0;
  const monthsSaved = Math.max(0, baseMonthsNeeded - acceleratedMonthsNeeded);
  const goalProgressPct = Math.min(100, Math.round((goalCurrent / (goalTarget || 1)) * 100));

  const all12Modules = [
    { title: 'Expense Tracking', desc: 'Exact completed ledger, transfers, and real-time cash flow.', icon: CreditCard, cat: 'Track & Control', href: '/app/expense-tracking' },
    { title: 'Daily Budgeting', desc: 'Category-level limits derived live from completed expenses.', icon: PieChart, cat: 'Track & Control', href: '/app/budgeting' },
    { title: 'Splitter', desc: 'Split shared bills equally or custom with integer paise precision.', icon: Users, cat: 'Track & Control', href: '/app/splitter' },
    { title: 'Pre-Spend Check', desc: 'Simulate purchase impact on remaining category cushion.', icon: ShoppingBag, cat: 'Decide Before Spending', href: '/app/pre-spend-check' },
    { title: 'Spend Leak Detector', desc: 'Identify recurring subscriptions and creeping monthly costs.', icon: Zap, cat: 'Decide Before Spending', href: '/app/spend-leak-detector' },
    { title: 'Money Guides', desc: 'Practical rules, debt-payoff strategies, and allocation guides.', icon: BookOpen, cat: 'Decide Before Spending', href: '/app/money-guides' },
    { title: 'Net Worth', desc: 'Assets minus liabilities across checking, savings, and credit.', icon: TrendingUp, cat: 'Build & Protect', href: '/app/net-worth' },
    { title: 'Goal Timeline', desc: 'Simulate savings targets, contribution shifts, and milestone dates.', icon: Target, cat: 'Build & Protect', href: '/app/goal-timeline' },
    { title: 'Emergency Cushion', desc: 'Estimate essential baseline survival fund with configurable runway.', icon: Umbrella, cat: 'Build & Protect', href: '/app/emergency-cushion' },
    { title: 'EMI / Debt Watchdog', desc: 'Track loans, due dates, amortized liabilities, and interest.', icon: ShieldAlert, cat: 'Manage Obligations', href: '/app/debt-watchdog' },
    { title: 'Credit Health', desc: 'Credit utilization metrics and healthy repayment guidance.', icon: ShieldCheck, cat: 'Manage Obligations', href: '/app/credit-health' },
    { title: 'Financial Health', desc: 'Integrated multi-dimensional health assessment across all accounts.', icon: Activity, cat: 'Manage Obligations', href: '/app/financial-health' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white">
      {/* 1. Sticky Navigation */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-[var(--ink)]"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            finroq
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
            <a href="#ledger" className="hover:text-[var(--ink)] transition-colors">Ledger</a>
            <a href="#budgets" className="hover:text-[var(--ink)] transition-colors">Budgets</a>
            <a href="#comparison" className="hover:text-[var(--ink)] transition-colors">Comparison</a>
            <a href="#simulator" className="hover:text-[var(--ink)] transition-colors">Goal Simulator</a>
            <a href="#modules" className="hover:text-[var(--ink)] transition-colors">12 Modules</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] px-2 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill sm bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-mono font-medium uppercase tracking-wider text-[var(--muted)]">
              Personal finance, done precisely
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.04]">
              Your money,<br />to the <em className="italic text-[var(--accent)] not-italic">paisa.</em>
            </h1>
            <p className="text-lg md:text-xl text-[var(--muted)] max-w-xl leading-relaxed">
              Finroq is a ledger built on exact decimal math. Track every account, set monthly budgets, and let recurring bills record themselves.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
                className="btn-pill bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
              >
                Open your ledger
              </button>
              <a
                href="#ledger"
                className="btn-pill ghost"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Hero Financial Preview Card */}
          <div className="md:col-span-5">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium tracking-wider uppercase text-[var(--muted)]">
                  Net Worth
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--soft)] text-[var(--muted)]">
                  Sample Data
                </span>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
                ₹5,41,310.00
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
                <div>
                  <span className="text-xs text-[var(--muted)]">Assets</span>
                  <p className="font-mono text-base font-semibold text-[var(--accent)] mt-1">
                    ₹5,63,650.00
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">Liabilities</span>
                  <p className="font-mono text-base font-semibold text-[var(--bad)] mt-1">
                    ₹22,340.00
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)] leading-relaxed">
                Sample figures. Every amount is stored as an exact decimal representation, never a float.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proof Strip */}
      <div className="border-b border-[var(--line)] bg-[var(--soft)]/50 py-4">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--muted)] font-medium">
          <span>NUMERIC(14,2) MONEY</span>
          <span>ARGON2ID PASSWORD HASHING</span>
          <span>SIGNED JWT SESSIONS</span>
          <span>PER-USER DATA ISOLATION</span>
        </div>
      </div>

      {/* 4. Feature 1: Spend Tracker & Ledger Demo */}
      <section id="ledger" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-6 sticky top-24">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--accent)]">
              Feature One
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              A ledger that always adds up.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Only completed transactions touch your balances. Pending and cancelled ones wait on the sidelines, and transfers move money between accounts without inflating income or spending.
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Exact</span>
                <span className="text-[var(--muted)]">Decimal arithmetic end to end, so totals never drift by a paisa.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Transfers</span>
                <span className="text-[var(--muted)]">Move money between accounts. Income and expense stay honest.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Net Worth</span>
                <span className="text-[var(--muted)]">Assets minus liabilities, across every account you hold.</span>
              </li>
            </ul>
          </div>

          {/* Interactive Ledger Demonstration Card */}
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="font-display text-lg font-bold">October Ledger</h3>
              <span className="text-xs font-mono text-[var(--muted)]">Tap any status to cycle it</span>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {ledgerRows.map((r) => {
                const isInc = r.t === 'income';
                const isTfr = r.t === 'transfer';
                return (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)] truncate">{r.d}</p>
                      <span className="text-xs text-[var(--muted)]">
                        {isTfr ? 'Transfer · not counted' : isInc ? 'Income' : 'Expense'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-medium ${isInc ? 'text-[var(--accent)]' : isTfr ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}>
                        {isInc ? '+' : isTfr ? '' : '−'}
                        {fmt(r.a).replace('−', '')}
                      </span>
                      <button
                        onClick={() => cycleStatus(r.id)}
                        className={`chip ${r.s}`}
                        title="Click to toggle status"
                      >
                        {r.s}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t-2 border-[var(--ink)] flex items-center justify-between">
              <span className="font-medium text-sm text-[var(--ink)]">Net Cash Flow (Completed only)</span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--accent)]">
                {fmtSigned(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature 2: Budgets & Safe Recurrence */}
      <section id="budgets" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-7 shadow-xs order-2 md:order-1">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="font-display text-lg font-bold">October Category Budgets</h3>
              <span className="text-xs font-mono text-[var(--muted)]">Illustrative Sample</span>
            </div>

            <div className="space-y-5">
              {[
                { cat: 'Food', alloc: 600000, spent: 527000 },
                { cat: 'Transport', alloc: 150000, spent: 138000 },
                { cat: 'Shopping', alloc: 500000, spent: 799900 },
              ].map((m) => {
                const over = m.spent > m.alloc;
                const pct = Math.min(100, (m.spent / m.alloc) * 100);
                return (
                  <div key={m.cat} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[var(--ink)] flex items-center gap-2">
                        {m.cat}
                        {over && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--bad-soft)] text-[var(--bad)] text-[11px] font-mono uppercase font-bold">
                            Over
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {fmt(m.spent)} of {fmt(m.alloc)}
                      </span>
                    </div>
                    <div className="track">
                      <i
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? 'var(--bad)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
                      <span>{over ? `Over by ${fmt(m.spent - m.alloc)}` : `${pct.toFixed(1)}% utilized`}</span>
                      <span>{over ? 'Cap exceeded' : `Remaining: ${fmt(m.alloc - m.spent)}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Duplicate-Safe Recurrence Demo */}
            <div className="pt-6 border-t border-[var(--line)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">Broadband Subscription</p>
                  <span className="text-xs text-[var(--muted)]">Monthly · next on 15 Oct</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-sm">₹999.00</span>
                  <button
                    onClick={handleRecordRec}
                    className="btn-pill sm bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
                  >
                    Record occurrence
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] bg-[var(--soft)] p-3 rounded-xl border border-[var(--line)] leading-relaxed">
                {recMessage}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 space-y-6 order-1 md:order-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--accent)]">
              Feature Two
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Budgets that watch themselves.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Set a monthly amount per category. Spending is worked out from your completed expenses as you go, with a clear flag the moment a category runs over.
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Live</span>
                <span className="text-[var(--muted)]">Spending is derived from the ledger, so there is nothing to update by hand.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Recurring</span>
                <span className="text-[var(--muted)]">Daily, weekly, monthly or yearly rules. Month-end dates clamp correctly.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[75px]">Safe</span>
                <span className="text-[var(--muted)]">Recording the same occurrence twice never duplicates an entry.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Section 3: Interactive Budget Comparison Graph */}
      <section id="comparison" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/30">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--accent)]">
              Interactive Comparison
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Budgets that tell you when to act.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Compare your plan with actual spending. Adjust the sliders below to see how category health responds immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Interactive Sliders */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)]">
                Simulation Controls
              </h4>

              {/* Category Picker */}
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-2">Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Food', 'Shopping', 'Transport', 'Entertainment'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBudgetCat(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        budgetCat === cat
                          ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                          : 'bg-[var(--soft)] text-[var(--muted)] border-transparent hover:border-[var(--line)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cap Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--muted)]">Planned Budget Cap:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">₹{activeCap.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={activeCap}
                  onChange={(e) =>
                    setBudgetCaps((prev) => ({ ...prev, [budgetCat]: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Spend Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--muted)]">Actual Spending:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">₹{activeSpend.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60000"
                  step="1000"
                  value={activeSpend}
                  onChange={(e) =>
                    setBudgetSpends((prev) => ({ ...prev, [budgetCat]: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Comparison Graph */}
            <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h4 className="font-display font-bold text-lg">{budgetCat} Budget Health</h4>
                  <p className="text-xs text-[var(--muted)]">Planned vs Actual</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                    isBudgetOver
                      ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                      : 'bg-[var(--soft)] text-[var(--accent)]'
                  }`}
                >
                  {isBudgetOver ? 'Over Budget' : 'On Track'}
                </span>
              </div>

              {/* Grouped Comparative Bars */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[var(--muted)]">Planned Cap</span>
                    <span className="font-mono font-bold">₹{activeCap.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-5 rounded-lg overflow-hidden">
                    <div className="bg-[var(--ink)] h-full rounded-lg" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[var(--muted)]">Actual Spent ({budgetUtilization}%)</span>
                    <span className={`font-mono font-bold ${isBudgetOver ? 'text-[var(--bad)]' : 'text-[var(--accent)]'}`}>
                      ₹{activeSpend.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-5 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (activeSpend / activeCap) * 100)}%`,
                        backgroundColor: isBudgetOver ? 'var(--bad)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Verdict */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  isBudgetOver
                    ? 'bg-[var(--bad-soft)]/50 border-[var(--bad-soft)] text-[var(--bad)]'
                    : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]'
                }`}
              >
                {isBudgetOver ? (
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <strong>Attention:</strong> Spending exceeds your cap by{' '}
                    <strong className="font-mono">₹{Math.abs(activeRemaining).toLocaleString('en-IN')}</strong>. Reallocate from other categories or defer discretionary purchases.
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                    <strong>Comfortable Cushion:</strong> You have{' '}
                    <strong className="font-mono">₹{activeRemaining.toLocaleString('en-IN')}</strong> remaining ({100 - budgetUtilization}% unspent) for this billing period.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 4: Interactive Savings-Goal Timeline Simulator */}
      <section id="simulator" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--accent)]">
              Milestone Simulator
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              See how your spending decisions change your goals.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Choose a target, adjust how much you save, and understand how redirecting discretionary leaks accelerates your timeline.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Simulator Controls */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)]">
                Goal Parameters
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--muted)]">Target Goal Amount:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">₹{goalTarget.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="500000"
                  step="10000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--muted)]">Saved So Far:</span>
                  <span className="font-mono font-bold text-[var(--accent)]">₹{goalCurrent.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={goalTarget}
                  step="5000"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--muted)]">Base Monthly Contribution:</span>
                  <span className="font-mono font-bold text-[var(--ink)]">₹{baseContribution.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={baseContribution}
                  onChange={(e) => setBaseContribution(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-[var(--line)]">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--accent)] font-semibold">+ Discretionary Spend Cut Redirected:</span>
                  <span className="font-mono font-bold text-[var(--accent)]">₹{spendCutRedirect.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="500"
                  value={spendCutRedirect}
                  onChange={(e) => setSpendCutRedirect(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <span className="text-[11px] text-[var(--muted)] block">
                  Simulate cutting dining out or subscriptions and adding it directly to savings.
                </span>
              </div>
            </div>

            {/* Live Results Timeline Card */}
            <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h4 className="font-display font-bold text-lg">Goal Completion Projection</h4>
                  <p className="text-xs text-[var(--muted)]">Deterministic calculation: ceil(gap / monthly)</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--soft)] text-[var(--accent)]">
                  {goalProgressPct}% Funded
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
                  <span>Current: ₹{goalCurrent.toLocaleString('en-IN')}</span>
                  <span>Gap: ₹{goalRemaining.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-[var(--soft)] h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-[var(--accent)] h-full rounded-full transition-all duration-300"
                    style={{ width: `${goalProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Timeline Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--line)]">
                <div className="p-4 rounded-2xl bg-[var(--soft)]/60">
                  <span className="text-xs text-[var(--muted)] block">Total Monthly</span>
                  <span className="font-mono text-lg font-bold text-[var(--ink)] block mt-1">
                    ₹{totalMonthlySavings.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/60">
                  <span className="text-xs text-[var(--muted)] block">Time to Target</span>
                  <span className="font-mono text-lg font-bold text-[var(--accent)] block mt-1">
                    {acceleratedMonthsNeeded} Months
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/60 col-span-2 sm:col-span-1">
                  <span className="text-xs text-[var(--muted)] block">Time Saved</span>
                  <span className="font-mono text-lg font-bold text-[var(--accent)] block mt-1">
                    +{monthsSaved} Months
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--soft)] border border-[var(--line)] text-xs text-[var(--ink)] leading-relaxed">
                💡 <strong>Scenario Verdict:</strong> By redirecting an additional{' '}
                <strong className="font-mono">₹{spendCutRedirect.toLocaleString('en-IN')}/mo</strong> from discretionary leaks into this goal, you reach your target in{' '}
                <strong className="font-mono">{acceleratedMonthsNeeded} months</strong> instead of{' '}
                <strong className="font-mono">{baseMonthsNeeded} months</strong>, saving{' '}
                <strong className="font-mono">{monthsSaved} full months</strong> of waiting.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Section 6: Discover All 12 Modules */}
      <section id="modules" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/40">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[var(--accent)]">
              All 12 Modules
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              One connected personal finance workspace.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Every area of your financial life — from daily transactions to retirement runway and debt watchdogs — operating in complete precision.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {all12Modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--ink)] hover:shadow-sm transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[var(--ink)] group-hover:text-[var(--bg)] transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--muted)]">
                        {mod.cat}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-[var(--ink)]">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-[var(--line)]">
                    <button
                      onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
                      className="text-xs font-semibold text-[var(--accent)] group-hover:text-[var(--ink)] flex items-center gap-1.5 transition-colors"
                    >
                      Open module <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Technical Precision & Security Section */}
      <section className="py-16 md:py-24 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="font-display font-bold text-lg">Exact Decimal Arithmetic</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Backed by Python `Decimal` and database `NUMERIC` types. Zero floating-point rounding errors across account balances, allocations, and transfers.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-bold text-lg">Zero Trust Isolation</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Hard server-enforced per-user data tenancy on all SQL operations. Signed stateless JWTs with cryptographic Argon2id password hashing.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-bold text-lg">Deterministic Logic</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Transparent timeline and emergency projections with zero invented returns. Every financial calculation is explainable and verifiable.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Closer CTA & Minimal Footer */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-end justify-between gap-8">
          <div className="space-y-4 max-w-lg">
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight">
              Open your ledger.
            </h2>
            <p className="text-[var(--muted)] text-base">
              Start recording transactions, set intelligent category budgets, and understand your financial trajectory to the paisa.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
            >
              Get started
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="btn-pill ghost"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-8 text-xs text-[var(--muted)] font-mono">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>Finroq · Financial Intelligence &amp; Accounting Engine</span>
          <span>Sample figures shown throughout marketing preview</span>
        </div>
      </footer>
    </div>
  );
}
