'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Compass,
  ArrowLeft,
  Home,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { UserPersona, PERSONA_GUIDES, calculateYoungsterAdvantage } from '@/lib/investment-predictions';
import { IpoRadarSection } from '@/features/predictions/IpoRadarSection';
import { MutualFundSection } from '@/features/predictions/MutualFundSection';
import { YouthSipSection } from '@/features/predictions/YouthSipSection';
import { formatInrCompact } from '@/lib/multiverse-engine';

interface Props {
  isStandalonePortal?: boolean;
}

export function InvestmentPredictionCenter({ isStandalonePortal = false }: Props) {
  const [activePersona, setActivePersona] = useState<UserPersona>('student');
  const [marketData, setMarketData] = useState<{
    nifty: { val: number; chg: number };
    sensex: { val: number; chg: number };
  }>({
    nifty: { val: 24399.4, chg: 0.42 },
    sensex: { val: 80081.2, chg: 0.38 },
  });

  useEffect(() => {
    fetch('/api/market-telemetry')
      .then((r) => r.json())
      .then((d) => {
        if (d?.marketIndices) {
          setMarketData({
            nifty: { val: d.marketIndices.nifty50.value, chg: d.marketIndices.nifty50.changePct },
            sensex: { val: d.marketIndices.sensex.value, chg: d.marketIndices.sensex.changePct },
          });
        }
      })
      .catch((e) => console.warn('Using cached telemetry:', e));
  }, []);

  const currentGuide = PERSONA_GUIDES[activePersona];
  const youngsterEdge = calculateYoungsterAdvantage(activePersona === 'student' ? 1500 : 8000);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Native In-App Header Card */}
      <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Youth Investment Intelligence</span>
              </span>

              {/* Live Indian Markets Telemetry Pill */}
              <div className="flex items-center gap-2 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-500">NIFTY:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {marketData.nifty.val.toLocaleString()} ({marketData.nifty.chg >= 0 ? '+' : ''}{marketData.nifty.chg}%)
                </span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span className="text-gray-500">SENSEX:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {marketData.sensex.val.toLocaleString()} ({marketData.sensex.chg >= 0 ? '+' : ''}{marketData.sensex.chg}%)
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9]">
              Youth Investment &amp; IPO Prediction Center
            </h1>
            <p className="text-xs text-[#2E4035]/80 dark:text-[#A3B5AC] mt-0.5">
              Curated for students &amp; young professionals. Real-time listing gain predictions and compounding proof in ₹ INR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Switcher */}
            <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-1 rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] flex flex-wrap gap-1">
              {(['student', 'first_job', 'wealth_builder'] as UserPersona[]).map((p) => {
                const guide = PERSONA_GUIDES[p];
                const isSelected = activePersona === p;
                return (
                  <button
                    key={p}
                    onClick={() => setActivePersona(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                        : 'text-[#2E4035]/70 dark:text-[#A3B5AC] hover:text-[#173F2B]'
                    }`}
                  >
                    {guide.badge.split(' ')[0]} {p === 'student' ? 'Student' : p === 'first_job' ? 'First Job' : 'Pro'}
                  </button>
                );
              })}
            </div>

            {/* Direct Home Return Link */}
            <Link
              href="/app/home"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#EAF3E7] hover:bg-[#D5E8D2] text-[#173F2B] dark:bg-[#1A2C22] dark:hover:bg-[#233D2F] dark:text-emerald-300 transition-all border border-[#CAD5CA] dark:border-[#2A3D33]"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Financial Tools</span>
            </Link>
          </div>
        </div>

        {/* Selected Persona Strategy Bar */}
        <div className="mt-4 pt-3 border-t border-[#CAD5CA]/60 dark:border-[#2A3D33] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33]">
            <span className="text-gray-500 block text-[11px]">Recommended Monthly Budget</span>
            <span className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#5ECB9C] block mt-0.5">
              {currentGuide.suggestedBudgetMonthly}
            </span>
          </div>

          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33] col-span-2">
            <span className="text-gray-500 block text-[11px]">Recommended Asset Allocation</span>
            <div className="flex items-center gap-2 mt-1">
              {currentGuide.recommendedSplit.map((split, i) => (
                <div key={i} className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="truncate">{split.label}</span>
                    <span className="font-bold">{split.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#CAD5CA]/40 dark:bg-[#2A3D33] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${split.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The Youngster Superpower Banner */}
      <div className="bg-gradient-to-r from-[#EAF3E7] via-white to-[#EAF3E7] dark:from-[#1A2C22] dark:via-[#16251E] dark:to-[#1A2C22] rounded-2xl p-4 border border-[#CAD5CA] dark:border-[#2A3D33] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
            ⚡
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9]">
              The Youngster Compounding Advantage
            </h3>
            <p className="text-xs text-[#2E4035]/80 dark:text-[#A3B5AC]">
              Starting at Age 20 vs Age 30 creates a{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {youngsterEdge.multiplier}x Wealth Multiplier
              </strong>{' '}
              with the exact same monthly investment!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 block">Start at 20</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatInrCompact(youngsterEdge.starter20WealthAt50)}
            </span>
          </div>
          <div className="text-gray-400">vs</div>
          <div>
            <span className="text-[10px] text-gray-500 block">Start at 30</span>
            <span className="text-sm font-bold text-gray-500">
              {formatInrCompact(youngsterEdge.starter30WealthAt50)}
            </span>
          </div>
        </div>
      </div>

      {/* Modular Grids: IPO Radar & Curated Mutual Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IpoRadarSection />
        <MutualFundSection />
      </div>

      {/* Interactive Youth SIP Growth Calculator */}
      <YouthSipSection initialMonthly={activePersona === 'student' ? 1500 : 8000} />

      {/* Guidance Callout to Money Guides Visual Tips */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 dark:from-[#1A2C22] dark:via-[#16251E] dark:to-[#1A2C22] rounded-2xl border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
            💡
          </div>
          <div>
            <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9] block">
              New to Personal Finance? Master the 6 Golden Visual Rules First
            </span>
            <span className="text-gray-500 dark:text-slate-300">
              Interactive visual playbooks: The 24-Hour Impulse Rule, Chai vs Compounding, 30% CIBIL Shield &amp; UPI Zero-PIN Scam Defense.
            </span>
          </div>
        </div>

        <Link
          href="/app/money-guides"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-[#0B1A13] font-semibold shrink-0 shadow-xs"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explore Visual Money Guides →</span>
        </Link>
      </div>

      {/* Cross-Link to What-If Life Timeline */}
      <div className="p-4 bg-white dark:bg-[#16251E] rounded-2xl border border-[#CAD5CA] dark:border-[#2A3D33] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9] block">
            See how these investments shape your 30-year life freedom
          </span>
          <span className="text-gray-500">
            Simulate your early retirement age (F.I.R.E.), property purchase, or startup bet.
          </span>
        </div>

        <Link
          href="/app/multiverse"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13] font-semibold shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Launch What-If Timeline Simulator →</span>
        </Link>
      </div>
    </div>
  );
}
