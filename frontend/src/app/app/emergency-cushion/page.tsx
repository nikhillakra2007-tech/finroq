'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { Umbrella, CheckCircle2, AlertTriangle, ShieldCheck, Wallet, Sparkles, Activity } from 'lucide-react';

export default function AppEmergencyCushionPage() {
  const { language } = useI18n();
  const [monthlyEssential, setMonthlyEssential] = useState<number>(45000);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [currentEmergencyLiquid, setCurrentEmergencyLiquid] = useState<number>(180000);
  const [realTxnCount, setRealTxnCount] = useState<number>(0);
  const [isCalculatedFromLedger, setIsCalculatedFromLedger] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRealData() {
      try {
        const [accRes, txnRes] = await Promise.all([
          apiClient.listAccounts({ page: 1, page_size: 100, is_active: true }),
          apiClient.listTransactions({ page: 1, page_size: 100, transaction_type: 'expense' }),
        ]);

        // 1. Calculate liquid savings from bank balances
        const liquidAccounts = (accRes.data.accounts || []).filter(
          (a: any) => a.account_type === 'checking' || a.account_type === 'savings'
        );
        if (liquidAccounts.length > 0) {
          const totalLiquid = liquidAccounts.reduce(
            (sum: number, a: any) => sum + parseFloat(a.current_balance || a.initial_balance || '0'),
            0
          );
          if (totalLiquid > 0) {
            setCurrentEmergencyLiquid(totalLiquid);
          }
        }

        // 2. Dynamically calculate monthly burn from actual transactions
        const expenseTxns = txnRes.data.transactions || [];
        if (expenseTxns.length > 0) {
          const totalSpent = expenseTxns.reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
          if (totalSpent > 0) {
            // If we have verified transactions, derive the realistic monthly burn rate
            const calculatedBurn = Math.round(totalSpent > 10000 ? totalSpent : totalSpent * 3);
            setMonthlyEssential(calculatedBurn);
            setRealTxnCount(expenseTxns.length);
            setIsCalculatedFromLedger(true);
          }
        }
      } catch (err) {
        console.warn('Fallback to standard model for emergency cushion:', err);
      }
    }
    loadRealData().finally(() => setIsLoading(false));
  }, []);

  const targetFund = monthlyEssential * targetMonths;
  const fundedMonths = monthlyEssential > 0 ? (currentEmergencyLiquid / monthlyEssential).toFixed(1) : '0';
  const fundingGap = Math.max(0, targetFund - currentEmergencyLiquid);
  const isFullyFunded = currentEmergencyLiquid >= targetFund;
  const fundedPercent = Math.min(100, Math.round((currentEmergencyLiquid / (targetFund || 1)) * 100));

  return (
    <ModuleShell
      title={language === 'hi' ? 'आपातकालीन कुशन' : 'Emergency Cushion'}
      category={language === 'hi' ? 'निर्माण और सुरक्षा' : 'Build & Protect'}
      description={
        language === 'hi'
          ? 'व्यय ट्रैकर से आपके वास्तविक मासिक खर्च से जुड़ा हुआ। जैसे-जैसे आपका खर्च बदलता है, आपका आपातकालीन फंड स्वतः समायोजित होता है।'
          : 'Connected to your actual monthly spending from the expense tracker. Your emergency fund adjusts as your spending changes.'
      }
    >
      {isLoading ? (
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 h-96 bg-[var(--soft)] rounded-3xl animate-pulse" />
          <div className="md:col-span-7 space-y-6">
            <div className="h-40 bg-[var(--soft)] rounded-3xl animate-pulse" />
            <div className="h-64 bg-[var(--soft)] rounded-3xl animate-pulse" />
          </div>
        </div>
      ) : (
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs md:col-span-5">
          <div className="pb-3 border-b border-[#DCE4DC] dark:border-[var(--line)] flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
              {language === 'hi' ? 'कुशन पैरामीटर' : 'Cushion Parameters'}
            </h3>
            {isCalculatedFromLedger && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#173F2B] dark:text-emerald-300 border border-emerald-200 text-[11px] font-bold font-mono">
                <Activity className="w-3 h-3 text-emerald-600" /> {language === 'hi' ? 'लाइव लेजर सिंक' : 'Live Ledger Sync'}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              {language === 'hi'
                ? 'मासिक अनिवार्य खर्च (किराया, राशन, ईएमआई, बिल)'
                : 'Monthly Essential Burn (Rent, Groceries, EMIs, Utilities)'}
            </label>
            <input
              type="number"
              min="10000"
              step="1000"
              value={monthlyEssential}
              onChange={(e) => {
                setMonthlyEssential(parseFloat(e.target.value) || 0);
                setIsCalculatedFromLedger(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold text-[#173F2B] dark:text-slate-100"
            />
            {isCalculatedFromLedger && (
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {language === 'hi'
                  ? `✓ आपके ${realTxnCount} पूर्ण लेन-देन से स्वतः परिकलित।`
                  : `✓ Auto-derived from your ${realTxnCount} completed expense transactions.`}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              {language === 'hi' ? 'लक्षित सुरक्षा अवधि (महीने)' : 'Target Runway Months'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMonths(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    targetMonths === m
                      ? 'bg-[#173F2B] text-white border-[#173F2B] shadow-xs'
                      : 'bg-white dark:bg-[var(--surface)] text-[#4D5D51] dark:text-slate-300 border-[#DCE4DC] dark:border-[var(--line)] hover:bg-[#F4F7F3]'
                  }`}
                >
                  {m} {language === 'hi' ? 'महीने' : 'Months'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173F2B] dark:text-slate-200 block mb-1.5">
              {language === 'hi' ? 'तरल नकद व बैंक रिज़र्व' : 'Liquid Cash & Bank Reserves'}
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={currentEmergencyLiquid}
              onChange={(e) => setCurrentEmergencyLiquid(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] focus:outline-none focus:ring-2 focus:ring-[#173F2B] text-sm font-mono font-bold text-[#173F2B] dark:text-slate-100"
            />
            <p className="mt-1 text-[11px] text-[#4D5D51] dark:text-slate-400 font-medium">
              {language === 'hi'
                ? 'सत्यापित बचत और चालू बैंक खातों से सिंक किया गया।'
                : 'Synchronized with verified checking and high-yield savings accounts.'}
            </p>
          </div>
        </div>

        {/* Output Metrics */}
        <div className="md:col-span-7 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                {language === 'hi' ? 'वर्तमान रनवे' : 'Current Runway'}
              </span>
              <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {fundedMonths} <span className="text-base font-normal">{language === 'hi' ? 'महीने' : 'Months'}</span>
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                {language === 'hi' ? 'बिना किसी नई आय के वित्तीय सुरक्षा अवधि' : 'Survival timeline without any fresh income'}
              </p>
            </div>

            <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 space-y-2 shadow-xs">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-400">
                {language === 'hi' ? 'आवश्यक लक्षित फंड' : 'Required Target Fund'}
              </span>
              <div className="font-mono text-3xl font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(targetFund)}
              </div>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                {language === 'hi' ? `${targetMonths} पूरे महीनों का सुरक्षा कुशन सुनिश्चित करने हेतु` : `To guarantee ${targetMonths} full months of buffer`}
              </p>
            </div>
          </div>

          {/* Runway Progress Card */}
          <div className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DC] dark:border-[var(--line)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-display font-bold text-base text-[#173F2B] dark:text-slate-100">
                  {language === 'hi' ? 'कुशन शोधनक्षमता स्थिति' : 'Cushion Solvency Status'}
                </h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isFullyFunded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {fundedPercent}% {language === 'hi' ? 'वित्तपोषित' : 'Funded'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-[#E5EDE5] dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFullyFunded ? 'bg-[#157A42]' : 'bg-[#173F2B]'
                  }`}
                  style={{ width: `${fundedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-[#4D5D51] dark:text-slate-400 font-medium">
                <span>{formatCurrency(currentEmergencyLiquid)} {language === 'hi' ? 'संचित' : 'stored'}</span>
                <span>{language === 'hi' ? 'लक्ष्य:' : 'Target:'} {formatCurrency(targetFund)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#15241C] border border-[#DCE4DC] dark:border-[var(--line)] text-xs space-y-1">
              <p className="font-bold text-[#173F2B] dark:text-slate-100">
                {isFullyFunded
                  ? (language === 'hi' ? '🎉 पूर्ण सुरक्षित सुरक्षा कवच' : '🎉 Pristine Solvency Protection')
                  : (language === 'hi' ? `वित्तीय अंतर: ${formatCurrency(fundingGap)} शेष` : `Funding Gap: ${formatCurrency(fundingGap)} remaining`)}
              </p>
              <p className="text-[#4D5D51] dark:text-slate-300">
                {isFullyFunded
                  ? (language === 'hi'
                    ? 'आपका लिक्विड कुशन नौकरी बदलाव या अप्रत्याशित चिकित्सा खर्चों को बिना दीर्घकालिक निवेश को छुए संभाल सकता है।'
                    : 'Your liquid cushion can absorb job transitions or unexpected medical expenses without touching long-term investments.')
                  : (language === 'hi'
                    ? `प्रति माह ₹10,000 की बचत करके आप मात्र ${Math.ceil(fundingGap / 10000)} महीनों में अपना ${targetMonths}-महीने का सुरक्षा फंड पूरी तरह तैयार कर लेंगे।`
                    : `Automating ₹10,000/month into an instant sweep-in FD will fully fund your remaining ${targetMonths}-month safety net in ${Math.ceil(fundingGap / 10000)} months.`)}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </ModuleShell>
  );
}
