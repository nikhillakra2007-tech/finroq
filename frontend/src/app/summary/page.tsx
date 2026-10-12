'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SummaryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/home');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
        <span className="text-xs font-mono font-medium tracking-wider uppercase text-[var(--muted)]">
          Redirecting to Finroq Home...
        </span>
      </div>
    </div>
  );
}