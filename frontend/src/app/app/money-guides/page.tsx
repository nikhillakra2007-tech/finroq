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
    title: 'The 50/30/20 Rule — Simple Money Split',
    tag: 'Budgeting',
    readTime: '2 min read',
    summary: 'Split your salary into 3 parts: 50% for needs (rent, food), 30% for wants (movies, eating out), 20% for savings.',
    fullBody: {
      coreConcept: 'Divide your take-home salary into three simple buckets. Needs first, savings second, wants last.',
      whyItMatters: 'Most people spend first and save later. By saving first, you guarantee your future self is taken care of.',
      actionSteps: [
        'Check your salary after PF and tax.',
        'Keep rent, food, bills under 50%.',
        'Move 20% to savings on salary day.',
        'Spend the rest on fun without guilt.',
      ],
      proTip: 'If rent is too high in big cities, cut wants to 20% instead of touching savings.',
    },
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund: Your Safety Net',
    tag: 'Safety',
    readTime: '2 min read',
    summary: 'Save 3-6 months of expenses in a separate bank account. Only use it for real emergencies.',
    fullBody: {
      coreConcept: 'An emergency fund is not for investment. It is protection against life surprises.',
      whyItMatters: 'If you lose your job or face a medical emergency, this fund stops you from going into debt.',
      actionSteps: [
        'Add up your monthly must-pay expenses (rent, food, bills).',
        'Multiply by 3 (if family support) or 6 (if single).',
        'Keep this money in a separate savings account.',
        'Do NOT use this for shopping or trips.',
      ],
      proTip: 'A credit card is NOT an emergency fund. Its interest rate is 42% per year!',
    },
  },
  {
    id: 'upi-scams',
    title: 'UPI Scams: How to Stay Safe',
    tag: 'Scam Protection',
    readTime: '2 min read',
    summary: 'You NEVER need to enter your UPI PIN to receive money. Scammers trick you into sending them money.',
    fullBody: {
      coreConcept: 'Your UPI PIN is only for sending money. Never enter it to receive anything.',
      whyItMatters: 'Thousands of Indians lose money daily to UPI scams. One mistake can empty your account.',
      actionSteps: [
        'Never scan QR codes to receive money — it is always a scam.',
        'Never share OTP or CVV with anyone, even bank staff.',
        'Set a daily UPI limit of ₹25,000 in your bank app.',
        'If scammed, call 1930 (Cyber Crime Helpline) immediately.',
      ],
      proTip: 'Real banks will NEVER ask you to install AnyDesk or TeamViewer. If someone does, it is a scam.',
    },
  },
  {
    id: 'debt-snowball',
    title: 'Kill Debt Fast: Snowball Method',
    tag: 'Debt Freedom',
    readTime: '2 min read',
    summary: 'Pay off smallest loan first while paying minimum on others. Build momentum to become debt-free.',
    fullBody: {
      coreConcept: 'Start with the smallest loan. Pay it off fast. Then move to the next one.',
      whyItMatters: 'Winning small keeps you motivated. Each loan you kill gives you confidence.',
      actionSteps: [
        'Write down all your loans from smallest to biggest.',
        'Pay minimum on all loans.',
        'Put all extra money into the smallest loan.',
        'Once it is paid off, roll that payment into the next loan.',
      ],
      proTip: 'After paying off a credit card, reduce its limit so you do not fall back into debt.',
    },
  },
  {
    id: 'sip-investing',
    title: 'SIP: Build Wealth Slowly & Steadily',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Invest a fixed amount every month in mutual funds. Even ₹500/month can grow into lakhs over time.',
    fullBody: {
      coreConcept: 'SIP means investing a fixed amount every month, regardless of market ups and downs.',
      whyItMatters: 'You do not need lakhs to start investing. Small regular amounts compound into big wealth.',
      actionSteps: [
        'Start with just ₹500-₹1000 per month in a good index fund.',
        'Increase your SIP amount every year as your salary grows.',
        'Do NOT stop your SIP during market crashes — that is when you buy cheap.',
        'Think in decades, not days.',
      ],
      proTip: 'A ₹5,000 monthly SIP at 12% return for 20 years becomes over ₹50 lakh.',
    },
  },
  {
    id: 'credit-score',
    title: 'Credit Score: Keep It Above 750',
    tag: 'Credit Health',
    readTime: '2 min read',
    summary: 'Pay all bills on time and keep credit card usage under 30% for a strong CIBIL score.',
    fullBody: {
      coreConcept: 'Your credit score (CIBIL) is like a financial report card. Banks use it to decide if you are trustworthy.',
      whyItMatters: 'A score above 750 gets you lower interest rates on loans and higher credit card limits.',
      actionSteps: [
        'Pay your credit card bill in full every month.',
        'Keep your credit card spending under 30% of your limit.',
        'Do not apply for too many loans or cards at once.',
        'Check your free CIBIL score once every 3 months.',
      ],
      proTip: 'Even one late payment can drop your score by 50-100 points. Set payment reminders!',
    },
  },
  {
    id: 'insurance-basics',
    title: 'Insurance: Protect Before You Invest',
    tag: 'Protection',
    readTime: '2 min read',
    summary: 'Buy term life insurance and health insurance BEFORE investing. One accident can wipe out savings.',
    fullBody: {
      coreConcept: 'Insurance is not an investment. It is a safety net for your family.',
      whyItMatters: 'One hospitalization can cost ₹3-5 lakh. Without insurance, you will either go into debt or sell investments.',
      actionSteps: [
        'Buy health insurance of ₹10 lakh for your family.',
        'Get term life insurance (NOT endowment) of 10x your annual income.',
        'Do NOT mix insurance and investment — they serve different purposes.',
        'Review your insurance needs every 2 years.',
      ],
      proTip: 'ULIPs and endowment plans are terrible. Buy pure term insurance + invest the rest in mutual funds.',
    },
  },
  {
    id: 'scam-awareness',
    title: 'Common Indian Financial Scams to Avoid',
    tag: 'Scam Protection',
    readTime: '3 min read',
    summary: 'Learn about OTP scams, KYC fraud, fake loan apps, and Ponzi schemes targeting Indians.',
    fullBody: {
      coreConcept: 'Scammers use fear, greed, and urgency to make you act without thinking.',
      whyItMatters: 'Indians lose over ₹10,000 crore to financial fraud every year. Awareness is your best defense.',
      actionSteps: [
        'OTP Scam: Never share OTP. Banks never ask for it.',
        'KYC Fraud: Never send documents to unknown numbers. Update KYC only through official bank branches.',
        'Fake Loan Apps: Never pay "processing fee" before loan disbursement. Real loans deduct fees from the loan amount.',
        'Ponzi Schemes: If returns are guaranteed and too high (20%+), it is always a scam.',
      ],
      proTip: 'If someone promises risk-free high returns, assume it is a scam. There is no such thing.',
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
