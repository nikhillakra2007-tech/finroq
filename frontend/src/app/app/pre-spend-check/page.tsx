'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { Budget, Account } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';

export default function AppPreSpendCheckPage() {
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
      setCommitSuccess(`Committed ${formatCurrency(purchaseAmount)} to ${selectedBudget.category_name} budget.`);
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
      title="Pre-Spend Check"
      category="Decide Before Spending"
      description="Simulate potential purchases against your active category caps to preview budget impact before spending a single rupee."
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Simulation Input Card */}
        <div className="md:col-span-6 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <h3 className="font-display font-bold text-lg">Purchase Simulator</h3>
            <span className="text-xs font-mono text-[var(--muted)]">Hypothetical Simulation</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
                Item / Expense Description
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Flight Tickets, Dinner"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
                Estimated Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted)] block mb-1.5">
                Impacted Budget Category
              </label>
              {budgets.length === 0 ? (
                <div className="text-xs text-[var(--muted)] p-3 rounded-xl bg-[var(--soft)] border border-[var(--line)]">
                  Using illustrative category cap (₹10,000.00). Create active budgets in Module 2 for live syncing.
                </div>
              ) : (
                <select
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-medium"
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

        {/* Impact Verdict */}
        <div className="md:col-span-6 bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
              Budget Impact Verdict
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
                willOverspend
                  ? 'bg-[var(--bad-soft)] text-[var(--bad)]'
                  : 'bg-[var(--soft)] text-[var(--accent)]'
              }`}
            >
              {willOverspend ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> Deficit Risk
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Safe to Spend
                </>
              )}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Category Allocation:</span>
              <span className="font-mono font-bold text-[var(--ink)]">{formatCurrency(allocated)}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Spent So Far:</span>
              <span className="font-mono font-bold text-[var(--ink)]">{formatCurrency(spentSoFar)}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Available Cushion Before:</span>
              <span className="font-mono font-bold text-[var(--accent)]">{formatCurrency(remainingBefore)}</span>
            </div>
            <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold">
              <span>Remaining Cushion After:</span>
              <span
                className={`font-mono text-base ${
                  willOverspend ? 'text-[var(--bad)]' : 'text-[var(--accent)]'
                }`}
              >
                {willOverspend ? `−${formatCurrency(overrunAmount)}` : formatCurrency(remainingAfter)}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              willOverspend
                ? 'bg-[var(--bad-soft)]/50 border-[var(--bad-soft)] text-[var(--bad)]'
                : 'bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]'
            }`}
          >
            {willOverspend ? (
              <p>
                ⚠️ <strong>Overrun Warning:</strong> Spending <strong>{formatCurrency(purchaseAmount)}</strong> on{' '}
                <em>{itemDescription}</em> will cause a deficit of{' '}
                <strong>{formatCurrency(overrunAmount)}</strong> in this category. Consider postponing or adjusting allowances.
              </p>
            ) : (
              <p>
                ✅ <strong>Approved Cushion:</strong> This planned expense fits cleanly within your category allowance, leaving{' '}
                <strong>{formatCurrency(remainingAfter)}</strong> remaining for the rest of the cycle.
              </p>
            )}
          </div>

          {/* Action to commit to ledger */}
          <div className="pt-3 border-t border-[var(--line)] space-y-3">
            {commitSuccess ? (
              <div className="p-3 rounded-xl bg-[var(--soft)] text-xs text-[var(--accent)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{commitSuccess}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.length > 0 && (
                  <div>
                    <label className="text-[11px] text-[var(--muted)] block mb-1">Charge Account</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {isCommitting ? 'Committing...' : `Commit Purchase to Ledger (${formatCurrency(purchaseAmount)})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
