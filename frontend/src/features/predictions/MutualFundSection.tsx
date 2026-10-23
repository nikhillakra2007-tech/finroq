'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { TOP_MUTUAL_FUNDS, MutualFundPick } from '@/lib/investment-predictions';

export function MutualFundSection() {
  return (
    <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#CAD5CA]/60 dark:border-[#2A3D33]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <h2 className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9]">
            Top Youth Mutual Funds (Low Min. SIP)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-gray-500">Starts at ₹100 - ₹500</span>
      </div>

      <div className="space-y-3">
        {TOP_MUTUAL_FUNDS.map((mf: MutualFundPick) => (
          <div
            key={mf.id}
            className="p-3.5 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33] bg-[#F7F7F0]/40 dark:bg-[#0D1411]/40 hover:border-emerald-500/40 transition-all space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9] block">
                  {mf.name}
                </span>
                <span className="text-[11px] text-gray-500">{mf.amc}</span>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {mf.category}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-gray-500 block">3-Yr Return</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{mf.cagr3Yr}% p.a.
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block">5-Yr Return</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{mf.cagr5Yr}% p.a.
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block">Min. SIP</span>
                <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                  ₹{mf.minSip}/mo
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#2E4035]/80 dark:text-[#A3B5AC] pt-1 border-t border-[#CAD5CA]/30 dark:border-[#2A3D33]/40">
              <span className="font-semibold text-[#173F2B] dark:text-[#5ECB9C]">Verdict:</span>{' '}
              {mf.predictionVerdict}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
