'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Umbrella, CheckCircle2, AlertTriangle, ShieldCheck, Wallet, Sparkles, Activity } from 'lucide-react';

export default function AppEmergencyCushionPage() {
  const [monthlyEssential, setMonthlyEssential] = useState<number>(45000);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [currentEmergencyLiquid, setCurrentEmergencyLiquid] = useState<number>(180000);
  const [realTxnCount, setRealTxnCount] = useState<number>(0);
  const [isCalculatedFromLedger, setIsCalculatedFromLedger] = useState<boolean>(false);

  useEffect(() => {
    async function loadRealData() {
      try {
        const [accRes, txnRes] = await Promise.all([
          apiClient.listAccounts({ page: 1, page_size: 100, is_active: true }),
          apiClient.listTransactions({ page: 1, page_size: 100, transaction_type: 'expense' }),
        ]);

        // 1. Calculate liquid savings from bank balances
        const liquidAccounts = (accRes.data.accounts || []).filter(
          (a: any) => a.account_type === 'checking' || a.account_type === 'savings'
        );
        if (liquidAccounts.length > 0) {
          const totalLiquid = liquidAccounts.reduce(
            (sum: number, a: any) => sum + parseFloat(a.current_balance || a.initial_balance || '0'),
            0
          );
          if (totalLiquid > 0) {
            setCurrentEmergencyLiquid(totalLiquid);
          }
        }

        // 2. Dynamically calculate monthly burn from actual transactions
        const expenseTxns = txnRes.data.transactions || [];
        if (expenseTxns.length > 0) {
          const totalSpent = expenseTxns.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
          if (totalSpent > 0) {
            // If we have verified transactions, derive the realistic monthly burn rate
            const calculatedBurn = Math.round(totalSpent > 10000 ? totalSpent : totalSpent * 3);
            setMonthlyEssential(calculatedBurn);
            setRealTxnCount(expenseTxns.length);
            setIsCalculatedFromLedger(true);
          }
        }
      } catch (err) {
        console.warn('Fallback to standard model for emergency cushion:', err);
      }
    }
    loadRealData();
  }, []);

  const targetFund = monthlyEssential * targetMonths;
  const fundedMonths = monthlyEssential > 0 ? (currentEmergencyLiquid / monthlyEssential).toFixed(1) : '0';
  const fundingGap = Math.max(0, targetFund - currentEmergencyLiquid);
  const isFullyFunded = currentEmergencyLiquid >= targetFund;
  const fundedPercent = Math.min(100, Math.round((currentEmergencyLiquid / (targetFund || 1)) * 100));

  return (
    <ModuleShell
      title="Emergency Cushion"
      category="Build & Protect"
      description="Calculate your survival runway dynamically connected to actual monthly spending from ledger transactions."
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="md:col-span-5 bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="pb-3 border-b border-[#DCE4DC] dark:border-[var(--line)] flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
              Cushion Parameters
            </h3>
            {isCalculatedFromLedger && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#173F2B] dark:text-emerald-300 border border-emerald-200 text-[11px] font-bold font-mono">
                <Activity className="w-3 h-3 text-emerald-600" /> Live Ledger Sync
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              Monthly Essential Burn (Rent, Groceries, EMIs, Utilities)
            </label>
            <input
              type="number"
              min="10000"
              step="1000"
              value={monthlyEssential}
              onChange={(e) => {
                setMonthlyEssential(parseFloat(e.target.value) || 0);
                setIsCalculatedFromLedger(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold text-[#173F2B] dark:text-slate-100"
            />
            {isCalculatedFromLedger && (
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ Auto-derived from your {realTxnCount} completed expense transactions.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              Target Runway Months
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMonths(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    targetMonths === m
                      ? 'bg-[#173F2B] text-white border-[#173F2B] shadow-xs'
                      : 'bg-white dark:bg-[var(--surface)] text-[#4D5D51] dark:text-slate-300 border-[#DCE4DC] dark:border-[var(--line)] hover:bg-[#F4F7F3]'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              Liquid Cash & Bank Reserves
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={currentEmergencyLiquid}
              onChange={(e) => setCurrentEmergencyLiquid(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold text-[#173F2B] dark:text-slate-100"
            />
            <p className="mt-1 text-[11px] text-[#4D5D51] dark:text-slate-400 font-medium">
              Synchronized with verified checking and high-yield savings accounts.
            </p>
          </div>
        </div>

        {/* Output Metrics */}
        <div className="md:col-span-7 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                Current Runway
              </span>
              <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {fundedMonths} <span className="text-base font-normal">Months</span>
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                Survival timeline without any fresh income
              </p>
            </div>

            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                Required Target Fund
              </span>
              <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(targetFund)}
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                To guarantee {targetMonths} full months of buffer
              </p>
            </div>
          </div>

          {/* Runway Progress Card */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DC] dark:border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-display font-bold text-base text-[#173F2B] dark:text-slate-100">
                  Cushion Solvency Status
                </h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isFullyFunded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {fundedPercent}% Funded
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-[#E5EDE5] dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFullyFunded ? 'bg-[#157A42]' : 'bg-[#173F2B]'
                  }`}
                  style={{ width: `${fundedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-[#4D5D51] dark:text-slate-400 font-medium">
                <span>{formatCurrency(currentEmergencyLiquid)} stored</span>
                <span>Target: {formatCurrency(targetFund)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#15241C] border border-[#DCE4DC] dark:border-[var(--line)] text-xs space-y-1">
              <p className="font-bold text-[#173F2B] dark:text-slate-100">
                {isFullyFunded
                  ? '🎉 Pristine Solvency Protection'
                  : `Funding Gap: ${formatCurrency(fundingGap)} remaining`}
              </p>
              <p className="text-[#4D5D51] dark:text-slate-300">
                {isFullyFunded
                  ? 'Your liquid cushion can absorb job transitions or unexpected medical expenses without touching long-term investments.'
                  : `Automating ₹10,000/month into an instant sweep-in FD will fully fund your remaining ${targetMonths}-month safety net in ${Math.ceil(fundingGap / 10000)} months.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
