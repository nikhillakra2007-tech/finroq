'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
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
  LogOut,
  Globe,
} from 'lucide-react';

interface ModuleItem {
  id: string;
  name: string;
  i18nKey: string;
  desc: string;
  i18nDescKey: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Track & Control' | 'Decide Before Spending' | 'Build & Protect' | 'Manage Obligations';
  href: string;
}

const TWELVE_MODULES: ModuleItem[] = [
  // Category A: Track and Control
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
    id: 'daily-budgeting',
    name: 'Daily Budgeting',
    i18nKey: 'mod.daily_budgeting',
    desc: 'Set category spending caps, compare plans with actual expenses, and monitor cushions.',
    i18nDescKey: 'mod.daily_budgeting.desc',
    icon: PieChart,
    category: 'Track & Control',
    href: '/app/budgeting',
  },
  {
    id: 'splitter',
    name: 'Splitter',
    i18nKey: 'mod.splitter',
    desc: 'Divide shared expenses, calculate exact equal or custom shares, and track settlements.',
    i18nDescKey: 'mod.splitter.desc',
    icon: Users,
    category: 'Track & Control',
    href: '/app/splitter',
  },

  // Category B: Decide Before Spending
  {
    id: 'pre-spend-check',
    name: 'Pre-Spend Check',
    i18nKey: 'mod.pre_spend_check',
    desc: 'Estimate the effect of a planned purchase on remaining budget before spending.',
    i18nDescKey: 'mod.pre_spend_check.desc',
    icon: ShoppingBag,
    category: 'Decide Before Spending',
    href: '/app/pre-spend-check',
  },
  {
    id: 'spend-leak-detector',
    name: 'Spend Leak Detector',
    i18nKey: 'mod.spend_leak_detector',
    desc: 'Identify recurring subscriptions, auto-debits, and potential spend leaks from ledger history.',
    i18nDescKey: 'mod.spend_leak_detector.desc',
    icon: Zap,
    category: 'Decide Before Spending',
    href: '/app/spend-leak-detector',
  },
  {
    id: 'money-guides',
    name: 'Money Guides',
    i18nKey: 'mod.money_guides',
    desc: 'Explore practical financial frameworks, emergency ratios, and allocation blueprints.',
    i18nDescKey: 'mod.money_guides.desc',
    icon: BookOpen,
    category: 'Decide Before Spending',
    href: '/app/money-guides',
  },

  // Category C: Build and Protect Wealth
  {
    id: 'net-worth',
    name: 'Net Worth',
    i18nKey: 'mod.net_worth',
    desc: 'Track assets minus liabilities across checking, savings, and credit accounts.',
    i18nDescKey: 'mod.net_worth.desc',
    icon: TrendingUp,
    category: 'Build & Protect',
    href: '/app/net-worth',
  },
  {
    id: 'goal-timeline-simulator',
    name: 'Goal Timeline Simulator',
    i18nKey: 'mod.goal_timeline',
    desc: 'Model savings targets, project milestone completion dates, and simulate contribution shifts.',
    i18nDescKey: 'mod.goal_timeline.desc',
    icon: Target,
    category: 'Build & Protect',
    href: '/app/goal-timeline',
  },
  {
    id: 'emergency-cushion',
    name: 'Emergency Cushion',
    i18nKey: 'mod.emergency_cushion',
    desc: 'Estimate required baseline survival reserves using essential expenses and target months.',
    i18nDescKey: 'mod.emergency_cushion.desc',
    icon: Umbrella,
    category: 'Build & Protect',
    href: '/app/emergency-cushion',
  },

  // Category D: Manage Obligations and Financial Health
  {
    id: 'emi-debt-watchdog',
    name: 'EMI/Debt Watchdog',
    i18nKey: 'mod.debt_watchdog',
    desc: 'Monitor debt obligations, upcoming loan EMIs, due dates, and recorded payments.',
    i18nDescKey: 'mod.debt_watchdog.desc',
    icon: ShieldAlert,
    category: 'Manage Obligations',
    href: '/app/debt-watchdog',
  },
  {
    id: 'credit-health',
    name: 'Credit Health',
    i18nKey: 'mod.credit_health',
    desc: 'Review credit utilization metrics, billing schedules, and healthy score maintenance guidance.',
    i18nDescKey: 'mod.credit_health.desc',
    icon: ShieldCheck,
    category: 'Manage Obligations',
    href: '/app/credit-health',
  },
  {
    id: 'integrated-financial-health',
    name: 'Integrated Financial Health',
    i18nKey: 'mod.financial_health',
    desc: 'Multi-factor holistic view across liquidity, debt ratio, budget discipline, and net savings.',
    i18nDescKey: 'mod.financial_health.desc',
    icon: Activity,
    category: 'Manage Obligations',
    href: '/app/financial-health',
  },
];

export default function AuthenticatedHomeHub() {
  const router = useRouter();
  const { user, logout, login, isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { navigateWithCurtain } = useCurtain();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  const displayName = user?.full_name || 'Lakra';

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

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--accent)] selection:text-white flex flex-col justify-between">
      {/* App Bar - Static, scrolls naturally with the page like landing page */}
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

      {/* Main Content Area: Dedicated 12-Module Launcher Grid */}
      <main className="max-w-6xl w-full mx-auto px-5 py-10 md:py-16 space-y-10 flex-1">
        {/* Welcome Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--accent)]">
              {t('common.financial_workspace', 'Financial Workspace')}
            </span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-xs font-mono text-[var(--muted)] font-medium">
              {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-50">
            {language === 'hi' ? `स्वागत है, ${displayName}` : `${t('common.welcome_back', 'Welcome back')}, ${displayName}.`}
          </h1>
          <p className="text-base sm:text-lg text-[#2E4035] dark:text-slate-300 max-w-xl font-medium">
            {t('common.choose_today', 'Choose what you want to work on today.')}
          </p>
        </div>

        {/* EXACTLY TWELVE ROUNDED-SQUARE FEATURE CARDS IN 4x3 GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {TWELVE_MODULES.map((mod) => {
            const Icon = mod.icon;
            const localizedName = t(mod.i18nKey, mod.name);
            const localizedDesc = t(mod.i18nDescKey, mod.desc);
            return (
              <button
                key={mod.id}
                onClick={() => navigateWithCurtain(mod.href, mod.name.toLowerCase(), 'fwd')}
                className="group text-left bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 rounded-3xl p-6 sm:p-7 flex flex-col justify-between aspect-square transition-all duration-200 hover:-translate-y-1 shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {/* Card Top: Category and Icon */}
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[#173F2B] group-hover:text-white dark:group-hover:bg-emerald-600 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--muted)] font-bold">
                      {mod.category.split(' ')[0]}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold text-[#173F2B] dark:text-slate-50 tracking-tight leading-snug">
                      {localizedName.split('(')[0].trim()}
                    </h2>
                    <p className="text-xs text-[#2E4035] dark:text-slate-300 mt-1.5 leading-relaxed line-clamp-3 font-medium">
                      {localizedDesc}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Open cue */}
                <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs font-bold text-[#173F2B] dark:text-slate-200 group-hover:text-[var(--accent)] transition-colors w-full">
                  <span>{t('common.open_module', 'Open module')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[var(--accent)]" />
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] font-mono font-medium">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>{language === 'hi' ? 'फिनरॉक 12-मॉड्यूल वित्तीय इंजन' : 'Finroq 12-Module Financial Engine'}</span>
          <span>{language === 'hi' ? 'सटीक दशमलव अंकगणित NUMERIC(14,2)' : 'Exact Decimal Math NUMERIC(14,2)'}</span>
        </div>
      </footer>
    </div>
  );
}
