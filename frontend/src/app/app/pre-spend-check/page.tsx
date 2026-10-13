'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { Budget, Account } from '@/lib/api-types';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { ShoppingBag, CheckCircle2, AlertTriangle, Wallet } from 'lucide-react';

export default function AppPreSpendCheckPage() {
  const { language, t } = useI18n();
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
        language === 'hi'
          ? `${formatCurrency(purchaseAmount)} को ${selectedBudget.category_name} बजट में दर्ज कर दिया गया है।`
          : `Committed ${formatCurrency(purchaseAmount)} to ${selectedBudget.category_name} budget.`
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
      title={language === 'hi' ? 'खर्च पूर्व जांच' : 'Pre-Spend Check'}
      category={language === 'hi' ? 'खर्च करने से पहले निर्णय लें' : 'Decide Before Spending'}
      description={
        language === 'hi'
          ? 'पैसे खर्च करने से पहले देखें कि किसी खरीदारी का आपके श्रेणी बजट और बचत पर क्या प्रभाव पड़ेगा।'
          : 'Simulate potential purchases against your active category caps to preview budget impact before spending a single rupee.'
      }
    >
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Simulation Input Card — crisp white in light mode, sleek dark emerald in dark mode */}
        <div className="md:col-span-6 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33]">
            <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-50">
              {language === 'hi' ? 'खरीदारी सिम्युलेटर' : 'Purchase Simulator'}
            </h3>
            <span className="text-xs font-mono font-medium text-[#2E4035] dark:text-slate-300">
              {language === 'hi' ? 'काल्पनिक परीक्षण' : 'Hypothetical Simulation'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
                {language === 'hi' ? 'वस्तु / खर्च का विवरण' : 'Item / Expense Description'}
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Flight Tickets, Dinner"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 border border-[#CBD5CB] dark:border-[#2A3D33] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#173F2B] dark:text-slate-200 block mb-1.5">
                {language === 'hi' ? 'अनुमानित मूल्य (₹)' : 'Estimated Price (₹)'}
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
                {language === 'hi' ? 'प्रभावित बजट श्रेणी' : 'Impacted Budget Category'}
              </label>
              {budgets.length === 0 ? (
                <div className="text-xs text-[#2E4035] dark:text-slate-300 p-3 rounded-xl bg-[#F4F7F3] dark:bg-[#1A2C22] border border-[#CBD5CB] dark:border-[#2A3D33] font-medium">
                  {language === 'hi'
                    ? 'उदाहरण सीमा (₹10,000.00) का उपयोग किया जा रहा है। लाइव सिंक के लिए बजट मॉड्यूल में बजट बनाएं।'
                    : 'Using illustrative category cap (₹10,000.00). Create active budgets in Module 2 for live syncing.'}
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

        {/* Impact Verdict Card — crisp white in light mode, dark emerald in dark mode */}
        <div className="md:col-span-6 bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5CB] dark:border-[#2A3D33]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#173F2B] dark:text-slate-300">
              {language === 'hi' ? 'बजट प्रभाव परिणाम' : 'Budget Impact Verdict'}
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
                  {language === 'hi' ? 'घाटे का जोखिम' : 'Deficit Risk'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'खर्च करने के लिए सुरक्षित' : 'Safe to Spend'}
                </>
              )}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span>{language === 'hi' ? 'श्रेणी आवंटन:' : 'Category Allocation:'}</span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(allocated)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span>{language === 'hi' ? 'अब तक का खर्च:' : 'Spent So Far:'}</span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(spentSoFar)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#2E4035] dark:text-slate-300 font-medium">
              <span>{language === 'hi' ? 'उपलब्ध शेष राशि (पहले):' : 'Available Cushion Before:'}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(remainingBefore)}</span>
            </div>
            <div className="pt-2 border-t border-[#CBD5CB] dark:border-[#2A3D33] flex justify-between font-bold">
              <span className="text-[#173F2B] dark:text-slate-100">
                {language === 'hi' ? 'खरीदारी के बाद शेष राशि:' : 'Remaining Cushion After:'}
              </span>
              <span
                className={`font-mono text-base font-extrabold ${
                  willOverspend ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {willOverspend ? `−${formatCurrency(overrunAmount)}` : formatCurrency(remainingAfter)}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed border ${
              willOverspend
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                : 'bg-[#F4F7F3] border-[#CBD5CB] text-[#173F2B] dark:bg-[#1A2C22] dark:border-[#2A3D33] dark:text-slate-200'
            }`}
          >
            {willOverspend ? (
              <p>
                ⚠️ <strong>{language === 'hi' ? 'अति-व्यय चेतावनी:' : 'Overrun Warning:'}</strong>{' '}
                <em>{itemDescription}</em> पर <strong>{formatCurrency(purchaseAmount)}</strong> खर्च करने से इस श्रेणी में{' '}
                <strong>{formatCurrency(overrunAmount)}</strong> का घाटा होगा। इसे स्थगित करने या बजट समायोजित करने पर विचार करें।
              </p>
            ) : (
              <p>
                ✅ <strong>{language === 'hi' ? 'स्वीकृत कुशन:' : 'Approved Cushion:'}</strong> यह योजनाबद्ध खर्च आपके श्रेणी बजट में पूरी तरह फिट बैठता है, और चक्र के लिए{' '}
                <strong>{formatCurrency(remainingAfter)}</strong> शेष बचेंगे।
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
                      {language === 'hi' ? 'भुगतान खाता' : 'Charge Account'}
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
                    ? language === 'hi' ? 'दर्ज हो रहा है...' : 'Committing...'
                    : language === 'hi'
                    ? `लेजर में खर्च दर्ज करें (${formatCurrency(purchaseAmount)})`
                    : `Commit Purchase to Ledger (${formatCurrency(purchaseAmount)})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
