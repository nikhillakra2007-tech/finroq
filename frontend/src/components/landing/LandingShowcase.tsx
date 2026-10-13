'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCurtain } from '@/components/layout/CurtainTransition';
import {
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  Zap,
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

  // FAQ accordion state (first item open by default)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    { id: 1, d: 'Salary Direct Deposit', s: 'Completed', t: 'income', a: 8500000 },
    { id: 2, d: 'Consulting Retainer Invoice', s: 'Pending', t: 'income', a: 1200000 },
    { id: 3, d: 'Residential Rent Payment', s: 'Completed', t: 'expense', a: 2200000 },
    { id: 4, d: 'Transfer to Index Portfolio', s: 'Completed', t: 'transfer', a: 1000000 },
    { id: 5, d: 'Noise Cancelling Headphones', s: 'Completed', t: 'expense', a: 799900 },
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
    'Ledger occurrences for 15 Oct: 0. Press the button to verify duplicate prevention in action.'
  );

  const handleRecordRec = () => {
    if (recEntriesCount === 0) {
      setRecEntriesCount(1);
      setRecMessage('✓ Recorded for 15 Oct. Ledger entries for this period: 1. Verified atomic entry.');
    } else {
      setRecMessage('✓ Already recorded for 15 Oct. Safe idempotency enforced: zero duplicate entries created.');
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

  // 5 High-Impact FAQs
  const faqs = [
    {
      id: 0,
      badge: 'PRECISION',
      q: 'How does FINROQ guarantee absolute mathematical precision across accounts?',
      a: 'Most personal finance apps rely on standard IEEE 754 floating-point numbers, which accumulate fractional rounding drift across hundreds of transactions. FINROQ enforces arbitrary-precision decimal mathematics through Python Decimal and PostgreSQL NUMERIC(14,2) end to end. Every balance, ledger entry, category allocation, and transfer balances with zero drift.',
    },
    {
      id: 1,
      badge: 'ARCHITECTURE',
      q: 'How is FINROQ fundamentally different from spreadsheets and standard budgeting apps?',
      a: 'Unlike unstructured spreadsheets or superficial budget trackers, FINROQ implements strict double-entry ledger semantics. Internal transfers move money between accounts neutrally without falsely inflating income or expenses. Pending transactions remain isolated from liquid balances, and calendar schedules clamp automatically across leap years and month ends.',
    },
    {
      id: 2,
      badge: 'AUTOMATION',
      q: 'Can I automate recurring subscriptions and bills without risk of duplicate entries?',
      a: 'Yes. FINROQ includes a deterministic, idempotent recurring rules engine. Even if an occurrence trigger fires multiple times in a billing cycle, the system checks previous ledger records and prevents duplicate entries. You get predictable, transparent recurrence without phantom expenses.',
    },
    {
      id: 3,
      badge: 'SECURITY',
      q: 'How is my financial data protected, isolated, and kept private?',
      a: 'FINROQ enforces a zero-trust tenant architecture where all database queries explicitly scope to your verified account identity on the server. Authentication is backed by Argon2id cryptographic password hashing and tamper-proof JWT tokens. Your private financial metrics are never harvested, sold, or shared with third parties.',
    },
    {
      id: 4,
      badge: 'SOVEREIGNTY',
      q: 'Can I use FINROQ privately without exposing real banking login credentials?',
      a: 'Absolutely. FINROQ does not require you to provide banking passwords or grant broad OAuth access to third-party scraping brokers. You maintain sovereign ownership over your books, with the ability to record ledger entries manually, import CSV statements, and explore every simulation tool in a clean, self-contained environment.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white">
      {/* 1. Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display font-bold text-xl tracking-tight text-[var(--ink)] hover:opacity-90 transition-opacity"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
            <span className="tracking-tight font-extrabold">finroq</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
            <a href="#ledger" className="hover:text-[var(--ink)] transition-colors">
              Ledger
            </a>
            <a href="#budgets" className="hover:text-[var(--ink)] transition-colors">
              Budgets
            </a>
            <a href="#comparison" className="hover:text-[var(--ink)] transition-colors">
              Comparison
            </a>
            <a href="#simulator" className="hover:text-[var(--ink)] transition-colors">
              Goal Simulator
            </a>
            <a href="#faq" className="hover:text-[var(--ink)] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] px-2 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill sm bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] shadow-sm"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-center">
          {/* Left Column: Clean, unbordered, razor-sharp typography */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-[var(--ink)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>Next-Gen Personal Finance Engine</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-[var(--ink)]">
              Master your wealth,<br />
              with <span className="text-[var(--accent)]">absolute precision.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--muted)] max-w-xl leading-relaxed">
              Finroq is an enterprise-grade financial ledger engineered with exact decimal arithmetic. Gain complete command over cash flow, dynamic category budgets, and net worth trajectory with zero guesswork.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
                className="btn-pill bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] shadow-sm"
              >
                Open your ledger <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <a
                href="#ledger"
                className="btn-pill ghost hover:border-[var(--ink)]"
              >
                Explore interactive demo
              </a>
            </div>
          </div>

          {/* Right Column: Hero Financial Preview Card (sharp, no blur) */}
          <div className="md:col-span-5">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-7 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--muted)]">
                  Consolidated Net Worth
                </span>
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--accent)]">
                  Live Ledger State
                </span>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
                ₹5,41,310.00
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
                <div>
                  <span className="text-xs font-medium text-[var(--muted)]">Liquid Assets</span>
                  <p className="font-mono text-base font-bold text-[var(--accent)] mt-1">
                    ₹5,63,650.00
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-[var(--muted)]">Active Liabilities</span>
                  <p className="font-mono text-base font-bold text-[var(--bad)] mt-1">
                    ₹22,340.00
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] pt-3 border-t border-[var(--line)] leading-relaxed">
                Every calculation is backed by exact fixed-point decimal arithmetic, eliminating IEEE 754 floating-point drift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proof Strip */}
      <div className="border-b border-[var(--line)] bg-[var(--soft)]/50 py-4">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--muted)] font-semibold tracking-wider">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" /> NUMERIC(14,2) DECIMAL LEDGER</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[var(--accent)]" /> ARGON2ID ENCRYPTION</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[var(--accent)]" /> ZERO-TRUST TENANT ISOLATION</span>
          <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" /> DETERMINISTIC RECURRENCE ENGINE</span>
        </div>
      </div>

      {/* 4. Feature 1: Spend Tracker & Ledger Demo */}
      <section id="ledger" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-6 sticky top-24">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              Feature One
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              A ledger that always balances.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Only completed transactions alter your liquid balance. Pending charges and transfers stay segregated, ensuring income and expenditure metrics are never artificially distorted.
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Exact Math</span>
                <span className="text-[var(--muted)]">Decimal arithmetic end to end, ensuring your totals balance with zero rounding drift.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Transfers</span>
                <span className="text-[var(--muted)]">Transfer funds between accounts neutrally without bloating monthly revenue.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Real-Time</span>
                <span className="text-[var(--muted)]">True net worth derived continuously across checking, savings, and credit balances.</span>
              </li>
            </ul>
          </div>

          {/* Interactive Ledger Demonstration Card */}
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--ink)]">October Ledger Records</h3>
                <p className="text-xs text-[var(--muted)]">Interactive sandbox demonstration</p>
              </div>
              <span className="text-xs font-mono text-[var(--muted)] bg-[var(--soft)] px-2.5 py-1 rounded-full">
                Tap status chip to cycle
              </span>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {ledgerRows.map((r) => {
                const isInc = r.t === 'income';
                const isTfr = r.t === 'transfer';
                return (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-3 text-sm hover:bg-[var(--soft)]/40 px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--ink)] truncate">{r.d}</p>
                      <span className="text-xs text-[var(--muted)]">
                        {isTfr ? 'Transfer · Neutral cash flow' : isInc ? 'Income Deposit' : 'Direct Expense'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-semibold ${isInc ? 'text-[var(--accent)]' : isTfr ? 'text-[var(--muted)]' : 'text-[var(--ink)]'}`}>
                        {isInc ? '+' : isTfr ? '' : '−'}
                        {fmt(r.a).replace('−', '')}
                      </span>
                      <button
                        onClick={() => cycleStatus(r.id)}
                        className={`chip ${r.s}`}
                        title="Click to cycle status"
                      >
                        {r.s}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t-2 border-[var(--ink)] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[var(--ink)] block">Net Liquid Cash Flow</span>
                <span className="text-xs text-[var(--muted)]">Calculated exclusively on completed transactions</span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-[var(--accent)]">
                {fmtSigned(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature 2: Budgets & Safe Recurrence */}
      <section id="budgets" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/20">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-7 shadow-xs order-2 md:order-1 hover:border-[var(--line)] transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--ink)]">Monthly Category Allocations</h3>
                <p className="text-xs text-[var(--muted)]">Dynamically synchronized with completed ledger entries</p>
              </div>
              <span className="text-xs font-mono text-[var(--muted)] bg-[var(--soft)] px-2.5 py-1 rounded-full">
                Active Limits
              </span>
            </div>

            <div className="space-y-5">
              {[
                { cat: 'Groceries & Food', alloc: 600000, spent: 527000 },
                { cat: 'Commute & Fuel', alloc: 150000, spent: 138000 },
                { cat: 'Discretionary Lifestyle', alloc: 500000, spent: 799900 },
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
                            Over Limit
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[var(--muted)]">
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
                    <div className="flex justify-between text-xs font-mono text-[var(--muted)] font-medium">
                      <span>{over ? `Deficit: ${fmt(m.spent - m.alloc)}` : `${pct.toFixed(1)}% consumed`}</span>
                      <span>{over ? 'Reallocation suggested' : `Remaining: ${fmt(m.alloc - m.spent)}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Duplicate-Safe Recurrence Demo */}
            <div className="pt-6 border-t border-[var(--line)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-[var(--ink)]">Fiber Internet Subscription</p>
                  <span className="text-xs text-[var(--muted)]">Monthly recurrence · Scheduled for 15 Oct</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-[var(--ink)]">₹999.00</span>
                  <button
                    onClick={handleRecordRec}
                    className="btn-pill sm bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
                  >
                    Record occurrence
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] bg-[var(--soft)] p-3 rounded-xl border border-[var(--line)] leading-relaxed font-mono">
                {recMessage}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 space-y-6 order-1 md:order-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              Feature Two
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Budgets that monitor themselves.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Set planned limits per category. Actual spending is derived live from verified transactions, alerting you the instant discretionary thresholds are tested.
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Autonomous</span>
                <span className="text-[var(--muted)]">Derived live from ledger data so you never have to reconcile receipts manually.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Recurrence</span>
                <span className="text-[var(--muted)]">Weekly, monthly, or yearly calendar rules handle shorter months with precision.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">Idempotent</span>
                <span className="text-[var(--muted)]">Recording scheduled charges repeatedly never triggers duplicate expenses.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Section 3: Interactive Budget Comparison Graph */}
      <section id="comparison" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              Interactive Simulation
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Dynamic Budget Stress-Testing.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Compare your intended caps with actual expenditures. Adjust the sliders to examine immediate category health responses in real time.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Interactive Sliders */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)]">
                Allocation Controls
              </h4>

              <div>
                <label className="text-xs font-semibold text-[var(--muted)] block mb-2">Category Under Review</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Food', 'Shopping', 'Transport', 'Entertainment'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBudgetCat(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        budgetCat === cat
                          ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] shadow-xs'
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
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--muted)]">Allocated Budget Cap:</span>
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
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--muted)]">Simulated Actual Spending:</span>
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
            <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h4 className="font-display font-bold text-lg text-[var(--ink)]">{budgetCat} Health Diagnostic</h4>
                  <p className="text-xs text-[var(--muted)]">Planned cap versus active expenditures</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                    isBudgetOver
                      ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                      : 'bg-[var(--soft)] text-[var(--accent)]'
                  }`}
                >
                  {isBudgetOver ? 'Deficit Warning' : 'Within Allocation'}
                </span>
              </div>

              {/* Grouped Comparative Bars */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[var(--muted)]">Allocated Cap</span>
                    <span className="font-mono font-bold text-[var(--ink)]">₹{activeCap.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-5 rounded-lg overflow-hidden">
                    <div className="bg-[var(--ink)] h-full rounded-lg" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[var(--muted)]">Simulated Spend ({budgetUtilization}%)</span>
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
                    <strong>Deficit Alert:</strong> Spending currently exceeds planned cap by{' '}
                    <strong className="font-mono">₹{Math.abs(activeRemaining).toLocaleString('en-IN')}</strong>. Defer discretionary purchases or reallocate surplus funds.
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                    <strong>Healthy Cushion:</strong> You have{' '}
                    <strong className="font-mono">₹{activeRemaining.toLocaleString('en-IN')}</strong> remaining ({100 - budgetUtilization}% cushion) for this cycle.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 4: Interactive Savings-Goal Timeline Simulator */}
      <section id="simulator" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/20">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              Timeline Accelerator
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Simulate How Spending Shifts Accelerate Wealth.
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Model your timeline to critical savings milestones. Adjust monthly contributions and watch how trimming discretionary leaks brings goals forward.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Simulator Controls */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs hover:border-[var(--line)] transition-colors">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--muted)]">
                Milestone Parameters
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--muted)]">Milestone Target:</span>
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
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--muted)]">Principal Saved to Date:</span>
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
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--muted)]">Standard Monthly Allocation:</span>
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
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--accent)] font-bold">+ Discretionary Trims Redirected:</span>
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
                <span className="text-[11px] text-[var(--muted)] block font-medium">
                  Simulate cutting creeping recurring subscriptions and directing the surplus into your goal.
                </span>
              </div>
            </div>

            {/* Live Results Timeline Card */}
            <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h4 className="font-display font-bold text-lg text-[var(--ink)]">Deterministic Horizon Forecast</h4>
                  <p className="text-xs text-[var(--muted)]">Mathematical formula: ceil((Target − Saved) / Monthly Total)</p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--soft)] text-[var(--accent)]">
                  {goalProgressPct}% Funded
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] font-semibold">
                  <span>Current: ₹{goalCurrent.toLocaleString('en-IN')}</span>
                  <span>Funding Gap: ₹{goalRemaining.toLocaleString('en-IN')}</span>
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
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70">
                  <span className="text-xs text-[var(--muted)] font-medium block">Total Monthly</span>
                  <span className="font-mono text-lg font-bold text-[var(--ink)] block mt-1">
                    ₹{totalMonthlySavings.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70">
                  <span className="text-xs text-[var(--muted)] font-medium block">Time to Target</span>
                  <span className="font-mono text-lg font-bold text-[var(--accent)] block mt-1">
                    {acceleratedMonthsNeeded} Months
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70 col-span-2 sm:col-span-1">
                  <span className="text-xs text-[var(--muted)] font-medium block">Time Saved</span>
                  <span className="font-mono text-lg font-bold text-[var(--accent)] block mt-1">
                    +{monthsSaved} Months
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--soft)] border border-[var(--line)] text-xs text-[var(--ink)] leading-relaxed">
                💡 <strong>Optimization Insight:</strong> Redirecting an additional{' '}
                <strong className="font-mono text-[var(--accent)]">₹{spendCutRedirect.toLocaleString('en-IN')}/mo</strong> into this milestone achieves your target in{' '}
                <strong className="font-mono">{acceleratedMonthsNeeded} months</strong> instead of{' '}
                <strong className="font-mono">{baseMonthsNeeded} months</strong>, reclaiming{' '}
                <strong className="font-mono text-[var(--accent)]">{monthsSaved} full months</strong> of waiting.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. 5 Comprehensive FAQs with Clean Interactive Accordion */}
      <section id="faq" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              Frequently Asked Questions
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)]">
              Everything you need to know.
            </h2>
            <p className="text-[var(--muted)] text-base leading-relaxed">
              Clear answers regarding our double-entry architecture, decimal math precision, privacy, and deterministic intelligence.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-[var(--surface)] border rounded-2xl transition-all duration-200 overflow-hidden cursor-pointer ${
                    isOpen
                      ? 'border-[var(--accent)] shadow-sm'
                      : 'border-[var(--line)] hover:border-[var(--ink)]/40'
                  }`}
                  onClick={() => setOpenFaq(isOpen ? null : item.id)}
                >
                  <button
                    className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--soft)] text-[var(--accent)] shrink-0">
                        0{idx + 1}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-[var(--muted)]">
                          {item.badge}
                        </span>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[var(--ink)] pr-4">
                          {item.q}
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--soft)] text-[var(--muted)]'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-0 border-t border-[var(--line)]/60 mt-1">
                      <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed pt-4">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Technical Precision & Security Section */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[var(--soft)]/20">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-3 gap-8">
          <div className="space-y-3 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[var(--ink)]">Arbitrary Decimal Arithmetic</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Backed by Python Decimal and database NUMERIC types. Eliminates binary floating-point roundoff errors across account balances, allocations, and currency transfers.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[var(--ink)]">Zero-Trust Isolation</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Hard server-enforced per-user data tenancy on all SQL operations. Signed stateless JWTs with cryptographic Argon2id password hashing protect your identity.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[var(--ink)]">Deterministic Logic</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Transparent timeline and emergency projections with zero invented returns. Every financial calculation is explainable, verifiable, and mathematically auditable.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Closer CTA & Minimal Footer */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-end justify-between gap-8">
          <div className="space-y-4 max-w-lg">
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[var(--ink)]">
              Open your ledger.
            </h2>
            <p className="text-[var(--muted)] text-base">
              Start recording transactions, set intelligent category budgets, and understand your financial trajectory with uncompromising certainty.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] shadow-sm"
            >
              Get started
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="btn-pill ghost hover:border-[var(--ink)]"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-8 text-xs text-[var(--muted)] font-mono">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span className="font-medium">Finroq · Intelligent Financial Accounting Engine</span>
          <span>Sample figures shown throughout marketing preview</span>
        </div>
      </footer>
    </div>
  );
}
