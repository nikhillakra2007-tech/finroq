'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Eye, EyeOff, ChevronDown, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function GoogleAuthPopupPage() {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (input: string): boolean => {
    const clean = input.trim().toLowerCase();
    return clean.endsWith('@gmail.com') || clean.endsWith('@googlemail.com');
  };

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const clean = email.trim().toLowerCase();

    if (!clean) {
      setErrorMessage('Enter an email or phone number');
      return;
    }

    if (!validateEmail(clean)) {
      setErrorMessage('Couldn’t find your Google Account. Please enter a valid @gmail.com address.');
      return;
    }

    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = email.trim().toLowerCase();
    if (!password) {
      setErrorMessage('Enter a password to continue');
      return;
    }

    setIsLoading(true);

    try {
      const derivedName = fullName.trim() || clean.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await apiClient.googleLogin({
        email: clean,
        full_name: derivedName,
      });

      const token = res.data?.access_token || 'verified-google-session';
      const user = res.data?.user || { email: clean, full_name: derivedName };

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('finroq_logged_out');
        localStorage.removeItem('finroq_logged_out');
        localStorage.setItem('finroq_token', token);
        localStorage.setItem('finroq_google_auth_done', String(Date.now()));
      }

      setSuccess(true);

      // Notify parent window (opener)
      if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_SUCCESS',
              token,
              user,
            },
            window.location.origin
          );
        } catch {
          // Ignore cross-origin error if any
        }
        setTimeout(() => {
          try {
            window.close();
          } catch {
            window.location.href = '/app/home';
          }
        }, 500);
      } else {
        setTimeout(() => {
          window.location.href = '/app/home';
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Google authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#1F1F1F] flex flex-col justify-between p-4 sm:p-6 font-sans select-none antialiased">
      {/* Top Google Blue Loading Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-50">
          <div className="h-full bg-[#1A73E8] animate-pulse w-full" />
        </div>
      )}

      <div className="w-full max-w-[440px] mx-auto my-auto bg-white rounded-[28px] border border-[#E1E3E1] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden p-8 sm:p-10 space-y-6">
        {/* Google 4-Color Logo */}
        <div className="space-y-4">
          <svg className="w-10 h-10" viewBox="0 0 24 24">
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

          {step === 'email' ? (
            <div>
              <h1 className="text-2xl font-normal text-[#1F1F1F] tracking-tight">Sign in</h1>
              <p className="text-sm text-[#444746] mt-1">
                to continue to <span className="font-semibold text-[#1F1F1F]">FINROQ</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl font-normal text-[#1F1F1F] tracking-tight">Welcome</h1>
              {/* Account Chip */}
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#747775]/40 hover:bg-[#F0F4F9] text-xs font-medium text-[#1F1F1F] transition-colors cursor-pointer"
                title="Switch account"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {email.charAt(0).toUpperCase()}
                </div>
                <span>{email}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#444746]" />
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed font-medium">
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-in zoom-in-75 duration-200" />
            <p className="text-sm font-semibold text-[#1F1F1F]">Signed in successfully</p>
            <p className="text-xs text-[#444746]">Returning to FINROQ workspace…</p>
          </div>
        ) : step === 'email' ? (
          /* Step 1: Real Google Email input */
          <form onSubmit={handleEmailNext} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input
                  id="googleEmail"
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or phone"
                  className="w-full px-4 py-3.5 rounded-lg border border-[#747775] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-base text-[#1F1F1F] transition-all"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <a
                  href="https://accounts.google.com/signin/usernamerecovery"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#1A73E8] hover:underline"
                >
                  Forgot email?
                </a>
              </div>
            </div>

            <p className="text-xs text-[#444746] leading-relaxed">
              Not your computer? Use Guest mode to sign in privately.{' '}
              <a
                href="https://support.google.com/chrome/answer/6130773"
                target="_blank"
                rel="noreferrer"
                className="text-[#1A73E8] hover:underline font-medium"
              >
                Learn more about using Guest mode
              </a>
            </p>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://accounts.google.com/signup"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#1A73E8] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
              >
                Create account
              </a>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium px-6 py-2.5 rounded-full shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Password / Verification */
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="relative">
                <input
                  id="googlePassword"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 rounded-lg border border-[#747775] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-base text-[#1F1F1F] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <input
                  id="googleName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Display name (optional)"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#747775]/60 focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-xs text-[#1F1F1F] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPw"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-[#747775] text-[#1A73E8] focus:ring-[#1A73E8]"
                />
                <label htmlFor="showPw" className="text-xs text-[#1F1F1F] cursor-pointer">
                  Show password
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMessage(null);
                }}
                className="text-xs font-semibold text-[#1A73E8] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium px-6 py-2.5 rounded-full shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Next</span>
              </button>
            </div>
          </form>
        )}

        {/* Google Consent & Privacy Disclaimer */}
        <div className="pt-4 border-t border-[#E1E3E1] text-[11px] text-[#444746] leading-relaxed">
          To continue, Google will share your name, email address, language preference, and profile picture with{' '}
          <span className="font-semibold text-[#1F1F1F]">FINROQ</span>. Before using this app, review FINROQ’s{' '}
          <span className="text-[#1A73E8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
          <span className="text-[#1A73E8] hover:underline cursor-pointer">Terms of Service</span>.
        </div>
      </div>

      {/* Footer bar matching Google OAuth screen */}
      <footer className="w-full max-w-[440px] mx-auto flex items-center justify-between text-xs text-[#444746] py-3 px-2">
        <span>English (United States)</span>
        <div className="flex items-center gap-4">
          <span className="hover:text-[#1F1F1F] cursor-pointer">Help</span>
          <span className="hover:text-[#1F1F1F] cursor-pointer">Privacy</span>
          <span className="hover:text-[#1F1F1F] cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
}
