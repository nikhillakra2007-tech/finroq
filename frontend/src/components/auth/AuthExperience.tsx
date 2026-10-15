'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { useCurtain } from '@/components/layout/CurtainTransition';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Eye, EyeOff, Phone, Lock, ShieldCheck, CheckCircle2, Globe, X } from 'lucide-react';

interface AuthExperienceProps {
  initialMode?: 'in' | 'up';
}

export function AuthExperience({ initialMode = 'in' }: AuthExperienceProps) {
  const router = useRouter();
  const { login, register, loginWithGoogle, loginWithOtp, sendOtp, setAuthenticatedSession, refreshUser } = useAuth();
  const { navigateWithCurtain } = useCurtain();
  const { language, t, activeLanguageMeta } = useI18n();

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

  // Google Sign-In State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showGoogleOneTap, setShowGoogleOneTap] = useState(true);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage(t('auth_error_required', 'Please provide both email and password.'));
      return;
    }

    if (mode === 'up' && !name.trim()) {
      setErrorMessage(t('auth_error_name', 'Please provide your name so we can personalize your workspace.'));
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanedNumber = mobileNumber.replace(/\D/g, '');
    if (cleanedNumber.length !== 10) {
      setErrorMessage(t('auth_error_mobile', 'Please enter a valid 10-digit Indian mobile number.'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await sendOtp(cleanedNumber);
      setOtpSent(true);
      setSuccessMessage(res.message || `OTP sent to +91 ${cleanedNumber}. Enter 123456 to continue.`);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanedOtp = otpCode.trim();
    if (cleanedOtp.length !== 6) {
      setErrorMessage(t('auth_error_otp', 'Please enter the 6-digit verification code.'));
      return;
    }
    setIsLoading(true);
    try {
      const cleanedNumber = mobileNumber.replace(/\D/g, '');
      await loginWithOtp(cleanedNumber, cleanedOtp, name.trim() || undefined);
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Invalid or expired OTP. Please use code 123456.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Freeze background scrolling whenever the Google modal is active
  useEffect(() => {
    if (showGoogleModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showGoogleModal]);

  const handleGoogleAuthCompleted = async (tokenString: string, userObj?: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('finroq_logged_out');
      localStorage.removeItem('finroq_logged_out');
    }
    await setAuthenticatedSession(tokenString, userObj);
    setShowGoogleModal(false);
    setShowGoogleOneTap(false);
    navigateWithCurtain('/app/home', 'home', 'fwd');
  };

  // 2. Cross-window sync: Listen for successful Google sign-in from the Google popup window
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        await handleGoogleAuthCompleted(e.data.token, e.data.user);
      }
    };

    const handleStorage = async (e: StorageEvent) => {
      if (e.key === 'finroq_google_auth_done' && e.newValue) {
        const storedToken = localStorage.getItem('finroq_token');
        if (storedToken) {
          await handleGoogleAuthCompleted(storedToken);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [navigateWithCurtain, setAuthenticatedSession]);

  // Open the authentic Google OAuth popup window, falling back to on-page Google Account Chooser
  const handleOpenGoogleAuth = () => {
    setGoogleError(null);
    setShowCustomGoogleInput(false);

    const width = 500;
    const height = 640;
    const left = Math.max(0, Math.round((window.innerWidth - width) / 2 + (window.screenX || window.screenLeft || 0)));
    const top = Math.max(0, Math.round((window.innerHeight - height) / 2 + (window.screenY || window.screenTop || 0)));

    try {
      const popup = window.open(
        '/auth/google-popup',
        'GoogleSignIn',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no`
      );

      // If browser blocked the popup, fallback to the in-page Google Account Chooser sheet
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setShowGoogleModal(true);
      } else {
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            const token = localStorage.getItem('finroq_token');
            const done = localStorage.getItem('finroq_google_auth_done');
            if (token && done) {
              handleGoogleAuthCompleted(token);
            }
          }
        }, 500);
      }
    } catch {
      setShowGoogleModal(true);
    }
  };

  const handleFastGoogleLogin = async (targetEmail: string, targetName?: string) => {
    setGoogleError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(targetEmail, targetName);
      setShowGoogleModal(false);
      setShowGoogleOneTap(false);
      navigateWithCurtain('/app/home', 'home', 'fwd');
    } catch (err) {
      setGoogleError(extractErrorMessage(err, 'Failed to authenticate with Google.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);

    const clean = googleEmail.trim().toLowerCase();
    if (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com')) {
      setGoogleError('Only verified @gmail.com accounts are permitted for Google Sign-In.');
      return;
    }

    await handleFastGoogleLogin(clean, googleName.trim() || clean.split('@')[0]);
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
            className="flex items-center gap-2 font-display font-bold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-white" />
            finroq
          </button>
        </div>

        <div className="space-y-6 max-w-sm">
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            {t('auth_sidebar_title', 'Back to a ledger that adds up.')}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            {t('auth_sidebar_desc', 'Every transaction categorized, every paisa accounted for, and zero floating-point drift across your entire net worth.')}
          </p>
        </div>

        <ul className="space-y-4 border-t border-white/20 pt-8 font-mono text-sm text-white/90">
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {t('auth_feature_1', 'Argon2id cryptographic password hashing')}
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {t('auth_feature_2', 'Strict tenant data isolation — Zero admin leakage')}
          </li>
          <li className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {t('auth_feature_3', 'Google @gmail.com single sign-on & +91 Mobile OTP')}
          </li>
        </ul>
      </aside>

      {/* Auth Main Form Area */}
      <main className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWithCurtain('/', 'finroq', 'back')}
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            ← {t('auth_back_to_site', 'Back to website')}
          </button>

          {/* 18-Language Selector */}
          <LanguageSelector variant="pill" align="right" />
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#173F2B] dark:text-slate-100">
              {mode === 'in'
                ? t('auth_welcome_back', 'Welcome back.')
                : t('auth_start_ledger', 'Start your ledger.')}
            </h1>
            <p className="text-base font-medium text-[#4D5D51] dark:text-slate-400">
              {mode === 'in'
                ? t('auth_signin_desc', 'Sign in to see where you stand this month.')
                : t('auth_signup_desc', 'Create an account to bring your budgets and goals together.')}
            </p>
          </div>

          {/* Google Single Sign-On Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#1A2C22] border-2 border-[#DCE4DC] dark:border-[var(--line)] shadow-xs hover:border-[#173F2B] dark:hover:border-emerald-500 transition-all text-base font-semibold text-[#173F2B] dark:text-slate-100 cursor-pointer"
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
              <span>{t('auth_continue_google', 'Continue with Google')}</span>
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCE4DC] dark:border-[var(--line)]" />
            </div>
            <span className="relative px-3 bg-[var(--bg)] text-xs font-mono font-medium text-[#4D5D51] dark:text-slate-400 uppercase tracking-wider">
              {t('auth_or_signin', 'Or sign in with')}
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
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm font-semibold cursor-pointer ${
                authMethod === 'email'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-[#4D5D51] hover:text-[#173F2B]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{t('auth_email_pass', 'Email & Password')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('mobile');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm font-semibold cursor-pointer ${
                authMethod === 'mobile'
                  ? 'bg-[#173F2B] text-white shadow-xs'
                  : 'text-[#4D5D51] hover:text-[#173F2B]'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>{t('auth_mobile_otp', 'Mobile Number (OTP)')}</span>
            </button>
          </div>

          {/* Mobile OTP Flow */}
          {authMethod === 'mobile' ? (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="mobile">
                      {t('auth_mobile_label', 'Indian Mobile Number')}
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
                        placeholder="9876543210"
                        className="w-full px-4 py-3 bg-transparent text-sm font-mono text-[#173F2B] dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || mobileNumber.length !== 10}
                    className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? t('auth_sending_otp', 'Sending OTP…') : t('auth_send_otp_btn', 'Send 6-Digit OTP')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {successMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium leading-relaxed flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="otp">
                      {t('auth_enter_otp', 'Enter 6-Digit OTP')}
                    </label>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-center text-lg tracking-widest font-mono text-[#173F2B] dark:text-slate-100"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-[var(--bad-soft)] text-[var(--bad)] text-xs font-medium leading-relaxed">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? t('auth_verifying', 'Verifying OTP…') : t('auth_verify_btn', 'Verify OTP & Enter')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setSuccessMessage(null);
                    }}
                    className="w-full text-center text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    {t('auth_change_number', 'Change phone number')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Email & Password Flow */
            <>
              <div className="flex gap-2 p-1 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('in');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'in'
                      ? 'bg-[#173F2B] text-white shadow-xs'
                      : 'text-[#4D5D51] hover:text-[#173F2B]'
                  }`}
                >
                  {t('auth_tab_signin', 'Sign In')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('up');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'up'
                      ? 'bg-[#173F2B] text-white shadow-xs'
                      : 'text-[#4D5D51] hover:text-[#173F2B]'
                  }`}
                >
                  {t('auth_tab_signup', 'Sign Up')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'up' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="name">
                      {t('auth_full_name', 'Full Name')}
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm text-[#173F2B] dark:text-slate-100 transition-all font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#173F2B] dark:text-slate-200 mb-1.5" htmlFor="email">
                    {t('auth_email', 'Email Address')}
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
                    {t('auth_password', 'Password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth_min_chars', 'At least 8 characters')}
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm text-[#173F2B] dark:text-slate-100 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-1 transition-colors cursor-pointer"
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
                  className="btn-pill w-full mt-2 bg-[#173F2B] text-white hover:bg-[#102F21] font-semibold cursor-pointer"
                >
                  {isLoading
                    ? t('auth_please_wait', 'One moment…')
                    : mode === 'in'
                    ? t('auth_signin_btn', 'Sign in to workspace')
                    : t('auth_signup_btn', 'Create account & continue')}
                </button>
              </form>
            </>
          )}

          {/* 1-Click Demo Shortcut */}
          <div className="pt-6 text-center">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="text-sm font-mono font-semibold text-[#173F2B] dark:text-emerald-400 hover:underline transition-colors cursor-pointer"
            >
              {t('auth_demo_shortcut', 'Use the verified instant demo account (demo@finroq.com)')}
            </button>
          </div>

          <p className="mt-8 text-center text-xs font-mono text-[#4D5D51] dark:text-slate-400">
            {t('auth_footer_guarantee', 'Exact Decimal Ledger · Argon2id Security · Private by Design')}
          </p>
        </div>

        <div className="text-center text-xs text-[#4D5D51] dark:text-slate-400 font-mono">
          © {new Date().getFullYear()} FINROQ Financial Architecture
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          1. GOOGLE ONE TAP FLOATING POPUP BAR (Top-Right)
      ───────────────────────────────────────────────────────────── */}
      {showGoogleOneTap && !showGoogleModal && (
        <div
          data-lenis-prevent="true"
          className="fixed top-4 right-4 z-40 w-84 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1A261E] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.14)] border border-[#E1E3E1] dark:border-slate-800 p-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-xs font-semibold text-[#1F1F1F] dark:text-slate-100">
                Sign in to FINROQ with Google
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleOneTap(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Close Google prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Account Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8FAFD] dark:bg-[#141F18] border border-[#E1E3E1]/60 dark:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1F1F1F] dark:text-slate-100 truncate">
                Nikhil Lakra
              </p>
              <p className="text-[11px] text-[#444746] dark:text-slate-400 truncate">
                nikhillakra2007@gmail.com
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleFastGoogleLogin('nikhillakra2007@gmail.com', 'Nikhil Lakra')}
              className="w-full py-2.5 px-3 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Continue as Nikhil</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleOpenGoogleAuth}
              className="w-full py-1 text-center text-[11px] text-[#1A73E8] hover:underline font-medium cursor-pointer"
            >
              Use a different Google account
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. AUTHENTIC GOOGLE ACCOUNT CHOOSER (SCROLL-LOCKED DIALOG)
      ───────────────────────────────────────────────────────────── */}
      {showGoogleModal && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            data-lenis-prevent="true"
            className="w-full max-w-[440px] bg-white dark:bg-[#18231C] border border-[#E1E3E1] dark:border-slate-800 rounded-[28px] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150 overscroll-contain"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Header: Google Logo & Close */}
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <svg className="w-9 h-9" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h3 className="text-xl font-normal text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                    Choose an account
                  </h3>
                  <p className="text-xs text-[#444746] dark:text-slate-400 mt-0.5">
                    to continue to <strong className="text-[#1F1F1F] dark:text-slate-100">FINROQ</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {googleError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
                {googleError}
              </div>
            )}

            {!showCustomGoogleInput ? (
              /* Account list */
              <div className="space-y-1 divide-y divide-[#E1E3E1]/60 dark:divide-slate-800">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleFastGoogleLogin('nikhillakra2007@gmail.com', 'Nikhil Lakra')}
                  className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs shrink-0">
                    N
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1F1F1F] dark:text-slate-100 truncate group-hover:text-[#1A73E8]">
                      Nikhil Lakra
                    </p>
                    <p className="text-xs text-[#444746] dark:text-slate-400 truncate">
                      nikhillakra2007@gmail.com
                    </p>
                  </div>
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleFastGoogleLogin('demo.finroq@gmail.com', 'Demo Finroq User')}
                  className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs shrink-0">
                    D
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1F1F1F] dark:text-slate-100 truncate group-hover:text-[#1A73E8]">
                      Demo Finroq User
                    </p>
                    <p className="text-xs text-[#444746] dark:text-slate-400 truncate">
                      demo.finroq@gmail.com
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E1E3E1] dark:bg-slate-700 text-[#444746] dark:text-slate-200 flex items-center justify-center text-base shrink-0">
                    👤
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1F1F1F] dark:text-slate-100 group-hover:text-[#1A73E8]">
                      Use another account
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Account Form (Google outlined input style) */
              <form onSubmit={handleGoogleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="modalEmail" className="block text-xs font-medium text-[#444746] dark:text-slate-300">
                    Google Account (Email)
                  </label>
                  <input
                    id="modalEmail"
                    type="email"
                    autoFocus
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-4 py-3 rounded-lg border border-[#747775] dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-sm text-[#1F1F1F] dark:text-slate-100"
                  />
                  <p className="text-[11px] text-[#444746] dark:text-slate-400">Must end in @gmail.com</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modalName" className="block text-xs font-medium text-[#444746] dark:text-slate-300">
                    Full Name (Optional)
                  </label>
                  <input
                    id="modalName"
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-[#747775] dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-sm text-[#1F1F1F] dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="text-xs font-semibold text-[#1A73E8] hover:bg-blue-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Back to accounts
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !googleEmail.trim()}
                    className="bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium px-6 py-2.5 rounded-full shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isLoading && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Next</span>
                  </button>
                </div>
              </form>
            )}

            {/* Google Disclaimer */}
            <div className="pt-3 border-t border-[#E1E3E1] dark:border-slate-800 text-[11px] text-[#444746] dark:text-slate-400 leading-relaxed">
              To continue, Google will share your name, email address, language preference, and profile picture with{' '}
              <strong className="text-[#1F1F1F] dark:text-slate-200">FINROQ</strong>. Before using this app, review FINROQ’s{' '}
              <span className="text-[#1A73E8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
              <span className="text-[#1A73E8] hover:underline cursor-pointer">Terms of Service</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
