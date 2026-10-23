'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { FinancialSummary, RecurringTransaction } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
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
  LogOut,
  Wallet,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
} from 'lucide-react';

interface ModuleItem {
  id: string;
  name: string;
  i18nKey: string;
  desc: string;
  i18nDescKey: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Track & Control' | 'Wealth & Planning' | 'Decisions Before Spending' | 'Obligations & Health';
  href: string;
}

const ALL_TOOLS: ModuleItem[] = [
  // Category 0: Track & Control
  {
    id: 'expense-tracking',
    name: 'Expense Tracking',
    i18nKey: 'mod.expense_tracking',
    desc: 'Record and categorize transactions, monitor statuses, and review completed cash flow.',
    i18nDescKey: 'mod.expense_tracking.desc',
    icon: CreditCard,
    category: 'Track & Control',
    href: '/app/expense-tracking',
  },
  {
    id: 'budgeting',
    name: 'Budgeting',
    i18nKey: 'mod.daily_budgeting',
    desc: 'Set category spending caps, compare plans with actual expenses, and monitor cushions.',
    i18nDescKey: 'mod.daily_budgeting.desc',
    icon: PieChart,
    category: 'Track & Control',
    href: '/app/budgeting',
  },

  // Category 1: Wealth & Planning
  {
    id: 'investments',
    name: 'Youth Investments & IPOs',
    i18nKey: 'mod.investments',
    desc: 'Curated mutual funds, live IPO listing gain predictions, and compounding proof for youth.',
    i18nDescKey: 'mod.investments.desc',
    icon: TrendingUp,
    category: 'Wealth & Planning',
    href: '/app/investments',
  },
  {
    id: 'multiverse',
    name: 'Quantum Multiverse',
    i18nKey: 'mod.multiverse',
    desc: 'Simulate parallel life timelines, 30-year wealth trajectories, and lifestyle fork trade-offs.',
    i18nDescKey: 'mod.multiverse.desc',
    icon: Compass,
    category: 'Wealth & Planning',
    href: '/app/multiverse',
  },
  {
    id: 'net-worth',
    name: 'Net Worth',
    i18nKey: 'mod.net_worth',
    desc: 'Track assets minus liabilities across checking, savings, and credit cards.',
    i18nDescKey: 'mod.net_worth.desc',
    icon: TrendingUp,
    category: 'Wealth & Planning',
    href: '/app/net-worth',
  },
  {
    id: 'goal-timeline',
    name: 'Goal Simulator',
    i18nKey: 'mod.goal_timeline',
    desc: 'Model savings targets, project milestone completion dates, and track progress.',
    i18nDescKey: 'mod.goal_timeline.desc',
    icon: Target,
    category: 'Wealth & Planning',
    href: '/app/goal-timeline',
  },
  {
    id: 'emergency-cushion',
    name: 'Emergency Cushion',
    i18nKey: 'mod.emergency_cushion',
    desc: 'Estimate required baseline survival reserves using essential monthly burn rates.',
    i18nDescKey: 'mod.emergency_cushion.desc',
    icon: Umbrella,
    category: 'Wealth & Planning',
    href: '/app/emergency-cushion',
  },

  // Category 2: Decisions Before Spending
  {
    id: 'pre-spend-check',
    name: 'Pre-Spend Check',
    i18nKey: 'mod.pre_spend_check',
    desc: 'Estimate the effect of a planned purchase on remaining monthly category budget.',
    i18nDescKey: 'mod.pre_spend_check.desc',
    icon: ShoppingBag,
    category: 'Decisions Before Spending',
    href: '/app/pre-spend-check',
  },
  {
    id: 'spend-leak-detector',
    name: 'Spend Leak Detector',
    i18nKey: 'mod.spend_leak_detector',
    desc: 'Identify recurring subscriptions, auto-debits, and potential spend leaks.',
    i18nDescKey: 'mod.spend_leak_detector.desc',
    icon: Zap,
    category: 'Decisions Before Spending',
    href: '/app/spend-leak-detector',
  },
  {
    id: 'splitter',
    name: 'Splitter',
    i18nKey: 'mod.splitter',
    desc: 'Divide shared expenses, calculate exact shares, and track reimbursements.',
    i18nDescKey: 'mod.splitter.desc',
    icon: Users,
    category: 'Decisions Before Spending',
    href: '/app/splitter',
  },
  {
    id: 'money-guides',
    name: 'Money Guides',
    i18nKey: 'mod.money_guides',
    desc: 'Explore practical financial frameworks, emergency ratios, and allocation blueprints.',
    i18nDescKey: 'mod.money_guides.desc',
    icon: BookOpen,
    category: 'Decisions Before Spending',
    href: '/app/money-guides',
  },

  // Category 3: Obligations & Health
  {
    id: 'debt-watchdog',
    name: 'Debt Watchdog',
    i18nKey: 'mod.debt_watchdog',
    desc: 'Monitor debt obligations, upcoming loan EMIs, due dates, and payment history.',
    i18nDescKey: 'mod.debt_watchdog.desc',
    icon: ShieldAlert,
    category: 'Obligations & Health',
    href: '/app/debt-watchdog',
  },
  {
    id: 'credit-health',
    name: 'Credit Health',
    i18nKey: 'mod.credit_health',
    desc: 'Review credit utilization metrics, billing schedules, and card liability health.',
    i18nDescKey: 'mod.credit_health.desc',
    icon: ShieldCheck,
    category: 'Obligations & Health',
    href: '/app/credit-health',
  },
  {
    id: 'financial-health',
    name: 'Financial Health',
    i18nKey: 'mod.financial_health',
    desc: 'Multi-factor holistic view across liquidity, debt ratio, and budget discipline.',
    i18nDescKey: 'mod.financial_health.desc',
    icon: Activity,
    category: 'Obligations & Health',
    href: '/app/financial-health',
  },
  {
    id: 'crash-test',
    name: 'Crash-Test Simulator',
    i18nKey: 'mod.crash_test',
    desc: 'Autonomous stress-testing engine modeling compound shocks and recovery plans.',
    i18nDescKey: 'mod.crash_test.desc',
    icon: ShieldAlert,
    category: 'Obligations & Health',
    href: '/app/crash-test',
  },
];

const EXAMPLE_AI_PROMPTS = [
  'Can I afford a ₹15,000 purchase?',
  'How much have I spent this month?',
  'What upcoming bills should I prepare for?',
  'How am I doing against my budget?',
  'How is my savings goal progressing?',
];

export default function AuthenticatedHomeHub() {
  const router = useRouter();
  const { user, logout, login, isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { navigateWithCurtain } = useCurtain();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Copilot quick question input state
  const [quickQuestion, setQuickQuestion] = useState('');

  // Financial summary state
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recurringCount, setRecurringCount] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const isSigningOutRef = useRef(false);

  useEffect(() => {
    if (
      isSigningOutRef.current ||
      (typeof window !== 'undefined' && sessionStorage.getItem('finroq_logged_out') === 'true')
    ) {
      router.replace('/');
      return;
    }
    if (!isLoading && !isAuthenticated) {
      login('demo@finroq.com', 'password123').catch(() => {});
    }
  }, [isLoading, isAuthenticated, login, router]);

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

  const handleSignOut = () => {
    isSigningOutRef.current = true;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('finroq_logged_out', 'true');
    }
    logout();
    navigateWithCurtain('/', 'finroq', 'back');
  };

  // Fetch verified financial summary and active commitments
  const fetchOverviewData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      setDataError(null);
      const [sumRes, recRes] = await Promise.all([
        apiClient.getSummary(),
        apiClient.listRecurring().catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      const activeRecurring = Array.isArray(recRes.data)
        ? recRes.data.filter((r: any) => r.status === 'active')
        : [];
      setRecurringCount(activeRecurring.length);
    } catch (err) {
      setDataError(extractErrorMessage(err, 'Unable to load summary metrics.'));
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverviewData();
    }
  }, [isAuthenticated, fetchOverviewData]);

  const handleLaunchPrompt = (promptText: string) => {
    const query = encodeURIComponent(promptText.trim());
    navigateWithCurtain(`/app/ai-assistant?q=${query}`, 'ai-copilot', 'fwd');
  };

  const handleQuickQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    handleLaunchPrompt(quickQuestion);
  };

  const displayName = user?.full_name || 'Finroq Member';

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-xs font-mono font-medium tracking-wider uppercase text-[var(--muted)]">
            finroq
          </span>
        </div>
      </div>
    );
  }

  const isDemo = apiClient.isDemoSession();
  const netWorthVal = summary?.net_worth ? parseFloat(summary.net_worth) : 0;
  const incomeVal = summary?.total_income ? parseFloat(summary.total_income) : 0;
  const expenseVal = summary?.total_expenses ? parseFloat(summary.total_expenses) : 0;
  const netCashFlowVal = summary?.net_cash_flow ? parseFloat(summary.net_cash_flow) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white flex flex-col justify-between">
      {/* Top Application Bar */}
      <header className="relative w-full z-30 bg-[var(--bg)] border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/home"
              className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-[var(--ink)]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              finroq
            </Link>
            <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--muted)] border border-[var(--line)] font-bold">
              {t('common.workspace', 'Financial Hub')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#173F2B] dark:text-slate-200 hidden md:inline-block">
              {displayName}
            </span>
            <LanguageSelector variant="compact" align="right" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSignOut}
              className="btn-pill sm ghost text-xs flex items-center gap-1.5 font-bold text-[#173F2B] dark:text-slate-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('common.sign_out', 'Sign out')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-5 py-8 md:py-12 space-y-10 flex-1">
        {/* Welcome & Data Context Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--accent)]">
                {t('common.financial_workspace', 'Financial Workspace')}
              </span>
              <span className="text-xs text-[var(--muted)]">•</span>
              <span className="text-xs font-mono text-[var(--muted)] font-medium">
                {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {language === 'hi' ? `स्वागत है, ${displayName}` : `${t('common.welcome_back', 'Welcome back')}, ${displayName}.`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                isDemo
                  ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isDemo ? 'Verified Demo Ledger' : 'Authenticated Ledger Records'}
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 1: PRIMARY EXPERIENCE — AI FINANCIAL COPILOT HERO
        ───────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="ai-copilot-heading"
          className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-[#F7FAF6] to-[#EEF5EC] dark:from-[#13221A] dark:via-[#16251E] dark:to-[#0F1C15] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-md transition-all space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-bold bg-[#EAF3E7] text-[#173F2B] dark:bg-emerald-500/20 dark:text-emerald-300 border border-[#CBD5CB] dark:border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-[#173F2B] dark:text-emerald-300" />
                  Primary Decision Assistant
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  Deterministic Arithmetic
                </span>
                <span className="text-xs text-[var(--muted)] font-mono">Bounded Tool Execution</span>
              </div>
              <h2
                id="ai-copilot-heading"
                className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#173F2B] dark:text-white"
              >
                Ask Finroq AI about your money
              </h2>
              <p className="text-xs sm:text-sm text-[#2E4035] dark:text-slate-300 leading-relaxed font-medium">
                Grounded in your verified ledger records, category budgets, active bills, and deterministic projection tools.
              </p>
            </div>

            <button
              onClick={() => navigateWithCurtain('/app/ai-assistant', 'ai-copilot', 'fwd')}
              className="btn-pill bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold shrink-0 flex items-center gap-2 shadow-xs transition-all self-start md:self-auto"
            >
              Open Full AI Copilot
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Question Input Bar */}
          <form onSubmit={handleQuickQuestionSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-[#173F2B] dark:text-emerald-400 pointer-events-none" />
            <input
              type="text"
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
              placeholder={language === 'hi' ? 'कोई भी वित्तीय प्रश्न पूछें (उदा. क्या मैं ₹15,000 की खरीदारी कर सकता हूँ?)...' : 'Ask any financial question (e.g. Can I afford a ₹15,000 purchase?)...'}
              className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-white dark:bg-[#0D1812] border border-[#CBD5CB] dark:border-[#2A3D33] text-sm text-[#173F2B] dark:text-slate-100 placeholder:text-[#5E7366] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-xs transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-[#173F2B] hover:bg-[#102F21] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Ask AI
            </button>
          </form>

          {/* Verified Question Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#5E7366] dark:text-slate-400 tracking-wider">
              Verified Capabilities to Ask:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_AI_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleLaunchPrompt(prompt)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#173F2B] dark:text-slate-200 bg-white dark:bg-[#1B2D24] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-400 hover:bg-[#EAF3E7] dark:hover:bg-[#20362B] transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#173F2B] dark:text-emerald-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: SUPPORTING EXPERIENCE — FINANCIAL OVERVIEW
        ───────────────────────────────────────────────────────────── */}
        <section aria-labelledby="financial-overview-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--accent)]" />
              <h2
                id="financial-overview-heading"
                className="font-display text-xl font-bold text-[#173F2B] dark:text-slate-50"
              >
                Financial Overview
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[var(--accent)]">
              <Link href="/app/expense-tracking" className="hover:underline flex items-center gap-1">
                Open Ledger
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[var(--muted)]">•</span>
              <Link href="/app/budgeting" className="hover:underline flex items-center gap-1">
                Budgets
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Key Authoritative Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Net Worth */}
            <Link
              href="/app/net-worth"
              className="p-5 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all space-y-2 group block"
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono font-medium">
                <span className="group-hover:text-[#173F2B] dark:group-hover:text-slate-200 transition-colors">Net Worth</span>
                <TrendingUp className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-display text-2xl font-bold tracking-tight text-[#173F2B] dark:text-white">
                {isDataLoading ? '—' : formatCurrency(netWorthVal)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
                <span className="truncate">Assets minus liabilities</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* Card 2: Monthly Cash Flow */}
            <Link
              href="/app/expense-tracking"
              className="p-5 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all space-y-2 group block"
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono font-medium">
                <span className="group-hover:text-[#173F2B] dark:group-hover:text-slate-200 transition-colors">Net Cash Flow (Month)</span>
                {netCashFlowVal >= 0 ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    +Surplus
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold">
                    −Deficit
                  </span>
                )}
              </div>
              <p
                className={`font-display text-2xl font-bold tracking-tight ${
                  netCashFlowVal >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {isDataLoading ? '—' : formatCurrency(netCashFlowVal)}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
                <span className="truncate">Income vs Outflow</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* Card 3: Inception Liquid Accounts */}
            <Link
              href="/app/net-worth"
              className="p-5 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all space-y-2 group block"
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono font-medium">
                <span className="group-hover:text-[#173F2B] dark:group-hover:text-slate-200 transition-colors">Accounts Active</span>
                <CreditCard className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-display text-2xl font-bold tracking-tight text-[#173F2B] dark:text-white">
                {isDataLoading
                  ? '—'
                  : `${summary?.account_balances?.length || 0} Accounts`}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
                <span className="truncate">Checking, Savings & Credit</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            {/* Card 4: Upcoming Commitments */}
            <Link
              href="/app/debt-watchdog"
              className="p-5 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all space-y-2 group block"
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono font-medium">
                <span className="group-hover:text-[#173F2B] dark:group-hover:text-slate-200 transition-colors">Upcoming Commitments</span>
                <Calendar className="w-4 h-4 text-[var(--accent)] group-hover:scale-110 transition-transform" />
              </div>
              <p className="font-display text-2xl font-bold tracking-tight text-[#173F2B] dark:text-white">
                {isDataLoading ? '—' : `${recurringCount} Active`}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
                <span className="truncate">Scheduled rent & bills</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: SUPPORTING EXPERIENCE — SPECIALIZED FINANCIAL TOOLS
        ───────────────────────────────────────────────────────────── */}
        <section aria-labelledby="financial-tools-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              <h2
                id="financial-tools-heading"
                className="font-display text-xl font-bold text-[#173F2B] dark:text-slate-50"
              >
                Specialized Financial Tools
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--muted)]">
              {ALL_TOOLS.length} Preserved Modules
            </span>
          </div>

          <div className="space-y-6">
            {(['Track & Control', 'Wealth & Planning', 'Decisions Before Spending', 'Obligations & Health'] as const).map(
              (category) => {
                const toolsInCategory = ALL_TOOLS.filter((t) => t.category === category);
                return (
                  <div key={category} className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#5E7366] dark:text-slate-400">
                      {category}
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {toolsInCategory.map((mod) => {
                        const Icon = mod.icon;
                        const localizedName = t(mod.i18nKey, mod.name);
                        const localizedDesc = t(mod.i18nDescKey, mod.desc);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => navigateWithCurtain(mod.href, mod.name.toLowerCase(), 'fwd')}
                            className="group text-left bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          >
                            <div className="space-y-3 w-full">
                              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[#173F2B] group-hover:text-white dark:group-hover:bg-emerald-600 transition-colors">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-display text-base font-bold text-[#173F2B] dark:text-slate-50 tracking-tight">
                                  {localizedName.split('(')[0].trim()}
                                </h4>
                                <p className="text-xs text-[#2E4035] dark:text-slate-300 mt-1 leading-relaxed line-clamp-2 font-medium">
                                  {localizedDesc}
                                </p>
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-bold text-[#173F2B] dark:text-slate-200 group-hover:text-[var(--accent)] transition-colors w-full">
                              <span>Open module</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[var(--accent)]" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] font-mono font-medium">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>{language === 'hi' ? 'फिनरॉक एआई-संचालित वित्तीय प्लेटफॉर्म' : 'Finroq AI-Driven Financial Architecture'}</span>
          <span>{language === 'hi' ? 'सटीक दशमलव अंकगणित NUMERIC(14,2)' : 'Exact Decimal Math NUMERIC(14,2)'}</span>
        </div>
      </footer>
    </div>
  );
}
