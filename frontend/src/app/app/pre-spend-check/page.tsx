'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { Budget, Account } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import {
  PRESPEND_I18N,
  renderOverrunWarning,
  renderApprovedCushion,
  getCommitBtnText,
  getCommitSuccessMessage,
} from '@/lib/i18n-prespend';
import { CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';

export default function AppPreSpendCheckPage() {
  const { language } = useI18n();
  const labels = PRESPEND_I18N[language] || PRESPEND_I18N.en;

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(1500);
  const [itemDescription, setItemDescription] = useState('New Noise Cancelling Headphones');
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<string | null>(null);

  const loadBudgetsAndAccounts = async () => {
    try {
      const now = new Date();
      const [bRes, aRes] = await Promise.all([
        apiClient.listBudgets(now.getFullYear(), now.getMonth() + 1),
        apiClient.listAccounts(),
      ]);
      setBudgets(bRes.data);
      if (bRes.data.length > 0 && !selectedBudgetId) {
        setSelectedBudgetId(String(bRes.data[0].id));
      }
      setAccounts(aRes.data.accounts || []);
      if (aRes.data.accounts && aRes.data.accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(aRes.data.accounts[0].id);
      }
    } catch {
      // Fallback for simulation
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetsAndAccounts();
  }, []);

  const handleCommitPurchase = async () => {
    if (!selectedAccountId || !selectedBudget || purchaseAmount <= 0) return;
    setIsCommitting(true);
    setCommitSuccess(null);
    try {
      await apiClient.createTransaction({
        account_id: selectedAccountId,
        category_id: selectedBudget.category_id,
        amount: purchaseAmount.toFixed(2),
        currency: accounts.find((a) => a.id === selectedAccountId)?.currency || 'USD',
        transaction_type: 'expense',
        description: itemDescription,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setCommitSuccess(
        getCommitSuccessMessage(
          language,
          formatCurrency(purchaseAmount),
          selectedBudget.category_name || 'Category'
        )
      );
      await loadBudgetsAndAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record purchase.');
    } finally {
      setIsCommitting(false);
    }
  };

  const selectedBudget = budgets.find((b) => String(b.id) === selectedBudgetId);
  const allocated = selectedBudget ? parseFloat(selectedBudget.allocated_amount) : 10000;
  const spentSoFar = selectedBudget ? parseFloat(selectedBudget.actual_spending || '0') : 6500;
  const remainingBefore = Math.max(0, allocated - spentSoFar);
  const remainingAfter = allocated - (spentSoFar + (purchaseAmount || 0));
  const willOverspend = remainingAfter < 0;
  const overrunAmount = willOverspend ? Math.abs(remainingAfter) : 0;

  return (
    <ModuleShell
      title={labels.moduleTitle}
      category={labels.moduleCategory}
      description={labels.moduleDesc}
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Simulation Input Card */}
        <div className="md:col-span-6 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33]">
            <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
              {labels.simulatorTitle}
            </h3>
            <span className="text-xs font-mono font-medium text-[#2E4035] dark:text-slate-300">
              {labels.hypotheticalBadge}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
                {labels.itemLabel}
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder={labels.itemPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
                {labels.priceLabel}
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
                {labels.categoryLabel}
              </label>
              {budgets.length === 0 ? (
                <div className="text-xs text-[#2E4035] dark:text-slate-300 p-3 rounded-xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] font-medium">
                  {labels.illustrativeCapNote}
                </div>
              ) : (
                <select
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-medium"
                >
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.category_name || `Budget #${b.id}`} — Cap: {formatCurrency(b.allocated_amount)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Impact Verdict Card */}
        <div className="md:col-span-6 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#173F2B] dark:text-slate-300">
              {labels.verdictTitle}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
                willOverspend
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {willOverspend ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {labels.deficitRisk}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {labels.safeToSpend}
                </>
              )}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-baseline gap-2 text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span className="min-w-0 break-words">{labels.categoryAllocation}</span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100 shrink-0">{formatCurrency(allocated)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2 text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span className="min-w-0 break-words">{labels.spentSoFar}</span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100 shrink-0">{formatCurrency(spentSoFar)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2 text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span className="min-w-0 break-words">{labels.availableCushionBefore}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{formatCurrency(remainingBefore)}</span>
            </div>
            <div className="pt-2 border-t border-[#CBD5CB] dark:border-[#2A3D33] flex justify-between items-baseline gap-2 font-bold">
              <span className="text-[#173F2B] dark:text-slate-100 min-w-0 break-words">
                {labels.remainingCushionAfter}
              </span>
              <span
                className={`font-mono text-base font-extrabold shrink-0 ${
                  willOverspend ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {willOverspend ? `−${formatCurrency(overrunAmount)}` : formatCurrency(remainingAfter)}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border break-words [overflow-wrap:anywhere] ${
              willOverspend
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                : 'bg-[#F4F7F3] border-[#CBD5CB] text-[#173F2B] dark:bg-[#1A2C22] dark:border-[#2A3D33] dark:text-slate-200'
            }`}
          >
            {willOverspend ? (
              <p>
                ⚠️ <strong>{labels.overrunWarningTitle}</strong>{' '}
                {renderOverrunWarning(
                  language,
                  itemDescription,
                  formatCurrency(purchaseAmount),
                  formatCurrency(overrunAmount)
                )}
              </p>
            ) : (
              <p>
                ✅ <strong>{labels.approvedCushionTitle}</strong>{' '}
                {renderApprovedCushion(language, formatCurrency(remainingAfter))}
              </p>
            )}
          </div>

          {/* Action to commit to ledger */}
          <div className="pt-3 border-t border-[#CBD5CB] dark:border-[#2A3D33] space-y-3">
            {commitSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{commitSuccess}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-[#173F2B] dark:text-slate-300 block mb-1">
                      {labels.chargeAccountLabel}
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#173F2B]"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCommitPurchase}
                  disabled={isCommitting || purchaseAmount <= 0 || !selectedBudget}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {isCommitting
                    ? labels.committing
                    : getCommitBtnText(language, formatCurrency(purchaseAmount))}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
