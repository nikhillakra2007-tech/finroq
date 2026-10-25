'use client';

import React from 'react';

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--soft)]/30 text-[var(--muted)] pt-12 pb-8 text-xs font-sans">
      <div className="max-w-6xl mx-auto px-5 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--line)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-display font-bold text-lg text-[var(--ink)]">
              <span className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-xs shadow-emerald-500/50" />
              <span className="tracking-tight font-extrabold text-[#173F2B] dark:text-slate-100">finroq</span>
            </div>
            <p className="text-xs text-[var(--muted)] max-w-md">
              Mathematical financial accounting engine with zero float drift and complete data privacy.
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-[var(--muted)]">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">0.00% Drift Verified</span>
            <span>•</span>
            <span>NUMERIC(14,2) Exact Arithmetic</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[#CAD5CA]/60 dark:border-[#2A3D33] text-[11px] leading-relaxed text-[var(--muted)]">
          <span className="font-bold text-[var(--ink)] block">Educational &amp; Regulatory Notice:</span>
          Finroq is an analytical bookkeeping, personal simulation, and budgeting system developed for educational and organizational purposes. Projections and compounding simulations do not constitute regulated investment advisory.
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--ink)] font-medium">FINROQ Technologies © 2026. All rights reserved.</span>
          </div>
          <div className="text-[var(--muted)]">
            <span>Private Enclave Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
