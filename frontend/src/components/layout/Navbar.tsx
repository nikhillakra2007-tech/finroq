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
  { name: '12-Module Home', href: '/app/home', icon: Home },
  { name: 'Ledger', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Net Worth', href: '/net-worth', icon: TrendingUp },
  { name: 'AI Insights', href: '/insights', icon: Sparkles },
];

const ALL_12_MODULES = [
  { name: 'Expense Tracking', href: '/app/expense-tracking', icon: CreditCard, cat: 'Track' },
  { name: 'Daily Budgeting', href: '/app/budgeting', icon: PieChart, cat: 'Track' },
  { name: 'Expense Splitter', href: '/app/splitter', icon: Users, cat: 'Track' },
  { name: 'Pre-Spend Check', href: '/app/pre-spend-check', icon: ShoppingBag, cat: 'Decide' },
  { name: 'Spend Leak Detector', href: '/app/spend-leak-detector', icon: Zap, cat: 'Decide' },
  { name: 'Money Guides', href: '/app/money-guides', icon: BookOpen, cat: 'Decide' },
  { name: 'Net Worth Architecture', href: '/app/net-worth', icon: TrendingUp, cat: 'Wealth' },
  { name: 'Goal Timeline Simulator', href: '/app/goal-timeline', icon: Target, cat: 'Wealth' },
  { name: 'Emergency Cushion', href: '/app/emergency-cushion', icon: Umbrella, cat: 'Wealth' },
  { name: 'EMI / Debt Watchdog', href: '/app/debt-watchdog', icon: ShieldAlert, cat: 'Health' },
  { name: 'Credit Health', href: '/app/credit-health', icon: ShieldCheck, cat: 'Health' },
  { name: 'Integrated Financial Health', href: '/app/financial-health', icon: Activity, cat: 'Health' },
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
    <nav className="bg-white/95 backdrop-blur-md border-b border-finroq-border sticky top-0 z-40 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-finroq-forest rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Wallet className="h-5 w-5 text-finroq-lime" />
              </div>
              <span className="text-xl font-black font-heading text-finroq-forest tracking-tight">
                FINROQ
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {PRIMARY_NAV.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200',
                      isActive
                        ? 'bg-finroq-mint text-finroq-forest shadow-xs'
                        : 'text-finroq-muted hover:bg-slate-50 hover:text-finroq-text'
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* All 12 Modules Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setModulesDropdownOpen(!modulesDropdownOpen)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200',
                    modulesDropdownOpen
                      ? 'bg-finroq-mint text-finroq-forest'
                      : 'text-finroq-muted hover:bg-slate-50 hover:text-finroq-text'
                  )}
                  aria-expanded={modulesDropdownOpen}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Modules</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', modulesDropdownOpen ? 'rotate-180' : '')} />
                </button>

                {modulesDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-lg border border-finroq-border p-2 grid grid-cols-1 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-finroq-muted uppercase tracking-wider">
                      <span>All 12 Financial Modules</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 space-y-0.5">
                      {ALL_12_MODULES.map((m) => (
                        <Link
                          key={m.name}
                          href={m.href}
                          onClick={() => setModulesDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-finroq-text hover:bg-finroq-mint/50 transition-colors"
                        >
                          <m.icon className="h-4 w-4 text-finroq-forest shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold">{m.name}</p>
                            <span className="text-[10px] text-finroq-muted">{m.cat}</span>
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-finroq-text bg-finroq-ivory border border-finroq-border hover:bg-finroq-mint/50 transition-all duration-200"
                >
                  <UserIcon className="h-3.5 w-3.5 text-finroq-forest" />
                  <span className="max-w-[130px] truncate">{user?.full_name || user?.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl text-finroq-muted hover:text-finroq-negative hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200"
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
            <span className="px-3.5 text-[10px] uppercase font-bold text-finroq-muted">Primary Hubs</span>
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-finroq-text hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4 text-finroq-forest" />
                {item.name}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-100 mt-2">
              <span className="px-3.5 text-[10px] uppercase font-bold text-finroq-muted">All 12 Modules</span>
              <div className="grid grid-cols-2 gap-1 px-2 pt-1">
                {ALL_12_MODULES.map((m) => (
                  <Link
                    key={m.name}
                    href={m.href}
                    className="p-2 rounded-lg text-xs font-medium text-finroq-text hover:bg-finroq-mint/40 truncate"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {m.name}
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
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  <button
                    onClick={handleInstantDemo}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-finroq-lime text-finroq-forest-deep text-center shadow-xs"
                  >
                    1-Click Live Demo
                  </button>
                  <Link
                    href="/login"
                    className="w-full py-2 rounded-xl text-xs font-semibold text-center border border-finroq-border hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
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