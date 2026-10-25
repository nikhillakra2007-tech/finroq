'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export function LandingFaq() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why is fixed-point decimal arithmetic necessary for personal finance?',
      a: 'Most apps rely on standard floating-point numbers, accumulating rounding drift across hundreds of transactions. Finroq enforces arbitrary-precision decimal mathematics through Python Decimal and PostgreSQL NUMERIC(14,2) end to end. Every balance and transfer balances with 0.00% drift.',
    },
    {
      q: 'How does the spend leak detector work?',
      a: 'Finroq continuously analyzes recurring billing cycles and micro-transactions to flag creeping subscription rate hikes, redundant dormant mandates, and duplicate charges with actionable evidence.',
    },
    {
      q: 'How is my private data isolated and secured?',
      a: 'Finroq enforces strict tenant isolation on every SQL query scoped to your authenticated account ID. Passwords use Argon2id hashing, and we never monetize, sell, or scrape your financial information.',
    },
    {
      q: 'Can I use Finroq without connecting my real bank credentials?',
      a: 'Yes. Finroq never demands your banking passwords or intrusive scraping logins. You maintain complete sovereign control: enter ledger records, import CSV statements, and explore all simulation engines with full privacy.',
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 border-b border-[var(--line)]">
      <div className="max-w-4xl mx-auto px-5 space-y-10">
        <div className="space-y-3 text-center max-w-xl mx-auto">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Clear Answers
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-[var(--surface)] border rounded-2xl transition-all duration-200 overflow-hidden cursor-pointer ${
                  isOpen
                    ? 'border-[#173F2B] dark:border-emerald-500 shadow-xs'
                    : 'border-[#CBD5CB] dark:border-[#243B2E] hover:border-[#173F2B]/40'
                }`}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <button
                  type="button"
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--soft)] text-emerald-800 dark:text-emerald-300 shrink-0">
                      0{idx + 1}
                    </span>
                    <h4 className="font-display font-medium text-sm sm:text-base text-[var(--ink)] pr-4">
                      {faq.q}
                    </h4>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 bg-[#173F2B] text-white dark:bg-emerald-600'
                        : 'bg-[var(--soft)] text-[var(--ink)]'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-[var(--line)]">
                    <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed pt-3 font-normal">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
