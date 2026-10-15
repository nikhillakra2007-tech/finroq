'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { ShieldCheck, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';

export default function AppCreditHealthPage() {
  const { language, t } = useI18n();
  const [totalCreditLimit, setTotalCreditLimit] = useState(150000);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(22340);
  const [hasLiveCreditAccount, setHasLiveCreditAccount] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await apiClient.listAccounts();
        const creditAccounts = (res.data.accounts || []).filter((a: any) => a.account_type === 'credit');
        if (creditAccounts.length > 0) {
          const totalBal = creditAccounts.reduce(
            (sum: number, a: any) => sum + Math.abs(parseFloat(a.current_balance || a.initial_balance || '0')),
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
      title={t('mod.credit_health', 'Credit Health')}
      category={t('cat.manage_obligations', 'Manage Obligations')}
      description={t(
        'mod.credit_health.desc',
        'Review credit utilization metrics, payment punctuality, and healthy credit maintenance without fabricated bureau scores.'
      )}
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="md:col-span-5 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <h3 className="font-display font-bold text-lg pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33] text-[#173F2B] dark:text-slate-50">
            {t('credit.inputs', 'Credit Line Inputs')}
          </h3>

          <div>
            <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              {t('credit.total_limit', 'Total Combined Credit Limit (₹)')}
            </label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={totalCreditLimit}
              onChange={(e) => setTotalCreditLimit(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              {t('credit.current_balance', 'Current Outstanding Balance (₹)')}
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={currentCreditBalance}
              onChange={(e) => setCurrentCreditBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold"
            />
          </div>
        </div>

        {/* Verdict */}
        <div className="md:col-span-7 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33]">
            <div>
              <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
                {t('credit.revolving_health', 'Revolving Credit Health')}
              </h3>
              <p className="text-xs text-[#2E4035] dark:text-slate-300 font-medium">
                {t('credit.target_utilization', 'Target Utilization: ≤ 30%')}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                isHealthy
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {isHealthy
                ? t('credit.optimal', 'Optimal Utilization')
                : t('credit.high', 'High Utilization')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-[#2E4035] dark:text-slate-300 font-medium">
              <span>{t('credit.utilized', 'Utilized:')} {formatCurrency(currentCreditBalance)}</span>
              <span>{t('credit.limit', 'Limit:')} {formatCurrency(totalCreditLimit)}</span>
            </div>
            <div className="track">
              <i
                style={{
                  width: `${Math.min(100, utilizationRate)}%`,
                  backgroundColor: isHealthy ? '#247A50' : '#B74747',
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold block text-right text-[#173F2B] dark:text-slate-100">
              {utilizationRate.toFixed(1)}% {t('credit.ratio', 'Ratio')}
            </span>
          </div>

          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              isHealthy
                ? 'bg-[#F4F7F3] border-[#CBD5CB] text-[#173F2B] dark:bg-[#1A2C22] dark:border-[#2A3D33] dark:text-slate-200'
                : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
            }`}
          >
            {isHealthy ? (
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{t('credit.healthy_ratio', 'Healthy Ratio:')}</strong>{' '}
                  {t(
                    'credit.healthy_desc',
                    'Maintaining revolving balances below 30% signals low credit risk and avoids interest spirals.'
                  )}
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>{t('credit.caution', 'Caution:')}</strong>{' '}
                  {language === 'hi'
                    ? `30% से अधिक उपयोग क्रेडिट स्कोर को प्रभावित कर सकता है। सुरक्षित सीमा में आने के लिए ₹${Math.max(0, Math.round(currentCreditBalance - totalCreditLimit * 0.3)).toLocaleString('hi-IN')} का भुगतान करें।`
                    : `Utilization above 30% can depress creditworthiness and incur heavy compounding finance charges. Pay down ₹${Math.max(0, Math.round(currentCreditBalance - totalCreditLimit * 0.3)).toLocaleString('en-IN')} to return under 30%.`}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
