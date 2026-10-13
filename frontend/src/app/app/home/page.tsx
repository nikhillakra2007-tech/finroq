'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
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
} from 'lucide-react';

interface ModuleItem {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Track & Control' | 'Decide Before Spending' | 'Build & Protect' | 'Manage Obligations';
  href: string;
}

const TWELVE_MODULES: ModuleItem[] = [
  // Category A: Track and Control
  {
    id: 'expense-tracking',
    name: 'Expense Tracking',
    desc: 'Record and categorize transactions, monitor statuses, and review completed cash flow.',
    icon: CreditCard,
    category: 'Track & Control',
    href: '/app/expense-tracking',
  },
  {
    id: 'daily-budgeting',
    name: 'Daily Budgeting',
    desc: 'Set category spending caps, compare plans with actual expenses, and monitor cushions.',
    icon: PieChart,
    category: 'Track & Control',
    href: '/app/budgeting',
  },
  {
    id: 'splitter',
    name: 'Splitter',
    desc: 'Divide shared expenses, calculate exact equal or custom shares, and track settlements.',
    icon: Users,
    category: 'Track & Control',
    href: '/app/splitter',
  },

  // Category B: Decide Before Spending
  {
    id: 'pre-spend-check',
    name: 'Pre-Spend Check',
    desc: 'Estimate the effect of a planned purchase on remaining budget before spending.',
    icon: ShoppingBag,
    category: 'Decide Before Spending',
    href: '/app/pre-spend-check',
  },
  {
    id: 'spend-leak-detector',
    name: 'Spend Leak Detector',
    desc: 'Identify recurring subscriptions, auto-debits, and potential spend leaks from ledger history.',
    icon: Zap,
    category: 'Decide Before Spending',
    href: '/app/spend-leak-detector',
  },
  {
    id: 'money-guides',
    name: 'Money Guides',
    desc: 'Explore practical financial frameworks, emergency ratios, and allocation blueprints.',
    icon: BookOpen,
    category: 'Decide Before Spending',
    href: '/app/money-guides',
  },

  // Category C: Build and Protect Wealth
  {
    id: 'net-worth',
    name: 'Net Worth',
    desc: 'Track assets minus liabilities across checking, savings, and credit accounts.',
    icon: TrendingUp,
    category: 'Build & Protect',
    href: '/app/net-worth',
  },
  {
    id: 'goal-timeline-simulator',
    name: 'Goal Timeline Simulator',
    desc: 'Model savings targets, project milestone completion dates, and simulate contribution shifts.',
    icon: Target,
    category: 'Build & Protect',
    href: '/app/goal-timeline',
  },
  {
    id: 'emergency-cushion',
    name: 'Emergency Cushion',
    desc: 'Estimate required baseline survival reserves using essential expenses and target months.',
    icon: Umbrella,
    category: 'Build & Protect',
    href: '/app/emergency-cushion',
  },

  // Category D: Manage Obligations and Financial Health
  {
    id: 'emi-debt-watchdog',
    name: 'EMI/Debt Watchdog',
    desc: 'Monitor debt obligations, upcoming loan EMIs, due dates, and recorded payments.',
    icon: ShieldAlert,
    category: 'Manage Obligations',
    href: '/app/debt-watchdog',
  },
  {
    id: 'credit-health',
    name: 'Credit Health',
    desc: 'Review credit utilization metrics, billing schedules, and healthy score maintenance guidance.',
    icon: ShieldCheck,
    category: 'Manage Obligations',
    href: '/app/credit-health',
  },
  {
    id: 'integrated-financial-health',
    name: 'Integrated Financial Health',
    desc: 'Multi-factor holistic view across liquidity, debt ratio, budget discipline, and net savings.',
    icon: Activity,
    category: 'Manage Obligations',
    href: '/app/financial-health',
  },
];

export default function AuthenticatedHomeHub() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { navigateWithCurtain } = useCurtain();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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
      {/* App Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/app/home"
              className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-[var(--ink)]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              finroq
            </Link>
            <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--muted)] border border-[var(--line)]">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--muted)] hidden md:inline-block">
              {displayName}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSignOut}
              className="btn-pill sm ghost text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Dedicated 12-Module Launcher Grid */}
      <main className="max-w-6xl w-full mx-auto px-5 py-10 md:py-16 space-y-10 flex-1">
        {/* Welcome Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-[var(--accent)]">
              Financial Workspace
            </span>
            <span className="text-xs text-[var(--muted)]">•</span>
            <span className="text-xs font-mono text-[var(--muted)]">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink)]">
            Welcome back, {displayName}.
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl">
            Choose what you want to work on today.
          </p>
        </div>

        {/* EXACTLY TWELVE ROUNDED-SQUARE FEATURE CARDS IN 4x3 GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {TWELVE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => navigateWithCurtain(mod.href, mod.name.toLowerCase(), 'fwd')}
                className="group text-left bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--ink)] rounded-3xl p-6 sm:p-7 flex flex-col justify-between aspect-square transition-all duration-200 hover:-translate-y-1 shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {/* Card Top: Category and Icon */}
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--soft)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[var(--ink)] group-hover:text-[var(--bg)] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--muted)] font-medium">
                      {mod.category.split(' ')[0]}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold text-[var(--ink)] tracking-tight leading-snug">
                      {mod.name}
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed line-clamp-3">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Open cue */}
                <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs font-semibold text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors w-full">
                  <span>Open module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[var(--accent)] group-hover:text-[var(--ink)]" />
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] font-mono">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>Finroq 12-Module Financial Engine</span>
          <span>Exact Decimal Math NUMERIC(14,2)</span>
        </div>
      </footer>
    </div>
  );
}
