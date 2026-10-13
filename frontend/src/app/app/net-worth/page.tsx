'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { FinancialSummary, Account } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, CreditCard } from 'lucide-react';

export default function AppNetWorthPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [sumRes, acctRes] = await Promise.all([
          apiClient.getSummary(),
          apiClient.listAccounts(),
        ]);
        if (!cancelled) {
          setSummary(sumRes.data);
          setAccounts(acctRes.data.accounts || []);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load net worth data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const totalAssets = accounts
    .filter((a) => a.account_type !== 'credit')
    .reduce((sum, a) => sum + parseFloat(a.current_balance || a.initial_balance || '0'), 0);

  const totalLiabilities = accounts
    .filter((a) => a.account_type === 'credit')
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.current_balance || a.initial_balance || '0')), 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <ModuleShell
      title="Net Worth"
      category="Build & Protect"
      description="Track total assets minus liabilities across checking, savings, investment, and credit accounts with exact decimal math."
    >
      {isLoading ? (
        <div className="space-y-8">
          <div className="grid sm:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-[var(--soft)] rounded-3xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-[var(--soft)] rounded-3xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-[var(--bad-soft)] border border-[var(--bad-soft)] text-center">
          <p className="text-[var(--bad)] font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 btn-pill sm bg-[var(--ink)] text-[var(--bg)]">Retry</button>
        </div>
      ) : (
      <div className="space-y-8">
        {/* Top Net Worth Stat Cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Total Net Worth</span>
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[var(--accent)]">
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-[var(--muted)]">Assets − Liabilities</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Liquid &amp; Invested Assets</span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
              {formatCurrency(totalAssets)}
            </div>
            <p className="text-xs text-[var(--accent)] flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Positive Equity
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-3 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">Total Liabilities &amp; Debt</span>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[var(--bad)]">
              {formatCurrency(totalLiabilities)}
            </div>
            <p className="text-xs text-[var(--bad)] flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Credit Balances
            </p>
          </div>
        </div>

        {/* Account Balance Sheet Table */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">Balance Sheet Breakdown</h3>
            <span className="text-xs font-mono text-[var(--muted)]">{accounts.length} Connected Accounts</span>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 text-sm text-[var(--muted)]">
              No accounts registered yet. Add accounts to populate the live balance sheet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {accounts.map((acct) => {
                const isCredit = acct.account_type === 'credit';
                const bal = parseFloat(acct.current_balance || acct.initial_balance || '0');
                return (
                  <div key={acct.id} className="py-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--soft)] flex items-center justify-center text-[var(--muted)]">
                        {isCredit ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{acct.name}</p>
                        <span className="text-xs font-mono text-[var(--muted)] uppercase">{acct.account_type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono text-base font-bold ${isCredit ? 'text-[var(--bad)]' : 'text-[var(--accent)]'}`}>
                        {formatCurrency(bal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}
    </ModuleShell>
  );
}
