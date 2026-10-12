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
  CreditCard,
  PieChart,
  TrendingUp,
  Sparkles,
  Settings,
  LogOut,
  User as UserIcon,
  Wallet,
} from 'lucide-react';

// Streamlined, uncluttered 5-item core navigation
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Ledger', href: '/transactions', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: PieChart },
  { name: 'Net Worth', href: '/net-worth', icon: TrendingUp },
  { name: 'AI Insights', href: '/insights', icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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
      console.error('Demo login error', err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-finroq-border sticky top-0 z-40 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-finroq-forest rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Wallet className="h-5 w-5 text-finroq-lime" />
              </div>
              <span className="text-xl font-extrabold font-heading text-finroq-forest tracking-tight">
                FINROQ
              </span>
            </Link>

            {/* Streamlined Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200',
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
            </div>
          </div>

          {/* User Account Controls */}
          <div className="hidden sm:flex sm:items-center sm:gap-2.5">
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
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium',
                    isActive
                      ? 'bg-finroq-mint text-finroq-forest font-semibold'
                      : 'text-finroq-muted hover:bg-slate-50 hover:text-finroq-text'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

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