'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import {
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Globe,
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
  ChevronDown,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ModuleShellProps {
  title: string;
  category: string;
  description: string;
  children: React.ReactNode;
}

const MODULES_NAV = [
  { href: '/app/ai-assistant', key: 'mod.ai_assistant', label: 'Finroq AI', icon: Sparkles },
  { href: '/app/expense-tracking', key: 'mod.expense_tracking', label: 'Expense Tracking', icon: CreditCard },
  { href: '/app/budgeting', key: 'mod.daily_budgeting', label: 'Daily Budgeting', icon: PieChart },
  { href: '/app/splitter', key: 'mod.splitter', label: 'Splitter', icon: Users },
  { href: '/app/pre-spend-check', key: 'mod.pre_spend_check', label: 'Pre-Spend Check', icon: ShoppingBag },
  { href: '/app/spend-leak-detector', key: 'mod.spend_leak_detector', label: 'Spend Leak Detector', icon: Zap },
  { href: '/app/money-guides', key: 'mod.money_guides', label: 'Money Guides', icon: BookOpen },
  { href: '/app/net-worth', key: 'mod.net_worth', label: 'Net Worth', icon: TrendingUp },
  { href: '/app/goal-timeline', key: 'mod.goal_timeline', label: 'Goal Simulator', icon: Target },
  { href: '/app/emergency-cushion', key: 'mod.emergency_cushion', label: 'Emergency Cushion', icon: Umbrella },
  { href: '/app/debt-watchdog', key: 'mod.debt_watchdog', label: 'Debt Watchdog', icon: ShieldAlert },
  { href: '/app/credit-health', key: 'mod.credit_health', label: 'Credit Health', icon: ShieldCheck },
  { href: '/app/financial-health', key: 'mod.financial_health', label: 'Financial Health', icon: Activity },
];

export function ModuleShell({ title, category, description, children }: ModuleShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { navigateWithCurtain } = useCurtain();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleScroll() {
      setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const activeMod = MODULES_NAV.find((mod) => pathname === mod.href || pathname?.startsWith(mod.href)) || MODULES_NAV[0];
  const ActiveIcon = activeMod.icon;

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('finroq_logged_out', 'true');
    }
    logout();
    navigateWithCurtain('/', 'finroq', 'back');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      {/* Top App Bar */}
      <header className="relative z-30 bg-[var(--bg)] border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWithCurtain('/app/home', 'home', 'back')}
              className="btn-pill sm ghost text-xs flex items-center gap-1.5 hover:border-[var(--ink)] font-bold text-[#173F2B] dark:text-slate-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('common.back_home', 'Back to home')}
            </button>
            <Link
              href="/app/home"
              className="hidden sm:flex items-center gap-2 font-display font-bold text-lg tracking-tight text-[var(--ink)]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              finroq
            </Link>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Feature Switcher Dropdown Bar */}
      <div className="relative z-20 bg-[var(--surface)] border-b border-[var(--line)] shadow-xs">
        <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] shrink-0">
              <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{language === 'hi' ? 'फीचर चुनें:' : 'Select Feature:'}</span>
            </div>

            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full sm:w-[280px] flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#16251E] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] hover:border-[#173F2B] dark:hover:border-emerald-500 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <ActiveIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate">{t(activeMod.key, activeMod.label)}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options Menu */}
              {isDropdownOpen && (
                <div
                  data-lenis-prevent="true"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-1.5 w-full sm:w-[320px] max-h-[290px] overflow-y-auto dropdown-menu-scroller overscroll-contain rounded-2xl bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--muted)] opacity-75 border-b border-[var(--line)]/60 mb-1">
                    {language === 'hi' ? 'सभी 12 फीचर्स' : 'All 12 Features'}
                  </div>
                  {MODULES_NAV.map((mod) => {
                    const Icon = mod.icon;
                    const isSelected = activeMod.href === mod.href;
                    return (
                      <button
                        key={mod.href}
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigateWithCurtain(mod.href, mod.label.toLowerCase(), 'fwd');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isSelected
                            ? 'bg-[#173F2B] text-white dark:bg-emerald-600 dark:text-white font-bold shadow-xs'
                            : 'text-[#173F2B] dark:text-slate-200 hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[var(--accent)]'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate">{t(mod.key, mod.label)}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Current Category Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 font-mono text-[11px] font-bold border border-[#CBD5CB] dark:border-[#2A3D33]">
              {category}
            </span>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <main className="max-w-6xl w-full mx-auto px-5 py-8 md:py-12 space-y-8 flex-1">
        <div className="space-y-2 border-b border-[var(--line)] pb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase text-[var(--accent)]">
              {category}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--ink)]">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl">
            {description}
          </p>
        </div>

        <div>{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-xs text-[var(--muted)] font-mono">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-between items-center gap-4">
          <span>Finroq · {title}</span>
          <span>{language === 'hi' ? 'प्रामाणिक वित्तीय इंजन' : 'Authoritative Financial Engine'}</span>
        </div>
      </footer>
    </div>
  );
}
