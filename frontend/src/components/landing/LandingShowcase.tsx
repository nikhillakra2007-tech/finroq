'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Lock,
  Activity,
  Send,
  Target,
  BarChart3,
  CreditCard,
  Repeat,
  AlertTriangle,
  Users,
  ShoppingBag,
  Zap,
  BookOpen,
  Umbrella,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

const MODULES_CATEGORIES = [
  {
    category: 'A. Track and Control',
    description: 'Master daily ledger flows, transaction states, and shared costs.',
    modules: [
      {
        id: '1',
        title: 'Expense Tracking',
        desc: 'Record and categorize transactions, review status (Completed, Pending, Cancelled), and track net cash flow.',
        icon: CreditCard,
        href: '/transactions',
      },
      {
        id: '2',
        title: 'Daily Budgeting',
        desc: 'Set category monthly budgets, compare actual spending against limits, and track remaining cushions.',
        icon: PieChart,
        href: '/budgets',
      },
      {
        id: '3',
        title: 'Expense Splitter',
        desc: 'Divide shared expenses, calculate equal and custom shares, and resolve net settlements with minimum payments.',
        icon: Users,
        href: '/splitter',
      },
    ],
  },
  {
    category: 'B. Decide Before Spending',
    description: 'Proactively simulate impact and eliminate hidden annual drains.',
    modules: [
      {
        id: '4',
        title: 'Pre-Spend Check',
        desc: 'Estimate how a planned purchase affects remaining category budget and monthly savings rate before buying.',
        icon: ShoppingBag,
        href: '/pre-spend-check',
      },
      {
        id: '5',
        title: 'Spend Leak Detector',
        desc: 'Audit recurring subscriptions and automatic fees to expose cumulative annualized drains.',
        icon: Zap,
        href: '/spend-leaks',
      },
      {
        id: '6',
        title: 'Money Guides',
        desc: 'Practical, evidence-based money management frameworks: 50/30/20, emergency buffers, and debt payoff.',
        icon: BookOpen,
        href: '/guides',
      },
    ],
  },
  {
    category: 'C. Build and Protect Wealth',
    description: 'Track overall equity, emergency resilience, and milestone progress.',
    modules: [
      {
        id: '7',
        title: 'Net Worth Architecture',
        desc: 'Balance sheet tracking: real-time liquid assets minus credit liabilities with debt-to-asset ratio.',
        icon: TrendingUp,
        href: '/net-worth',
      },
      {
        id: '8',
        title: 'Goal Timeline Simulator',
        desc: 'Calculate exact funding gaps, required monthly contributions, and estimated completion dates.',
        icon: Target,
        href: '/insights',
      },
      {
        id: '9',
        title: 'Emergency Cushion',
        desc: 'Determine your liquid runway (3, 6, 12 months) based on verified essential monthly burn rates.',
        icon: Umbrella,
        href: '/emergency-cushion',
      },
    ],
  },
  {
    category: 'D. Manage Obligations and Health',
    description: 'Eliminate high-interest debt and maintain authentic credit resilience.',
    modules: [
      {
        id: '10',
        title: 'EMI / Debt Watchdog',
        desc: 'Track revolving liabilities, simulate accelerated payoff timelines, and minimize cumulative interest.',
        icon: ShieldAlert,
        href: '/debt-watchdog',
      },
      {
        id: '11',
        title: 'Credit Health',
        desc: 'Monitor revolving credit utilization against limits without fake or simulated bureau credit scores.',
        icon: ShieldCheck,
        href: '/credit-health',
      },
      {
        id: '12',
        title: 'Integrated Financial Health',
        desc: 'Holistic index scoring savings rate, leverage, emergency runway, and cash flow positivity.',
        icon: Activity,
        href: '/financial-health',
      },
    ],
  },
];

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [selectedGoalContribution, setSelectedGoalContribution] = useState<number>(500);

  const handleInstantDemo = async () => {
    setIsDemoLoading(true);
    try {
      await login('demo@finroq.com', 'password123');
      if (onEnterApp) {
        onEnterApp();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finroq-ivory text-finroq-text selection:bg-finroq-lime selection:text-finroq-forest">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-finroq-mint/70 via-finroq-mint/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand Nav Header */}
          <div className="flex items-center justify-between mb-12 sm:mb-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2.5 bg-finroq-forest rounded-2xl shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Wallet className="h-5 w-5 text-finroq-lime" />
              </div>
              <div>
                <span className="text-xl font-black font-heading tracking-tight text-finroq-forest">
                  FINROQ
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider text-finroq-muted font-bold ml-2">
                  Personal Finance, Made Precise
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={onEnterApp ? onEnterApp : () => router.push('/')}
                  className="btn btn-lime text-xs sm:text-sm px-4 py-2"
                >
                  Enter Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm font-semibold text-finroq-text hover:text-finroq-forest px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={handleInstantDemo}
                    disabled={isDemoLoading}
                    className="btn btn-lime text-xs sm:text-sm px-4 py-2"
                  >
                    {isDemoLoading ? 'Loading...' : 'Get Started'} <ArrowRight className="h-4 w-4 ml-1.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-finroq-mint border border-finroq-sage/80 text-finroq-forest text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Connected Personal Finance Workspace
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-heading text-finroq-text tracking-tight leading-[1.12] mb-6">
              Know where your money goes.{' '}
              <span className="text-finroq-forest underline decoration-finroq-lime decoration-4 underline-offset-6">
                Decide where it should take you.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-finroq-muted leading-relaxed mb-8">
              Track spending, compare budgets, build savings goals, monitor debt, and understand your financial health — all in one connected personal finance workspace.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button
                onClick={handleInstantDemo}
                disabled={isDemoLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isDemoLoading ? 'Launching...' : 'Get Started (1-Click Demo)'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#all-modules"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-finroq-text bg-white hover:bg-finroq-mint/50 border border-finroq-border shadow-xs hover:-translate-y-0.5 transition-all duration-200"
              >
                Explore All 12 Features
              </a>
            </div>

            {/* Trust line referencing only implemented capabilities */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-finroq-muted font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-finroq-positive" /> Exact Decimal Arithmetic
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-finroq-positive" /> Argon2id Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-finroq-positive" /> Private User-Scoped Data
              </span>
            </div>
          </div>

          {/* Hero Visual: Rich Dashboard Preview (Clearly Labelled Sample Data) */}
          <div className="relative bg-white border border-finroq-border rounded-3xl p-5 sm:p-8 shadow-md">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-finroq-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-finroq-forest tracking-wide">
                  FINROQ Executive Financial Preview
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Illustrative Sample Data
              </span>
            </div>

            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-finroq-ivory p-4 rounded-2xl border border-finroq-border">
                <span className="text-xs text-finroq-muted font-medium">Net Worth</span>
                <p className="font-mono text-xl sm:text-2xl font-bold text-finroq-forest mt-1">$77,950.00</p>
                <span className="text-[10px] text-finroq-positive font-bold">+4.2% this month</span>
              </div>
              <div className="bg-finroq-ivory p-4 rounded-2xl border border-finroq-border">
                <span className="text-xs text-finroq-muted font-medium">Monthly Income</span>
                <p className="font-mono text-xl sm:text-2xl font-bold text-finroq-positive mt-1">$5,400.00</p>
                <span className="text-[10px] text-finroq-muted">Verified Completed</span>
              </div>
              <div className="bg-finroq-ivory p-4 rounded-2xl border border-finroq-border">
                <span className="text-xs text-finroq-muted font-medium">Monthly Expenses</span>
                <p className="font-mono text-xl sm:text-2xl font-bold text-finroq-negative mt-1">$2,476.80</p>
                <span className="text-[10px] text-finroq-muted">Across 8 Categories</span>
              </div>
              <div className="bg-finroq-mint p-4 rounded-2xl border border-finroq-sage/80">
                <span className="text-xs text-finroq-forest font-semibold">Net Cash Flow</span>
                <p className="font-mono text-xl sm:text-2xl font-bold text-finroq-forest mt-1">+$2,923.20</p>
                <span className="text-[10px] text-finroq-positive font-bold">54.1% Savings Rate</span>
              </div>
            </div>

            {/* Middle Row: Income vs Expenses & Category Breakdown */}
            <div className="grid lg:grid-cols-12 gap-5 mb-5">
              {/* Income vs Expenses Mini Chart */}
              <div className="lg:col-span-7 bg-finroq-ivory p-5 rounded-2xl border border-finroq-border space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-finroq-text">
                  <span>Cash Flow Trend (Last 4 Months)</span>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-finroq-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-finroq-forest" /> Income
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-finroq-lime" /> Expenses
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { month: 'Jul', inc: 5200, exp: 2600 },
                    { month: 'Aug', inc: 5400, exp: 2850 },
                    { month: 'Sep', inc: 5350, exp: 2300 },
                    { month: 'Oct (Active)', inc: 5400, exp: 2476.8 },
                  ].map((row, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-finroq-muted">
                        <span className="font-medium text-finroq-text">{row.month}</span>
                        <span className="font-mono font-bold text-finroq-positive">
                          +${(row.inc - row.exp).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 h-2.5">
                        <div className="w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="bg-finroq-forest h-full rounded-full" style={{ width: `${(row.inc / 6000) * 100}%` }} />
                        </div>
                        <div className="w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="bg-finroq-lime h-full rounded-full" style={{ width: `${(row.exp / 6000) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown & Budget Utilization */}
              <div className="lg:col-span-5 bg-finroq-ivory p-5 rounded-2xl border border-finroq-border space-y-4">
                <span className="text-xs font-bold text-finroq-text">Category Spending & Caps</span>
                <div className="space-y-3">
                  {[
                    { cat: 'Housing (Rent)', spent: 2100, cap: 2200, pct: 95.4, safe: true },
                    { cat: 'Groceries & Provisions', spent: 276.8, cap: 800, pct: 34.6, safe: true },
                    { cat: 'Transportation', spent: 55, cap: 350, pct: 15.7, safe: true },
                    { cat: 'Entertainment & Subs', spent: 45, cap: 400, pct: 11.2, safe: true },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-finroq-text">{item.cat}</span>
                        <span className="font-mono font-bold text-finroq-forest">${item.spent} / ${item.cap}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${item.pct > 90 ? 'bg-amber-500' : 'bg-finroq-forest'}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Savings Goal Progress */}
            <div className="bg-finroq-mint/60 border border-finroq-sage/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-finroq-forest text-white rounded-xl">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-finroq-forest">Primary Goal: 6-Month Emergency Cushion</p>
                  <p className="text-xs text-finroq-muted">Saved $31,000.00 of $15,000.00 target • Target Date: Dec 2026</p>
                </div>
              </div>
              <button
                onClick={handleInstantDemo}
                className="btn btn-primary text-xs px-4 py-2 w-full sm:w-auto"
              >
                Test Real Dashboard <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FINANCIAL OVERVIEW: SEE THE COMPLETE PICTURE
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-finroq-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-finroq-forest">
              Systemic Wealth Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight mt-2">
              See the complete picture. Not isolated fragments.
            </h2>
            <p className="text-base text-finroq-muted mt-3 leading-relaxed">
              Most tools silo your data: one app for budgeting, another for net worth, another for split bills. FINROQ unifies all financial components so every transaction immediately reflects in your balance sheet, budgets, and savings runway.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-3">
              <div className="w-10 h-10 bg-finroq-mint rounded-xl flex items-center justify-center text-finroq-forest">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-finroq-text">1. Income & Spending</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Deterministic cash flow calculation. Transfers between checking and savings are never distorted into fake income or expenses.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-3">
              <div className="w-10 h-10 bg-finroq-mint rounded-xl flex items-center justify-center text-finroq-forest">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-finroq-text">2. Net Worth Balance Sheet</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Total Assets minus Liabilities. Real equity that reveals true debt leverage rather than transient checking account balances.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-3">
              <div className="w-10 h-10 bg-finroq-mint rounded-xl flex items-center justify-center text-finroq-forest">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-finroq-text">3. Budget Utilization</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Real-time category spending percentage derived from verified completed transactions with proactive overrun alerts.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-3">
              <div className="w-10 h-10 bg-finroq-mint rounded-xl flex items-center justify-center text-finroq-forest">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-base text-finroq-text">4. Goal Projections</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Deterministic timeline simulator calculating funding gaps and required contributions with zero speculative return assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: SPEND TRACKER: EVERY RUPEE ACCOUNTED FOR
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-finroq-ivory">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold">
                <CreditCard className="h-3.5 w-3.5" />
                Ledger Semantics
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight">
                Every rupee accounted for. Without losing track of the details.
              </h2>
              <p className="text-base text-finroq-muted leading-relaxed">
                Understand what comes in, what goes out, and where your spending changes. Completed, pending, and cancelled transactions are strictly distinguished so unverified charges never corrupt your balance sheet.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-finroq-text">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Zero Float Artifacts:</strong> Python <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">Decimal</code> and PostgreSQL <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">NUMERIC</code> prevent rounding drift.</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-finroq-text">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Atomic Transfers:</strong> Moving $1,000 to savings preserves total portfolio balance and never inflates expenditure metrics.</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-finroq-text">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Reversals & Refunds:</strong> Linked directly to parent transactions to adjust net spend without duplicate entries.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/transactions" className="btn btn-primary text-xs px-5 py-2.5">
                  Open Transaction Ledger <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Illustrative Ledger Card */}
            <div className="lg:col-span-6 bg-white border border-finroq-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-finroq-border text-xs">
                <span className="font-bold text-finroq-text uppercase tracking-wider">Sample Ledger Feed</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-finroq-mint text-finroq-positive">
                  Illustrative Sample Data
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { desc: 'Acme Corp Monthly Payroll', cat: 'Salary', amt: '+$5,400.00', status: 'Completed', type: 'income' },
                  { desc: 'Beacon Luxury Apartments Rent', cat: 'Housing', amt: '-$2,100.00', status: 'Completed', type: 'expense' },
                  { desc: 'Transfer to High-Yield Savings', cat: 'Transfer', amt: '$1,000.00', status: 'Completed', type: 'transfer' },
                  { desc: 'Whole Foods Market Provisions', cat: 'Groceries', amt: '-$184.50', status: 'Completed', type: 'expense' },
                  { desc: 'Airline Flight Hold', cat: 'Travel', amt: '-$420.00', status: 'Pending', type: 'pending' },
                ].map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-finroq-text">{item.desc}</p>
                      <span className="text-[11px] text-finroq-muted">{item.cat}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${
                        item.type === 'income' ? 'text-finroq-positive' : item.type === 'transfer' ? 'text-blue-600' : 'text-finroq-text'
                      }`}>
                        {item.amt}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        item.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: BUDGET COMPARISON: COMPARE, CONTROL, IMPROVE
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-finroq-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-finroq-forest">
              Planned vs Actual Spending
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight mt-2">
              Your budget should tell you something.
            </h2>
            <p className="text-base text-finroq-muted mt-3">
              Compare what you planned with what you actually spent. Catch overspending before it becomes a pattern.
            </p>
          </div>

          <div className="bg-finroq-ivory border border-finroq-border rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-finroq-border text-xs">
              <span className="font-bold text-finroq-text uppercase">Monthly Category Benchmarks</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Illustrative Sample Data
              </span>
            </div>

            <div className="space-y-6">
              {[
                { name: 'Housing & Utilities', allocated: 2200, spent: 2100, remaining: 100, over: false },
                { name: 'Groceries & Household', allocated: 800, spent: 276.8, remaining: 523.2, over: false },
                { name: 'Dining Out & Entertainment', allocated: 400, spent: 445, remaining: 0, over: true, overrun: 45 },
                { name: 'Transportation & Commute', allocated: 350, spent: 55, remaining: 295, over: false },
              ].map((b, i) => {
                const pct = Math.min(100, (b.spent / b.allocated) * 100);
                return (
                  <div key={i} className="space-y-2 bg-white p-4 rounded-2xl border border-finroq-border">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-sm text-finroq-text">{b.name}</span>
                        <p className="text-[11px] text-finroq-muted">
                          Planned: {formatCurrency(b.allocated)} • Actual: {formatCurrency(b.spent)}
                        </p>
                      </div>
                      <div className="text-right">
                        {b.over ? (
                          <span className="text-xs font-bold text-finroq-negative flex items-center gap-1 justify-end">
                            <AlertTriangle className="h-3.5 w-3.5" /> Over budget by {formatCurrency(b.overrun || 0)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-finroq-positive">
                            {formatCurrency(b.remaining)} remaining
                          </span>
                        )}
                        <span className="text-[11px] text-finroq-muted">{pct.toFixed(1)}% utilized</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          b.over ? 'bg-finroq-negative' : pct > 85 ? 'bg-amber-500' : 'bg-finroq-forest'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 mt-6 border-t border-finroq-border flex justify-between items-center">
              <span className="text-xs text-finroq-muted">
                Zero manual math. Spending auto-aggregates from completed transaction records.
              </span>
              <Link href="/budgets" className="btn btn-primary text-xs px-4 py-2">
                Manage Monthly Budgets <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: GOAL ACHIEVER: TURN INTENTIONS INTO MILESTONES
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-finroq-ivory">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold">
                <Target className="h-3.5 w-3.5" />
                Goal Timeline Architecture
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight">
                Give your money a destination.
              </h2>

              <p className="text-base text-finroq-muted leading-relaxed">
                Set a goal, see the gap, and understand what it takes to reach it. All projections use deterministic arithmetic based on explicit monthly contributions without speculative growth assumptions.
              </p>

              <div className="space-y-3 text-xs text-finroq-text">
                <div className="p-3 bg-white rounded-xl border border-finroq-border">
                  <strong>Example Concepts:</strong> Emergency Buffer, New Laptop, Travel Vacation, Higher Education.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-finroq-muted">
                  Test Monthly Contribution Scenario:
                </label>
                <div className="flex gap-2">
                  {[250, 500, 750, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setSelectedGoalContribution(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedGoalContribution === amt
                          ? 'bg-finroq-forest text-white'
                          : 'bg-white text-finroq-text border border-finroq-border'
                      }`}
                    >
                      ${amt}/mo
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Goal Milestone Card */}
            <div className="lg:col-span-7 bg-white border border-finroq-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-finroq-border text-xs">
                <span className="font-bold text-finroq-text uppercase">Goal Timeline Milestone Simulator</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-finroq-mint text-finroq-positive">
                  Illustrative Sample Data
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-lg text-finroq-text">
                    New Workstation & Creative Setup
                  </h3>
                  <p className="text-xs text-finroq-muted">Target: $4,500.00 • Saved So Far: $1,500.00</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold text-finroq-forest">33.3%</span>
                  <p className="text-[11px] text-finroq-muted">Gap: $3,000.00</p>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-finroq-forest h-3 rounded-full" style={{ width: '33.3%' }} />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-finroq-muted">
                  <span>Start ($0)</span>
                  <span>Milestone 1 ($1.5k)</span>
                  <span>Milestone 2 ($3.0k)</span>
                  <span>Target ($4.5k)</span>
                </div>
              </div>

              {/* Dynamic Projection Box */}
              <div className="p-4 bg-finroq-mint rounded-2xl border border-finroq-sage/80 space-y-2">
                <span className="text-xs font-bold text-finroq-forest">
                  Deterministic Math Projection ({formatCurrency(selectedGoalContribution)}/mo):
                </span>
                <p className="text-xs text-finroq-muted leading-relaxed">
                  At <strong>${selectedGoalContribution}/month</strong>, you will bridge the remaining $3,000.00 gap in exactly{' '}
                  <strong className="text-finroq-forest">
                    {Math.ceil(3000 / selectedGoalContribution)} months
                  </strong>{' '}
                  (Target achieved by {new Date(Date.now() + Math.ceil(3000 / selectedGoalContribution) * 30 * 24 * 3600 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric' })}).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: ALL 12 FINANCIAL MODULES: ONE CONNECTED WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <section id="all-modules" className="py-24 bg-white border-y border-finroq-border scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-finroq-forest">
              Complete Financial Spectrum
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-finroq-text tracking-tight mt-2">
              All 12 financial features. One connected workspace.
            </h2>
            <p className="text-base text-finroq-muted mt-3">
              Explore the full depth of FINROQ. Every module connects to the same authoritative financial ledger with zero dead ends.
            </p>
          </div>

          <div className="space-y-12">
            {MODULES_CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <div className="border-b border-finroq-border pb-2">
                  <h3 className="font-heading font-extrabold text-xl text-finroq-forest">
                    {cat.category}
                  </h3>
                  <p className="text-xs text-finroq-muted">{cat.description}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {cat.modules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      className="group p-6 bg-finroq-ivory hover:bg-white rounded-2xl border border-finroq-border hover:border-finroq-sage/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 bg-finroq-mint rounded-xl flex items-center justify-center text-finroq-forest group-hover:scale-105 transition-transform duration-200">
                          <mod.icon className="h-5 w-5" />
                        </div>
                        <h4 className="font-heading font-bold text-base text-finroq-text group-hover:text-finroq-forest transition-colors">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-finroq-muted leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center text-xs font-bold text-finroq-forest group-hover:translate-x-0.5 transition-transform">
                        <span>Open module</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: RECURRING BILLS AND FINANCIAL AUTOMATION
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-finroq-ivory">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold">
                <Repeat className="h-3.5 w-3.5" />
                Calendar Clamping Engine
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight">
                Routine bills. Less routine stress.
              </h2>

              <p className="text-base text-finroq-muted leading-relaxed">
                Keep recurring obligations organized and understand how they fit into your monthly plan. Schedulers handle shorter months without calendar degradation.
              </p>

              <div className="space-y-3 text-xs text-finroq-text">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Month-End Clamping:</strong> Rules scheduled on the 31st clamp to the 28th/30th and automatically restore on full 31-day months.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Idempotent Recording:</strong> Scheduled occurrences never duplicate transactions even if repeated recording requests occur.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-finroq-positive mt-0.5 shrink-0" />
                  <span><strong>Strict Definition Separation:</strong> Upcoming obligations do not alter bank balances until explicitly confirmed.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/recurring" className="btn btn-primary text-xs px-5 py-2.5">
                  View Recurring Schedules <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </div>
            </div>

            {/* Calendar Clamping Visual Card */}
            <div className="lg:col-span-6 bg-white border border-finroq-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <span className="text-xs font-bold text-finroq-text uppercase">Upcoming Recurring Schedule</span>
              <div className="space-y-3">
                {[
                  { title: 'Apartment Rent', amt: '$2,100.00', cadence: 'Monthly on 1st', next: 'Nov 1, 2026' },
                  { title: 'Bi-Weekly / Monthly Salary', amt: '+$5,400.00', cadence: 'Monthly on 15th', next: 'Oct 15, 2026' },
                  { title: 'Cloud Backups & Subscriptions', amt: '$45.00', cadence: 'Monthly on 31st (Clamped)', next: 'Oct 31, 2026' },
                ].map((r, i) => (
                  <div key={i} className="p-3.5 bg-finroq-ivory rounded-xl border border-finroq-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-finroq-text">{r.title}</p>
                      <span className="text-finroq-muted text-[11px]">{r.cadence}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-finroq-forest">{r.amt}</p>
                      <span className="text-[11px] text-finroq-positive">Next: {r.next}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: PRECISION AND SECURITY
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-finroq-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-finroq-forest">
              Architectural Guarantees
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-finroq-text tracking-tight mt-2">
              Built to get the details right.
            </h2>
            <p className="text-base text-finroq-muted mt-3">
              FINROQ enforces institutional security and mathematical integrity at every layer of the application.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-2">
              <Lock className="h-5 w-5 text-finroq-forest" />
              <h3 className="font-heading font-bold text-sm text-finroq-text">Argon2id Passwords</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                State-of-the-art memory-hard password hashing protecting accounts against brute-force and dictionary attacks.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-2">
              <ShieldCheck className="h-5 w-5 text-finroq-forest" />
              <h3 className="font-heading font-bold text-sm text-finroq-text">Cryptographic JWTs</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Signed access tokens with expiration verification. Identity derived strictly on the server from verified claims.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-2">
              <BarChart3 className="h-5 w-5 text-finroq-forest" />
              <h3 className="font-heading font-bold text-sm text-finroq-text">Decimal Precision</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Arbitrary-precision arithmetic using Python Decimal and PostgreSQL NUMERIC. Zero floating-point rounding drift.
              </p>
            </div>

            <div className="p-6 bg-finroq-ivory rounded-2xl border border-finroq-border space-y-2">
              <Layers className="h-5 w-5 text-finroq-forest" />
              <h3 className="font-heading font-bold text-sm text-finroq-text">Per-User Isolation</h3>
              <p className="text-xs text-finroq-muted leading-relaxed">
                Every database query scopes explicitly to the authenticated owner. Client-provided owner IDs are rejected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: FINAL CTA & FOOTER
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-finroq-ivory">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-finroq-text tracking-tight">
            Build a clearer picture of your money.
          </h2>
          <p className="text-base text-finroq-muted max-w-xl mx-auto">
            Start with your transactions. Set your budgets. Give your goals a timeline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleInstantDemo}
              disabled={isDemoLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 shadow-sm transition-all"
            >
              {isDemoLoading ? 'Launching Demo...' : 'Get Started (1-Click Demo)'}
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-finroq-text bg-white hover:bg-slate-50 border border-finroq-border"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-finroq-border text-xs text-finroq-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-finroq-forest" />
              <span className="font-heading font-black text-sm text-finroq-forest">FINROQ</span>
              <span className="text-slate-400">|</span>
              <span>Personal Finance, Made Precise</span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold text-finroq-text">
              <Link href="/transactions" className="hover:text-finroq-forest">Transactions</Link>
              <Link href="/budgets" className="hover:text-finroq-forest">Budgets</Link>
              <Link href="/net-worth" className="hover:text-finroq-forest">Net Worth</Link>
              <Link href="/insights" className="hover:text-finroq-forest">AI Insights</Link>
              <Link href="/guides" className="hover:text-finroq-forest">Money Guides</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} FINROQ. Engineered with Python Decimal & Next.js 14.</p>
            <p>Arbitrary-precision ledger math • Zero speculative investment advice</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
