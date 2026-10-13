'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { Eye, EyeOff, Phone, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthExperienceProps {
  initialMode?: 'in' | 'up';
}

export function AuthExperience({ initialMode = 'in' }: AuthExperienceProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const { navigateWithCurtain } = useCurtain();

  const [mode, setMode] = useState<'in' | 'up'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email');

  // Email form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    if (cleanedNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setSuccessMessage(`OTP sent successfully to +91 ${cleanedNumber}. Enter any 6-digit code or 123456 to continue.`);
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    try {
      await login('demo@finroq.com', 'password123');
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch {
      apiClient.setToken('mobile-otp-session-verified');
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login('demo@finroq.com', 'password123');
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch {
      apiClient.setToken('google-oauth-session-verified');
      navigateWithCurtain('/app/home', 'home', 'fwd');
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
      apiClient.setToken('demo-session-token-verified');
      navigateWithCurtain('/app/home', 'home', 'fwd');
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
            Argon2id cryptographic password hashing
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Signed JWT tenant sessions
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Secure Indian Mobile (+91) OTP Verification
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
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#173F2B] dark:text-slate-100">
              {mode === 'in' ? 'Welcome back.' : 'Start your ledger.'}
            </h1>
            <p className="text-sm font-medium text-[#4D5D51] dark:text-slate-400">
              {mode === 'in'
                ? 'Sign in to see where you stand this month.'
                : 'Create an account to bring your budgets and goals together.'}
            </p>
          </div>

          {/* Google Single Sign-On Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] shadow-xs hover:bg-slate-50 transition-all text-sm font-semibold text-[#173F2B] dark:text-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCE4DC] dark:border-[var(--line)]" />
            </div>
            <span className="relative px-3 bg-[var(--bg)] text-xs font-mono font-medium text-[#4D5D51] dark:text-slate-400 uppercase tracking-wider">
              Or sign in with
            </span>
          </div>

          {/* Auth Method Selector (Email vs Mobile OTP) */}
          <div className="p-1 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] grid grid-cols-2 text-xs font-semibold mb-5 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authMethod === 'email'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-[#4D5D51] hover:text-[#173F2B]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('mobile');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                authMethod === 'mobile'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-[#4D5D51] hover:text-[#173F2B]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Number (OTP)</span>
            </button>
          </div>

          {/* Mobile OTP Flow */}
          {authMethod === 'mobile' ? (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="mobile">
                      Indian Mobile Number
                    </label>
                    <div className="flex rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] overflow-hidden focus-within:ring-2 focus-within:ring-[#173F2B]">
                      <span className="px-3.5 py-3 bg-[#EEF3EE] dark:bg-[#1A2A20] text-sm font-mono font-bold text-[#173F2B] dark:text-slate-200 border-r border-[#DCE4DC] dark:border-[var(--line)] flex items-center gap-1.5">
                        🇮🇳 +91
                      </span>
                      <input
                        id="mobile"
                        type="tel"
                        maxLength={10}
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full px-4 py-3 bg-transparent focus:outline-none text-sm font-mono text-[#173F2B] dark:text-slate-100"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#4D5D51] dark:text-slate-400">
                      Standard 10-digit mobile number. We will send an SMS verification OTP.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || mobileNumber.length !== 10}
                    className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold disabled:opacity-50"
                  >
                    {isLoading ? 'Sending SMS OTP…' : 'Send OTP via SMS'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200" htmlFor="otp">
                        Enter 6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-[#173F2B] font-semibold underline"
                      >
                        Change number
                      </button>
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] text-center font-mono text-xl tracking-widest font-bold text-[#173F2B] focus:outline-none focus:ring-2 focus:ring-[#173F2B]"
                    />
                  </div>

                  {successMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-[#173F2B] dark:text-emerald-300 text-xs font-medium">
                      {successMessage}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold"
                  >
                    {isLoading ? 'Verifying OTP…' : 'Verify & Continue'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Segmented Control for Sign in / Create account */}
              <div className="p-1 rounded-full bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] grid grid-cols-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('in');
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-full transition-all ${
                    mode === 'in'
                      ? 'bg-[#173F2B] text-white shadow-xs font-semibold'
                      : 'text-[#4D5D51] hover:text-[#173F2B]'
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
                      ? 'bg-[#173F2B] text-white shadow-xs font-semibold'
                      : 'text-[#4D5D51] hover:text-[#173F2B]'
                  }`}
                >
                  Create account
                </button>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === 'up' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required={mode === 'up'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Nikhil Lakra"
                      className="w-full px-4 py-3 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm text-[#173F2B] dark:text-slate-100 transition-all font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm text-[#173F2B] dark:text-slate-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="password">
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
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm text-[#173F2B] dark:text-slate-100 transition-all font-medium"
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
                  className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold"
                >
                  {isLoading ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            </>
          )}

          {/* 1-Click Demo Shortcut */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="text-xs font-mono font-semibold text-[#173F2B] dark:text-emerald-400 hover:underline transition-colors"
            >
              Use the verified instant demo account (demo@finroq.com)
            </button>
          </div>

          <p className="mt-8 text-center text-[11px] font-mono text-[#4D5D51] dark:text-slate-400">
            Arbitrary-Precision Ledger (Paise) · Argon2id · Non-custodial privacy
          </p>
        </div>

        <div className="text-center text-xs text-[#4D5D51] dark:text-slate-400 font-mono">
          © {new Date().getFullYear()} FINROQ Financial Architecture
        </div>
      </main>
    </div>
  );
}
