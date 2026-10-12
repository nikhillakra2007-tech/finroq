'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Dashboard } from '@/features/summary/Dashboard';
import { MainLayout } from '@/components/layout/MainLayout';
import { LandingShowcase } from '@/components/landing/LandingShowcase';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [forceShowcase, setForceShowcase] = useState(false);

  // If still checking token, show a soothing minimalist loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-finroq-ivory flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-finroq-forest/20 border-t-finroq-forest rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase text-finroq-muted">
            FINROQ Loading...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated or user explicitly requested the showcase tour
  if (!isAuthenticated || forceShowcase) {
    return (
      <LandingShowcase
        onEnterApp={() => {
          setForceShowcase(false);
        }}
      />
    );
  }

  // Live Authenticated Dashboard
  return (
    <MainLayout>
      <div className="relative">
        {/* Subtle toggle back to product tour */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setForceShowcase(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-finroq-border text-finroq-muted hover:text-finroq-forest hover:bg-finroq-mint transition-all"
          >
            ← View Product Tour & Showcase
          </button>
        </div>
        <Dashboard />
      </div>
    </MainLayout>
  );
}