'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { ShieldAlert, TrendingDown, Calendar, Calculator, CheckCircle2, DollarSign } from 'lucide-react';

export default function DebtWatchdogPage() {
  const [balance, setBalance] = useState<number>(1250);
  const [interestRate, setInterestRate] = useState<number>(18.5);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(150);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.listAccounts();
        const accountsList = res.data.accounts || [];
        const debtAccounts = accountsList.filter((a) => a.account_type === 'credit');
        setAccounts(debtAccounts);
        const total = debtAccounts.reduce((sum, a) => sum + parseFloat(a.current_balance || a.initial_balance), 0);
        if (total > 0) {
          setBalance(total);
        }
      } catch {
        // Handled
      }
    }
    loadData();
  }, []);

  // Payoff calculations
  const monthlyRate = interestRate / 100 / 12;
  let months = 0;
  let totalInterest = 0;
  let remaining = balance;

  if (monthlyPayment > balance * monthlyRate && monthlyPayment > 0) {
    while (remaining > 0.01 && months < 360) {
      const interest = remaining * monthlyRate;
      const principal = monthlyPayment - interest;
      totalInterest += interest;
      remaining -= principal;
      months++;
    }
  } else {
    months = 999; // Never payoff if payment <= interest
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-semibold mb-3">
            <ShieldAlert className="h-3.5 w-3.5" />
            Module 10: Manage Obligations & Health
          </div>
          <h1 className="heading-page">EMI & Debt Watchdog</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Monitor outstanding credit balances and calculate payoff timelines to eliminate high-interest liabilities.
          </p>
        </div>

        {/* Current Balances */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Recorded Debt Balances</span>
            <p className="font-mono text-2xl font-bold text-finroq-negative mt-1">{formatCurrency(balance)}</p>
            <span className="text-[11px] text-finroq-muted">{accounts.length} Credit Accounts Monitored</span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Estimated Payoff Time</span>
            <p className="font-mono text-2xl font-bold text-finroq-text mt-1">
              {months >= 999 ? 'Insufficient Payment' : `${months} Months`}
            </p>
            <span className="text-[11px] text-finroq-positive font-medium">
              {months < 999 ? `Debt-Free in ${(months / 12).toFixed(1)} years` : 'Payment does not cover interest'}
            </span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Projected Total Interest</span>
            <p className="font-mono text-2xl font-bold text-amber-800 mt-1">
              {months >= 999 ? 'N/A' : formatCurrency(totalInterest)}
            </p>
            <span className="text-[11px] text-finroq-muted">Cost of borrowing over cycle</span>
          </Card>
        </div>

        {/* Simulator */}
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-5">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
              <h2 className="font-heading font-bold text-base text-finroq-text">1. Payoff Parameters</h2>

              <div>
                <label className="label">Current Principal ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balance || ''}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="label">Annual Interest Rate (APR %)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="label">Monthly Payment Budget ($/mo)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={monthlyPayment || ''}
                  onChange={(e) => setMonthlyPayment(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-base font-bold"
                />
              </div>
            </Card>
          </div>

          <div className="md:col-span-6 space-y-5">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-5">
              <h2 className="font-heading font-bold text-base text-finroq-text">2. Strategy Comparison</h2>

              <div className="space-y-3">
                <div className="p-3.5 bg-finroq-ivory rounded-xl border border-finroq-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-finroq-text">Current Plan ({formatCurrency(monthlyPayment)}/mo)</span>
                    <p className="text-finroq-muted">{months} months to payoff</p>
                  </div>
                  <span className="font-mono font-bold text-finroq-text">
                    Total: {formatCurrency(balance + totalInterest)}
                  </span>
                </div>

                <div className="p-3.5 bg-finroq-mint rounded-xl border border-finroq-sage/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-finroq-forest">
                      Accelerated (+ $50/mo: {formatCurrency(monthlyPayment + 50)}/mo)
                    </span>
                    <p className="text-finroq-positive font-medium">Saves interest and shortens duration</p>
                  </div>
                  <span className="font-mono font-bold text-finroq-positive">Recommended</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-finroq-muted leading-relaxed">
                💡 <strong>Tip:</strong> Always prioritize high-APR revolving debt (like credit cards at 18–24%) over low-rate installment loans. Every extra $50 applied directly to principal shortens your debt horizon.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
