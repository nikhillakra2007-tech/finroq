'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function GoogleAuthPopupPage() {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Suggested accounts
  const accounts = [
    {
      name: 'Nikhil Lakra',
      email: 'nikhillakra2007@gmail.com',
      avatarColor: 'bg-blue-600',
      initial: 'N',
    },
    {
      name: 'Demo Finroq Account',
      email: 'demo.finroq@gmail.com',
      avatarColor: 'bg-emerald-600',
      initial: 'D',
    },
  ];

  const handleSignIn = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('@googlemail.com')) {
      setErrorMessage('Please enter a valid Google account ending in @gmail.com.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedEmail(cleanEmail);

    try {
      const res = await apiClient.googleLogin({
        email: cleanEmail,
        full_name: name || cleanEmail.split('@')[0],
      });

      const token = res.data?.access_token || 'demo-google-token-verified';
      const user = res.data?.user || { email: cleanEmail, full_name: name || cleanEmail.split('@')[0] };

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('finroq_logged_out');
        localStorage.removeItem('finroq_logged_out');
        localStorage.setItem('finroq_token', token);
        localStorage.setItem('finroq_google_auth_done', String(Date.now()));
      }

      setSuccess(true);

      // Post message to the parent window that opened this popup
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
          // Ignore postMessage cross-origin exception
        }
        setTimeout(() => {
          try {
            window.close();
          } catch {
            window.location.href = '/app/home';
          }
        }, 600);
      } else {
        // Direct window navigation fallback
        setTimeout(() => {
          window.location.href = '/app/home';
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to authenticate with Google.');
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    handleSignIn(customEmail, customName);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#1F1F1F] flex flex-col justify-between p-4 sm:p-6 font-sans select-none antialiased">
      {/* Top indeterminate progress bar when loading */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-50">
          <div className="h-full bg-[#1A73E8] animate-pulse w-full" />
        </div>
      )}

      <div className="w-full max-w-[440px] mx-auto my-auto bg-white rounded-[28px] border border-[#E1E3E1] shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden p-8 space-y-6">
        {/* Google Logo & Title */}
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

          <div>
            <h1 className="text-2xl font-normal text-[#1F1F1F] tracking-tight">
              {success ? 'Signed in successfully' : 'Choose an account'}
            </h1>
            <p className="text-sm text-[#444746] mt-1">
              to continue to <span className="font-semibold text-[#1F1F1F]">FINROQ</span>
            </p>
          </div>
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
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-xl font-bold">
              ✓
            </div>
            <p className="text-sm font-medium text-[#1F1F1F]">
              Welcome back! Closing window and returning to Finroq...
            </p>
          </div>
        ) : !showCustomInput ? (
          /* Accounts List */
          <div className="space-y-1 divide-y divide-[#E1E3E1]/60">
            {accounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={isLoading}
                onClick={() => handleSignIn(acc.email, acc.name)}
                className="w-full flex items-center gap-4 py-3.5 px-2 rounded-xl hover:bg-[#F0F4F9] transition-colors text-left group cursor-pointer disabled:opacity-50"
              >
                <div
                  className={`w-10 h-10 rounded-full ${acc.avatarColor} text-white font-semibold flex items-center justify-center text-base shadow-xs shrink-0`}
                >
                  {acc.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1F1F1F] truncate group-hover:text-[#1A73E8] transition-colors">
                    {acc.name}
                  </p>
                  <p className="text-xs text-[#444746] truncate">{acc.email}</p>
                </div>
                {selectedEmail === acc.email && isLoading && (
                  <div className="w-4 h-4 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </button>
            ))}

            {/* Use another account option */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-4 py-3.5 px-2 rounded-xl hover:bg-[#F0F4F9] transition-colors text-left group cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-[#E1E3E1] text-[#444746] flex items-center justify-center text-lg shrink-0">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1F1F1F] group-hover:text-[#1A73E8] transition-colors">
                  Use another account
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* Custom Email Entry Form (Google style) */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="customEmail" className="block text-xs font-medium text-[#444746]">
                Google Account (Email or phone)
              </label>
              <input
                id="customEmail"
                type="email"
                autoFocus
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-4 py-3 rounded-lg border border-[#747775] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-sm text-[#1F1F1F]"
              />
              <p className="text-[11px] text-[#444746]">Must be a valid @gmail.com address</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="customName" className="block text-xs font-medium text-[#444746]">
                Your Name (Optional)
              </label>
              <input
                id="customName"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-lg border border-[#747775] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 outline-none text-sm text-[#1F1F1F]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="text-xs font-semibold text-[#1A73E8] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Back to accounts
              </button>

              <button
                type="submit"
                disabled={isLoading || !customEmail.trim()}
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
