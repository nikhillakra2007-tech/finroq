'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Activity, ShieldCheck, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FinancialHealthPage() {
  const [income, setIncome] = useState<number>(5400);
  const [expenses, setExpenses] = useState<number>(2476.8);
  const [assets, setAssets] = useState<number>(79200);
  const [liabilities, setLiabilities] = useState<number>(1250);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, accRes] = await Promise.all([
          apiClient.getSummary(),
          apiClient.listAccounts(),
        ]);

        if (sumRes.data.total_income) setIncome(parseFloat(sumRes.data.total_income));
        if (sumRes.data.total_expenses) setExpenses(parseFloat(sumRes.data.total_expenses));

        let ast = 0;
        let liab = 0;
        const accountsList = accRes.data.accounts || [];
        accountsList.forEach((a) => {
          const bal = parseFloat(a.current_balance || a.initial_balance);
          if (a.account_type === 'credit') liab += bal;
          else ast += bal;
        });
        if (ast > 0) setAssets(ast);
        if (liab > 0) setLiabilities(liab);
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Pillar 1: Savings Rate (30 pts max)
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const savingsScore = Math.min(30, Math.max(0, (savingsRate / 20) * 30));

  // Pillar 2: Debt-to-Asset (25 pts max)
  const debtRatio = assets > 0 ? (liabilities / assets) * 100 : 0;
  const debtScore = Math.min(25, Math.max(0, 25 - (debtRatio / 30) * 25));

  // Pillar 3: Emergency Runway (25 pts max)
  const runwayMonths = expenses > 0 ? assets / expenses : 0;
  const runwayScore = Math.min(25, Math.max(0, (runwayMonths / 6) * 25));

  // Pillar 4: Cash Flow Positivity (20 pts max)
  const cashFlow = income - expenses;
  const cashFlowScore = cashFlow > 0 ? 20 : 0;

  const totalScore = Math.round(savingsScore + debtScore + runwayScore + cashFlowScore);

  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <Activity className="h-3.5 w-3.5" />
            Module 12: Manage Obligations & Health
          </div>
          <h1 className="heading-page">Integrated Financial Health</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Holistic financial assessment integrating verified cash flow, balance sheet resilience, and emergency coverage.
          </p>
        </div>

        {/* Overall Score Hero Card */}
        <div className="bg-finroq-forest text-white rounded-3xl p-8 sm:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-finroq-lime">
              Composite Financial Health Index
            </span>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="font-heading font-black text-5xl sm:text-7xl text-white">
                {totalScore}
              </span>
              <span className="text-lg text-slate-300 font-medium">/ 100</span>
            </div>
            <p className="text-sm text-slate-200 mt-2 max-w-md">
              {totalScore >= 80
                ? 'Excellent financial resilience. Your balance sheet demonstrates low leverage and healthy surplus generation.'
                : totalScore >= 60
                ? 'Stable foundation with opportunities to optimize emergency liquidity or accelerate savings.'
                : 'Needs attention. Focus on eliminating high-interest liabilities and controlling monthly burn rate.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link href="/insights" className="btn btn-lime text-xs font-bold px-6 py-3">
              Consult AI Spending Assistant <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs space-y-2">
            <span className="text-xs text-finroq-muted font-medium">1. Savings Rate</span>
            <p className="font-mono text-xl font-bold text-finroq-positive">{savingsRate.toFixed(1)}%</p>
            <span className="text-[11px] text-finroq-muted">Target: &gt; 20% of net income</span>
            <div className="text-xs font-semibold text-finroq-forest pt-1">
              Score: {Math.round(savingsScore)} / 30
            </div>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs space-y-2">
            <span className="text-xs text-finroq-muted font-medium">2. Debt-to-Asset Ratio</span>
            <p className="font-mono text-xl font-bold text-finroq-positive">{debtRatio.toFixed(1)}%</p>
            <span className="text-[11px] text-finroq-muted">Target: &lt; 20% total equity</span>
            <div className="text-xs font-semibold text-finroq-forest pt-1">
              Score: {Math.round(debtScore)} / 25
            </div>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs space-y-2">
            <span className="text-xs text-finroq-muted font-medium">3. Liquid Runway</span>
            <p className="font-mono text-xl font-bold text-finroq-positive">{runwayMonths.toFixed(1)} mo</p>
            <span className="text-[11px] text-finroq-muted">Target: &gt;= 6 months buffer</span>
            <div className="text-xs font-semibold text-finroq-forest pt-1">
              Score: {Math.round(runwayScore)} / 25
            </div>
          </Card>

          <Card className="p-5 bg-white border-finroq-border rounded-2xl shadow-xs space-y-2">
            <span className="text-xs text-finroq-muted font-medium">4. Cash Flow Position</span>
            <p className="font-mono text-xl font-bold text-finroq-positive">+{formatCurrency(cashFlow)}</p>
            <span className="text-[11px] text-finroq-muted">Net surplus per month</span>
            <div className="text-xs font-semibold text-finroq-forest pt-1">
              Score: {cashFlowScore} / 20
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
