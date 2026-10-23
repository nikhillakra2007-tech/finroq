'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { UPCOMING_IPOS, IpoPrediction } from '@/lib/investment-predictions';

export function IpoRadarSection() {
  return (
    <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#CAD5CA]/60 dark:border-[#2A3D33]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h2 className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9]">
            Live IPO Listing Gain Predictions
          </h2>
        </div>
        <span className="text-[11px] font-mono text-gray-500">
          GMP & Subscription Forecast
        </span>
      </div>

      <div className="space-y-3">
        {UPCOMING_IPOS.map((ipo: IpoPrediction) => (
          <div
            key={ipo.id}
            className="p-3.5 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33] bg-[#F7F7F0]/40 dark:bg-[#0D1411]/40 hover:border-emerald-500/40 transition-all space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9]">
                    {ipo.companyName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {ipo.symbol}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 block">{ipo.sector}</span>
              </div>

              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono text-white"
                style={{ backgroundColor: ipo.signalColor }}
              >
                {ipo.predictionSignal}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-gray-500 block">Price Band</span>
                <span className="font-semibold text-[#173F2B] dark:text-[#E6EEE9]">
                  {ipo.priceBand}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block">Grey Market (GMP)</span>
                <span
                  className={`font-bold ${
                    ipo.gmpInr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {ipo.gmpInr >= 0 ? `+₹${ipo.gmpInr}` : `₹${ipo.gmpInr}`} ({ipo.gmpPercent}%)
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block">Predicted Pop</span>
                <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                  {ipo.gmpPercent > 0 ? `+${ipo.gmpPercent}%` : 'Muted'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#2E4035]/80 dark:text-[#A3B5AC] pt-1 border-t border-[#CAD5CA]/30 dark:border-[#2A3D33]/40 flex items-center justify-between">
              <span className="line-clamp-1">💡 {ipo.shortReason}</span>
              <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-2">
                {ipo.expectedListingDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
