'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { useI18n } from '@/lib/i18n-context';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
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
  Globe,
  Menu,
  X,
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const targets = el.querySelectorAll('.rv');
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const { navigateWithCurtain } = useCurtain();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const rootRef = useScrollReveal();

  // FAQ accordion state (collapsed by default)
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme management — read from localStorage and apply on mount
  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
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

  // Custom Transaction to Sandbox Ledger
  const [newLedgerDesc, setNewLedgerDesc] = useState('');
  const [newLedgerAmount, setNewLedgerAmount] = useState('');
  const [newLedgerType, setNewLedgerType] = useState<'income' | 'expense'>('expense');

  const handleAddCustomLedgerRow = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newLedgerAmount);
    if (isNaN(val) || val <= 0) return;
    const paisa = Math.round(val * 100);
    const newRow = {
      id: Date.now(),
      d: newLedgerDesc.trim() || (newLedgerType === 'income' ? t('feat1.income_opt', 'Custom Income') : t('feat1.expense_opt', 'Custom Expense')),
      s: 'Completed' as const,
      t: newLedgerType,
      a: paisa,
    };
    setLedgerRows((prev) => [newRow, ...prev]);
    setNewLedgerDesc('');
    setNewLedgerAmount('');
  };

  // Dedicated Amount Sandbox State (Landing Page Only)
  const [testAmount, setTestAmount] = useState<number>(15000);
  const [testLens, setTestLens] = useState<'prespend' | 'allocation' | 'milestones'>('prespend');

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

  // 2. Interactive Feature 2: Self-Monitoring Budget Simulation
  // Category under spotlight: Dining & Outings (Base cap: ₹5,000, initial spend: ₹3,850 = 77%)
  const [simDiningSpend, setSimDiningSpend] = useState<number>(385000); // in paisa: ₹3,850.00
  const [simDiningCap, setSimDiningCap] = useState<number>(500000); // in paisa: ₹5,000.00
  const [simCommuteCap, setSimCommuteCap] = useState<number>(200000); // in paisa: ₹2,000.00
  const [simRebalanceDone, setSimRebalanceDone] = useState<boolean>(false);

  const diningOver = simDiningSpend > simDiningCap;
  const diningPct = Math.min(100, (simDiningSpend / simDiningCap) * 100);
  const diningDeficit = Math.max(0, simDiningSpend - simDiningCap);

  const handleSimAddSpend = (amountPaisa: number) => {
    setSimDiningSpend((prev) => prev + amountPaisa);
    setSimRebalanceDone(false);
  };

  const handleSimRebalance = () => {
    // Rebalance ₹500 (50,000 paisa) from commute surplus into dining
    setSimDiningCap(550000); // ₹5,500
    setSimCommuteCap(150000); // ₹1,500
    setSimRebalanceDone(true);
  };

  const handleSimReset = () => {
    setSimDiningSpend(385000);
    setSimDiningCap(500000);
    setSimCommuteCap(200000);
    setSimRebalanceDone(false);
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
  const faqs = useMemo(
    () => [
      {
        id: 0,
        badge: t('faq.b0', 'PRECISION'),
        q: t('faq.q0', 'Why is exact decimal arithmetic necessary for personal finance?'),
        a: t('faq.a0', 'Most personal finance apps rely on standard IEEE 754 floating-point numbers, which accumulate fractional rounding drift across hundreds of transactions. FINROQ enforces arbitrary-precision decimal mathematics through Python Decimal and PostgreSQL NUMERIC(14,2) end to end. Every balance, ledger entry, category allocation, and transfer balances with zero drift.'),
      },
      {
        id: 1,
        badge: t('faq.b1', 'ARCHITECTURE'),
        q: t('faq.q1', 'How is FINROQ fundamentally different from spreadsheets and standard budgeting apps?'),
        a: t('faq.a1', 'Unlike unstructured spreadsheets or superficial budget trackers, FINROQ implements strict double-entry ledger semantics. Internal transfers move money between accounts neutrally without falsely inflating income or expenses. Pending transactions remain isolated from liquid balances, and calendar schedules clamp automatically across leap years and month ends.'),
      },
      {
        id: 2,
        badge: t('faq.b2', 'AUTOMATION'),
        q: t('faq.q2', 'Can I automate recurring subscriptions and bills without risk of duplicate entries?'),
        a: t('faq.a2', 'Yes. FINROQ includes a deterministic, idempotent recurring rules engine. Even if an occurrence trigger fires multiple times in a billing cycle, the system checks previous ledger records and prevents duplicate entries. You get predictable, transparent recurrence without phantom expenses.'),
      },
      {
        id: 3,
        badge: t('faq.b3', 'SECURITY'),
        q: t('faq.q3', 'How is my financial data protected, isolated, and kept private?'),
        a: t('faq.a3', 'FINROQ enforces a zero-trust tenant architecture where all database queries explicitly scope to your verified account identity on the server. Authentication is backed by Argon2id cryptographic password hashing and tamper-proof JWT tokens. Your private financial metrics are never harvested, sold, or shared with third parties.'),
      },
      {
        id: 4,
        badge: t('faq.b4', 'SOVEREIGNTY'),
        q: t('faq.q4', 'Can I use FINROQ privately without exposing real banking login credentials?'),
        a: t('faq.a4', 'Absolutely. FINROQ does not require you to provide banking passwords or grant broad OAuth access to third-party scraping brokers. You maintain sovereign ownership over your books, with the ability to record ledger entries manually, import CSV statements, and explore every simulation tool in a clean, self-contained environment.'),
      },
    ],
    [language, t]
  );

  return (
    <div ref={rootRef} className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {/* 1. Stationary Top Navigation - Does not pop up or stick during scrolling */}
      <header className="relative w-full z-40 bg-[var(--bg)] border-b border-[var(--line)]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile / Tablet Menu Button (visible below xl) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--soft)] transition-colors shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2.5 font-display font-bold text-xl tracking-tight text-[var(--ink)] hover:opacity-90 transition-opacity"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              <span className="tracking-tight font-extrabold text-[#173F2B] dark:text-slate-100">finroq</span>
            </Link>
          </div>

          {/* Desktop Navigation Links (visible at xl and up: >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-2.5 2xl:gap-6 text-xs 2xl:text-sm font-bold text-[#173F2B] dark:text-slate-100 shrink min-w-0">
            <a href="#ledger" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              {t('nav.ledger', 'Ledger')}
            </a>
            <a href="#budgets" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              {t('nav.budgets', 'Budgets')}
            </a>
            <a href="#amount-sandbox" className="hover:text-[var(--accent)] transition-colors text-[var(--accent)] whitespace-nowrap">
              {t('nav.amount_lab', 'Amount Lab')}
            </a>
            <a href="#comparison" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              {t('nav.comparison', 'Comparison')}
            </a>
            <a href="#simulator" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              {t('nav.simulator', 'Goal Simulator')}
            </a>
            <a href="#faq" className="hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              {t('nav.faq', 'FAQ')}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageSelector variant="pill" align="right" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="text-xs sm:text-sm font-bold text-[#173F2B] dark:text-slate-100 hover:text-[var(--accent)] px-1.5 sm:px-2 transition-colors whitespace-nowrap"
            >
              {t('nav.signin', 'Sign in')}
            </button>
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill sm bg-[#173F2B] text-white hover:bg-[var(--accent)] shadow-sm font-bold whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4 py-1.5"
            >
              {t('nav.getstarted', 'Get started')}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[var(--surface)] border-b border-[var(--line)] px-4 sm:px-6 py-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-bold text-[#173F2B] dark:text-slate-100">
              <a
                href="#ledger"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.ledger', 'Ledger')}</span>
              </a>
              <a
                href="#budgets"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.budgets', 'Budgets')}</span>
              </a>
              <a
                href="#amount-sandbox"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors text-[var(--accent)] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.amount_lab', 'Amount Lab')}</span>
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.comparison', 'Comparison')}</span>
              </a>
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.simulator', 'Goal Simulator')}</span>
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>{t('nav.faq', 'FAQ')}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Clean, balanced typography with refined scale */}
          <div className="md:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-bold text-[#173F2B] dark:text-slate-100">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>{t('hero.badge', 'Next-Gen Personal Finance Engine')}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[2.9rem] xl:text-[3.15rem] font-bold tracking-tight leading-[1.14] text-[#173F2B] dark:text-slate-50">
              {t('hero.title_part1', 'Master your wealth,')}
              <br />
              {t('hero.title_with', 'with')}{' '}
              <span className="text-[var(--accent)]">{t('hero.title_part2', 'absolute precision.')}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-[1.125rem] text-[#2E4035] dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              {t('hero.description', 'Finroq is an enterprise-grade financial ledger engineered with exact decimal arithmetic. Gain complete command over cash flow, dynamic category budgets, and net worth trajectory with zero guesswork.')}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
                className="btn-pill bg-[#173F2B] text-white hover:bg-[#102F21] shadow-sm font-bold text-sm sm:text-base"
              >
                {t('hero.open_ledger', 'Open your ledger')} <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <a
                href="#ledger"
                className="btn-pill ghost hover:border-[var(--ink)] font-bold text-sm sm:text-base text-[#173F2B] dark:text-slate-100"
              >
                {t('hero.explore_demo', 'Explore interactive demo')}
              </a>
              <a
                href="#amount-sandbox"
                className="btn-pill ghost hover:border-[var(--accent)] font-bold text-sm sm:text-base text-[#173F2B] dark:text-slate-100 flex items-center gap-1.5"
              >
                <span>{t('hero.test_amount', '⚡ Test Specific Amount')}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Expanded Hero Financial Preview Card that fills space harmoniously */}
          <div className="md:col-span-6">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-8 sm:p-9 space-y-6 shadow-md hover:border-[var(--line)] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#2E4035] dark:text-slate-300">
                  {t('hero.net_worth', 'Consolidated Net Worth')}
                </span>
                <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[var(--soft)] text-[var(--accent)] border border-[var(--line)]">
                  {t('hero.live_state', 'Live Ledger State')}
                </span>
              </div>

              <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-[#173F2B] dark:text-slate-50">
                ₹5,41,310.00
              </div>

              <div className="grid grid-cols-2 gap-5 pt-4 border-t border-[var(--line)]">
                <div>
                  <span className="text-xs font-bold text-[#2E4035] dark:text-slate-300">
                    {t('hero.liquid_assets', 'Liquid Assets')}
                  </span>
                  <p className="font-mono text-xl font-bold text-[var(--accent)] mt-1">
                    ₹5,63,650.00
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2E4035] dark:text-slate-300">
                    {t('hero.active_liabilities', 'Active Liabilities')}
                  </span>
                  <p className="font-mono text-xl font-bold text-[var(--bad)] mt-1">
                    ₹22,340.00
                  </p>
                </div>
              </div>

              {/* Asset Solvency Ratio Progress Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-mono font-semibold text-[#2E4035] dark:text-slate-300">
                  <span>{t('hero.solvency_ratio', 'Asset Solvency Ratio')}</span>
                  <span className="text-[var(--accent)] font-bold">96.2% {t('hero.solvent', 'Solvent')}</span>
                </div>
                <div className="w-full bg-[var(--soft)] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-500" style={{ width: '96.2%' }} />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-mono font-semibold text-[#2E4035] dark:text-slate-300">
                <span>{t('hero.net_surplus', 'Monthly Net Surplus:')}</span>
                <span className="text-[var(--accent)] font-bold text-sm">+₹1,07,200.00</span>
              </div>

              <p className="text-xs text-[#2E4035] dark:text-slate-400 pt-2 border-t border-[var(--line)] leading-relaxed font-medium">
                {t('hero.decimal_note', 'Every calculation is backed by exact fixed-point decimal arithmetic, eliminating IEEE 754 floating-point drift.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proof Strip */}
      <div className="border-b border-[var(--line)] bg-[var(--soft)]/50 py-4">
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-[#173F2B] dark:text-slate-200 font-bold tracking-wider">
          <span className="flex items-center gap-1.5 break-words [overflow-wrap:anywhere]"><ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> <span>{t('proof.numeric', 'NUMERIC(14,2) DECIMAL LEDGER')}</span></span>
          <span className="flex items-center gap-1.5 break-words [overflow-wrap:anywhere]"><Shield className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> <span>{t('proof.argon', 'ARGON2ID ENCRYPTION')}</span></span>
          <span className="flex items-center gap-1.5 break-words [overflow-wrap:anywhere]"><Lock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> <span>{t('proof.isolation', 'ZERO-TRUST TENANT ISOLATION')}</span></span>
          <span className="flex items-center gap-1.5 break-words [overflow-wrap:anywhere]"><RotateCcw className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> <span>{t('proof.recurrence', 'DETERMINISTIC RECURRENCE ENGINE')}</span></span>
        </div>
      </div>

      {/* 4. Feature 1: Spend Tracker & Ledger Demo */}
      <section id="ledger" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-6 sticky top-24">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              {t('feat1.badge', 'Feature One')}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('feat1.title', 'A ledger that always balances.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('feat1.desc', 'Only completed transactions alter your liquid balance. Pending charges and transfers stay segregated, ensuring income and expenditure metrics are never artificially distorted.')}
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm font-medium">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">
                  {t('feat1.exact_math', 'Exact Math')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat1.exact_math_desc', 'Decimal arithmetic end to end, ensuring your totals balance with zero rounding drift.')}
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">
                  {t('feat1.transfers', 'Transfers')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat1.transfers_desc', 'Transfer funds between accounts neutrally without bloating monthly revenue.')}
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[80px]">
                  {t('feat1.realtime', 'Real-Time')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat1.realtime_desc', 'True net worth derived continuously across checking, savings, and credit balances.')}
                </span>
              </li>
            </ul>
          </div>

          {/* Interactive Ledger Demonstration Card */}
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#173F2B] dark:text-slate-50">
                  {t('feat1.oct_records', 'October Ledger Records')}
                </h3>
                <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                  {t('feat1.sandbox', 'Interactive sandbox demonstration')}
                </p>
              </div>
              <span className="text-xs font-mono text-[#173F2B] dark:text-slate-300 bg-[var(--soft)] px-2.5 py-1 rounded-full font-bold">
                {t('feat1.cycle_chip', 'Tap status chip to cycle')}
              </span>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {ledgerRows.map((r) => {
                const isInc = r.t === 'income';
                const isTfr = r.t === 'transfer';
                const localizedDesc =
                  language === 'hi'
                    ? r.d === 'Salary Direct Deposit'
                      ? 'वेतन प्रत्यक्ष जमा'
                      : r.d === 'Consulting Retainer Invoice'
                      ? 'परामर्श सेवा चालान (कंसल्टिंग)'
                      : r.d === 'Residential Rent Payment'
                      ? 'आवासीय मकान किराया भुगतान'
                      : r.d === 'Transfer to Index Portfolio'
                      ? 'इंडेक्स पोर्टफोलियो में स्थानांतरण'
                      : r.d === 'Noise Cancelling Headphones'
                      ? 'हेडफोन खरीद व्यय'
                      : r.d
                    : r.d;
                const localizedSub =
                  isTfr
                    ? language === 'hi' ? 'स्थानांतरण · तटस्थ कैश फ्लो' : 'Transfer · Neutral cash flow'
                    : isInc
                    ? language === 'hi' ? 'आय जमा (Income Deposit)' : 'Income Deposit'
                    : language === 'hi' ? 'प्रत्यक्ष व्यय (Direct Expense)' : 'Direct Expense';
                const localizedChip =
                  r.s === 'Completed'
                    ? t('feat1.status_completed', 'Completed')
                    : r.s === 'Pending'
                    ? t('feat1.status_pending', 'Pending')
                    : t('feat1.status_cancelled', 'Cancelled');

                return (
                  <div key={r.id} className="py-3.5 flex items-center justify-between gap-3 text-sm hover:bg-[var(--soft)]/40 px-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <p className="font-bold text-[#173F2B] dark:text-slate-50 truncate">{localizedDesc}</p>
                      <span className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                        {localizedSub}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold ${isInc ? 'text-[var(--accent)]' : isTfr ? 'text-[#2E4035] dark:text-slate-300' : 'text-[#173F2B] dark:text-slate-50'}`}>
                        {isInc ? '+' : isTfr ? '' : '−'}
                        {fmt(r.a).replace('−', '')}
                      </span>
                      <button
                        onClick={() => cycleStatus(r.id)}
                        className={`chip ${r.s}`}
                        title="Click to cycle status"
                      >
                        {localizedChip}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Custom Specific Amount to Sandbox Ledger */}
            <form onSubmit={handleAddCustomLedgerRow} className="pt-3 border-t border-[var(--line)] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#173F2B] dark:text-slate-200">
                <span>{t('feat1.add_custom', '➕ Add Specific Amount to Ledger:')}</span>
                <span className="text-[11px] font-mono text-[var(--muted)]">{t('feat1.instant_live', 'Instant live test')}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder={t('feat1.desc_placeholder', 'Description (e.g. Freelance, Dinner)')}
                  value={newLedgerDesc}
                  onChange={(e) => setNewLedgerDesc(e.target.value)}
                  className="col-span-12 sm:col-span-5 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#16251E] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <div className="col-span-7 sm:col-span-4 relative">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-[var(--muted)]">₹</span>
                  <input
                    type="number"
                    placeholder="5000"
                    min="1"
                    required
                    value={newLedgerAmount}
                    onChange={(e) => setNewLedgerAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-[#16251E] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <select
                  value={newLedgerType}
                  onChange={(e) => setNewLedgerType(e.target.value as 'income' | 'expense')}
                  className="col-span-5 sm:col-span-3 px-2 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#16251E] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none"
                >
                  <option value="expense">{t('feat1.expense_opt', 'Expense (−)')}</option>
                  <option value="income">{t('feat1.income_opt', 'Income (+)')}</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('feat1.add_btn', '+ Add Amount & Calculate Net Cash Flow')}</span>
              </button>
            </form>

            <div className="pt-4 border-t-2 border-[var(--ink)] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#173F2B] dark:text-slate-50 block">
                  {t('feat1.net_cash_flow', 'Net Liquid Cash Flow')}
                </span>
                <span className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                  {t('feat1.completed_only', 'Calculated exclusively on completed transactions')}
                </span>
              </div>
              <span className="font-mono text-xl sm:text-2xl font-black text-[var(--accent)]">
                {fmtSigned(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature 2: Budgets That Monitor Themselves */}
      <section id="budgets" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-7 shadow-xs order-2 md:order-1 hover:border-[var(--line)] transition-colors">
            {/* Card Header with Live Status Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#173F2B] dark:text-slate-50">
                  {t('feat2.live_alloc', 'Live Category Allocations')}
                </h3>
                <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                  {t('feat2.burn_rate', 'Continuous burn-rate monitoring on verified transactions')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  {t('feat2.guardian', 'Autonomous Guardian')}
                </span>
              </div>
            </div>

            {/* Category Monitoring Bars */}
            <div className="space-y-5">
              {/* Category 1: Groceries & Essentials */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--ink)] flex items-center gap-2">
                    {t('feat2.groceries', 'Groceries & Essentials')}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono uppercase font-semibold">
                      {t('feat2.on_track', 'On Track')}
                    </span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--muted)]">
                    {fmt(527000)} of {fmt(650000)}
                  </span>
                </div>
                <div className="track">
                  <i style={{ width: '81.1%', backgroundColor: 'var(--accent)' }} />
                </div>
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] font-medium">
                  <span>81.1% {t('feat2.consumed', 'consumed')}</span>
                  <span>{t('feat2.remaining', 'Remaining:')} {fmt(123000)}</span>
                </div>
              </div>

              {/* Category 2: Commute & Fuel (Surplus Donor) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--ink)] flex items-center gap-2">
                    {t('feat2.commute', 'Commute & Fuel')}
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-mono uppercase font-semibold">
                      {t('feat2.surplus_cushion', 'Surplus Cushion')}
                    </span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-[var(--muted)]">
                    {fmt(138000)} of {fmt(simCommuteCap)}
                  </span>
                </div>
                <div className="track">
                  <i
                    style={{
                      width: `${Math.min(100, (138000 / simCommuteCap) * 100)}%`,
                      backgroundColor: '#0284C7',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] font-medium">
                  <span>{((138000 / simCommuteCap) * 100).toFixed(1)}% {t('feat2.consumed', 'consumed')}</span>
                  <span className="text-sky-700 font-semibold">{t('feat2.available_surplus', 'Available Surplus:')} {fmt(simCommuteCap - 138000)}</span>
                </div>
              </div>

              {/* Category 3: Dining & Outings (Interactive Hero) */}
              <div className="space-y-2 p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[var(--ink)] flex items-center gap-2">
                    {t('feat2.dining', 'Dining & Outings')}
                    {simRebalanceDone ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono uppercase font-bold">
                        {t('feat2.rebalanced', '✓ Rebalanced')}
                      </span>
                    ) : diningOver ? (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bad-soft)] text-[var(--bad)] text-[11px] font-mono uppercase font-bold animate-pulse">
                        {t('feat2.over_limit', 'Over Limit')}
                      </span>
                    ) : diningPct >= 85 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono uppercase font-bold">
                        {t('feat2.velocity_warning', 'Velocity Warning')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono uppercase font-semibold">
                        {t('feat2.safe_pace', 'Safe Pace')}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--ink)]">
                    {fmt(simDiningSpend)} of {fmt(simDiningCap)}
                  </span>
                </div>
                <div className="track">
                  <i
                    style={{
                      width: `${diningPct}%`,
                      backgroundColor: diningOver
                        ? 'var(--bad)'
                        : diningPct >= 85
                        ? '#D97706'
                        : 'var(--accent)',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-[var(--muted)] font-medium">
                  <span className={diningOver ? 'text-[var(--bad)] font-bold' : ''}>
                    {diningOver
                      ? `${t('feat2.deficit', 'Deficit:')} ${fmt(diningDeficit)}`
                      : `${diningPct.toFixed(1)}% ${t('feat2.consumed', 'consumed')}`}
                  </span>
                  <span>
                    {diningOver
                      ? t('feat2.rebalance_needed', 'Rebalance needed')
                      : `${t('feat2.safe_remaining', 'Safe remaining:')} ${fmt(simDiningCap - simDiningSpend)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="pt-5 border-t border-[var(--line)] space-y-4">
              <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#173F2B] dark:text-emerald-300 flex items-center gap-1.5">
                  <span>💡 {language === 'hi' ? 'यह 2-चरणीय इंटरैक्टिव डेमो आज़माएं:' : 'Try This Quick 2-Step Interactive Demo:'}</span>
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong className="text-[#173F2B] dark:text-emerald-200">
                    {language === 'hi' ? '1. नीचे "+ ₹1,500 डिनर बिल" पर क्लिक करें' : '1. Click "+ ₹1,500 Bistro Dinner" below'}
                  </strong>{' '}
                  {language === 'hi' ? 'और देखें कि कैसे डाइनिंग का बजट सीमा पार करता है।' : 'to simulate a weekend restaurant overspend.'}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong className="text-[#173F2B] dark:text-emerald-200">
                    {language === 'hi' ? '2. डाइनिंग लाल होने पर हरा "⚡ 1-क्लिक ऑटो-रीबैलेंस" बटन दबाएं' : '2. Watch Dining turn RED, then click "⚡ 1-Click Auto-Rebalance"'}
                  </strong>{' '}
                  {language === 'hi' ? 'और देखें कि फिनरॉक आवागमन (Commute) के बचे पैसों से आपके बजट की रक्षा कैसे करता है!' : 'to see FINROQ rescue your budget using unused money from Commute!'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-[var(--ink)]">
                    {language === 'hi' ? 'लाइव लेन-देन का अनुकरण करें' : 'Simulate Live Transactions'}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {language === 'hi' ? 'कार्ड खर्च सिमुलेट करें और देखें कि सुरक्षा प्रहरी घाटे को कैसे पकड़ता है:' : 'Simulate card spending to watch the guardian catch and rebalance deficits:'}
                  </p>
                </div>
                <button
                  onClick={handleSimReset}
                  className="self-start sm:self-auto text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--ink)] underline underline-offset-2 cursor-pointer"
                >
                  {language === 'hi' ? '↺ डेमो रीसेट करें' : '↺ Reset demo'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSimAddSpend(60000)}
                  disabled={diningOver || simRebalanceDone}
                  className="btn-pill sm bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--soft)] text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {language === 'hi' ? '+ ₹600 कैफे बिल (चेतावनी)' : '+ ₹600 Cafe Bill (Warning)'}
                </button>
                <button
                  onClick={() => handleSimAddSpend(150000)}
                  disabled={diningOver || simRebalanceDone}
                  className="btn-pill sm bg-[#173F2B] text-white border border-[#173F2B] hover:bg-[#102F21] text-xs font-bold disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {language === 'hi' ? '+ ₹1,500 डिनर (सीमा पार)' : '+ ₹1,500 Bistro Dinner (Over Cap)'}
                </button>
                {(diningOver || diningPct >= 85) && !simRebalanceDone && (
                  <button
                    onClick={handleSimRebalance}
                    className="btn-pill sm bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm flex items-center gap-1.5 animate-bounce cursor-pointer"
                  >
                    <span>{language === 'hi' ? '⚡ 1-क्लिक ऑटो-रीबैलेंस' : '⚡ 1-Click Auto-Rebalance'}</span>
                    <span className="opacity-90 font-mono text-[11px]">{language === 'hi' ? '(+₹500 आवागमन से)' : '(+₹500 from Commute)'}</span>
                  </button>
                )}
              </div>

              {/* Dynamic Intelligence Explanation Card */}
              <div
                className={`p-3.5 rounded-2xl border text-xs font-mono leading-relaxed transition-all ${
                  simRebalanceDone
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : diningOver
                    ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                    : diningPct >= 85
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]'
                }`}
              >
                {simRebalanceDone ? (
                  <div>
                    <span className="font-bold block mb-1">
                      {language === 'hi' ? '✓ स्वचालित पुनर्संतुलन लागू हुआ:' : '✓ Automated Rebalance Applied:'}
                    </span>
                    {language === 'hi'
                      ? 'फिनरॉक ने आपके आवागमन बजट से ₹500 अतिरिक्त राशि सुरक्षित रूप से डाइनिंग में स्थानांतरित कर दी। आपका डाइनिंग बजट अब ₹5,500 है, घाटा समाप्त हो गया और आपकी मासिक बचत पूर्णतः सुरक्षित है।'
                      : 'FINROQ safely shifted ₹500 surplus from your Commute cushion into Dining. Your Dining cap is now ₹5,500, deficit is neutralized, and your net monthly savings of ₹1,07,200 remains 100% untouched.'}
                  </div>
                ) : diningOver ? (
                  <div>
                    <span className="font-bold block mb-1">
                      {language === 'hi' ? '🚨 स्वायत्त घाटा अवरोधन:' : '🚨 Autonomous Deficit Intercept:'}
                    </span>
                    {language === 'hi'
                      ? `डाइनिंग में निर्धारित लक्ष्य से ${fmt(diningDeficit)} अधिक खर्च हुआ है! फिनरॉक ने 'आवागमन' में ${fmt(simCommuteCap - 138000)} का अतिरिक्त कुशन खोजा है। इसे स्वतः संतुलित करने के लिए ऊपर "1-क्लिक ऑटो-रीबैलेंस" दबाएं।`
                      : `Dining is ${fmt(diningDeficit)} over target with 17 days left in October! FINROQ spotted a ${fmt(simCommuteCap - 138000)} spare cushion in 'Commute & Fuel'. Click "1-Click Auto-Rebalance" above to neutralize it automatically.`}
                  </div>
                ) : diningPct >= 85 ? (
                  <div>
                    <span className="font-bold block mb-1">
                      {language === 'hi' ? '⚠️ खर्च गति चेतावनी:' : '⚠️ Burn-Rate Velocity Warning:'}
                    </span>
                    {language === 'hi'
                      ? `आपने अपने डाइनिंग बजट का ${diningPct.toFixed(1)}% खर्च कर लिया है। फिनरॉक महीने के अंत तक बजट में रहने के लिए दैनिक खर्च को ${fmt(Math.round((simDiningCap - simDiningSpend) / 17))}/दिन तक सीमित रखने की सलाह देता है।`
                      : `You have consumed ${diningPct.toFixed(1)}% of your dining allocation with 17 days remaining. FINROQ recommends capping discretionary dining to ${fmt(Math.round((simDiningCap - simDiningSpend) / 17))}/day to finish October in the green.`}
                  </div>
                ) : (
                  <div>
                    <span className="font-bold block mb-1">
                      {language === 'hi' ? '🛡️ स्वायत्त मॉनिटर: सक्रिय' : '🛡️ Autonomous Monitor: Active'}
                    </span>
                    {language === 'hi'
                      ? 'लेन-देन बिना किसी मैन्युअल प्रविष्टि के स्वचालित रूप से श्रेणियों में दर्ज होते हैं। जब खर्च सामान्य गति से अधिक होता है, तो फिनरॉक वास्तविक समय में चेतावनी और पुनर्संतुलन विकल्प देता है।'
                      : 'Transactions flow into category buckets with zero manual entry. When burn rates exceed calendar days or breach limits, FINROQ triggers predictive alerts and reallocation options in real time.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column Copy */}
          <div className="md:col-span-5 space-y-6 order-1 md:order-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              {t('feat2.badge', 'Feature Two')}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('feat2.title', 'Budgets that monitor themselves.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('feat2.desc', 'No manual receipt spreadsheets or end-of-month regret. FINROQ watches your spending velocity in real-time, warning you before limits are broken and rebalancing surpluses automatically.')}
            </p>
            <ul className="space-y-4 pt-4 border-t border-[var(--line)] text-sm font-medium">
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[95px]">
                  {t('feat2.realtime_sync', 'Real-Time Sync')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat2.realtime_sync_desc', 'Every card swipe, UPI transfer, and bank debit categorizes instantly. Zero manual logging.')}
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[95px]">
                  {t('feat2.burn_alerts', 'Burn Alerts')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat2.burn_alerts_desc', 'Proactive velocity warnings flag categories running hot weeks before the month ends.')}
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--accent)] min-w-[95px]">
                  {t('feat2.auto_rebalance', 'Auto-Rebalance')}
                </span>
                <span className="text-[#2E4035] dark:text-slate-300">
                  {t('feat2.auto_rebalance_desc', 'When you spend more on dining, FINROQ absorbs it from under-budget surplus without denting your savings.')}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5.5 Dedicated Interactive Amount Analyzer & Sandbox Section (Landing Page Only) */}
      <section id="amount-sandbox" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/30 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)]">
              {t('lab.badge', 'Interactive Amount Lab')}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('lab.title', 'Enter any specific amount to see its instant financial impact.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 text-lg leading-relaxed font-medium">
              {t('lab.desc', 'Test pre-spend purchase safety, calculate your 50/30/20 wealth allocation, or feed this amount directly into the live sandbox ledger with zero signup required.')}
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left Control Panel: Enter Amount & Choose Lens */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-slate-200 block">
                  {t('lab.enter_amount', 'Enter Specific Amount (₹):')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xl font-bold text-[var(--muted)]">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FCFDFC] dark:bg-[#16251E] text-2xl sm:text-3xl font-mono font-extrabold text-[#173F2B] dark:text-slate-50 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Quick Preset Amount Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[var(--muted)] font-bold">
                  {t('lab.quick_presets', 'Quick Presets:')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1500, 5000, 15000, 45000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTestAmount(amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        testAmount === amt
                          ? 'bg-[#173F2B] text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                          : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-200 border border-[#CBD5CB] dark:border-[#2A3D33] hover:bg-[#EAF3E7]'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens Mode Tabs */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                <span className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block">
                  {t('lab.select_lens', 'Select Analysis Lens:')}
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTestLens('prespend')}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                      testLens === 'prespend'
                        ? 'bg-[#173F2B] text-white shadow-xs'
                        : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'
                    }`}
                  >
                    {t('lab.lens_prespend', 'Pre-Spend')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestLens('allocation')}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                      testLens === 'allocation'
                        ? 'bg-[#173F2B] text-white shadow-xs'
                        : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'
                    }`}
                  >
                    {t('lab.lens_503020', '50/30/20')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestLens('milestones')}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                      testLens === 'milestones'
                        ? 'bg-[#173F2B] text-white shadow-xs'
                        : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'
                    }`}
                  >
                    {t('lab.lens_milestones', 'Milestones')}
                  </button>
                </div>
              </div>

              {/* Feed directly into Live Sandbox Ledger button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const paisa = Math.round(testAmount * 100);
                    setLedgerRows((prev) => [
                      {
                        id: Date.now(),
                        d: `${t('lab.lens_prespend', 'Test Spend')} (₹${testAmount.toLocaleString('en-IN')})`,
                        s: 'Completed',
                        t: 'expense',
                        a: paisa,
                      },
                      ...prev,
                    ]);
                    document.getElementById('ledger')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 hover:bg-[#DCE7D9] dark:hover:bg-[#253D30] border border-[#CBD5CB] dark:border-[#2A3D33] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{t('lab.add_to_ledger', '➕ Add This Amount to Live Ledger')}</span>
                </button>
              </div>
            </div>

            {/* Right Display Panel: Live Calculation & Verdict */}
            <div className="md:col-span-7 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              {testLens === 'prespend' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <div>
                      <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                        {t('lab.prespend_title', 'Pre-Spend Purchase Safety Verdict')}
                      </h4>
                      <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                        {t('lab.prespend_sub', 'Calculated against reference ₹35,000 monthly discretionary buffer')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                        testAmount <= 5000
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : testAmount <= 18000
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {testAmount <= 5000
                        ? t('lab.safe_approved', '✓ Safe & Approved')
                        : testAmount <= 18000
                        ? t('lab.vel_warning', '⚠️ Velocity Warning')
                        : t('lab.high_drain', '🚨 High Discretionary Drain')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33]">
                      <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                        {t('lab.buffer_ratio', 'Buffer Ratio')}
                      </span>
                      <span className="font-mono text-xl font-extrabold text-[#173F2B] dark:text-slate-50 block mt-1">
                        {((testAmount / 35000) * 100).toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-medium">
                        {t('lab.buffer_sub', 'of discretionary pool')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33]">
                      <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                        {t('lab.work_equiv', 'Work Equivalent')}
                      </span>
                      <span className="font-mono text-xl font-extrabold text-[#173F2B] dark:text-slate-50 block mt-1">
                        {(testAmount / 350).toFixed(0)} {t('lab.work_hours', 'hrs')}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-medium">
                        {t('lab.earning_rate', 'at ₹350/hr earning')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] col-span-2 sm:col-span-1">
                      <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                        {t('lab.daily_drag', 'Daily Drag')}
                      </span>
                      <span className="font-mono text-xl font-extrabold text-[var(--bad)] block mt-1">
                        −₹{(testAmount / 30).toFixed(0)}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-medium">
                        {t('lab.daily_drag_sub', 'per day over 30 days')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFDFC] dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-[#173F2B] dark:text-slate-100 flex items-center gap-1.5">
                      <span>💡 {t('lab.rec_title', 'FINROQ Autonomous Recommendation:')}</span>
                    </p>
                    <p className="text-[#2E4035] dark:text-slate-300 font-medium">
                      {testAmount <= 5000
                        ? t('lab.rec_safe', `Spending ₹${testAmount.toLocaleString('en-IN')} is well within safe velocity. It represents a negligible 1-day cash flow impact.`)
                        : testAmount <= 18000
                        ? t('lab.rec_warning', `This purchase consumes a notable chunk of discretionary buffer. Recommend trimming dining or transport by ₹${(testAmount / 30).toFixed(0)}/day.`)
                        : t('lab.rec_danger', `Alert: ₹${testAmount.toLocaleString('en-IN')} triggers major runway velocity drag. Recommend deferring purchase or splitting into scheduled allocations.`)}
                    </p>
                  </div>
                </div>
              )}

              {testLens === 'allocation' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <div>
                      <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                        {t('lab.blueprint_title', '50/30/20 Smart Allocation Blueprint')}
                      </h4>
                      <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                        {t('lab.blueprint_sub', 'Calculated assuming monthly take-home')}: ₹{testAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {t('lab.balanced_engine', 'Balanced Engine')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        50% {t('lab.essentials', 'Essentials')}
                      </span>
                      <p className="font-mono text-xl font-black text-[#173F2B] dark:text-slate-50">
                        ₹{(testAmount * 0.5).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.essentials_desc', 'Groceries, rent, utilities')}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        30% {t('lab.lifestyle', 'Lifestyle')}
                      </span>
                      <p className="font-mono text-xl font-black text-amber-700 dark:text-amber-400">
                        ₹{(testAmount * 0.3).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.lifestyle_desc', 'Dining, outings, shopping')}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        20% {t('lab.compounding', 'Compounding')}
                      </span>
                      <p className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                        ₹{(testAmount * 0.2).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.compounding_desc', 'Emergency & wealth assets')}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFDFC] dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-[#173F2B] dark:text-slate-100 flex items-center gap-1.5">
                      <span>📈 {t('lab.projected_title', '12-Month Projected Wealth:')}</span>
                    </p>
                    <p className="text-[#2E4035] dark:text-slate-300 font-medium">
                      {t('lab.projected_desc', `Disciplined adherence yields ₹${(testAmount * 0.2 * 12).toLocaleString('en-IN')} in pure asset reserves over 12 months, with a safe spending velocity of ₹${((testAmount * 0.3) / 30).toFixed(0)}/day.`)}
                    </p>
                  </div>
                </div>
              )}

              {testLens === 'milestones' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <div>
                      <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                        {t('lab.milestones_title', 'Savings Velocity to Key Milestones')}
                      </h4>
                      <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                        {t('lab.milestones_sub', 'Assuming dedicated monthly contribution')}: ₹{testAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {t('lab.milestone_engine', 'Milestone Engine')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        ₹1,00,000 (1 {t('lab.lakh', 'Lakh')})
                      </span>
                      <p className="font-mono text-xl font-black text-[#173F2B] dark:text-slate-50">
                        {Math.ceil(100000 / (testAmount || 1))} {t('lab.months', 'Months')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.m1_desc', 'Starter emergency buffer')}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        ₹5,00,000 (5 {t('lab.lakh', 'Lakh')})
                      </span>
                      <p className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {Math.ceil(500000 / (testAmount || 1))} {t('lab.months', 'Months')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.m2_desc', 'Full resilience cushion')}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] space-y-1">
                      <span className="text-xs font-mono font-bold text-[#173F2B] dark:text-slate-300 uppercase">
                        ₹25,00,000 (25 {t('lab.lakh', 'Lakh')})
                      </span>
                      <p className="font-mono text-xl font-black text-emerald-800 dark:text-emerald-300">
                        {(2500000 / (testAmount || 1) / 12).toFixed(1)} {t('lab.years', 'Years')}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {t('lab.m3_desc', 'Major wealth foundation')}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFDFC] dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-[#173F2B] dark:text-slate-100 flex items-center gap-1.5">
                      <span>🎯 {t('lab.insight_title', 'Milestone Insight:')}</span>
                    </p>
                    <p className="text-[#2E4035] dark:text-slate-300 font-medium">
                      {t('lab.insight_desc', `Committing ₹${testAmount.toLocaleString('en-IN')}/month compounds rapidly, crossing your first ₹1 Lakh in just ${Math.ceil(100000 / (testAmount || 1))} months.`)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section 3: Interactive Budget Comparison Graph */}
      <section id="comparison" className="py-20 md:py-28 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              {t('feat3.badge', 'Interactive Simulation')}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('feat3.title', 'Dynamic Budget Stress-Testing.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('feat3.desc', 'Compare your intended caps with actual expenditures. Adjust the sliders to examine immediate category health responses in real time.')}
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Interactive Sliders */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-slate-300">
                {t('comp.controls', 'Allocation Controls')}
              </h4>

              <div>
                <label className="text-xs font-bold text-[#173F2B] dark:text-slate-300 block mb-2">
                  {t('comp.cat_review', 'Category Under Review')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Food', 'Shopping', 'Transport', 'Entertainment'] as const).map((cat) => {
                    const label =
                      cat === 'Food'
                        ? t('comp.cat_food', 'Food & Dining')
                        : cat === 'Shopping'
                        ? t('comp.cat_shopping', 'Shopping & Retail')
                        : cat === 'Transport'
                        ? t('comp.cat_transport', 'Transport & Fuel')
                        : t('comp.cat_entertainment', 'Entertainment');
                    return (
                      <button
                        key={cat}
                        onClick={() => setBudgetCat(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          budgetCat === cat
                            ? 'bg-[#173F2B] text-white dark:bg-emerald-600 dark:text-white border-[#173F2B] shadow-xs'
                            : 'bg-[var(--soft)] text-[#2E4035] dark:text-slate-300 border-transparent hover:border-[var(--line)]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cap Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#2E4035] dark:text-slate-300">
                    {t('comp.cap_label', 'Allocated Budget Cap:')}
                  </span>
                  <span className="font-mono text-[#173F2B] dark:text-slate-50">₹{activeCap.toLocaleString('en-IN')}</span>
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
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#2E4035] dark:text-slate-300">
                    {t('comp.spend_label', 'Simulated Actual Spending:')}
                  </span>
                  <span className="font-mono text-[#173F2B] dark:text-slate-50">₹{activeSpend.toLocaleString('en-IN')}</span>
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
                  <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                    {budgetCat === 'Food'
                      ? t('comp.cat_food', 'Food & Dining')
                      : budgetCat === 'Shopping'
                      ? t('comp.cat_shopping', 'Shopping & Retail')
                      : budgetCat === 'Transport'
                      ? t('comp.cat_transport', 'Transport & Fuel')
                      : t('comp.cat_entertainment', 'Entertainment')}{' '}
                    {t('comp.diag_title', 'Health Diagnostic')}
                  </h4>
                  <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                    {t('comp.diag_sub', 'Planned cap versus active expenditures')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                    isBudgetOver
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {isBudgetOver
                    ? t('comp.deficit_warning', 'Deficit Warning')
                    : t('comp.within_alloc', 'Within Allocation')}
                </span>
              </div>

              {/* Grouped Comparative Bars */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#2E4035] dark:text-slate-300">
                      {t('comp.alloc_cap', 'Allocated Cap')}
                    </span>
                    <span className="font-mono text-[#173F2B] dark:text-slate-50">₹{activeCap.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-5 rounded-lg overflow-hidden">
                    <div className="bg-[#173F2B] dark:bg-emerald-700 h-full rounded-lg" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#2E4035] dark:text-slate-300">
                      {t('comp.sim_spend', 'Simulated Spend')} ({budgetUtilization}%)
                    </span>
                    <span className={`font-mono ${isBudgetOver ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-emerald-700 dark:text-emerald-400 font-extrabold'}`}>
                      ₹{activeSpend.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-5 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (activeSpend / activeCap) * 100)}%`,
                        backgroundColor: isBudgetOver ? '#B74747' : '#247A50',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Verdict */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  isBudgetOver
                    ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                    : 'bg-[#F4F7F3] border-[#CBD5CB] text-[#173F2B] dark:bg-[#1A2C22] dark:border-[#2A3D33] dark:text-slate-200'
                }`}
              >
                {isBudgetOver ? (
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>{t('comp.deficit_alert', 'Deficit Alert:')}</strong>{' '}
                      {t('comp.deficit_desc', `Spending currently exceeds planned cap by ₹${Math.abs(activeRemaining).toLocaleString('en-IN')}. Defer discretionary purchases or reallocate surplus funds.`)}
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      <strong>{t('comp.healthy_cushion', 'Healthy Cushion:')}</strong>{' '}
                      {t('comp.healthy_desc', `You have ₹${activeRemaining.toLocaleString('en-IN')} remaining (${100 - budgetUtilization}% cushion) for this cycle.`)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 4: Interactive Savings-Goal Timeline Simulator */}
      <section id="simulator" className="py-20 md:py-28 border-b border-[var(--line)] bg-[var(--soft)]/20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] px-2.5 py-1 rounded-md bg-[var(--soft)] border border-[var(--line)]">
              {t('feat4.badge', 'Timeline Accelerator')}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('feat4.title', 'Simulate How Spending Shifts Accelerate Wealth.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('feat4.desc', 'Model your timeline to critical savings milestones. Adjust monthly contributions and watch how trimming discretionary leaks brings goals forward.')}
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Simulator Controls */}
            <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-5 shadow-xs hover:border-[var(--line)] transition-colors">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-slate-300">
                {t('sim.badge', 'Milestone Parameters')}
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#2E4035] dark:text-slate-300">
                    {t('sim.target_label', 'Milestone Target:')}
                  </span>
                  <span className="font-mono text-[#173F2B] dark:text-slate-50">₹{goalTarget.toLocaleString('en-IN')}</span>
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
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#2E4035] dark:text-slate-300">
                    {t('sim.saved_label', 'Principal Saved to Date:')}
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">₹{goalCurrent.toLocaleString('en-IN')}</span>
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
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#2E4035] dark:text-slate-300">
                    {t('sim.allocation_label', 'Standard Monthly Allocation:')}
                  </span>
                  <span className="font-mono text-[#173F2B] dark:text-slate-50">₹{baseContribution.toLocaleString('en-IN')}</span>
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
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {t('sim.trims_label', '+ Discretionary Trims Redirected:')}
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">₹{spendCutRedirect.toLocaleString('en-IN')}</span>
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
                <span className="text-[11px] text-[#2E4035] dark:text-slate-400 block font-medium">
                  {t('sim.trims_desc', 'Simulate cutting creeping recurring subscriptions and directing the surplus into your goal.')}
                </span>
              </div>
            </div>

            {/* Live Results Timeline Card */}
            <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs hover:border-[var(--line)] transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div>
                  <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                    {t('sim.title', 'Deterministic Horizon Forecast')}
                  </h4>
                  <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                    {t('sim.formula', 'Mathematical formula: ceil((Target − Saved) / Monthly Total)')}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {goalProgressPct}% {t('sim.funded', 'Funded')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#2E4035] dark:text-slate-300 font-bold">
                  <span>{t('sim.current', 'Current:')} ₹{goalCurrent.toLocaleString('en-IN')}</span>
                  <span>{t('sim.gap', 'Funding Gap:')} ₹{goalRemaining.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-[var(--soft)] h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-[#173F2B] dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${goalProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Timeline Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--line)]">
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70">
                  <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                    {t('sim.total_monthly', 'Total Monthly')}
                  </span>
                  <span className="font-mono text-lg font-extrabold text-[#173F2B] dark:text-slate-50 block mt-1">
                    ₹{totalMonthlySavings.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70">
                  <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                    {t('sim.time_target', 'Time to Target')}
                  </span>
                  <span className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">
                    {acceleratedMonthsNeeded} {t('sim.months', 'Months')}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--soft)]/70 col-span-2 sm:col-span-1">
                  <span className="text-xs text-[#2E4035] dark:text-slate-300 font-bold block">
                    {t('sim.time_saved', 'Time Saved')}
                  </span>
                  <span className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">
                    +{monthsSaved} {t('sim.months', 'Months')}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] text-xs text-[#173F2B] dark:text-slate-200 leading-relaxed font-medium">
                💡 <strong>{t('sim.insight_label', 'Optimization Insight:')}</strong>{' '}
                {t('sim.insight_desc', `Redirecting an additional ₹${spendCutRedirect.toLocaleString('en-IN')}/mo into this milestone achieves your target in ${acceleratedMonthsNeeded} months instead of ${baseMonthsNeeded} months, reclaiming ${monthsSaved} full months of waiting.`)}
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
              {t('faq.badge', 'Frequently Asked Questions')}
            </span>
            <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('faq.title', 'Everything you need to know.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 text-base leading-relaxed font-medium">
              {t('faq.desc', 'Clear answers regarding our double-entry architecture, decimal math precision, privacy, and deterministic intelligence.')}
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
                      ? 'border-[#173F2B] dark:border-emerald-500 shadow-sm'
                      : 'border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B]/40'
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
                        <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-[#2E4035] dark:text-slate-400">
                          {item.badge}
                        </span>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#173F2B] dark:text-slate-50 pr-4">
                          {item.q}
                        </h3>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[#173F2B] text-white dark:bg-emerald-600' : 'bg-[var(--soft)] text-[#2E4035] dark:text-slate-300'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-0 border-t border-[var(--line)] mt-1">
                      <p className="text-sm sm:text-base text-[#2E4035] dark:text-slate-300 leading-relaxed pt-4 font-medium">
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
          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
              {t('sec.decimal_title', 'Arbitrary Decimal Arithmetic')}
            </h4>
            <p className="text-xs text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('sec.decimal_desc', 'Backed by Python Decimal and database NUMERIC types. Eliminates binary floating-point roundoff errors across account balances, allocations, and currency transfers.')}
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
              {t('sec.isolation_title', 'Zero-Trust Isolation')}
            </h4>
            <p className="text-xs text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('sec.isolation_desc', 'Hard server-enforced per-user data tenancy on all SQL operations. Signed stateless JWTs with cryptographic Argon2id password hashing protect your identity.')}
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
              {t('sec.deterministic_title', 'Deterministic Logic')}
            </h4>
            <p className="text-xs text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
              {t('sec.deterministic_desc', 'Transparent timeline and emergency projections with zero invented returns. Every financial calculation is explainable, verifiable, and mathematically auditable.')}
            </p>
          </div>
        </div>
      </section>

      {/* 10. Closer CTA & Minimal Footer */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-end justify-between gap-8">
          <div className="space-y-4 max-w-lg">
            <h2 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {t('cta.title', 'Open your ledger.')}
            </h2>
            <p className="text-[#2E4035] dark:text-slate-300 text-lg font-medium">
              {t('cta.desc', 'Start recording transactions, set intelligent category budgets, and understand your financial trajectory with uncompromising certainty.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="btn-pill bg-[#173F2B] text-white hover:bg-[#102F21] shadow-sm font-bold"
            >
              {t('nav.getstarted', 'Get started')}
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="btn-pill ghost hover:border-[var(--ink)] font-bold text-[#173F2B] dark:text-slate-100"
            >
              {t('nav.signin', 'Sign in')}
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] py-8 text-xs text-[var(--muted)] font-mono">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span className="font-medium">
            {t('footer.brand', 'Finroq · Intelligent Financial Accounting Engine')}
          </span>
          <span>
            {t('footer.disclaimer', 'Sample figures shown throughout marketing preview')}
          </span>
        </div>
      </footer>
    </div>
  );
}
