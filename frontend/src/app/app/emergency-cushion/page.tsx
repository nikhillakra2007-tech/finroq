'use client';

import React, { useState } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { formatCurrency } from '@/lib/utils';
import { Umbrella, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AppEmergencyCushionPage() {
  const [monthlyEssential, setMonthlyEssential] = useState<number>(45000);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [currentEmergencyLiquid, setCurrentEmergencyLiquid] = useState<number>(180000);

  const targetFund = monthlyEssential * targetMonths;
  const fundedMonths = monthlyEssential > 0 ? (currentEmergencyLiquid / monthlyEssential).toFixed(1) : '0';
  const fundingGap = Math.max(0, targetFund - currentEmergencyLiquid);
  const isFullyFunded = currentEmergencyLiquid >= targetFund;
  const fundedPercent = Math.min(100, Math.round((currentEmergencyLiquid / (targetFund || 1)) * 100));

  return (
    <ModuleShell
      title="Emergency Cushion"
      category="Build & Protect"
      description="Estimate emergency reserves from essential survival living expenses and simulate your runway against unexpected shocks."
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="font-display font-bold text-lg pb-3 border-b border-[var(--line)]">
            Cushion Parameters
          </h3>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
              Monthly Essential Needs (Rent, Food, EMIs, Utilities)
            </label>
            <input
              type="number"
              min="10000"
              step="1000"
              value={monthlyEssential}
              onChange={(e) => setMonthlyEssential(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="text-[var(--muted)]">Desired Runway Months</span>
              <span className="font-mono font-bold text-[var(--ink)]">{targetMonths} Months</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={targetMonths}
              onChange={(e) => setTargetMonths(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-[var(--muted)] mt-1">
              <span>3 mos (Lean)</span>
              <span>6 mos (Standard)</span>
              <span>12 mos (Ultra Safe)</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
              Current Liquid Savings Allocated
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={currentEmergencyLiquid}
              onChange={(e) => setCurrentEmergencyLiquid(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>
        </div>

        {/* Verdict */}
        <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-display font-bold text-lg">Runway Assessment</h3>
              <p className="text-xs text-[var(--muted)]">Target Reserve: {formatCurrency(targetFund)}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                isFullyFunded
                  ? 'bg-[var(--soft)] text-[var(--accent)]'
                  : 'bg-[var(--bad-soft)] text-[var(--bad)]'
              }`}
            >
              {isFullyFunded ? 'Fully Cushioned' : `${fundedMonths} Months Ready`}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
              <span>Current Cushion: {formatCurrency(currentEmergencyLiquid)}</span>
              <span>Target: {formatCurrency(targetFund)}</span>
            </div>
            <div className="track">
              <i style={{ width: `${fundedPercent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--line)]">
            <div className="p-4 rounded-2xl bg-[var(--soft)]">
              <span className="text-xs text-[var(--muted)] block">Months of Complete Runway</span>
              <span className="font-mono text-2xl font-bold text-[var(--accent)] block mt-1">
                {fundedMonths} Months
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--soft)]">
              <span className="text-xs text-[var(--muted)] block">Remaining Buffer Deficit</span>
              <span className={`font-mono text-2xl font-bold block mt-1 ${isFullyFunded ? 'text-[var(--accent)]' : 'text-[var(--bad)]'}`}>
                {isFullyFunded ? '₹0.00' : formatCurrency(fundingGap)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)] text-xs text-[var(--ink)] leading-relaxed border border-[var(--line)]">
            🛡️ <strong>Emergency Recommendation:</strong> Maintain your emergency reserve strictly in high-liquidity instruments (liquid savings or short-term fixed deposits) with immediate withdrawal capabilities.
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
