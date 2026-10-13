'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import {
  Menu,
  X,
  Home,
  CreditCard,
  PieChart,
  TrendingUp,
  Sparkles,
  Settings,
  LogOut,
  User as UserIcon,
  Wallet,
  ChevronDown,
  Layers,
  Users,
  ShoppingBag,
  Zap,
  BookOpen,
  Umbrella,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Target,
  Globe,
} from 'lucide-react';

const PRIMARY_NAV = [
  { key: 'nav.home', name: '12-Module Home', href: '/app/home', icon: Home },
  { key: 'nav.ledger', name: 'Ledger', href: '/app/expense-tracking', icon: CreditCard },
  { key: 'nav.budgets', name: 'Budgets', href: '/app/budgeting', icon: PieChart },
  { key: 'mod.net_worth', name: 'Net Worth', href: '/app/net-worth', icon: TrendingUp },
  { key: 'nav.ai_insights', name: 'AI Insights', href: '/app/spend-leak-detector', icon: Sparkles },
];

const ALL_12_MODULES = [
  { key: 'mod.expense_tracking', name: 'Expense Tracking', href: '/app/expense-tracking', icon: CreditCard, cat: 'Track' },
  { key: 'mod.daily_budgeting', name: 'Daily Budgeting', href: '/app/budgeting', icon: PieChart, cat: 'Track' },
  { key: 'mod.splitter', name: 'Expense Splitter', href: '/app/splitter', icon: Users, cat: 'Track' },
  { key: 'mod.pre_spend_check', name: 'Pre-Spend Check', href: '/app/pre-spend-check', icon: ShoppingBag, cat: 'Decide' },
  { key: 'mod.spend_leak_detector', name: 'Spend Leak Detector', href: '/app/spend-leak-detector', icon: Zap, cat: 'Decide' },
  { key: 'mod.money_guides', name: 'Money Guides', href: '/app/money-guides', icon: BookOpen, cat: 'Decide' },
  { key: 'mod.net_worth', name: 'Net Worth Architecture', href: '/app/net-worth', icon: TrendingUp, cat: 'Wealth' },
  { key: 'mod.goal_timeline', name: 'Goal Timeline Simulator', href: '/app/goal-timeline', icon: Target, cat: 'Wealth' },
  { key: 'mod.emergency_cushion', name: 'Emergency Cushion', href: '/app/emergency-cushion', icon: Umbrella, cat: 'Wealth' },
  { key: 'mod.debt_watchdog', name: 'EMI / Debt Watchdog', href: '/app/debt-watchdog', icon: ShieldAlert, cat: 'Health' },
  { key: 'mod.credit_health', name: 'Credit Health', href: '/app/credit-health', icon: ShieldCheck, cat: 'Health' },
  { key: 'mod.financial_health', name: 'Integrated Financial Health', href: '/app/financial-health', icon: Activity, cat: 'Health' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModulesDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleInstantDemo = async () => {
    setIsDemoLoading(true);
    try {
      await login('demo@finroq.com', 'password123');
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-[#DCE4DC] dark:border-[#2A3D33] sticky top-0 z-40 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-finroq-forest rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Wallet className="h-5 w-5 text-finroq-lime" />
              </div>
              <span className="text-xl font-black font-heading text-[#173F2B] dark:text-emerald-300 tracking-tight">
                FINROQ
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {PRIMARY_NAV.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200',
                      isActive
                        ? 'bg-finroq-mint text-finroq-forest shadow-xs'
                        : 'text-[#173F2B] dark:text-slate-200 hover:bg-[#EAF3E7] hover:text-[#102F21]'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {t(item.key, item.name)}
                  </Link>
                );
              })}

              {/* All 12 Modules Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setModulesDropdownOpen(!modulesDropdownOpen)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200',
                    modulesDropdownOpen
                      ? 'bg-finroq-mint text-finroq-forest'
                      : 'text-[#173F2B] dark:text-slate-200 hover:bg-[#EAF3E7] hover:text-[#102F21]'
                  )}
                  aria-expanded={modulesDropdownOpen}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{t('nav.modules', 'Modules')}</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', modulesDropdownOpen ? 'rotate-180' : '')} />
                </button>

                {modulesDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#16251E] rounded-2xl shadow-lg border border-[#BAC7BE] dark:border-[#2A3D33] p-2 grid grid-cols-1 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#2A3D33] flex items-center justify-between text-[11px] font-bold text-[#173F2B] dark:text-slate-300 uppercase tracking-wider">
                      <span>{language === 'hi' ? 'सभी 12 वित्तीय मॉड्यूल' : 'All 12 Financial Modules'}</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-[#2A3D33] space-y-0.5">
                      {ALL_12_MODULES.map((m) => (
                        <Link
                          key={m.key}
                          href={m.href}
                          onClick={() => setModulesDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#173F2B] dark:text-slate-100 hover:bg-finroq-mint/50 dark:hover:bg-[#1A2C22] transition-colors"
                        >
                          <m.icon className="h-4 w-4 text-finroq-forest dark:text-emerald-400 shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold">{t(m.key, m.name)}</p>
                            <span className="text-[10px] text-[#374A3E] dark:text-slate-400 font-medium">{m.cat}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Account Controls */}
          <div className="hidden sm:flex sm:items-center sm:gap-2.5">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1.5 rounded-xl border border-finroq-border text-xs font-bold text-finroq-forest hover:bg-finroq-mint/40 flex items-center gap-1.5 transition-colors"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-finroq-forest" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
            <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#4D5D51] hover:text-[#173F2B] dark:text-slate-400 dark:hover:text-emerald-300 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-finroq-forest" />
                  <span className="max-w-[130px] truncate">{user?.full_name || user?.email}</span>
                </Link>
            <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl text-[#4D5D51] hover:text-[#B74747] hover:bg-red-50 border border-transparent hover:border-red-100 dark:text-slate-400 dark:hover:text-rose-400 transition-all duration-200"
                  title="Sign out"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstantDemo}
                  disabled={isDemoLoading}
                  className="px-3.5 py-1.5 text-xs font-bold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 rounded-xl shadow-xs transition-all duration-200 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isDemoLoading ? 'Entering...' : '1-Click Demo'}
                </button>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-finroq-forest hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            className="md:hidden p-2 rounded-xl text-finroq-text hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-finroq-forest"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div
          id="mobile-menu"
          className={cn(
            'md:hidden border-t border-finroq-border transition-all duration-200 ease-in-out',
            mobileMenuOpen ? 'block opacity-100 py-3' : 'hidden opacity-0'
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3.5 pb-2">
              <span className="text-[10px] uppercase font-bold text-finroq-muted">
                {language === 'hi' ? 'मुख्य हब' : 'Primary Hubs'}
              </span>
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="px-2.5 py-1 rounded-xl border border-finroq-border text-xs font-bold text-finroq-forest hover:bg-finroq-mint/40 flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-finroq-forest" />
                <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>
            </div>

            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-finroq-text hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4 text-finroq-forest" />
                {t(item.key, item.name)}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <span className="px-3.5 text-[10px] uppercase font-bold text-finroq-muted">
                {language === 'hi' ? 'सभी 12 वित्तीय मॉड्यूल' : 'All 12 Modules'}
              </span>
              <div className="grid grid-cols-2 gap-1 px-2 pt-1">
                {ALL_12_MODULES.map((m) => (
                  <Link
                    key={m.key}
                    href={m.href}
                    className="p-2 rounded-lg text-xs font-medium text-finroq-text hover:bg-finroq-mint/40 truncate"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(m.key, m.name)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-finroq-border">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-3.5 py-2">
                  <span className="text-xs font-medium text-finroq-text truncate">
                    {user?.full_name || user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-finroq-negative font-medium"
                  >
                    {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  <button
                    onClick={handleInstantDemo}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-finroq-lime text-finroq-forest-deep text-center shadow-xs"
                  >
                    {language === 'hi' ? '1-क्लिक लाइव डेमो' : '1-Click Live Demo'}
                  </button>
                  <Link
                    href="/login"
                    className="w-full py-2 rounded-xl text-xs font-semibold text-center border border-finroq-border hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {language === 'hi' ? 'साइन इन करें' : 'Sign In'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}