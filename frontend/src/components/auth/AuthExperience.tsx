'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { extractErrorMessage } from '@/lib/api-client';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { Eye, EyeOff } from 'lucide-react';

interface AuthExperienceProps {
  initialMode?: 'in' | 'up';
}

export function AuthExperience({ initialMode = 'in' }: AuthExperienceProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const { navigateWithCurtain } = useCurtain();

  const [mode, setMode] = useState<'in' | 'up'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    if (mode === 'up' && !name.trim()) {
      setErrorMessage('Please provide your name so we can personalize your workspace.');
      return;
    }

    try {
      setIsLoading(true);
      if (mode === 'in') {
        await login(trimmedEmail, password);
      } else {
        await register(trimmedEmail, password, name.trim());
      }
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch (err) {
      setErrorMessage(
        extractErrorMessage(
          err,
          mode === 'in'
            ? 'Invalid credentials. Please verify your email and password.'
            : 'Could not create account. Please check your information.'
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login('demo@finroq.com', 'password123');
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch {
      setErrorMessage('Could not sign into demo account. Please verify backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[var(--bg)] text-[var(--ink)]">
      {/* Brand Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 bg-[var(--accent)] text-white p-12 xl:p-16 flex-col justify-between">
        <div>
          <button
            onClick={() => navigateWithCurtain('/', 'finroq', 'back')}
            className="flex items-center gap-2 font-display font-bold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity"
          >
            <span className="w-3 h-3 rounded-full bg-white" />
            finroq
          </button>
        </div>

        <div className="space-y-6 max-w-sm">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Back to a ledger that adds up.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Every transaction categorized, every paisa accounted for, and zero floating-point drift across your entire net worth.
          </p>
        </div>

        <ul className="space-y-4 border-t border-white/20 pt-8 font-mono text-xs text-white/90">
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Argon2id password hashing
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Signed JWT sessions
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Your data is isolated strictly to you
          </li>
        </ul>
      </aside>

      {/* Auth Main Form Area */}
      <main className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div>
          <button
            onClick={() => navigateWithCurtain('/', 'finroq', 'back')}
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            ← Back to website
          </button>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              {mode === 'in' ? 'Welcome back.' : 'Start your ledger.'}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {mode === 'in'
                ? 'Sign in to see where you stand this month.'
                : 'Create an account to bring your budgets and goals together.'}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="mt-8 p-1 rounded-full bg-[var(--surface)] border border-[var(--line)] grid grid-cols-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('in');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-full transition-all ${
                mode === 'in'
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('up');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-full transition-all ${
                mode === 'up'
                  ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'up' && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required={mode === 'up'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nikhil Lakra"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-1 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-pill w-full mt-2 bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)]"
            >
              {isLoading ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
            </button>

            {/* 1-Click Demo Shortcut */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isLoading}
                className="text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--accent)] underline decoration-dotted transition-colors"
              >
                Use the verified demo account (demo@finroq.com)
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-[11px] font-mono text-[var(--muted)]">
            Exact arithmetic NUMERIC(14,2) · Zero floating-point rounding
          </p>
        </div>

        <div className="text-center text-xs text-[var(--muted)] font-mono">
          © {new Date().getFullYear()} FINROQ Engine
        </div>
      </main>
    </div>
  );
}
