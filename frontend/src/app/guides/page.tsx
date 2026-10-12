'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui';
import { BookOpen, Compass, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const GUIDES = [
  {
    title: 'The 50 / 30 / 20 Budgeting Framework',
    category: 'Budgeting & Control',
    readTime: '4 min read',
    summary: 'Allocate 50% of take-home pay to essential needs (housing, utilities, food), 30% to discretionary wants, and 20% to savings and debt reduction.',
    takeaway: 'Provides balanced living while systematically expanding your balance sheet.',
    link: '/budgets',
  },
  {
    title: 'Sizing Your Emergency Cushion',
    category: 'Wealth Protection',
    readTime: '5 min read',
    summary: 'Calculate your baseline monthly burn rate to store 3 to 6 months in liquid, capital-preserving instruments like high-yield savings.',
    takeaway: 'Insulates your long-term investments against forced liquidation during downturns.',
    link: '/emergency-cushion',
  },
  {
    title: 'Debt Avalanche vs. Debt Snowball',
    category: 'Obligations Management',
    readTime: '6 min read',
    summary: 'Compare targeting highest-interest liabilities first (Avalanche) to save interest against paying smallest balances first (Snowball) for psychological momentum.',
    takeaway: 'Avalanche is mathematically optimal; Snowball delivers rapid behavioral wins.',
    link: '/debt-watchdog',
  },
  {
    title: 'Tracking Net Worth Over Simple Balances',
    category: 'Long-Term Architecture',
    readTime: '4 min read',
    summary: 'Single bank balances hide leverage. Measuring Net Worth (Assets minus Liabilities) provides the true indicator of financial independence.',
    takeaway: 'Focus on growing total equity rather than transient cash flow spikes.',
    link: '/net-worth',
  },
];

export default function MoneyGuidesPage() {
  return (
    <MainLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-finroq-mint text-finroq-forest text-xs font-semibold mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            Module 6: Decide Before Spending
          </div>
          <h1 className="heading-page">Practical Money Guides</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Verified, evidence-based frameworks to help you make sound financial decisions without sponsored bias.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {GUIDES.map((g, idx) => (
            <Card key={idx} className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-finroq-muted">
                  <span className="font-semibold text-finroq-forest px-2 py-0.5 rounded bg-finroq-mint">
                    {g.category}
                  </span>
                  <span>{g.readTime}</span>
                </div>

                <h2 className="font-heading font-bold text-lg text-finroq-text">
                  {g.title}
                </h2>

                <p className="text-xs text-finroq-muted leading-relaxed">
                  {g.summary}
                </p>

                <div className="p-3 bg-finroq-ivory rounded-xl border border-finroq-border text-xs text-finroq-text font-medium">
                  💡 <strong>Key Takeaway:</strong> {g.takeaway}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={g.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-finroq-forest hover:text-finroq-forest-deep"
                >
                  Apply to your data <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
