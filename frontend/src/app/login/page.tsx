'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { extractErrorMessage } from '@/lib/api-client';
import { Input, Button, Card } from '@/components/ui';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-finroq-ivory flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="p-2.5 bg-finroq-forest rounded-xl shadow-sm group-hover:scale-105 transition-transform">
            <Wallet className="h-7 w-7 text-finroq-lime" />
          </div>
          <span className="text-2xl font-extrabold font-heading text-finroq-forest tracking-tight">FINROQ</span>
        </Link>
        <h1 className="heading-section text-finroq-text">Sign in to your account</h1>
        <p className="mt-2 text-sm text-finroq-muted">
          Access your personal finances, wealth dashboards, and budgets.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white p-8 rounded-2xl shadow-sm border border-finroq-border">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-finroq-negative flex items-start gap-3 text-sm animate-fade-in"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                label="Email Address"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 bg-finroq-forest hover:bg-finroq-forest-deep text-white font-medium"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-finroq-border text-center text-sm text-finroq-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-finroq-forest hover:underline">
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
