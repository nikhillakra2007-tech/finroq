'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { ArrowLeft, Sun, Moon, LogOut, Globe } from 'lucide-react';

interface ModuleShellProps {
  title: string;
  category: string;
  description: string;
  children: React.ReactNode;
}

export function ModuleShell({ title, category, description, children }: ModuleShellProps) {
  const { user, logout } = useAuth();
  const { navigateWithCurtain } = useCurtain();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-between">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)]">
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
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all flex items-center gap-1"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold">{language === 'en' ? 'हिन्दी' : 'EN'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
          <span>Authoritative Financial Engine</span>
        </div>
      </footer>
    </div>
  );
}
