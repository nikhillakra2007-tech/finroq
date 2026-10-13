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
  {
    id: 'index-funds',
    title: 'Index Funds: Best for Beginners',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Index funds track the whole market. Low fees, no need to pick stocks. Perfect for first-time investors.',
    fullBody: {
      coreConcept: 'An index fund buys all stocks in an index like Nifty 50. You own a tiny piece of India\'s top 50 companies.',
      whyItMatters: 'Most stock pickers fail to beat the index over 10+ years. Index funds give you market returns with minimal fees.',
      actionSteps: [
        'Start with a Nifty 50 or Sensex index fund.',
        'Choose direct plans (lower fees) over regular plans.',
        'Invest via SIP — same amount every month, regardless of market level.',
        'Stay invested for 10+ years. Time in the market beats timing the market.',
      ],
      proTip: 'A ₹10,000 monthly SIP in a Nifty 50 index fund for 30 years can grow to over ₹10 crore at 12% average returns.',
    },
  },
  {
    id: 'epf-vs-ppf',
    title: 'EPF vs PPF: Which is Better?',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Both are government-backed savings. EPF is for salaried, PPF is open to everyone. Know the difference.',
    fullBody: {
      coreConcept: 'EPF is automatic for salaried employees. PPF is voluntary but open to anyone with a bank account.',
      whyItMatters: 'EPF gives ~8.25% with employer contribution. PPF gives ~7.1% with 15-year lock-in. Both are safe.',
      actionSteps: [
        'If salaried, keep EPF and contribute more through VPF if possible.',
        'If self-employed or want extra savings, open a PPF account.',
        'Both qualify for tax deduction under Section 80C (up to ₹1.5 lakh/year).',
        'Do not withdraw EPF before 5 years unless absolutely necessary.',
      ],
      proTip: 'Max out both EPF and PPF for ₹3 lakh/year in safe, tax-free returns before investing in anything risky.',
    },
  },
  {
    id: 'gold-investment',
    title: 'Gold: Should You Invest?',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Gold is a hedge against inflation, not a wealth creator. Keep 5-10% of your portfolio in gold.',
    fullBody: {
      coreConcept: 'Gold protects your money when currencies fail and markets crash. But it does not grow wealth like equities.',
      whyItMatters: 'Gold has given ~8-10% long-term returns, roughly matching inflation. It is insurance, not growth.',
      actionSteps: [
        'Prefer Sovereign Gold Bonds (SGB) over physical gold — you earn 2.5% interest plus gold price gains.',
        'Gold ETFs are the cheapest way to invest in gold.',
        'Keep 5-10% of total portfolio in gold as insurance.',
        'Do not buy gold jewellery as investment — making charges eat 20-30% of value.',
      ],
      proTip: 'Buy gold during emotional market panic. It is your financial fire extinguisher, not your engine.',
    },
  },
  {
    id: 'stock-basics',
    title: 'Stock Market Basics for Beginners',
    tag: 'Investing',
    readTime: '3 min read',
    summary: 'Stocks represent ownership in companies. Learn how to start safely with small amounts.',
    fullBody: {
      coreConcept: 'When you buy a stock, you own a small piece of that company. If the company grows, your stock grows.',
      whyItMatters: 'Equities have given 12-15% annual returns over long periods in India — higher than FD, gold, or real estate.',
      actionSteps: [
        'Open a demat account with Zerodha, Groww, or any SEBI-registered broker.',
        'Start with blue-chip stocks (TCS, HDFC, Infosys) or just stick to index funds.',
        'Never invest emergency fund money in stocks.',
        'Ignore short-term noise. Think in years and decades.',
      ],
      proTip: 'If you do not understand a company, do not buy its stock. Index funds are always the safe default.',
    },
  },
  {
    id: 'retirement-planning',
    title: 'Retirement Planning: Start Early',
    tag: 'Long-Term',
    readTime: '2 min read',
    summary: 'The earlier you start, the less you need to save each month. Compound interest is the 8th wonder.',
    fullBody: {
      coreConcept: 'Starting at 25 vs 35 can mean saving ₹5,000/month vs ₹15,000/month for the same retirement corpus.',
      whyItMatters: 'Compounding needs time. 30 years at 12% turns ₹1 lakh into ₹30 lakh. 20 years turns it into only ₹10 lakh.',
      actionSteps: [
        'Target a retirement corpus of 25x your annual expenses (the 4% rule).',
        'Invest in equity for growth, then shift to debt as retirement approaches.',
        'Increase SIP amount by 10% every year as your salary grows.',
        'Do not withdraw retirement money early — let it compound.',
      ],
      proTip: 'A ₹5,000 monthly SIP at 12% for 30 years becomes ₹1.76 crore. Start today, not tomorrow.',
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
              className="bg-white dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-shadow"
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
                <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-emerald-300">
                  {g.title}
                </h3>
                <p className="text-xs font-medium text-[#2A4736] dark:text-slate-300 leading-relaxed">
                  {g.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)]">
                <button
                  onClick={() => { setSelectedGuide(g); document.body.style.overflow = 'hidden'; }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 text-xs font-bold hover:bg-[#DCE7D9] transition-colors"
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
              <p className="text-xs font-medium text-[#2A4736] dark:text-slate-200">
                {selectedGuide.fullBody.coreConcept}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100 mb-1">
                Why this protects your wealth:
              </h4>
              <p className="text-xs text-[#2A4736] dark:text-slate-300 leading-relaxed">
                {selectedGuide.fullBody.whyItMatters}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100">
                Action Steps:
              </h4>
              <ul className="space-y-2">
                {selectedGuide.fullBody.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2A4736] dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7FAF7] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] text-xs">
              <span className="font-bold text-[#173F2B] dark:text-emerald-300 block mb-0.5">
                Pro-Tip:
              </span>
              <p className="text-[#2A4736] dark:text-slate-300">
                {selectedGuide.fullBody.proTip}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setSelectedGuide(null); document.body.style.overflow = ''; }}
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
