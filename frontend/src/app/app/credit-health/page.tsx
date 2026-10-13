'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';

export default function AppCreditHealthPage() {
  const [totalCreditLimit, setTotalCreditLimit] = useState(150000);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(22340);
  const [hasLiveCreditAccount, setHasLiveCreditAccount] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await apiClient.listAccounts();
        const creditAccounts = (res.data.accounts || []).filter((a) => a.account_type === 'credit');
        if (creditAccounts.length > 0) {
          const totalBal = creditAccounts.reduce(
            (sum, a) => sum + Math.abs(parseFloat(a.current_balance || a.initial_balance || '0')),
            0
          );
          setCurrentCreditBalance(totalBal);
          setTotalCreditLimit(Math.max(100000, Math.round(totalBal * 3.5)));
          setHasLiveCreditAccount(true);
        }
      } catch {
        // Fallback
      }
    }
    loadAccounts();
  }, []);

  const utilizationRate = totalCreditLimit > 0 ? (currentCreditBalance / totalCreditLimit) * 100 : 0;
  const isHealthy = utilizationRate <= 30;

  return (
    <ModuleShell
      title="Credit Health"
      category="Manage Obligations"
      description="Review credit utilization metrics, payment punctuality, and healthy credit maintenance without fabricated bureau scores."
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="md:col-span-5 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="font-display font-bold text-lg pb-3 border-b border-[var(--line)]">
            Credit Line Inputs
          </h3>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
              Total Combined Credit Limit (₹)
            </label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={totalCreditLimit}
              onChange={(e) => setTotalCreditLimit(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
              Current Outstanding Balance (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={currentCreditBalance}
              onChange={(e) => setCurrentCreditBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
            />
          </div>
        </div>

        {/* Verdict */}
        <div className="md:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div>
              <h3 className="font-display font-bold text-lg">Revolving Credit Health</h3>
              <p className="text-xs text-[var(--muted)]">Target Utilization: &le; 30%</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                isHealthy
                  ? 'bg-[var(--soft)] text-[var(--accent)]'
                  : 'bg-[var(--bad-soft)] text-[var(--bad)]'
              }`}
            >
              {isHealthy ? 'Optimal Utilization' : 'High Utilization'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[var(--muted)]">
              <span>Utilized: {formatCurrency(currentCreditBalance)}</span>
              <span>Limit: {formatCurrency(totalCreditLimit)}</span>
            </div>
            <div className="track">
              <i
                style={{
                  width: `${Math.min(100, utilizationRate)}%`,
                  backgroundColor: isHealthy ? 'var(--accent)' : 'var(--bad)',
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold block text-right">
              {utilizationRate.toFixed(1)}% Ratio
            </span>
          </div>

          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              isHealthy
                ? 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]'
                : 'bg-[var(--bad-soft)]/50 border-[var(--bad-soft)] text-[var(--bad)]'
            }`}
          >
            {isHealthy ? (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span>
                  <strong>Healthy Ratio:</strong> Maintaining revolving balances below 30% signals low credit risk and avoids interest spirals.
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--bad)] shrink-0" />
                <span>
                  <strong>Caution:</strong> Utilization above 30% can depress creditworthiness and incur heavy compounding finance charges. Pay down ₹{Math.max(0, currentCreditBalance - totalCreditLimit * 0.3).toLocaleString('en-IN')} to return under 30%.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
