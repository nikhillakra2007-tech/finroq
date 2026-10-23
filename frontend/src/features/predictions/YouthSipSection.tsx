'use client';

import React, { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import { calculateSipPrediction } from '@/lib/investment-predictions';
import { formatInrCompact } from '@/lib/multiverse-engine';
import { formatCurrency } from '@/lib/utils';

interface Props {
  initialMonthly?: number;
}

export function YouthSipSection({ initialMonthly = 2000 }: Props) {
  const [monthlySip, setMonthlySip] = useState<number>(initialMonthly);
  const [expectedReturn, setExpectedReturn] = useState<number>(14);
  const [horizonYears, setHorizonYears] = useState<number>(15);

  const sipResult = useMemo(() => {
    return calculateSipPrediction(monthlySip, expectedReturn, horizonYears);
  }, [monthlySip, expectedReturn, horizonYears]);

  return (
    <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#CAD5CA]/60 dark:border-[#2A3D33]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <h2 className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9]">
            Interactive Youth SIP Growth Predictor
          </h2>
        </div>
        <span className="text-xs font-mono text-gray-500">
          Compounding Simulator (₹ INR)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-500">Monthly Deposit</span>
              <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                {formatCurrency(monthlySip)}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthlySip}
              onChange={(e) => setMonthlySip(Number(e.target.value))}
              className="w-full h-2 bg-[#CAD5CA]/60 dark:bg-[#2A3D33] rounded-lg appearance-none cursor-pointer accent-[#173F2B] dark:accent-[#5ECB9C]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
              <span>₹500 (Student)</span>
              <span>₹50,000 (Pro)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-500">Expected Annual CAGR</span>
              <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                {expectedReturn}% p.a.
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={18}
              step={0.5}
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              className="w-full h-2 bg-[#CAD5CA]/60 dark:bg-[#2A3D33] rounded-lg appearance-none cursor-pointer accent-[#173F2B] dark:accent-[#5ECB9C]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
              <span>10% (Low)</span>
              <span>14% (Nifty Index)</span>
              <span>18% (Midcap)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-500">Time Horizon</span>
              <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                {horizonYears} Years
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={25}
              step={1}
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="w-full h-2 bg-[#CAD5CA]/60 dark:bg-[#2A3D33] rounded-lg appearance-none cursor-pointer accent-[#173F2B] dark:accent-[#5ECB9C]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
              <span>3 Years</span>
              <span>15 Years</span>
              <span>25 Years</span>
            </div>
          </div>
        </div>

        {/* Wealth Output */}
        <div className="space-y-3">
          <div className="p-4 bg-[#EAF3E7] dark:bg-[#1A2C22] rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] space-y-1">
            <span className="text-xs text-gray-600 dark:text-gray-300 block font-medium">
              Predicted Total Wealth
            </span>
            <div className="text-2xl font-bold font-mono text-[#173F2B] dark:text-[#5ECB9C]">
              {formatInrCompact(sipResult.expectedWealth)}
            </div>
            <span className="text-xs font-mono text-gray-500 block">
              Exact: {formatCurrency(sipResult.expectedWealth)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
              <span className="text-gray-500 block text-[10px]">Your Total Deposit</span>
              <span className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9] block mt-0.5">
                {formatInrCompact(sipResult.totalInvested)}
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
              <span className="text-gray-500 block text-[10px]">Compounding Gain</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                +{formatInrCompact(sipResult.wealthGain)}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison vs Bank Fixed Deposit */}
        <div className="p-4 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33] space-y-3 text-xs">
          <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9] block">
            Where would your money end up?
          </span>

          <div className="space-y-2 font-mono">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  📈 Mutual Fund ({expectedReturn}%)
                </span>
                <span className="font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                  {formatInrCompact(sipResult.expectedWealth)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#CAD5CA]/40 dark:bg-[#2A3D33] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-amber-600">🏦 Bank FD (7% p.a.)</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {formatInrCompact(sipResult.fdComparison)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#CAD5CA]/40 dark:bg-[#2A3D33] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${Math.round((sipResult.fdComparison / sipResult.expectedWealth) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-gray-500">💰 Savings Account (3.5%)</span>
                <span className="font-bold text-gray-500">
                  {formatInrCompact(sipResult.savingsAccountComparison)}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#CAD5CA]/40 dark:bg-[#2A3D33] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-400"
                  style={{
                    width: `${Math.round((sipResult.savingsAccountComparison / sipResult.expectedWealth) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 pt-1">
            Investing in index funds vs bank savings creates an extra{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {formatInrCompact(sipResult.expectedWealth - sipResult.savingsAccountComparison)}
            </strong>!
          </p>
        </div>
      </div>
    </div>
  );
}
