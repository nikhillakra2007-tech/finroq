'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { useI18n } from '@/lib/i18n-context';
import { COPILOT_QUERIES_BY_LANG, CRASH_DATA_BY_LANG } from '@/lib/i18n-landing';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import {
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  Zap,
  Menu,
  X,
  Target,
  Layers,
  PieChart,
  TrendingUp,
  Activity,
  Umbrella,
  CreditCard,
  Flame,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Play,
  BookOpen,
  Mail,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { formatInrCompact } from '@/lib/multiverse-engine';

/* Utility to format money in Indian Rupees with 2 decimal places */
function fmtRupees(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  return (
    (isNeg ? '−' : '') +
    '₹' +
    abs.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const { navigateWithCurtain } = useCurtain();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Navigation & Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cinematic Boot Sequence State
  const [bootSequenceActive, setBootSequenceActive] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);

  // Scroll Progress & Dynamic Header Elevation
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Theme initialization
  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  // Handle Cinematic Boot Sequence on First Session Visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenBoot = sessionStorage.getItem('finroq_boot_seen');
      if (!hasSeenBoot) {
        setBootSequenceActive(true);
        sessionStorage.setItem('finroq_boot_seen', 'true');
      }
    }
  }, []);

  const triggerBootSequence = useCallback(() => {
    setBootStep(0);
    setBootProgress(0);
    setBootSequenceActive(true);
  }, []);

  const closeBootSequence = useCallback(() => {
    setBootSequenceActive(false);
  }, []);

  // Keyboard shortcut (Escape to skip boot sequence)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && bootSequenceActive) {
        closeBootSequence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bootSequenceActive, closeBootSequence]);

  // Boot sequence telemetry progression timer
  useEffect(() => {
    if (!bootSequenceActive) return;

    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setBootSequenceActive(false);
          }, 450);
          return 100;
        }
        const next = prev + 4;
        if (next > 25 && next < 55) setBootStep(1);
        else if (next >= 55 && next < 85) setBootStep(2);
        else if (next >= 85) setBootStep(3);
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [bootSequenceActive]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  // Scroll listener for top progress bar and header elevation
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollY / total)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bi-directional Scroll & Reverse Transition Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          } else {
            entry.target.classList.remove('revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll(
      '.reveal-item, .reveal-item-left, .reveal-item-right, .reveal-scale'
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // =========================================================================
  // HERO INTERACTIVE TERMINAL: Live Precision Ledger & Tabbed Architecture
  // =========================================================================
  const [terminalTab, setTerminalTab] = useState<'stream' | 'taccount' | 'drift'>('stream');
  const [heroTransactions, setHeroTransactions] = useState([
    { id: 1, desc: 'Client Advisory Retainer', amount: 85000, type: 'credit', cat: 'Income' },
    { id: 2, desc: 'Cloud Server & Production VPS', amount: -6400, type: 'debit', cat: 'Operations' },
    { id: 3, desc: 'Mutual Fund SIP Allocation', amount: -25000, type: 'debit', cat: 'Investments' },
  ]);

  const heroNetFlow = useMemo(() => {
    return heroTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [heroTransactions]);

  const addHeroSampleTx = (desc: string, amount: number, cat: string) => {
    const newTx = {
      id: Date.now(),
      desc,
      amount,
      type: amount > 0 ? ('credit' as const) : ('debit' as const),
      cat,
    };
    setHeroTransactions((prev) => [newTx, ...prev.slice(0, 3)]);
  };

  // =========================================================================
  // SECTION 2: BENTO GRID - INTERACTIVE STATES
  // =========================================================================

  // Pillar 1: AI Copilot State
  const [copilotQueryIndex, setCopilotQueryIndex] = useState(0);
  const copilotQueries = useMemo(() => {
    return COPILOT_QUERIES_BY_LANG[language] || COPILOT_QUERIES_BY_LANG['en'];
  }, [language]);

  // Pillar 2: Autonomous Crash-Test Simulator
  const [crashScenario, setCrashScenario] = useState<'income_cut' | 'medical_spike' | 'inflation_squeeze'>('income_cut');
  const crashData = useMemo(() => {
    return CRASH_DATA_BY_LANG[language] || CRASH_DATA_BY_LANG['en'];
  }, [language]);

  // =========================================================================
  // SECTION 2.5: INTERACTIVE FLAGSHIP PREVIEWS (TIMELINES & PREDICTIONS)
  // =========================================================================
  const [timelineYear, setTimelineYear] = useState<number>(15);
  const [selectedTimelinePath, setSelectedTimelinePath] = useState<'fire' | 'balanced' | 'startup'>('fire');

  // Dynamic wealth math for 3 parallel multiverse branches
  const fireWealth = Math.round(250000 + (1200000 * 0.5) * ((Math.pow(1.135, timelineYear) - 1) / 0.135));
  const balancedWealth = Math.round(200000 + (800000 * 0.25) * ((Math.pow(1.11, timelineYear) - 1) / 0.11));
  const startupWealth = timelineYear < 8
    ? Math.round(150000 + timelineYear * 260000)
    : Math.round(2230000 + Math.pow(timelineYear - 7, 2.3) * 165000);

  // Active highlighted metrics
  const activeTimelineWealth =
    selectedTimelinePath === 'fire'
      ? fireWealth
      : selectedTimelinePath === 'balanced'
      ? balancedWealth
      : startupWealth;

  // Flagship Card 2: Youth SIP & IPO Radar preview state
  const [previewSipMonthly, setPreviewSipMonthly] = useState<number>(3000);
  const [selectedIpoIndex, setSelectedIpoIndex] = useState<number>(0);

  const PREVIEW_IPOS = useMemo(
    () => [
      { name: 'Swiggy Ltd', price: '₹371 - ₹390', gmp: '₹165', gain: '+42.5%', signal: 'STRONG LISTING' },
      { name: 'NTPC Green Energy', price: '₹102 - ₹108', gmp: '₹30', gain: '+28.0%', signal: 'MODERATE GAIN' },
      { name: 'Acme Solar Holdings', price: '₹275 - ₹289', gmp: '₹48', gain: '+17.4%', signal: 'WATCHLIST' },
      { name: 'One Mobikwik Systems', price: '₹265 - ₹279', gmp: '₹95', gain: '+34.0%', signal: 'SPECULATIVE GAIN' },
    ],
    []
  );

  // 10-Year compounding math at 13.5% vs 6.5% FD
  const sip10YrWealth = Math.round(
    previewSipMonthly * ((Math.pow(1 + 0.135 / 12, 120) - 1) / (0.135 / 12)) * (1 + 0.135 / 12)
  );
  const fd10YrWealth = Math.round(
    previewSipMonthly * ((Math.pow(1 + 0.065 / 12, 120) - 1) / (0.065 / 12)) * (1 + 0.065 / 12)
  );
  const sipExtraWealth = sip10YrWealth - fd10YrWealth;

  // =========================================================================
  // SECTION 3: INTERACTIVE FINANCIAL HEALTH SIMULATOR (PLAYGROUND)
  // =========================================================================
  const [simIncome, setSimIncome] = useState(120000);
  const [simExpenses, setSimExpenses] = useState(55000);

  const simSurplus = Math.max(0, simIncome - simExpenses);
  const simEmergencyTarget = simExpenses * 6;
  const simSavingsRate = simIncome > 0 ? Math.round((simSurplus / simIncome) * 100) : 0;
  const simMonthsToTarget = simSurplus > 0 ? (simEmergencyTarget / simSurplus).toFixed(1) : '∞';
  const simResilienceScore = Math.min(100, Math.max(20, Math.round((simSavingsRate * 1.2) + 25)));

  // =========================================================================
  // SECTION 6: FAQ ACCORDION (18-Language Localized)
  // =========================================================================
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = useMemo(
    () => [
      {
        q: t('faq.q0', 'Why is exact decimal arithmetic necessary for personal finance?'),
        a: t(
          'faq.a0',
          'Most personal finance apps rely on standard IEEE 754 floating-point numbers, which accumulate fractional rounding drift across hundreds of transactions. FINROQ enforces arbitrary-precision decimal mathematics through Python Decimal and PostgreSQL NUMERIC(14,2) end to end. Every balance, ledger entry, category allocation, and transfer balances with zero drift.'
        ),
      },
      {
        q: t('faq.q1', 'How is FINROQ fundamentally different from spreadsheets and standard budgeting apps?'),
        a: t(
          'faq.a1',
          'Unlike unstructured spreadsheets or superficial budget trackers, FINROQ implements strict double-entry ledger semantics. Internal transfers move money between accounts neutrally without falsely inflating income or expenses. Pending transactions remain isolated from liquid balances, and calendar schedules clamp automatically across leap years and month ends.'
        ),
      },
      {
        q: t('faq.q2', 'Can I automate recurring subscriptions and bills without risk of duplicate entries?'),
        a: t(
          'faq.a2',
          'Yes. FINROQ includes a deterministic, idempotent recurring rules engine. Even if an occurrence trigger fires multiple times in a billing cycle, the system checks previous ledger records and prevents duplicate entries. You get predictable, transparent recurrence without phantom expenses.'
        ),
      },
      {
        q: t('faq.q3', 'How is my financial data protected, isolated, and kept private?'),
        a: t(
          'faq.a3',
          'FINROQ enforces a zero-trust tenant architecture where all database queries explicitly scope to your verified account identity on the server. Authentication is backed by Argon2id cryptographic password hashing and tamper-proof JWT tokens. Your private financial metrics are never harvested, sold, or shared with third parties.'
        ),
      },
      {
        q: t('faq.q4', 'Can I use FINROQ privately without exposing real banking login credentials?'),
        a: t(
          'faq.a4',
          'Absolutely. FINROQ does not require you to provide banking passwords or grant broad OAuth access to third-party scraping brokers. You maintain sovereign ownership over your books, with the ability to record ledger entries manually, import CSV statements, and explore every simulation tool in a clean, self-contained environment.'
        ),
      },
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[#173F2B] selection:text-white relative font-sans overflow-x-hidden">
      {/* 0. CINEMATIC BOOT SEQUENCE / MOTION INTRO OVERLAY */}
      {bootSequenceActive && (
        <div className="fixed inset-0 z-[200] bg-[#070F0B] text-slate-100 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
          {/* Ambient Radial Grid & Glow Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(16,185,129,0.18),rgba(7,15,11,0.98))] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

          {/* Skip Control Button */}
          <button
            onClick={closeBootSequence}
            className="absolute top-6 right-6 px-4 py-2 rounded-full border border-emerald-500/30 hover:border-emerald-400 bg-white/5 hover:bg-white/10 text-xs font-mono text-emerald-300 transition-all cursor-pointer z-10 flex items-center gap-2"
          >
            <span>Skip Boot</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">ESC</span>
          </button>

          <div className="relative max-w-lg w-full space-y-8 text-center z-10">
            {/* Pulsing Concentric Hexagon / Radar Core */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse-ring" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Header Telemetry */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>FINROQ KERNEL v1.3 // BOOT SEQUENCE</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Initializing Mathematical Engine
              </h2>
            </div>

            {/* Telemetry Log Step Cards */}
            <div className="p-4.5 rounded-2xl bg-black/40 border border-emerald-500/20 text-left font-mono text-xs space-y-2.5 backdrop-blur-sm">
              <div className={`flex items-center justify-between transition-opacity duration-200 ${bootStep >= 0 ? 'opacity-100 text-emerald-300' : 'opacity-30 text-slate-500'}`}>
                <span>01 // NUMERIC(14,2) FIXED-POINT REGISTERS</span>
                <span className="text-[10px] font-bold">{bootStep >= 1 ? 'OK' : 'MOUNTING...'}</span>
              </div>
              <div className={`flex items-center justify-between transition-opacity duration-200 ${bootStep >= 1 ? 'opacity-100 text-emerald-300' : 'opacity-30 text-slate-500'}`}>
                <span>02 // IEEE 754 FLOAT DRIFT PURGE (0.3000...4)</span>
                <span className="text-[10px] font-bold">{bootStep >= 2 ? 'REJECTED' : 'CHECKING...'}</span>
              </div>
              <div className={`flex items-center justify-between transition-opacity duration-200 ${bootStep >= 2 ? 'opacity-100 text-emerald-300' : 'opacity-30 text-slate-500'}`}>
                <span>03 // ARGON2ID TENANT ENCLAVE ENCRYPT</span>
                <span className="text-[10px] font-bold">{bootStep >= 3 ? 'LOCKED' : 'SECURING...'}</span>
              </div>
              <div className={`flex items-center justify-between transition-opacity duration-200 ${bootStep >= 3 ? 'opacity-100 text-emerald-300 font-bold' : 'opacity-30 text-slate-500'}`}>
                <span>04 // DOUBLE-ENTRY INTEGRITY CHECK</span>
                <span className="text-[10px] font-bold">{bootProgress >= 100 ? '0.00% DRIFT' : 'BALANCING...'}</span>
              </div>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-emerald-400/80">
                <span>SYSTEM CALIBRATION</span>
                <span>{bootProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-emerald-500/30 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-75 rounded-full"
                  style={{ width: `${bootProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Dynamic Top Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-[#173F2B] to-teal-400 z-[100] origin-left pointer-events-none transition-transform duration-75 shadow-xs"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* 2. Top Navigation Bar - Generous and Spacious */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] shadow-xs'
            : 'bg-[var(--bg)]/75 backdrop-blur-sm border-b border-[var(--line)]/50'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 h-16 sm:h-18 flex items-center justify-between gap-6">
          {/* Logo & Version Pip */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-[var(--line)] hover:border-[var(--ink)] text-[var(--ink)] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 font-display font-bold text-xl sm:text-2xl tracking-tight text-[var(--ink)] hover:opacity-90 transition-opacity"
            >
              <span className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-xs shadow-emerald-500/50" />
              <span className="tracking-tight font-extrabold text-[#173F2B] dark:text-slate-100">finroq</span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
            <a href="#engine" className="hover:text-[var(--ink)] transition-colors">
              {t('nav.engine', 'Engine')}
            </a>
            <a href="#bento" className="hover:text-[var(--ink)] transition-colors">
              {t('nav.pillars', 'Pillars')}
            </a>
            <a href="#flagship-features" className="hover:text-[var(--ink)] transition-colors text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('nav.predictions', 'Predictions & Timelines')}</span>
            </a>
            <a href="#simulator" className="hover:text-[var(--ink)] transition-colors">
              {t('nav.simulator', 'Simulator')}
            </a>
            <a href="#faq" className="hover:text-[var(--ink)] transition-colors">
              {t('nav.faq', 'FAQ')}
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSelector variant="pill" align="right" />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] hover:text-[var(--ink)] transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs cursor-pointer whitespace-nowrap transition-colors"
            >
              {t('nav.signin', 'Sign in')}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--surface)] border-b border-[var(--line)] px-5 py-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-2.5 text-sm font-medium text-[var(--ink)]">
              <a
                href="#engine"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2.5"
              >
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.engine', 'Precision Engine')}</span>
              </a>
              <a
                href="#bento"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2.5"
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.pillars', 'Autonomous Pillars')}</span>
              </a>
              <a
                href="#flagship-features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.predictions', 'Predictions & Timelines')}</span>
              </a>
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2.5"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.simulator', 'Health Simulator')}</span>
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl hover:bg-[var(--soft)] transition-colors flex items-center gap-2.5"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.faq', 'Frequently Asked Questions')}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO - COMMANDING EDITORIAL HEADLINE & LIVE PRECISION TERMINAL */}
      {/* ========================================================================= */}
      <section id="engine" className="pt-12 pb-14 md:pt-16 md:pb-16 border-b border-[var(--line)] relative overflow-hidden">
        {/* Soft Background Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center relative">
          {/* Left Column: Core Positioning Narrative */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-[#173F2B] dark:text-slate-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              <span>{t('hero.badge_tech', 'Autonomous Fixed-Point Decimal Architecture')}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.12] text-[#173F2B] dark:text-slate-50">
              {t('hero.title_line1', 'The ledger that refuses')}
              <br />
              <span className="text-emerald-700 dark:text-emerald-400">{t('hero.title_line2', 'to be wrong.')}</span>
            </h1>

            <p className="text-base sm:text-lg text-[#3D5245] dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              {t('hero.description', 'Most personal finance apps rely on floating-point spreadsheets and hallucinated LLM advice. Finroq unites double-entry accounting, dynamic envelope budgets, and autonomous stress simulations with zero decimal drift.')}
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap gap-3.5 items-center">
              <button
                onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
                className="btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 px-6.5 py-3 font-semibold text-sm sm:text-base rounded-full shadow-sm cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105"
              >
                <span>{t('hero.cta_open', 'Start Building Wealth →')}</span>
              </button>
              <a
                href="#simulator"
                className="btn-pill secondary border border-[var(--line)] hover:border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] px-6 py-3 font-medium text-sm sm:text-base rounded-full cursor-pointer whitespace-nowrap transition-colors"
              >
                {t('hero.cta_simulator', 'Try live simulator ↓')}
              </a>
            </div>

            {/* Three Pillar Guarantees */}
            <div className="pt-3 border-t border-[var(--line)] flex flex-wrap gap-4 text-xs font-mono font-medium text-[#2E4035] dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('hero.pill_zero_drift', 'Zero Float Drift')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('hero.pill_double_entry', 'Double-Entry Balance')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('hero.pill_argon', 'Argon2id Vault')}</span>
              </span>
            </div>

            {/* Direct Module Access Badges */}
            <div className="pt-4 border-t border-[var(--line)] space-y-2">
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                Direct Financial Systems:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <Link
                  href="/predictions"
                  className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Youth IPO &amp; Mutual Fund Predictor ⚡</span>
                </Link>
                <Link
                  href="/app/multiverse"
                  className="px-3 py-1.5 rounded-full bg-[var(--soft)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)] transition-all flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>30-Yr What-If Timeline</span>
                </Link>
                <Link
                  href="/app/money-guides"
                  className="px-3 py-1.5 rounded-full bg-[var(--soft)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)] transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Visual Tips &amp; Rules</span>
                </Link>
                <Link
                  href="/app/expense-tracking"
                  className="px-3 py-1.5 rounded-full bg-[var(--soft)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)] transition-all flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Expense Tracking</span>
                </Link>
                <Link
                  href="/app/budgeting"
                  className="px-3 py-1.5 rounded-full bg-[var(--soft)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--ink)] transition-all flex items-center gap-1.5"
                >
                  <PieChart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Budgeting</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Precision Ledger Terminal */}
          <div className="lg:col-span-6">
            <div className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl card-hover-lift">
              {/* Header Titlebar with Linear/macOS Style Dots & Tab Selector */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-display font-medium text-sm text-[var(--ink)]">
                    {t('terminal.title', 'Live Ledger Engine')}
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--soft)] text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setTerminalTab('stream')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      terminalTab === 'stream'
                        ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {t('terminal.tab_stream', 'Stream')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalTab('taccount')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      terminalTab === 'taccount'
                        ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {t('terminal.tab_taccount', 'T-Account')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerminalTab('drift')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      terminalTab === 'drift'
                        ? 'bg-[var(--surface)] text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {t('terminal.tab_drift', 'Drift Lab ⚡')}
                  </button>
                </div>
              </div>

              {/* Dynamic Sparkline Area & Consolidated Net Worth */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                      {t('terminal.net_worth', 'Consolidated Net Worth (Exact Numeric)')}
                    </span>
                    <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-[#173F2B] dark:text-slate-100">
                      {fmtRupees(541310 + heroNetFlow)}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                    {t('terminal.drift_badge', 'DR = CR · 0.00% Drift')}
                  </span>
                </div>

                {/* Live Dynamic SVG Sparkline Waveform */}
                <div className="w-full h-14 bg-[var(--soft)]/30 rounded-xl p-1.5 border border-[var(--line)] relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 300 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ledgerSparkline" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Dynamic Path based on net flow */}
                    <path
                      d={`M 0 45 Q 60 ${38 - (heroNetFlow > 0 ? 8 : 0)} 120 ${28 - (heroNetFlow > 20000 ? 12 : 0)} T 240 ${20 - (heroNetFlow > 0 ? 8 : -6)} T 300 ${14 - (heroNetFlow > 0 ? 10 : -8)} L 300 50 L 0 50 Z`}
                      fill="url(#ledgerSparkline)"
                    />
                    <path
                      d={`M 0 45 Q 60 ${38 - (heroNetFlow > 0 ? 8 : 0)} 120 ${28 - (heroNetFlow > 20000 ? 12 : 0)} T 240 ${20 - (heroNetFlow > 0 ? 8 : -6)} T 300 ${14 - (heroNetFlow > 0 ? 10 : -8)}`}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* TAB 1: Live Ledger Stream */}
              {terminalTab === 'stream' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono font-medium text-[var(--muted)]">
                    <span>{t('terminal.recent_postings', 'Recent Double-Entry Postings')}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('terminal.checksum', 'Checksum: 0.000000')}</span>
                  </div>
                  <div className="space-y-2">
                    {heroTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-[var(--soft)]/50 border border-[var(--line)] flex items-center justify-between text-xs transition-all"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="font-medium text-[var(--ink)] block truncate">{tx.desc}</span>
                          <span className="text-[10px] font-mono text-[var(--muted)]">{tx.cat}</span>
                        </div>
                        <span
                          className={`font-mono font-semibold whitespace-nowrap ${
                            tx.amount > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#173F2B] dark:text-slate-200'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {fmtRupees(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: T-Account Double-Entry Balance Sheet */}
              {terminalTab === 'taccount' && (
                <div className="p-3.5 rounded-2xl bg-[var(--soft)]/40 border border-[var(--line)] space-y-3 font-mono text-xs animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--line)] text-[10px] text-[var(--muted)] uppercase">
                    <span>Account Category</span>
                    <span>Debit (Dr) / Credit (Cr)</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--ink)] font-medium">{t('terminal.t_assets', 'Assets: Liquid Operating Cash')}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">Dr +₹5,41,310.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--ink)] font-medium">{t('terminal.t_equity', 'Equity: Retained Personal Surplus')}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">Cr −₹4,12,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--ink)] font-medium">{t('terminal.t_liabilities', 'Liabilities: Amortized Credit Card')}</span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">Cr −₹1,29,310.00</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)] flex justify-between text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                    <span>{t('terminal.t_equality', 'EQUALITY CHECKSUM')}</span>
                    <span>Σ(Dr) − Σ(Cr) = ₹0.000000 ✅</span>
                  </div>
                </div>
              )}

              {/* TAB 3: Float Drift Lab Mode */}
              {terminalTab === 'drift' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                    <span>{t('terminal.drift_title', 'IEEE 754 Binary Float vs Python Decimal')}</span>
                    <span>{t('terminal.drift_test', '0.10 + 0.20 Test')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-red-300 dark:border-red-900/60 space-y-1">
                      <span className="text-[10px] text-red-600 dark:text-red-400 block font-bold">{t('terminal.drift_standard', 'Standard Float (❌)')}</span>
                      <span className="text-red-700 dark:text-red-300 font-semibold block truncate">0.30000000000000004</span>
                      <span className="text-[10px] text-[var(--muted)]">{t('terminal.drift_standard_note', 'Binary approximation drift')}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--surface)] border border-emerald-300 dark:border-emerald-900/60 space-y-1">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">{t('terminal.drift_finroq', 'FINROQ NUMERIC (✅)')}</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold block truncate">0.30000000000000000</span>
                      <span className="text-[10px] text-[var(--muted)]">{t('terminal.drift_finroq_note', 'Exact fixed-point math')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Transaction Simulation Buttons */}
              <div className="pt-2 border-t border-[var(--line)] space-y-2">
                <span className="text-[11px] font-mono text-[var(--muted)] block">
                  {t('terminal.simulate_feeds', 'Simulate Live Accounting Feeds:')}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => addHeroSampleTx('Client Milestone Payment', 35000, 'Income')}
                    className="px-3 py-1.5 rounded-lg bg-[var(--soft)] hover:bg-[var(--line)] text-[var(--ink)] font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    {t('terminal.btn_retainer', '+ ₹35k Retainer')}
                  </button>
                  <button
                    type="button"
                    onClick={() => addHeroSampleTx('Office Software Licenses', -4200, 'Operations')}
                    className="px-3 py-1.5 rounded-lg bg-[var(--soft)] hover:bg-[var(--line)] text-[var(--ink)] font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    {t('terminal.btn_software', '− ₹4.2k Software')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroTransactions([
                      { id: 1, desc: 'Client Advisory Retainer', amount: 85000, type: 'credit', cat: 'Income' },
                      { id: 2, desc: 'Cloud Server & Production VPS', amount: -6400, type: 'debit', cat: 'Operations' },
                      { id: 3, desc: 'Mutual Fund SIP Allocation', amount: -25000, type: 'debit', cat: 'Investments' },
                    ])}
                    className="p-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--ink)] text-[var(--muted)] transition-colors cursor-pointer"
                    title="Reset ledger stream"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE 4 AUTONOMOUS PILLARS (BENTO GRID ARCHITECTURE)             */}
      {/* ========================================================================= */}
      <section id="bento" className="py-14 md:py-20 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          {/* Header */}
          <div className="max-w-2xl space-y-3 reveal-item">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('bento.badge', 'Core Architecture')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              {t('bento.title', 'Four autonomous systems. Complete financial command.')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-normal">
              {t('bento.desc', 'Every engine inside FINROQ is interlocked. Your checking balance immediately informs budgets, budgets inform AI Copilot pre-spend assessments, and multi-agent stress simulators verify total solvency.')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* Bento 1: AI Copilot Decision Engine (Col Span 7) */}
            <div className="lg:col-span-7 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs reveal-item-left card-hover-lift">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-medium text-base text-[var(--ink)] block">
                      {t('p1.title', 'Deterministic AI Copilot')}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {t('p1.subtitle', 'Audited provenance · Zero LLM hallucination in math')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[var(--soft)] text-[var(--ink)]">
                  {t('p1.badge', 'Live Assessment')}
                </span>
              </div>

              {/* Selector Tabs */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                  {t('p1.prompt_label', 'Select Decision Prompt:')}
                </span>
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  {copilotQueries.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCopilotQueryIndex(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-medium text-[11px] ${
                        copilotQueryIndex === idx
                          ? 'bg-[var(--soft)] border-[var(--ink)] text-[var(--ink)] shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <span className="line-clamp-2">{item.q}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision Verdict Brief */}
              <div className="p-4 rounded-2xl bg-[var(--soft)]/60 border border-[var(--line)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase text-emerald-800 dark:text-emerald-300">
                    {t('p1.verdict_label', 'Verdict')}: {copilotQueries[copilotQueryIndex]?.verdict}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)]">
                    {t('p1.provenance_checked', 'Provenance Checked')}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink)] leading-relaxed">
                  {copilotQueries[copilotQueryIndex]?.reason}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--line)]">
                  {copilotQueries[copilotQueryIndex]?.metrics.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
                      <span className="text-[9px] font-mono uppercase text-[var(--muted)] block truncate">{m.label}</span>
                      <span className="text-xs font-mono font-semibold text-[var(--ink)] block truncate">{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento 2: Autonomous Crash-Test Simulator (Col Span 5) */}
            <div className="lg:col-span-5 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs reveal-item-right delay-75 card-hover-lift">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-medium text-base text-[var(--ink)] block">
                      {t('p2.title', 'Crash-Test Simulator')}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {t('p2.subtitle', 'Autonomous household stress evaluation')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shock Trigger Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                  {t('p2.prompt_label', 'Simulate Shock Scenario:')}
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['income_cut', 'medical_spike', 'inflation_squeeze'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCrashScenario(key)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium text-[11px] ${
                        crashScenario === key
                          ? 'bg-[var(--soft)] border-[var(--ink)] text-[var(--ink)] shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--ink)]'
                      }`}
                    >
                      {key === 'income_cut'
                        ? t('p2.btn_income', '−35% Income')
                        : key === 'medical_spike'
                        ? t('p2.btn_medical', '₹50k Medical')
                        : t('p2.btn_inflation', '+18% Inflation')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gauge & Runway Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-1">
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                    {t('p2.resilience', 'Resilience')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {crashData[crashScenario]?.resilience ?? 84}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted)]">/ 100</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--line)] space-y-1">
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">
                    {t('p2.runway', 'Survival Runway')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-[var(--ink)]">
                      {crashData[crashScenario]?.runway ?? 7.2}
                    </span>
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {t('p2.runway_months', 'months')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linear Recovery Plan */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-xs font-mono font-medium text-emerald-800 dark:text-emerald-300 block">
                  {t('p2.blueprint_title', 'Proved Linear Recovery Blueprint')}
                </span>
                <p className="text-xs text-[var(--ink)] leading-relaxed">
                  {crashData[crashScenario]?.plan}
                </p>
              </div>
            </div>

            {/* Bento 3: Zero-Trust Cryptographic Privacy Vault (Col Span 5) */}
            <div className="lg:col-span-5 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs reveal-item-left delay-150 card-hover-lift">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-medium text-base text-[var(--ink)] block">
                      {t('p3.title', 'Zero-Trust Privacy Vault')}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      {t('p3.subtitle', 'Hardware-grade tenant isolation')}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                  {t('p3.badge', 'Encrypted')}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[var(--soft)]/50 border border-[var(--line)] flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-medium text-[var(--ink)] block text-xs">
                      {t('p3.b1_title', 'Zero Ad-Tracking or Mining')}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block leading-relaxed">
                      {t('p3.b1_desc', 'Your ledger is strictly private. Balances are never profiled, mined, or sold.')}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--soft)]/50 border border-[var(--line)] flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-medium text-[var(--ink)] block text-xs">
                      {t('p3.b2_title', 'Instant Data Sovereignty')}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block leading-relaxed">
                      {t('p3.b2_desc', 'Download raw CSV/JSON balance sheets anytime or trigger a 1-click total purge.')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 4: Real-Time Dynamic Category Budgets (Col Span 7) */}
            <div className="lg:col-span-7 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs reveal-item-right delay-200 card-hover-lift">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-medium text-base text-[var(--ink)] block">
                      {t('p4.title', 'Dynamic Category Budgets & Pacing')}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {t('p4.subtitle', 'Envelope allowances synchronized with double-entry ledger')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  {t('p4.badge', 'Pacing: On Track')}
                </span>
              </div>

              {/* Envelopes Progress Bar */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono font-medium">
                    <span>{t('p4.cat1', 'Dining & Social')} (₹18,500 {t('p4.cap', 'cap')})</span>
                    <span>₹12,400 {t('p4.spent', 'spent')} (67%)</span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono font-medium">
                    <span>{t('p4.cat2', 'Work & Tech Envelopes')} (₹35,000 {t('p4.cap', 'cap')})</span>
                    <span>₹19,200 {t('p4.spent', 'spent')} (55%)</span>
                  </div>
                  <div className="w-full bg-[var(--soft)] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2.5: FLAGSHIP WEALTH SYSTEMS - INTERACTIVE TIMELINES & PREDICTIONS */}
      {/* ========================================================================= */}
      <section id="flagship-features" className="py-14 md:py-20 border-b border-[var(--line)] scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 space-y-10">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('flagship.badge', 'Flagship Financial Systems')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              {t('flagship.title', 'Simulate 30-Year Timelines & Predict Market Moves')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-normal">
              {t('flagship.desc', 'Two interactive intelligence engines engineered for students and young working professionals in Indian Rupees (₹).')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Flagship Card 1: Interactive What-If Life Timeline Simulator */}
            <div className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs card-hover-lift transition-all duration-300 ease-in-out">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-display font-bold text-lg text-[var(--ink)] block">
                        {t('flagship.card1_title', 'What-If Life Timeline Simulator')}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                        {t('flagship.card1_sub', '30-Year Quantum Multiverse Scrubber')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                    {t('flagship.live_scrubber', 'Live Scrubber')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                  {t('flagship.card1_desc', 'Time-travel across your next 30 years. Drag the interactive scrubber to see how parallel life branches compound and reach early retirement (F.I.R.E.) in ₹ INR.')}
                </p>

                {/* Interactive Time-Scrubber Slider with Dynamic Reverse Transitions */}
                <div className="p-4 rounded-2xl bg-[var(--soft)]/50 border border-[var(--line)] space-y-3 transition-all duration-300 ease-in-out">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)] uppercase font-semibold">
                      {t('flagship.time_scrubber', 'Time Scrubber: Year')} {timelineYear}
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {t('flagship.age_simulated', 'Age')} {24 + timelineYear} ({t('flagship.simulated_label', 'Simulated')})
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={timelineYear}
                    onChange={(e) => setTimelineYear(Number(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer h-2 bg-gray-200 dark:bg-gray-800 rounded-lg transition-all duration-300 ease-in-out"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                    <span>{t('flagship.yr1', 'Yr 1 (Age 25)')}</span>
                    <span>{t('flagship.yr10', 'Yr 10 (Age 34)')}</span>
                    <span>{t('flagship.yr20', 'Yr 20 (Age 44)')}</span>
                    <span>{t('flagship.yr30', 'Yr 30 (Age 54)')}</span>
                  </div>

                  {/* 3 Clickable Parallel Path Forks */}
                  <div className="space-y-2 pt-1">
                    {/* Path 1: Fast FIRE */}
                    <div
                      onClick={() => setSelectedTimelinePath('fire')}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out ${
                        selectedTimelinePath === 'fire'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚀</span>
                        <div>
                          <span className="font-bold text-[var(--ink)] block">{t('flagship.fire_title', 'Fast FIRE Path')}</span>
                          <span className="text-[10px] text-gray-500">{t('flagship.fire_sub', 'Retire at Age 38')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block transition-all duration-300">
                          {formatInrCompact(fireWealth)}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{t('flagship.fire_savings', '50% Savings')}</span>
                      </div>
                    </div>

                    {/* Path 2: Balanced Life */}
                    <div
                      onClick={() => setSelectedTimelinePath('balanced')}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out ${
                        selectedTimelinePath === 'balanced'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚖️</span>
                        <div>
                          <span className="font-bold text-[var(--ink)] block">{t('flagship.balanced_title', 'Balanced Life')}</span>
                          <span className="text-[10px] text-gray-500">{t('flagship.balanced_sub', 'Retire at Age 48')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[var(--ink)] block transition-all duration-300">
                          {formatInrCompact(balancedWealth)}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{t('flagship.balanced_savings', '25% Savings')}</span>
                      </div>
                    </div>

                    {/* Path 3: Aggressive Startup */}
                    <div
                      onClick={() => setSelectedTimelinePath('startup')}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border cursor-pointer transition-all duration-300 ease-in-out ${
                        selectedTimelinePath === 'startup'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--line)] hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🦄</span>
                        <div>
                          <span className="font-bold text-[var(--ink)] block">{t('flagship.startup_title', 'Aggressive Startup Bet')}</span>
                          <span className="text-[10px] text-gray-500">{t('flagship.startup_sub', 'Retire at Age 42')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block transition-all duration-300">
                          {formatInrCompact(startupWealth)}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{t('flagship.startup_savings', 'High Risk Equity')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/app/multiverse"
                  className="w-full btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm py-3 rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01]"
                >
                  <span>{t('flagship.card1_btn', 'Launch Full 30-Year Simulator')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Flagship Card 2: Interactive Youth Investment & IPO Prediction Center */}
            <div className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs card-hover-lift transition-all duration-300 ease-in-out">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-display font-bold text-lg text-[var(--ink)] block">
                        {t('flagship.card2_title', 'Youth Investment & IPO Predictor')}
                      </span>
                      <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400">
                        {t('flagship.card2_sub', 'Live GMP & AMFI Telemetry')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-800 dark:text-orange-300 font-semibold border border-orange-500/20">
                    {t('flagship.live_telemetry', 'Live Telemetry')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                  {t('flagship.card2_desc', 'Real-time listing gain predictions for upcoming Indian IPOs using Grey Market Premiums (GMP %), paired with student-friendly index funds starting as low as ₹100 per month with zero commissions.')}
                </p>

                {/* Interactive Monthly SIP Compounding Slider */}
                <div className="p-4 rounded-2xl bg-[var(--soft)]/50 border border-[var(--line)] space-y-3 transition-all duration-300 ease-in-out">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)] uppercase font-semibold">
                      {t('flagship.sip_slider', 'Monthly Investment Slider')}
                    </span>
                    <span className="font-bold text-[#173F2B] dark:text-emerald-400">
                      ₹{previewSipMonthly.toLocaleString()}{t('flagship.per_month', '/month')}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="500"
                    value={previewSipMonthly}
                    onChange={(e) => setPreviewSipMonthly(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer h-2 bg-gray-200 dark:bg-gray-800 rounded-lg transition-all duration-300 ease-in-out"
                  />

                  {/* 10-Yr Equity SIP vs Bank FD Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase block">{t('flagship.equity_sip_label', '10-Yr Equity SIP (13.5%)')}</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block transition-all duration-300">
                        {formatInrCompact(sip10YrWealth)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase block">{t('flagship.bank_fd_label', '10-Yr Bank FD (6.5%)')}</span>
                      <span className="text-sm font-bold text-gray-500 block transition-all duration-300">
                        {formatInrCompact(fd10YrWealth)}
                      </span>
                    </div>
                  </div>

                  {/* Interactive IPO Selection Tabs */}
                  <div className="pt-2 border-t border-[var(--line)] space-y-2">
                    <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider block">
                      {t('flagship.ipo_radar', 'Live Upcoming IPO Radar (Click to Inspect):')}
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {PREVIEW_IPOS.map((ipo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIpoIndex(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                            selectedIpoIndex === idx
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)] hover:border-orange-500/50'
                          }`}
                        >
                          {ipo.name.split(' ')[0]} {ipo.gain}
                        </button>
                      ))}
                    </div>

                    {/* Active Selected IPO Details */}
                    <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-orange-500/30 flex items-center justify-between text-xs transition-all duration-300">
                      <div>
                        <span className="font-bold text-[var(--ink)] block">
                          {PREVIEW_IPOS[selectedIpoIndex]?.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {t('flagship.price_label', 'Price:')} {PREVIEW_IPOS[selectedIpoIndex]?.price} • {t('flagship.gmp_label', 'GMP:')} {PREVIEW_IPOS[selectedIpoIndex]?.gmp}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          {PREVIEW_IPOS[selectedIpoIndex]?.gain}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {PREVIEW_IPOS[selectedIpoIndex]?.signal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/app/investments"
                  className="w-full btn-pill primary bg-[#173F2B] text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-[#102F21] dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm py-3 rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01]"
                >
                  <span>{t('flagship.card2_btn', 'Open Prediction Center')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: INTERACTIVE FINANCIAL HEALTH SIMULATOR (PLAYGROUND)             */}
      {/* ========================================================================= */}
      <section id="simulator" className="py-12 md:py-16 border-b border-[var(--line)] bg-[var(--soft)]/15 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 space-y-10">
          {/* Header */}
          <div className="max-w-2xl space-y-3 reveal-item">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('sim.badge', 'Interactive Financial Playground')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              {t('sim.title', 'Simulate your household solvency in real time.')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-normal">
              {t('sim.desc', 'Adjust your monthly figures below. FINROQ’s mathematical engine calculates your runway, required emergency cushion, and baseline resilience score instantly.')}
            </p>
          </div>

          {/* Interactive Calculator Workbench */}
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Sliders Input Panel */}
            <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs reveal-item-left card-hover-lift">
              {/* Slider 1: Monthly Income */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono font-medium">
                  <span className="text-[var(--muted)] uppercase">{t('sim.income_label', 'Monthly Net Income')}</span>
                  <span className="text-base font-semibold text-[var(--ink)]">{fmtRupees(simIncome)}</span>
                </div>
                <input
                  type="range"
                  min="40000"
                  max="400000"
                  step="5000"
                  value={simIncome}
                  onChange={(e) => setSimIncome(Number(e.target.value))}
                  className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                  <span>₹40,000</span>
                  <span>₹2,00,000</span>
                  <span>₹4,00,000</span>
                </div>
              </div>

              {/* Slider 2: Fixed Monthly Obligations */}
              <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                <div className="flex justify-between items-center text-xs font-mono font-medium">
                  <span className="text-[var(--muted)] uppercase">{t('sim.expenses_label', 'Fixed Monthly Expenses & EMIs')}</span>
                  <span className="text-base font-semibold text-[var(--ink)]">{fmtRupees(simExpenses)}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="250000"
                  step="5000"
                  value={simExpenses}
                  onChange={(e) => setSimExpenses(Number(e.target.value))}
                  className="w-full accent-[#173F2B] dark:accent-emerald-400 cursor-pointer h-2 bg-[var(--soft)] rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                  <span>₹15,000</span>
                  <span>₹1,25,000</span>
                  <span>₹2,50,000</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Output Panel */}
            <div className="lg:col-span-6 bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs reveal-item-right delay-150 card-hover-lift">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--soft)]/50 border border-[var(--line)] space-y-1">
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">{t('sim.surplus_label', 'Monthly Net Surplus')}</span>
                  <span className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 block">
                    {fmtRupees(simSurplus)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {simSavingsRate}% {t('sim.savings_capacity', 'savings capacity')}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--soft)]/50 border border-[var(--line)] space-y-1">
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">{t('sim.cushion_label', '6-Mo Cushion Goal')}</span>
                  <span className="font-mono text-2xl font-bold text-[var(--ink)] block">
                    {fmtRupees(simEmergencyTarget)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {simMonthsToTarget} {t('sim.months_to_fund', 'months to fund')}
                  </span>
                </div>
              </div>

              {/* Resilience Meter */}
              <div className="p-4 rounded-2xl bg-[var(--soft)]/70 border border-[var(--line)] space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-medium">
                  <span>{t('sim.score_label', 'Household Resilience Score')}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{simResilienceScore} / 100</span>
                </div>
                <div className="w-full bg-[var(--surface)] h-2 rounded-full overflow-hidden border border-[var(--line)]">
                  <div
                    className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${simResilienceScore}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--muted)] block">
                  {t('sim.score_desc', 'Deterministic evaluation based on income solvency ratio and obligation load.')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: COMPARISON MATRIX - SPREADSHEETS VS FINROQ                      */}
      {/* ========================================================================= */}
      <section className="py-12 md:py-16 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-10">
          {/* Header */}
          <div className="max-w-2xl space-y-3 reveal-item">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('matrix.badge', 'Architectural Rigor')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              {t('matrix.title', 'Why engineers and high-earners switch to FINROQ.')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-normal">
              {t('matrix.desc', 'Most consumer finance tools are passive display dashboards built on loose spreadsheets. FINROQ is an enterprise-grade financial accounting ledger.')}
            </p>
          </div>

          {/* Matrix Card */}
          <div className="bg-[var(--surface)] border border-[#CBD5CB] dark:border-[#243B2E] rounded-3xl p-6 sm:p-8 shadow-xs reveal-scale delay-100 card-hover-lift overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-mono text-[var(--muted)]">
                  <th className="py-3 font-medium uppercase">{t('matrix.th_vector', 'Engineering Vector')}</th>
                  <th className="py-3 font-medium uppercase text-slate-500">{t('matrix.th_traditional', 'Traditional Apps & Sheets')}</th>
                  <th className="py-3 font-semibold uppercase text-emerald-700 dark:text-emerald-400">{t('matrix.th_finroq', 'FINROQ Ledger Engine')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-medium">
                <tr>
                  <td className="py-3.5 text-[var(--ink)] font-semibold">{t('matrix.r1_name', 'Arithmetic Precision')}</td>
                  <td className="py-3.5 text-slate-500">{t('matrix.r1_trad', 'IEEE 754 float drift (0.30000000000000004)')}</td>
                  <td className="py-3.5 text-emerald-700 dark:text-emerald-400 font-semibold">{t('matrix.r1_fin', 'Exact Fixed-Point NUMERIC(14,2)')}</td>
                </tr>
                <tr>
                  <td className="py-3.5 text-[var(--ink)] font-semibold">{t('matrix.r2_name', 'Decision Logic')}</td>
                  <td className="py-3.5 text-slate-500">{t('matrix.r2_trad', 'Hallucinating LLMs / Static generic rules')}</td>
                  <td className="py-3.5 text-emerald-700 dark:text-emerald-400 font-semibold">{t('matrix.r2_fin', 'Audited mathematical provenance checks')}</td>
                </tr>
                <tr>
                  <td className="py-3.5 text-[var(--ink)] font-semibold">{t('matrix.r3_name', 'Stress Modeling')}</td>
                  <td className="py-3.5 text-slate-500">{t('matrix.r3_trad', 'None (Passive retrospective pie charts)')}</td>
                  <td className="py-3.5 text-emerald-700 dark:text-emerald-400 font-semibold">{t('matrix.r3_fin', 'Autonomous multi-agent crash testing')}</td>
                </tr>
                <tr>
                  <td className="py-3.5 text-[var(--ink)] font-semibold">{t('matrix.r4_name', 'Security Model')}</td>
                  <td className="py-3.5 text-slate-500">{t('matrix.r4_trad', 'Shared databases, tracking cookies, data sold')}</td>
                  <td className="py-3.5 text-emerald-700 dark:text-emerald-400 font-semibold">{t('matrix.r4_fin', 'Argon2id vault, row isolation, zero data sale')}</td>
                </tr>
                <tr>
                  <td className="py-3.5 text-[var(--ink)] font-semibold">{t('matrix.r5_name', 'Bookkeeping Integrity')}</td>
                  <td className="py-3.5 text-slate-500">{t('matrix.r5_trad', 'Single-entry disconnected lists')}</td>
                  <td className="py-3.5 text-emerald-700 dark:text-emerald-400 font-semibold">{t('matrix.r5_fin', 'True double-entry debit = credit balancing')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: TRUST & ARCHITECTURAL PILLARS                                  */}
      {/* ========================================================================= */}
      <section id="architecture" className="py-12 md:py-16 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 space-y-12">
          <div className="max-w-2xl space-y-3 reveal-item">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--soft)] border border-[var(--line)] text-xs font-medium text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('trust.badge', 'Cryptographic Integrity')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
              {t('trust.title', 'Built for precision. Designed for absolute privacy.')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed font-normal">
              {t('trust.desc', 'No black-box algorithms, no floating-point errors, and zero data monetization.')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] space-y-3 shadow-xs reveal-item delay-75 card-hover-lift">
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-base text-[var(--ink)]">
                {t('trust.c1_title', 'Arbitrary Decimal Arithmetic')}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                {t('trust.c1_desc', 'Backed by Python Decimal and database NUMERIC(14,2) types. Eliminates binary IEEE 754 floating-point roundoff drift across account balances and currency transfers.')}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] space-y-3 shadow-xs reveal-item delay-150 card-hover-lift">
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-base text-[var(--ink)]">
                {t('trust.c2_title', 'Zero-Trust Tenant Isolation')}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                {t('trust.c2_desc', 'Hard server-enforced per-user data tenancy on all SQL queries. Signed stateless JWTs with cryptographic Argon2id password hashing protect your records.')}
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[var(--surface)] border border-[var(--line)] space-y-3 shadow-xs reveal-item delay-200 card-hover-lift">
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-display font-medium text-base text-[var(--ink)]">
                {t('trust.c3_title', 'Deterministic Financial Logic')}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                {t('trust.c3_desc', 'Transparent timeline and emergency projections with zero invented returns. Every financial calculation is explainable, verifiable, and mathematically auditable.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: FREQUENTLY ADDRESSED QUESTIONS (ACCORDION)                      */}
      {/* ========================================================================= */}
      <section className="py-12 md:py-16 border-b border-[var(--line)]">
        <div className="max-w-4xl mx-auto px-5 space-y-10">
          <div className="space-y-3 text-center max-w-xl mx-auto reveal-item">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              {t('faq.badge', 'Clear Questions & Answers')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
              {t('faq.title', 'Frequently addressed questions')}
            </h2>
          </div>

          <div className="space-y-3.5 reveal-item delay-100">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`bg-[var(--surface)] border rounded-2xl transition-all duration-200 overflow-hidden cursor-pointer ${
                    isOpen
                      ? 'border-[#173F2B] dark:border-emerald-500 shadow-xs'
                      : 'border-[#CBD5CB] dark:border-[#243B2E] hover:border-[#173F2B]/40'
                  }`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <button
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--soft)] text-emerald-800 dark:text-emerald-300 shrink-0">
                        0{idx + 1}
                      </span>
                      <h4 className="font-display font-medium text-sm sm:text-base text-[var(--ink)] pr-4">
                        {faq.q}
                      </h4>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[#173F2B] text-white dark:bg-emerald-600' : 'bg-[var(--soft)] text-[var(--ink)]'
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-[var(--line)]">
                      <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed pt-3 font-normal">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: PROMINENT SIGNATURE GRAND FINALE CTA                           */}
      {/* ========================================================================= */}
      <section className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="p-8 sm:p-14 rounded-3xl bg-[#173F2B] text-white dark:bg-[#0E261A] border border-[#23583D] dark:border-[#1E4D35] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl reveal-scale delay-150 card-hover-lift">
            <div className="space-y-3 max-w-xl">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                {t('cta.final_title', 'Take absolute command of your financial ledger.')}
              </h2>
              <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
                {t('cta.final_desc', 'Join the financial accounting engine built for people who refuse to leave their wealth to chance or floating-point drift.')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3.5 items-center shrink-0">
              <button
                onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Start Building Wealth →
              </button>
              <button
                onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-white font-semibold text-sm sm:text-base cursor-pointer whitespace-nowrap transition-all duration-300"
              >
                {t('cta.btn_signin', 'Sign in')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. COMPREHENSIVE MULTI-COLUMN FINTECH FOOTER (WITH EDUCATIONAL NOTICE)   */}
      {/* ========================================================================= */}
      <footer className="border-t border-[var(--line)] bg-[var(--soft)]/30 text-[var(--muted)] pt-12 pb-8 text-xs font-sans">
        <div className="max-w-6xl mx-auto px-5 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Col 1: Brand & Contact Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 font-display font-bold text-xl text-[var(--ink)]">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-xs shadow-emerald-500/50" />
                <span className="tracking-tight font-extrabold text-[#173F2B] dark:text-slate-100">finroq</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm">
                The autonomous mathematical financial ledger. Built for individuals and young professionals in India who refuse floating-point rounding drift and demand absolute precision.
              </p>
              <div className="space-y-1.5 text-xs font-mono text-[var(--muted)]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>support@finroq.in • security@finroq.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Indiranagar, Bengaluru, Karnataka, India • 560038</span>
                </div>
              </div>
            </div>

            {/* Col 2: Autonomous Systems */}
            <div className="space-y-3">
              <span className="font-bold font-mono uppercase text-[11px] text-[var(--ink)] tracking-wider block">
                Financial Systems
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/app/multiverse" className="hover:text-emerald-600 transition-colors">
                    30-Yr Multiverse Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/app/investments" className="hover:text-emerald-600 transition-colors">
                    Youth Investment &amp; IPO Radar
                  </Link>
                </li>
                <li>
                  <Link href="/app/expense-tracking" className="hover:text-emerald-600 transition-colors">
                    Double-Entry Expense Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/app/budgeting" className="hover:text-emerald-600 transition-colors">
                    Dynamic Envelope Budgets
                  </Link>
                </li>
                <li>
                  <Link href="/app/crash-test" className="hover:text-emerald-600 transition-colors">
                    Autonomous Crash-Test Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/app/net-worth" className="hover:text-emerald-600 transition-colors">
                    Consolidated Net Worth
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources & Guides */}
            <div className="space-y-3">
              <span className="font-bold font-mono uppercase text-[11px] text-[var(--ink)] tracking-wider block">
                Resources &amp; Rules
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/app/money-guides" className="hover:text-emerald-600 transition-colors">
                    Visual Money Guides (6 Rules)
                  </Link>
                </li>
                <li>
                  <Link href="/app/money-guides" className="hover:text-emerald-600 transition-colors">
                    The 24-Hour Impulse Protocol
                  </Link>
                </li>
                <li>
                  <Link href="/app/money-guides" className="hover:text-emerald-600 transition-colors">
                    Chai vs ₹18.5L Compounding
                  </Link>
                </li>
                <li>
                  <Link href="/app/money-guides" className="hover:text-emerald-600 transition-colors">
                    The 30% CIBIL Credit Shield
                  </Link>
                </li>
                <li>
                  <Link href="/app/money-guides" className="hover:text-emerald-600 transition-colors">
                    UPI Zero-PIN Scam Defense
                  </Link>
                </li>
                <li>
                  <Link href="/api/market-telemetry" className="hover:text-emerald-600 transition-colors font-mono text-[11px]">
                    AMFI Live Telemetry API
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Security */}
            <div className="space-y-3">
              <span className="font-bold font-mono uppercase text-[11px] text-[var(--ink)] tracking-wider block">
                Architecture &amp; Trust
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <span className="text-[var(--ink)] font-semibold block">Fixed-Point Decimal</span>
                  <span className="text-[10px] text-gray-500">PostgreSQL NUMERIC(14,2)</span>
                </li>
                <li>
                  <span className="text-[var(--ink)] font-semibold block">Argon2id Vault</span>
                  <span className="text-[10px] text-gray-500">Zero-knowledge auth hash</span>
                </li>
                <li>
                  <span className="text-[var(--ink)] font-semibold block">Tenant Isolation</span>
                  <span className="text-[10px] text-gray-500">No ad-tracking or scraping</span>
                </li>
                <li>
                  <span className="text-[var(--ink)] font-semibold block">Continuous Ledger Audit</span>
                  <span className="text-[10px] text-gray-500">DR = CR Checksum validation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Educational Purpose & Regulatory Notice Box */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[#CAD5CA]/60 dark:border-[#2A3D33] text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 space-y-1">
            <span className="font-bold text-[var(--ink)] block">
              Educational Purpose &amp; Regulatory Disclosure:
            </span>
            <p>
              FINROQ is a financial simulation, personal accounting, and wealth projection technology platform developed exclusively for educational, personal organization, and planning purposes. FINROQ is not a SEBI-registered Investment Adviser (RIA), Research Analyst (RA), or Portfolio Manager under SEBI regulations. Simulations, Grey Market Premiums (GMP), and compounding returns are indicative projections and do not constitute financial advice, investment recommendations, or guarantees of future earnings. Always perform independent due diligence or consult a licensed SEBI-registered advisor before executing capital transactions.
            </p>
          </div>

          {/* Bottom Copyright & Telemetry Bar */}
          <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[var(--ink)] font-medium">
                FINROQ Technologies Pvt. Ltd. © 2026. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Live Status: 0.00% Drift Verified
              </span>
              <span>•</span>
              <span>AMFI Feed Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
