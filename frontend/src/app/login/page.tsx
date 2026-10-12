'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { extractErrorMessage } from '@/lib/api-client';
import { Input, Button, Card } from '@/components/ui';
import { Wallet, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      router.push('/');
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Invalid credentials. Please verify your email and password.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsDemoLoading(true);
    setErrorMessage(null);
    try {
      await login('demo@finroq.com', 'password123');
      router.push('/');
    } catch {
      setErrorMessage('Unable to log into demo account. Please verify backend service.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-finroq-ivory flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="p-2.5 bg-finroq-forest rounded-2xl shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Wallet className="h-6 w-6 text-finroq-lime" />
          </div>
          <span className="text-2xl font-black font-heading text-finroq-forest tracking-tight">FINROQ</span>
        </Link>
        <h1 className="text-3xl font-extrabold font-heading text-finroq-text tracking-tight">
          Welcome back.
        </h1>
        <p className="mt-2 text-sm text-finroq-muted">
          Your financial picture is ready when you are.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {/* 1-Click Demo Option */}
        <div className="p-4 bg-finroq-mint border border-finroq-sage/80 rounded-2xl text-center space-y-2">
          <span className="text-xs font-bold text-finroq-forest">Exploring for the first time?</span>
          <button
            onClick={handleDemoSignIn}
            disabled={isDemoLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-finroq-lime text-finroq-forest-deep hover:brightness-95 shadow-xs transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {isDemoLoading ? 'Connecting...' : 'Instant 1-Click Demo Access'}
          </button>
        </div>

        <Card className="bg-white p-8 rounded-3xl shadow-sm border border-finroq-border">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-finroq-negative font-medium"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-finroq-muted hover:text-finroq-text"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-2.5 font-bold shadow-xs"
            >
              {isLoading ? 'Signing in...' : 'Sign in to workspace'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-finroq-muted">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-semibold text-finroq-forest hover:underline">
                Create new account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
