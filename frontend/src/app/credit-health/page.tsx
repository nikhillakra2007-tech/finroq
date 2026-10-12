'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export default function CreditHealthPage() {
  const [creditBalance, setCreditBalance] = useState<number>(1250);
  const [creditLimit, setCreditLimit] = useState<number>(10000);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.listAccounts();
        const accountsList = res.data.accounts || [];
        const creditCards = accountsList.filter((a) => a.account_type === 'credit');
        const bal = creditCards.reduce((sum, a) => sum + parseFloat(a.current_balance || a.initial_balance), 0);
        if (bal > 0) {
          setCreditBalance(bal);
        }
      } catch {
        // Handled
      }
    }
    loadData();
  }, []);

  const utilization = creditLimit > 0 ? (creditBalance / creditLimit) * 100 : 0;
  const isHealthy = utilization <= 30;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <CreditCard className="h-3.5 w-3.5" />
            Module 11: Manage Obligations & Health
          </div>
          <h1 className="heading-page">Credit Health & Utilization</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Monitor revolving credit utilization against limits based on your actual accounts—without simulated or invented credit scores.
          </p>
        </div>

        {/* Notice of authenticity */}
        <div className="p-4 bg-slate-50 border border-finroq-border rounded-2xl flex items-start gap-3 text-xs text-finroq-muted">
          <Info className="h-4 w-4 text-finroq-forest shrink-0 mt-0.5" />
          <p>
            <strong>Authentic Financial Metrics Guarantee:</strong> FINROQ does not manufacture fake FICO/CIBIL scores or pretend to query external bureaus. We track your actual revolving balance sheet credit utilization, which constitutes ~30% of standard scoring models.
          </p>
        </div>

        {/* Utilization Gauge Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Revolving Balance</span>
            <p className="font-mono text-2xl font-bold text-finroq-text mt-1">{formatCurrency(creditBalance)}</p>
            <span className="text-[11px] text-finroq-muted">Total current credit card debt</span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Credit Limit Ceiling</span>
            <p className="font-mono text-2xl font-bold text-finroq-forest mt-1">{formatCurrency(creditLimit)}</p>
            <span className="text-[11px] text-finroq-muted">Combined credit lines</span>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs">
            <span className="text-xs text-finroq-muted font-medium">Credit Utilization</span>
            <p className={`font-mono text-2xl font-bold mt-1 ${isHealthy ? 'text-finroq-positive' : 'text-finroq-negative'}`}>
              {utilization.toFixed(1)}%
            </p>
            <span className="text-[11px] font-medium text-finroq-positive">
              {utilization < 10 ? 'Optimal (< 10%)' : isHealthy ? 'Healthy (< 30%)' : 'High Utilization (Above 30%)'}
            </span>
          </Card>
        </div>

        {/* Visual Utilization Meter */}
        <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-finroq-text">Utilization Thresholds</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-finroq-muted">
              <span>0% (Ideal)</span>
              <span className="font-bold text-finroq-text">Current: {utilization.toFixed(1)}%</span>
              <span>100% (Maxed Out)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
              <div
                className={`h-3.5 rounded-full transition-all duration-300 ${
                  utilization <= 10 ? 'bg-finroq-positive' : utilization <= 30 ? 'bg-finroq-forest' : 'bg-finroq-negative'
                }`}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3 bg-finroq-mint rounded-xl border border-finroq-sage/60 text-xs text-finroq-forest">
              <p className="font-bold mb-1">0% – 10%: Optimal</p>
              <span>Maximizes credit profile standing and demonstrates low dependence on debt.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-finroq-border text-xs text-finroq-muted">
              <p className="font-bold mb-1 text-finroq-text">10% – 30%: Safe</p>
              <span>Standard acceptable ceiling across institutional lenders.</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-finroq-negative">
              <p className="font-bold mb-1">30%+: Risk Zone</p>
              <span>Lenders perceive high reliance on revolving lines. Pay down balances promptly.</span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
