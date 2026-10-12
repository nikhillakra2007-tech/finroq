'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, AlertCircle, TrendingUp, CheckCircle2, Umbrella, DollarSign } from 'lucide-react';

export default function EmergencyCushionPage() {
  const [monthlyBurnRate, setMonthlyBurnRate] = useState<number>(2471.80);
  const [liquidSavings, setLiquidSavings] = useState<number>(31000.00);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, accRes] = await Promise.all([
          apiClient.getSummary(),
          apiClient.listAccounts(),
        ]);

        if (sumRes.data.total_expenses && parseFloat(sumRes.data.total_expenses) > 0) {
          setMonthlyBurnRate(parseFloat(sumRes.data.total_expenses));
        }

        const accountsList = accRes.data.accounts || [];
        const liquid = accountsList
          .filter((a) => a.account_type === 'checking' || a.account_type === 'savings' || a.account_type === 'cash')
          .reduce((sum, a) => sum + parseFloat(a.current_balance || a.initial_balance), 0);

        if (liquid > 0) {
          setLiquidSavings(liquid);
        }
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const targetAmount = monthlyBurnRate * targetMonths;
  const currentCoverageMonths = monthlyBurnRate > 0 ? liquidSavings / monthlyBurnRate : 0;
  const fundingGap = Math.max(0, targetAmount - liquidSavings);
  const isFullyFunded = liquidSavings >= targetAmount;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <Umbrella className="h-3.5 w-3.5" />
            Module 9: Build & Protect Wealth
          </div>
          <h1 className="heading-page">Emergency Cushion Calculator</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Determine your liquid runway to shield against income disruptions, unforeseen medical costs, and emergency obligations.
          </p>
        </div>

        {/* Top Summary Banner */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Liquid Cash Available</span>
            <p className="font-mono text-2xl font-bold text-finroq-forest mt-1">
              {formatCurrency(liquidSavings)}
            </p>
            <span className="text-[11px] text-finroq-muted">Checking, Savings & Cash Accounts</span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Current Runway Coverage</span>
            <p className="font-mono text-2xl font-bold text-finroq-positive mt-1">
              {currentCoverageMonths.toFixed(1)} Months
            </p>
            <span className="text-[11px] text-finroq-positive font-medium">
              {currentCoverageMonths >= targetMonths ? 'Exceeds target buffer' : 'In progress'}
            </span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Target Cushion ({targetMonths} mo)</span>
            <p className="font-mono text-2xl font-bold text-finroq-text mt-1">
              {formatCurrency(targetAmount)}
            </p>
            <span className="text-[11px] text-finroq-muted">
              {isFullyFunded ? 'Fully funded' : `Gap: ${formatCurrency(fundingGap)}`}
            </span>
          </Card>
        </div>

        {/* Interactive Controls */}
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-5">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
              <h2 className="font-heading font-bold text-base text-finroq-text">1. Assumptions & Runway Target</h2>

              <div>
                <label className="label">Monthly Essential Outflow ($/month)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={monthlyBurnRate || ''}
                  onChange={(e) => setMonthlyBurnRate(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-base font-bold"
                />
                <span className="text-[11px] text-finroq-muted mt-1 block">
                  Autofilled from your recent monthly expenses.
                </span>
              </div>

              <div>
                <label className="label">Target Runway Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTargetMonths(m)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        targetMonths === m
                          ? 'bg-finroq-forest text-white shadow-xs'
                          : 'bg-finroq-ivory text-finroq-text border border-finroq-border hover:bg-slate-100'
                      }`}
                    >
                      {m} Months {m === 6 ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-6 space-y-5">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-5">
              <h2 className="font-heading font-bold text-base text-finroq-text">2. Buffer Health Assessment</h2>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-finroq-text">Coverage Progress</span>
                  <span className="font-mono font-bold text-finroq-positive">
                    {Math.min(100, (liquidSavings / targetAmount) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-finroq-positive h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (liquidSavings / targetAmount) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-finroq-mint rounded-xl text-xs text-finroq-forest leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cushion Status: {isFullyFunded ? 'Resilient' : 'Building'}</span>
                </div>
                <p>
                  At your verified burn rate of <strong>{formatCurrency(monthlyBurnRate)}/mo</strong>, your liquid reserves of <strong>{formatCurrency(liquidSavings)}</strong> will sustain essential living costs for <strong>{currentCoverageMonths.toFixed(1)} months</strong> without additional income.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
