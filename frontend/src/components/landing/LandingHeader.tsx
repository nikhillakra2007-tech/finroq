'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/layout/LanguageSelector';

interface LandingHeaderProps {
  isScrolled: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function LandingHeader({
  isScrolled,
  theme,
  onToggleTheme,
}: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigateWithCurtain } = useCurtain();
  const { t } = useI18n();

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        isScrolled
          ? 'bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] shadow-xs'
          : 'bg-[var(--bg)]/75 backdrop-blur-sm border-b border-[var(--line)]/50'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 h-16 sm:h-18 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)] transition-colors duration-200 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 font-display font-bold text-xl sm:text-2xl tracking-tight text-[var(--ink)] hover:opacity-90 transition-opacity duration-200"
          >
            <span className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-xs shadow-emerald-500/50" />
            <span className="tracking-tight font-extrabold text-[#173F2B] dark:text-slate-100">finroq</span>
          </Link>
        </div>

        {/* Clean Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--muted)]">
          <a href="#features" className="hover:text-[var(--ink)] transition-colors duration-200">
            {t('nav.pillars', 'Features')}
          </a>
          <a href="#simulator" className="hover:text-[var(--ink)] transition-colors duration-200">
            {t('nav.simulator', 'Simulator')}
          </a>
          <a href="#faq" className="hover:text-[var(--ink)] transition-colors duration-200">
            {t('nav.faq', 'FAQ')}
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <LanguageSelector variant="pill" align="right" />

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
            className="btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs cursor-pointer whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {t('nav.signin', 'Sign in')}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-b border-[var(--line)] px-5 py-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2.5 text-sm font-medium text-[var(--ink)]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors duration-200"
            >
              {t('nav.pillars', 'Features')}
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors duration-200"
            >
              {t('nav.simulator', 'Health Simulator')}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors duration-200"
            >
              {t('nav.faq', 'Frequently Asked Questions')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
