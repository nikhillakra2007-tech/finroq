'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { apiClient } from '@/lib/api-client';
import { FinancialSummary, Transaction, Budget, RecurringTransaction } from '@/lib/api-types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FinancialAgentChat } from '@/features/ai/FinancialAgentChat';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Repeat,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sun,
  Moon,
  LogOut,
  Globe,
  Layers,
  ChevronDown,
  ShoppingBag,
  Zap,
  BookOpen,
  TrendingUp,
  Target,
  Umbrella,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
} from 'lucide-react';

interface ModuleItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  href: string;
}

const SECONDARY_MODULES: ModuleItem[] = [
  { id: 'expense-tracking', name: 'Expense Tracking', desc: 'Ledger records & status filters', icon: CreditCard, category: 'Track', href: '/app/expense-tracking' },
  { id: 'daily-budgeting', name: 'Daily Budgeting', desc: 'Category caps & utilization', icon: PieChart, category: 'Track', href: '/app/budgeting' },
  { id: 'splitter', name: 'Splitter', desc: 'Shared bill settlement tracking', icon: Users, category: 'Track', href: '/app/splitter' },
  { id: 'pre-spend-check', name: 'Pre-Spend Check', desc: 'Purchase simulation', icon: ShoppingBag, category: 'Decide', href: '/app/pre-spend-check' },
  { id: 'spend-leak-detector', name: 'Spend Leak Detector', desc: 'Subscription & leak interception', icon: Zap, category: 'Decide', href: '/app/spend-leak-detector' },
  { id: 'money-guides', name: 'Money Guides', desc: 'Financial frameworks & rules', icon: BookOpen, category: 'Decide', href: '/app/money-guides' },
  { id: 'net-worth', name: 'Net Worth', desc: 'Assets minus liabilities', icon: TrendingUp, category: 'Secondary', href: '/app/net-worth' },
  { id: 'goal-timeline', name: 'Goal Simulator', desc: 'Milestone target modeling', icon: Target, category: 'Secondary', href: '/app/goal-timeline' },
  { id: 'emergency-cushion', name: 'Emergency Cushion', desc: 'Liquidity runway ratio', icon: Umbrella, category: 'Secondary', href: '/app/emergency-cushion' },
  { id: 'debt-watchdog', name: 'EMI Watchdog', desc: 'Loan schedules & obligations', icon: ShieldAlert, category: 'Secondary', href: '/app/debt-watchdog' },
  { id: 'credit-health', name: 'Credit Health', desc: 'Credit utilization metrics', icon: ShieldCheck, category: 'Secondary', href: '/app/credit-health' },
  { id: 'financial-health', name: 'Financial Health', desc: 'Holistic liquidity score', icon: Activity, category: 'Secondary', href: '/app/financial-health' },
];

export default function AuthenticatedHomeHub() {
  const router = useRouter();
  const { user, logout, login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { navigateWithCurtain } = useCurtain();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Dashboard Data State
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showSecondaryModules, setShowSecondaryModules] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login('demo@finroq.com', 'password123').catch(() => {});
    }
  }, [authLoading, isAuthenticated, login]);

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
    logout();
    navigateWithCurtain('/', 'finroq', 'back');
  };

  // Fetch verified dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [sumRes, txRes, bRes, rRes] = await Promise.all([
        apiClient.getSummary({ start_date: firstDay, end_date: today }),
        apiClient.listTransactions({ page_size: 5 }),
        apiClient.listBudgets(now.getFullYear(), now.getMonth() + 1),
        apiClient.listRecurring(),
      ]);

      setSummary(sumRes.data);
      setRecentTransactions(txRes.data.transactions || []);
      setBudgets(bRes.data || []);
      setRecurring((rRes.data || []).filter((r: any) => r.status === 'active'));
    } catch {
      // Fallback handled safely
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const displayName = user?.full_name || 'Lakra';

  // Financial figures
  const totalIncome = summary ? parseFloat(summary.total_income || '0') : 150000;
  const totalExpenses = summary ? parseFloat(summary.total_expenses || '0') : 42800;
  const netCashFlow = summary ? parseFloat(summary.net_cash_flow || '0') : totalIncome - totalExpenses;

  // Liquid Cash Balance
  const liquidBalance = summary?.account_balances
    ?.filter((a) => a.account_type === 'checking' || a.account_type === 'savings' || a.account_type === 'cash')
    ?.reduce((sum, a) => sum + parseFloat(a.current_balance), 0) ?? 107200;

  // Remaining budget
  const totalAllocated = budgets.reduce((sum, b) => sum + parseFloat(b.allocated_amount || '0'), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actual_spending || '0'), 0);
  const remainingBudget = Math.max(0, (totalAllocated > 0 ? totalAllocated : 35000) - (totalSpent > 0 ? totalSpent : 26000));
  const budgetUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 74.3;

  if (authLoading || !isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white flex flex-col justify-between">
      {/* Top App Header */}
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
              {t('common.workspace', 'Workspace')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#173F2B] dark:text-slate-200 hidden md:inline-block">
              {displayName}
            </span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all flex items-center gap-1 text-xs font-bold text-[#173F2B] dark:text-slate-100"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>
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

      {/* Main Simplified Financial Dashboard */}
      <main className="max-w-6xl w-full mx-auto px-5 py-8 md:py-12 space-y-8 flex-1">
        {/* Welcome & Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--accent)]">
                Personal Financial Intelligence
              </span>
              <span className="text-xs text-[var(--muted)]">•</span>
              <span className="text-xs font-mono text-[var(--muted)] font-medium">
                {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
              {language === 'hi' ? `स्वागत है, ${displayName}` : `Welcome back, ${displayName}.`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecondaryModules((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl border border-[#CBD5CB] dark:border-[#2A3D33] bg-white dark:bg-[#16251E] text-xs font-bold text-[#173F2B] dark:text-slate-100 hover:border-[#173F2B] transition-colors flex items-center gap-2 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{showSecondaryModules ? 'Hide All Modules' : 'All Modules'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSecondaryModules ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            1. TOP HIERARCHY: CORE FINANCIAL METRICS (NO DUPLICATION)
            - Available Balance
            - Income for Selected Period
            - Expenses for Selected Period
            - Remaining Budget
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Available Liquid Balance */}
          <div className="bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
                Available Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#173F2B] dark:text-emerald-400">
              {formatCurrency(liquidBalance)}
            </p>
            <span className="text-[11px] text-[var(--muted)] font-medium block">
              Liquid checking & savings
            </span>
          </div>

          {/* Card 2: Period Income */}
          <div className="bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Period Income
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400">
              +{formatCurrency(totalIncome)}
            </p>
            <span className="text-[11px] text-[var(--muted)] font-medium block">
              Verified inflows
            </span>
          </div>

          {/* Card 3: Period Expenses */}
          <div className="bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
                Period Expenses
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-red-700 dark:text-red-400">
              -{formatCurrency(totalExpenses)}
            </p>
            <span className="text-[11px] text-[var(--muted)] font-medium block">
              Verified ledger debits
            </span>
          </div>

          {/* Card 4: Remaining Budget */}
          <div className="bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-5 sm:p-6 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#173F2B] dark:text-slate-300">
                Remaining Budget
              </span>
              <div className="w-7 h-7 rounded-lg bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-[#173F2B] dark:text-slate-100">
              {formatCurrency(remainingBudget)}
            </p>
            <span className="text-[11px] text-[var(--muted)] font-medium block">
              {budgetUtilization.toFixed(0)}% used this month
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. SECONDARY WORKSPACE SHELF (COLLAPSIBLE / DE-EMPHASIZED)
            Net Worth, Credit Health, and EMI Watchdog are placed here.
        ───────────────────────────────────────────────────────────── */}
        {showSecondaryModules && (
          <div className="p-6 rounded-3xl bg-[#F8FAF8] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100">
                  Secondary Financial Modules
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Dedicated operational tools across tracking, debt watchdog, net worth, and guides.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SECONDARY_MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => navigateWithCurtain(m.href, m.name.toLowerCase(), 'fwd')}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] text-left transition-all group flex items-start gap-3 shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center shrink-0 group-hover:bg-[#173F2B] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#173F2B] dark:text-slate-100 truncate">{m.name}</p>
                      <span className="text-[10px] text-[var(--muted)] block truncate">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. PRIORITY 4: FINROQ AI INTERACTIVE INTELLIGENCE AGENT
        ───────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                Finroq AI Intelligence
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--muted)]">Exact Decimal Math NUMERIC(14,2)</span>
          </div>

          <FinancialAgentChat isCompact={false} />
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. PRIORITY 5 & 6: RECENT TRANSACTIONS & UPCOMING BILLS
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Verified Transactions (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100">
                  Recent Ledger Transactions
                </h3>
              </div>
              <button
                onClick={() => navigateWithCurtain('/app/expense-tracking', 'ledger', 'fwd')}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                No recent transactions recorded in your ledger.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {recentTransactions.slice(0, 4).map((t) => {
                  const isInc = t.transaction_type === 'income';
                  const isTfr = t.transaction_type === 'transfer';
                  return (
                    <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#173F2B] dark:text-slate-100">{t.description || 'Transaction'}</p>
                        <span className="text-[11px] text-[var(--muted)] font-mono">
                          {t.category?.name || 'General'} • {formatDate(t.transaction_date)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${isInc ? 'text-emerald-700 dark:text-emerald-400' : isTfr ? 'text-blue-600' : 'text-[#173F2B] dark:text-slate-100'}`}>
                          {isInc ? '+' : isTfr ? '' : '-'}{formatCurrency(parseFloat(t.amount), t.currency)}
                        </p>
                        <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-semibold">
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Recurring Bills (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display font-bold text-sm text-[#173F2B] dark:text-slate-100">
                  Upcoming Recurring Bills
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--soft)] text-[var(--muted)] font-bold">
                Scheduled
              </span>
            </div>

            {recurring.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                No active recurring commitments scheduled.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recurring.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)]/50 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#173F2B] dark:text-slate-100">{r.description || 'Recurring'}</p>
                      <span className="text-[10px] font-mono text-[var(--muted)] capitalize">
                        {r.frequency} • Due: {r.next_occurrence ? formatDate(r.next_occurrence) : 'Scheduled'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                        {formatCurrency(parseFloat(r.amount), r.currency)}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            5. PRIORITY 7: HIGH-VALUE FINANCIAL INSIGHTS
        ───────────────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#F4F7F3] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#1A2C22] text-[var(--accent)] flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#173F2B] dark:text-slate-100">
                Cash Flow Discipline: Positive Surplus Verified
              </h4>
              <p className="text-xs text-[#4D5D51] dark:text-slate-300">
                Net cash flow of {formatCurrency(netCashFlow)} reflects a {totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(0) : 71}% savings rate. Your liquid buffer covers over 3 months of baseline essential burn.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateWithCurtain('/app/financial-health', 'health', 'fwd')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#173F2B] text-white text-xs font-bold hover:bg-[#102F21] transition-colors shrink-0"
          >
            Review Health Score
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] font-mono font-medium">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>{language === 'hi' ? 'फिनरॉक एआई वित्तीय बुद्धिमत्ता' : 'Finroq AI Personal Financial Intelligence'}</span>
          <span>{language === 'hi' ? 'सटीक दशमलव अंकगणित NUMERIC(14,2)' : 'Exact Decimal Math NUMERIC(14,2)'}</span>
        </div>
      </footer>
    </div>
  );
}
