'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Input } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { Budget } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, PieChart } from 'lucide-react';

export default function PreSpendCheckPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(150);
  const [itemDescription, setItemDescription] = useState('New Noise Cancelling Headphones');

  useEffect(() => {
    async function loadBudgets() {
      try {
        const now = new Date();
        const res = await apiClient.listBudgets(now.getFullYear(), now.getMonth() + 1);
        setBudgets(res.data);
        if (res.data.length > 0) {
          setSelectedBudgetId(String(res.data[0].id));
        }
      } catch {
        // Handled gracefully
      } finally {
        setIsLoading(false);
      }
    }
    loadBudgets();
  }, []);

  const selectedBudget = budgets.find((b) => String(b.id) === selectedBudgetId);
  const allocated = selectedBudget ? parseFloat(selectedBudget.allocated_amount) : 0;
  const spentSoFar = selectedBudget ? parseFloat(selectedBudget.actual_spending || '0') : 0;
  const remainingBefore = Math.max(0, allocated - spentSoFar);
  const remainingAfter = allocated - (spentSoFar + (purchaseAmount || 0));
  const willOverspend = remainingAfter < 0;
  const overrunAmount = willOverspend ? Math.abs(remainingAfter) : 0;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <ShoppingBag className="h-3.5 w-3.5" />
            Module 4: Decide Before Spending
          </div>
          <h1 className="heading-page">Pre-Spend Impact Check</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Simulate how a planned purchase affects your category budget and cash flow before committing funds.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="md:col-span-6 space-y-5">
            <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
              <h2 className="font-heading font-bold text-base text-finroq-text">Planned Purchase</h2>

              <div>
                <label className="label">Item / Service Description</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="input"
                  placeholder="e.g. Flight tickets, Dinner, Gadget"
                />
              </div>

              <div>
                <label className="label">Estimated Price ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={purchaseAmount || ''}
                  onChange={(e) => setPurchaseAmount(parseFloat(e.target.value) || 0)}
                  className="input font-mono text-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Target Category Budget</label>
                {isLoading ? (
                  <div className="text-xs text-finroq-muted p-2">Loading active budgets...</div>
                ) : budgets.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
                    No active category budgets found. Create one in Budgets first!
                  </div>
                ) : (
                  <select
                    value={selectedBudgetId}
                    onChange={(e) => setSelectedBudgetId(e.target.value)}
                    className="input font-medium"
                  >
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.category_name || `Budget #${b.id}`} — Cap: {formatCurrency(b.allocated_amount)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </Card>
          </div>

          {/* Impact Analysis Result */}
          <div className="md:col-span-6 space-y-5">
            <Card
              className={`p-6 rounded-2xl border shadow-xs space-y-5 ${
                willOverspend ? 'bg-red-50/50 border-red-200' : 'bg-white border-finroq-border'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-finroq-muted">
                  Budget Impact Verdict
                </span>
                {willOverspend ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-finroq-negative text-xs font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Budget Overrun Risk
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-finroq-mint text-finroq-positive text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Safe to Spend
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs text-finroq-muted">
                  <span>Current Allocation:</span>
                  <span className="font-mono font-bold text-finroq-text">{formatCurrency(allocated)}</span>
                </div>
                <div className="flex justify-between text-xs text-finroq-muted">
                  <span>Spent So Far this Month:</span>
                  <span className="font-mono font-bold text-finroq-text">{formatCurrency(spentSoFar)}</span>
                </div>
                <div className="flex justify-between text-xs text-finroq-muted">
                  <span>Remaining Cushion Before:</span>
                  <span className="font-mono font-bold text-finroq-positive">{formatCurrency(remainingBefore)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold">
                  <span className={willOverspend ? 'text-finroq-negative' : 'text-finroq-forest'}>
                    Remaining Cushion After:
                  </span>
                  <span className={`font-mono text-base ${willOverspend ? 'text-finroq-negative' : 'text-finroq-positive'}`}>
                    {willOverspend ? `-${formatCurrency(overrunAmount)}` : formatCurrency(remainingAfter)}
                  </span>
                </div>
              </div>

              {/* Advice Box */}
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed ${
                  willOverspend
                    ? 'bg-red-100/70 text-red-900 border border-red-200'
                    : 'bg-finroq-mint text-finroq-forest border border-finroq-sage/60'
                }`}
              >
                {willOverspend ? (
                  <p>
                    ⚠️ <strong>Caution:</strong> Spending <strong>{formatCurrency(purchaseAmount)}</strong> on <em>{itemDescription}</em> will cause a deficit of <strong>{formatCurrency(overrunAmount)}</strong> in this category. Consider postponing or adjusting other categories.
                  </p>
                ) : (
                  <p>
                    ✅ <strong>Approved:</strong> This purchase fits cleanly within your category allowance, leaving <strong>{formatCurrency(remainingAfter)}</strong> available for the rest of the cycle.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
