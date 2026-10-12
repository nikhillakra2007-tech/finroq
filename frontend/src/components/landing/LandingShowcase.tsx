'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Wallet,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Lock,
  Activity,
  Send,
  Target,
  BarChart3,
  CreditCard,
} from 'lucide-react';

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [email, setEmail] = useState('demo@finroq.com');
  const [password, setPassword] = useState('password123');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'accounting' | 'ai'>('accounting');

  const handleInstantDemo = async () => {
    setIsDemoLoading(true);
    setAuthError(null);
    try {
      await login('demo@finroq.com', 'password123');
      if (onEnterApp) {
        onEnterApp();
      } else {
        router.push('/');
      }
    } catch {
      setAuthError('Unable to connect to demo account. Please ensure the backend is running.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoLoading(true);
    setAuthError(null);
    try {
      await login(email, password);
      if (onEnterApp) {
        onEnterApp();
      } else {
        router.push('/');
      }
    } catch {
      setAuthError('Invalid credentials. Try using the 1-Click Demo below.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finroq-ivory text-finroq-text selection:bg-finroq-lime selection:text-finroq-forest">
      {/* Eye-soothing Ambient Gradient Background */}
      <div className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-finroq-mint/60 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-finroq-forest rounded-2xl shadow-sm">
                <Wallet className="h-6 w-6 text-finroq-lime" />
              </div>
              <span className="text-2xl font-black font-heading tracking-tight text-finroq-forest">
                FINROQ
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={onEnterApp ? onEnterApp : () => router.push('/')}
                  className="btn btn-lime text-xs sm:text-sm px-4 py-2"
                >
                  Enter Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </button>
              ) : (
                <button
                  onClick={handleInstantDemo}
                  disabled={isDemoLoading}
                  className="btn btn-lime text-xs sm:text-sm px-4 py-2"
                >
                  {isDemoLoading ? 'Entering...' : '1-Click Demo'} <ArrowRight className="h-4 w-4 ml-1.5" />
                </button>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-finroq-mint border border-finroq-sage/60 text-finroq-forest text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5 text-finroq-forest" />
              FINANCIAL ARCHITECTURE & INTELLIGENCE
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-heading text-finroq-text tracking-tight leading-[1.1] mb-6">
              Financial clarity, engineered with{' '}
              <span className="text-finroq-forest underline decoration-finroq-lime decoration-4 underline-offset-6">
                mathematical precision
              </span>
              .
            </h1>

            <p className="text-lg sm:text-xl text-finroq-muted leading-relaxed mb-10">
              A serene personal finance operating system. Eliminates floating-point rounding errors with arbitrary-precision decimal math, paired with private, zero-hallucination AI intelligence.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleInstantDemo}
                disabled={isDemoLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isDemoLoading ? (
                  'Launching Demo...'
                ) : (
                  <>
                    Explore Live Platform (1-Click)
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-finroq-text bg-white hover:bg-finroq-mint/50 border border-finroq-border shadow-xs hover:-translate-y-0.5 transition-all duration-200"
              >
                Inspect Major Features
              </a>
            </div>
          </div>

          {/* Interactive Feature Switcher Bar */}
          <div id="features" className="scroll-mt-16 mb-16">
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 bg-white border border-finroq-border rounded-2xl shadow-xs">
                <button
                  onClick={() => setActiveFeatureTab('accounting')}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeFeatureTab === 'accounting'
                      ? 'bg-finroq-forest text-white shadow-xs'
                      : 'text-finroq-muted hover:text-finroq-text hover:bg-finroq-mint/40'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Feature 1: Deterministic Accounting Engine
                </button>
                <button
                  onClick={() => setActiveFeatureTab('ai')}
                  className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeFeatureTab === 'ai'
                      ? 'bg-finroq-forest text-white shadow-xs'
                      : 'text-finroq-muted hover:text-finroq-text hover:bg-finroq-mint/40'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Feature 2: Safe 3-Layer AI Intelligence
                </button>
              </div>
            </div>

            {/* FEATURE 1: DETERMINISTIC ACCOUNTING ENGINE */}
            {activeFeatureTab === 'accounting' && (
              <div className="grid lg:grid-cols-12 gap-8 items-center bg-white border border-finroq-border rounded-3xl p-6 sm:p-10 shadow-sm transition-all duration-300">
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Layer A — Authoritative Financial Ground Truth
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-finroq-text tracking-tight">
                    Arbitrary-Precision Ledger & Real-Time Balance Sheet
                  </h2>

                  <p className="text-finroq-muted leading-relaxed">
                    Most financial applications silently lose cents due to IEEE 754 binary floating-point rounding errors. FINROQ enforces arbitrary-precision decimal math with Python <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-finroq-forest font-mono">Decimal</code> and PostgreSQL <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-finroq-forest font-mono">NUMERIC(14, 2)</code>.
                  </p>

                  <ul className="space-y-3">
                    {[
                      'Real-time Net Worth calculation: Total Assets ($79,200.00) minus Liabilities ($1,250.00).',
                      'Atomic transfer reconciliation ensuring zero-sum movement between accounts.',
                      'Calendar month clamping (28th–31st) with leap-year auto-restoration for recurring transactions.',
                      'Category budget utilization gauges with instant overspending alarms.',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-finroq-text">
                        <CheckCircle2 className="h-4 w-4 text-finroq-positive shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <button
                      onClick={handleInstantDemo}
                      className="btn btn-primary text-sm px-5 py-2.5"
                    >
                      Test Ledger In Live App <ArrowRight className="h-4 w-4 ml-1.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive Accounting Card Preview */}
                <div className="lg:col-span-6 bg-finroq-ivory border border-finroq-border rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-finroq-border">
                    <span className="text-xs font-bold text-finroq-muted uppercase tracking-wider">
                      Live Balance Sheet Preview
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-finroq-mint text-finroq-positive">
                      Audited (0.00 Drift)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-finroq-border shadow-xs">
                      <p className="text-xs text-finroq-muted font-medium mb-1">Liquid Assets</p>
                      <p className="font-mono text-xl font-bold text-finroq-positive">$79,200.00</p>
                      <span className="text-[10px] text-finroq-muted">Checking, Savings, Brokerage</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-finroq-border shadow-xs">
                      <p className="text-xs text-finroq-muted font-medium mb-1">Liabilities</p>
                      <p className="font-mono text-xl font-bold text-finroq-negative">$1,250.00</p>
                      <span className="text-[10px] text-finroq-muted">Credit Card Balance</span>
                    </div>
                  </div>

                  <div className="bg-finroq-forest text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <p className="text-xs text-finroq-lime font-medium">Net Worth (Equity)</p>
                      <p className="font-mono text-2xl font-black tracking-tight">$77,950.00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">Debt-to-Asset</p>
                      <p className="font-mono text-sm font-bold text-finroq-lime">1.58% (Healthy)</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-4 rounded-xl border border-finroq-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-finroq-text">Housing Budget ($2,200/mo)</span>
                      <span className="font-mono font-bold text-finroq-positive">95.4% Utilized</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-finroq-forest h-2 rounded-full" style={{ width: '95.4%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURE 2: SAFE 3-LAYER AI INTELLIGENCE */}
            {activeFeatureTab === 'ai' && (
              <div className="grid lg:grid-cols-12 gap-8 items-center bg-white border border-finroq-border rounded-3xl p-6 sm:p-10 shadow-sm transition-all duration-300">
                <div className="lg:col-span-6 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    Layer C — Zero-Hallucination Explanations & Q&A
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-finroq-text tracking-tight">
                    Private Financial Intelligence & Spending Assistant
                  </h2>

                  <p className="text-finroq-muted leading-relaxed">
                    AI must explain verified facts, not invent them. FINROQ enforces an isolated 3-layer architecture: Layer A computes deterministic figures, Layer B strips PII and credentials, and Layer C invokes Google Gemini with prompt injection protection.
                  </p>

                  <ul className="space-y-3">
                    {[
                      'Financial Explainer translates monthly income, burn rate, and overruns into plain English.',
                      'Interactive Spending Assistant answers questions about your habits with prompt injection guards.',
                      'Goal Timeline Simulator calculates exact funding gaps and months needed to reach targets.',
                      'Deterministic heuristic fallback: Never fails or crashes even if external AI is offline.',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-finroq-text">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <button
                      onClick={handleInstantDemo}
                      className="btn btn-primary text-sm px-5 py-2.5"
                    >
                      Try AI Assistant In Live App <ArrowRight className="h-4 w-4 ml-1.5" />
                    </button>
                  </div>
                </div>

                {/* Interactive AI Assistant Preview */}
                <div className="lg:col-span-6 bg-finroq-ivory border border-finroq-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-finroq-text">FINROQ AI Assistant Preview</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Gemini 1.5 Flash
                    </span>
                  </div>

                  {/* Simulated User Question */}
                  <div className="flex justify-end">
                    <div className="bg-finroq-forest text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[80%] shadow-xs">
                      &quot;How much do I need to save monthly to reach $10,000 in 6 months?&quot;
                    </div>
                  </div>

                  {/* Simulated AI Answer */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-finroq-border text-finroq-text text-xs p-3.5 rounded-2xl rounded-tl-xs max-w-[90%] shadow-xs space-y-2">
                      <p className="font-semibold text-finroq-forest">
                        🎯 Goal Simulation Analysis:
                      </p>
                      <p className="text-finroq-muted leading-relaxed">
                        With current savings at <strong className="text-finroq-text">$6,500.00</strong>, your remaining funding gap is <strong className="text-finroq-text">$3,500.00</strong>.
                      </p>
                      <div className="p-2.5 bg-finroq-mint rounded-xl text-[11px] font-medium text-finroq-positive">
                        Recommendation: Allocate $583.33/month. At your current net cash flow of +$2,923.20/mo, this goal is fully achievable.
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-finroq-border rounded-xl flex items-center justify-between text-xs text-finroq-muted">
                    <span>Monthly Quota: 8 / 10 remaining</span>
                    <span className="font-bold text-finroq-forest">Encrypted & Isolated</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seamless Authentication & Instant Launch Box */}
          <div className="max-w-xl mx-auto bg-white border border-finroq-border rounded-3xl p-8 sm:p-10 shadow-md text-center">
            <div className="inline-flex p-3 bg-finroq-forest rounded-2xl shadow-sm mb-4">
              <Lock className="h-6 w-6 text-finroq-lime" />
            </div>

            <h3 className="text-2xl font-bold font-heading text-finroq-text mb-2">
              Ready to experience FINROQ?
            </h3>
            <p className="text-sm text-finroq-muted mb-6">
              Launch directly into the pre-loaded live environment with realistic transactions, budgets, and AI insights in 1 click.
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-finroq-negative font-medium">
                {authError}
              </div>
            )}

            <button
              onClick={handleInstantDemo}
              disabled={isDemoLoading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-finroq-forest-deep bg-finroq-lime hover:brightness-95 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mb-4"
            >
              {isDemoLoading ? (
                'Connecting to Platform...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Launch Live Platform as Alex Morgan (Demo)
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-finroq-muted pt-2 border-t border-finroq-border">
              <Link href="/login" className="hover:text-finroq-forest font-medium underline">
                Sign in with existing credentials
              </Link>
              <span>•</span>
              <Link href="/register" className="hover:text-finroq-forest font-medium underline">
                Create new private account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
