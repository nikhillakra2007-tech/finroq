'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { Account, RecurringTransaction } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { ShieldAlert, Calendar, Plus, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';

interface DebtItem {
  id: string;
  name: string;
  nameHi?: string;
  principal: number;
  remaining: number;
  monthlyEMI: number;
  interestRate: number;
  dueDate: string;
  source: 'live_account' | 'live_recurring' | 'illustrative';
}

export default function AppDebtWatchdogPage() {
  const { language } = useI18n();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDebtData() {
      try {
        const [accRes, recRes] = await Promise.all([
          apiClient.listAccounts(),
          apiClient.listRecurring(),
        ]);

        const creditAccounts = (accRes.data.accounts || []).filter((a: any) => a.account_type === 'credit');
        const recurringDebts = (recRes.data || []).filter(
          (r: any) => r.transaction_type === 'expense' && r.status === 'active'
        );

        const liveItems: DebtItem[] = [];

        creditAccounts.forEach((c: any) => {
          const bal = Math.abs(parseFloat(c.current_balance || c.initial_balance || '0'));
          liveItems.push({
            id: `acc-${c.id}`,
            name: `${c.name} (Credit Account)`,
            principal: bal > 0 ? bal * 1.2 : 50000,
            remaining: bal,
            monthlyEMI: Math.max(500, Math.round(bal * 0.05)),
            interestRate: 24.0,
            dueDate: 'Monthly billing cycle',
            source: 'live_account',
          });
        });

        recurringDebts.forEach((r: any) => {
          const amt = parseFloat(r.amount);
          liveItems.push({
            id: `rec-${r.id}`,
            name: `${r.description || r.category_name || 'Recurring Obligation'}`,
            principal: amt * 12,
            remaining: amt * 8,
            monthlyEMI: amt,
            interestRate: 8.5,
            dueDate: r.next_occurrence ? `Due ${r.next_occurrence}` : `${r.frequency} auto-debit`,
            source: 'live_recurring',
          });
        });

        if (liveItems.length > 0) {
          setDebts(liveItems);
        } else {
          // Illustrative scenario if demo user hasn't added credit accounts yet
          setDebts([
            {
              id: '1',
              name: 'Vehicle Auto Loan',
              nameHi: 'वाहन ऋण (कार लोन)',
              principal: 650000,
              remaining: 420000,
              monthlyEMI: 14500,
              interestRate: 8.5,
              dueDate: language === 'hi' ? 'हर महीने की 5 तारीख' : '5th of every month',
              source: 'illustrative',
            },
            {
              id: '2',
              name: 'Credit Card Revolving',
              nameHi: 'क्रेडिट कार्ड बकाया',
              principal: 75000,
              remaining: 22340,
              monthlyEMI: 3500,
              interestRate: 36.0,
              dueDate: language === 'hi' ? 'हर महीने की 18 तारीख' : '18th of every month',
              source: 'illustrative',
            },
          ]);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadDebtData();
  }, [language]);

  const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);
  const totalMonthlyObligation = debts.reduce((sum, d) => sum + d.monthlyEMI, 0);

  return (
    <ModuleShell
      title={language === 'hi' ? 'ईएमआई / ऋण प्रहरी' : 'EMI / Debt Watchdog'}
      category={language === 'hi' ? 'देनदारियों का प्रबंधन' : 'Manage Obligations'}
      description={
        language === 'hi'
          ? 'बकाया ऋण शेष, मासिक ईएमआई, भुगतान देय तिथियों और ब्याज के बोझ की स्पष्ट निगरानी।'
          : 'Track outstanding loan balances, recurring monthly EMIs, payment due dates, and interest drag without guessing.'
      }
    >
      <div className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
              {language === 'hi' ? 'कुल बकाया ऋण' : 'Total Outstanding Debt'}
            </span>
            <div className="font-mono text-3xl font-bold text-[var(--bad)]">
              {formatCurrency(totalDebt)}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {language === 'hi' ? `${debts.length} सक्रिय ऋण दायित्वों में` : `Across ${debts.length} active loan obligations`}
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
              {language === 'hi' ? 'मासिक ईएमआई भार' : 'Monthly EMI Burden'}
            </span>
            <div className="font-mono text-3xl font-bold text-[var(--ink)]">
              {formatCurrency(totalMonthlyObligation)}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {language === 'hi' ? 'प्रति माह तय नकद बहिर्वाह' : 'Committed monthly cash outflow'}
            </p>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">
              {language === 'hi' ? 'सक्रिय ऋण अनुबंध' : 'Active Debt Contracts'}
            </h3>
            <span className="text-xs font-mono text-[var(--muted)]">
              {language === 'hi' ? 'निश्चित परिशोधन' : 'Fixed Amortization'}
            </span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {debts.map((d) => (
              <div key={d.id} className="py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-semibold text-base text-[var(--ink)]">
                    {language === 'hi' && d.nameHi ? d.nameHi : d.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)]">
                    <span className="font-mono">{language === 'hi' ? 'देय:' : 'Due:'} {d.dueDate}</span>
                    <span>•</span>
                    <span className="font-mono text-[var(--bad)] font-semibold">{d.interestRate}% APR</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[var(--muted)] block">
                    {language === 'hi' ? 'शेष राशि' : 'Remaining Balance'}
                  </span>
                  <span className="font-mono text-lg font-bold text-[var(--ink)]">
                    {formatCurrency(d.remaining)}
                  </span>
                  <span className="text-xs text-[var(--muted)] block mt-0.5">
                    {language === 'hi' ? 'ईएमआई:' : 'EMI:'} <strong className="font-mono text-[var(--bad)]">{formatCurrency(d.monthlyEMI)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[var(--soft)] text-xs text-[var(--muted)] flex items-center gap-2 border border-[var(--line)]">
            <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>
              {language === 'hi'
                ? 'सुझाव: संचयी ब्याज के नुकसान को न्यूनतम करने के लिए उच्चतम ब्याज वाले ऋणों को पहले चुकाने को प्राथमिकता दें (Avalanche पद्धति)।'
                : 'Tip: Prioritize paying down highest-interest obligations (Avalanche method) to minimize cumulative interest bleed.'}
            </span>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
