'use client';

import React from 'react';
import { useCurtain } from '@/components/layout/CurtainTransition';

export function LandingCta() {
  const { navigateWithCurtain } = useCurtain();

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="p-8 sm:p-14 rounded-3xl bg-[#173F2B] text-white dark:bg-[#0E261A] border border-[#23583D] dark:border-[#1E4D35] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl card-hover-lift">
          <div className="space-y-3 max-w-xl">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Take complete control of your financial ledger.
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 font-normal leading-relaxed">
              Experience the accounting engine built for individuals who refuse floating-point drift and demand mathematical certainty.
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5 items-center shrink-0">
            <button
              onClick={() => navigateWithCurtain('/register', 'welcome', 'fwd')}
              className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 cursor-pointer whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Start Building Wealth →
            </button>
            <button
              onClick={() => navigateWithCurtain('/login', 'welcome', 'fwd')}
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/50 text-white font-semibold text-sm sm:text-base cursor-pointer whitespace-nowrap transition-all duration-300"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
