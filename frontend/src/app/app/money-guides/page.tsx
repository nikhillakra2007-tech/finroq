'use client';

import React, { useState } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { Modal } from '@/components/ui/Modal';
import { BookOpen, CheckCircle2, ShieldCheck, ArrowRight, ShieldAlert, Zap, HelpCircle } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  tag: string;
  readTime: string;
  summary: string;
  fullBody: {
    coreConcept: string;
    whyItMatters: string;
    actionSteps: string[];
    proTip: string;
  };
}

const GUIDES: Guide[] = [
  {
    id: '50-30-20',
    title: 'The 50/30/20 Rule in Plain Indian English',
    tag: 'Budgeting Fundamentals',
    readTime: '3 min read',
    summary: 'Split net monthly salary: 50% for uncompromised needs (rent, groceries), 30% for lifestyle wants, and 20% direct to savings before spending.',
    fullBody: {
      coreConcept: 'Instead of complex 30-category budgets, group every single rupee into 3 clear buckets: 50% Needs, 30% Wants, and 20% Future Wealth.',
      whyItMatters: 'Most people spend on wants first and try to save whatever is left over at the end of the month (which usually equals zero). Flipping the order guarantees wealth accumulation.',
      actionSteps: [
        'Calculate your net take-home salary after PF and tax deductions.',
        'Cap rent, electricity, groceries, and basic commute to 50% maximum.',
        'Automate your 20% SIP or savings transfer to happen on Day 1 after salary credit.',
        'Spend your remaining 30% on dining out, movies, and shopping completely guilt-free.',
      ],
      proTip: 'If your rent in cities like Bengaluru or Mumbai pushes Needs past 50%, temporarily shrink Wants to 20% rather than lowering your 20% savings quota.',
    },
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Cushion 101: Never Liquidate Equities',
    tag: 'Risk Management',
    readTime: '4 min read',
    summary: 'Keep 3 to 6 months of mandatory living burn-rate in separate high-interest savings or sweep-in FDs so market crashes never force you to sell low.',
    fullBody: {
      coreConcept: 'An emergency fund is insurance, not an investment. Its purpose is not high returns, but absolute liquidity within 5 minutes when life happens.',
      whyItMatters: 'When medical emergencies or sudden job transitions happen during a stock market crash, selling mutual funds locks in huge losses. A cash cushion protects your long-term wealth.',
      actionSteps: [
        'Calculate your bare-bones monthly survival budget (rent + groceries + essential EMIs).',
        'Multiply this bare-bones number by 3 (if double-income) or 6 (if single earner).',
        'Park the money across two separate banks with instant UPI or sweep-in FD facilities.',
        'Never link this emergency bank account to shopping apps or food delivery.',
      ],
      proTip: 'A credit card is NOT an emergency fund. Borrowing at 42% APR during a crisis creates a spiral of distress debt.',
    },
  },
  {
    id: 'upi-scams',
    title: 'UPI & Phishing Defence: The Golden Golden Rule',
    tag: 'Cyber Fraud Protection',
    readTime: '3 min read',
    summary: 'Understand the #1 trick cybercriminals use on OLX, WhatsApp, and fake customer care portals to steal money via UPI QR codes.',
    fullBody: {
      coreConcept: 'You NEVER need to enter your 4-digit or 6-digit UPI PIN to RECEIVE money. Entering your PIN ONLY authorizes money LEAVING your bank account.',
      whyItMatters: 'Over 80% of digital fraud in India occurs because victims believe scanning a QR code or entering an OTP will credit prize money, refunds, or marketplace payments into their account.',
      actionSteps: [
        'Rule 1: If someone sends you a QR code claiming "Scan this to receive your payment", it is 100% a fraud attempt.',
        'Rule 2: Never share your debit card CVV, expiry date, or SMS OTP with anyone posing as bank staff or courier delivery.',
        'Rule 3: Set daily UPI payment transaction limits in your banking app (e.g., ₹25,000 max per day).',
        'Rule 4: Immediately report suspicious transactions on the National Cyber Crime Helpline (1930).',
      ],
      proTip: 'Legitimate banks and government agencies will never ask you to download remote desktop apps like AnyDesk, TeamViewer, or RustDesk.',
    },
  },
  {
    id: 'debt-snowball',
    title: 'Debt Snowball: Rapid Psychological Momentum',
    tag: 'Debt Elimination',
    readTime: '4 min read',
    summary: 'Pay off your smallest loan balance first while paying minimums on everything else. The dopamine hit of closing loans creates unstoppable discipline.',
    fullBody: {
      coreConcept: 'Personal finance is 20% head knowledge and 80% behavior. The Debt Snowball focuses on human psychology rather than cold math.',
      whyItMatters: 'Seeing an entire loan account vanish completely from your credit report gives you tremendous confidence, keeping you motivated until you are 100% debt-free.',
      actionSteps: [
        'List all personal loans, credit card balances, and buy-now-pay-later dues from smallest to largest balance.',
        'Pay minimum dues on all accounts to maintain pristine CIBIL history.',
        'Throw every spare rupee of surplus at the smallest balance until it hits exactly zero.',
        'Roll the monthly payment from that closed loan directly into attacking the next smallest balance.',
      ],
      proTip: 'Once a credit card is completely paid off, immediately decrease its credit limit or lock it inside a drawer so you never relapse into debt.',
    },
  },
];

export default function AppMoneyGuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  return (
    <ModuleShell
      title="Money Guides"
      category="Decide Before Spending"
      description="Jargon-free financial rules, allocation blueprints, and cyber-safety protocols designed for everyday Indian households."
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <div
              key={g.id}
              className="bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {g.tag}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#4D5D51] dark:text-slate-400">
                    {g.readTime}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">
                  {g.title}
                </h3>
                <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-300 leading-relaxed">
                  {g.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)]">
                <button
                  onClick={() => setSelectedGuide(g)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#173F2B] dark:text-slate-100 text-xs font-bold hover:bg-[#EAF1EA] transition-colors"
                >
                  <span>Open Full Action Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail On Click Modal Dialog with Scroll Lock & Blur */}
      {selectedGuide && (
        <Modal
          isOpen={!!selectedGuide}
          onClose={() => setSelectedGuide(null)}
          title={selectedGuide.title}
        >
          <div className="space-y-5 text-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-emerald-300 block mb-1">
                Core Principle
              </span>
              <p className="text-xs font-medium text-[#173F2B] dark:text-slate-200">
                {selectedGuide.fullBody.coreConcept}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100 mb-1">
                Why this protects your wealth:
              </h4>
              <p className="text-xs text-[#4D5D51] dark:text-slate-300 leading-relaxed">
                {selectedGuide.fullBody.whyItMatters}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100">
                Action Steps:
              </h4>
              <ul className="space-y-2">
                {selectedGuide.fullBody.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#374151] dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7FAF7] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[var(--line)] text-xs">
              <span className="font-bold text-[#173F2B] dark:text-emerald-300 block mb-0.5">
                💡 FINROQ Practical Pro-Tip:
              </span>
              <p className="text-[#4D5D51] dark:text-slate-300">
                {selectedGuide.fullBody.proTip}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedGuide(null)}
                className="px-5 py-2 rounded-xl bg-[#173F2B] text-white text-xs font-bold hover:bg-[#102F21] transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ModuleShell>
  );
}
