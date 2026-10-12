'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  Menu,
  X,
  Home,
  Wallet,
  CreditCard,
  PieChart,
  Repeat,
  TrendingUp,
  Sparkles,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Net Worth', href: '/net-worth', icon: TrendingUp },
  { name: 'AI Insights', href: '/insights', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-finroq-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-finroq-forest rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <Wallet className="h-5 w-5 text-finroq-lime" />
              </div>
              <span className="text-xl font-extrabold font-heading text-finroq-forest tracking-tight">FINROQ</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-finroq-mint text-finroq-forest font-semibold shadow-xs'
                        : 'text-finroq-muted hover:bg-slate-100 hover:text-finroq-text'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Account Controls */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-finroq-text bg-finroq-ivory border border-finroq-border hover:bg-finroq-sage/30 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-finroq-forest" />
                  <span className="max-w-[140px] truncate">{user?.full_name || user?.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-finroq-negative hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-finroq-forest hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 rounded-lg shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            className="lg:hidden p-2 rounded-lg text-finroq-text hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-finroq-forest"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div
          id="mobile-menu"
          className={cn(
            'lg:hidden border-t border-finroq-border transition-all duration-200 ease-in-out',
            mobileMenuOpen ? 'block opacity-100 py-3' : 'hidden opacity-0'
          )}
        >
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-finroq-mint text-finroq-forest font-semibold'
                      : 'text-finroq-muted hover:bg-slate-100 hover:text-finroq-text'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-finroq-border">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-xs">
                  <p className="font-semibold text-finroq-text">{user?.full_name || 'FINROQ Member'}</p>
                  <p className="text-finroq-muted">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs font-semibold text-finroq-negative hover:underline"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 p-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold border border-finroq-border rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold bg-finroq-forest text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}