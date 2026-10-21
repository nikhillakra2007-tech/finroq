import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AIMessageRenderer,
  parseAIMessageContent,
  inferSourceFeatures,
  ALL_FINROQ_FEATURES,
} from './AIMessageRenderer';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('AIMessageRenderer & Multi-Feature Source Deep Linking', () => {
  it('covers all 13 Finroq features with valid routes and keywords', () => {
    expect(ALL_FINROQ_FEATURES.length).toBe(13);
    const routes = ALL_FINROQ_FEATURES.map((f) => f.url);
    expect(routes).toContain('/app/expense-tracking');
    expect(routes).toContain('/app/budgeting');
    expect(routes).toContain('/app/pre-spend-check');
    expect(routes).toContain('/app/spend-leak-detector');
    expect(routes).toContain('/app/crash-test');
    expect(routes).toContain('/app/goal-timeline');
    expect(routes).toContain('/app/emergency-cushion');
    expect(routes).toContain('/app/net-worth');
    expect(routes).toContain('/app/debt-watchdog');
    expect(routes).toContain('/app/credit-health');
    expect(routes).toContain('/app/financial-health');
    expect(routes).toContain('/app/splitter');
    expect(routes).toContain('/app/money-guides');
  });

  describe('Explicit Source Parsing', () => {
    it('correctly parses explicit 📌 Source tag and Detailed Analysis heading', () => {
      const raw = `Your net monthly cash surplus is ₹1,07,200.00.

### 🔍 Detailed Analysis
• Total Monthly Income: ₹1,50,000.00
• Total Outflow: ₹42,800.00

📌 Source: [Expense Tracking](/app/expense-tracking)`;

      const parsed = parseAIMessageContent(raw);
      expect(parsed.summary).toBe('Your net monthly cash surplus is ₹1,07,200.00.');
      expect(parsed.detailedAnalysis).toContain('Total Monthly Income: ₹1,50,000.00');
      expect(parsed.sources).toEqual([
        { title: 'Expense Tracking', url: '/app/expense-tracking' },
      ]);
    });
  });

  describe('Automatic Feature Inferencing for all features without explicit tag', () => {
    it('infers Expense Tracking from spending and transaction inquiries', () => {
      const res = inferSourceFeatures('In this sample demo ledger, recorded expenses total ₹42,800 across 14 transactions.');
      expect(res[0].title).toBe('Expense Tracking');
      expect(res[0].url).toBe('/app/expense-tracking');
    });

    it('infers Daily Budgeting from budget and envelope queries', () => {
      const res = inferSourceFeatures('You are at 74% of your monthly budget envelope with ₹9,000 remaining allowance.');
      expect(res[0].title).toBe('Daily Budgeting');
      expect(res[0].url).toBe('/app/budgeting');
    });

    it('infers Pre-Spend Check from affordability queries', () => {
      const res = inferSourceFeatures('Can I afford to buy a new smartphone for ₹25,000 without compromising safe reserves?');
      expect(res[0].title).toBe('Pre-Spend Check');
      expect(res[0].url).toBe('/app/pre-spend-check');
    });

    it('infers Spend Leak Detector from subscription and bill leaks', () => {
      const res = inferSourceFeatures('Found 3 recurring subscriptions and zombie bills totaling ₹16,500 due this month.');
      expect(res[0].title).toBe('Spend Leak Detector');
      expect(res[0].url).toBe('/app/spend-leak-detector');
    });

    it('infers Crash-Test Engine from shock, stress test, and layoff queries', () => {
      const res = inferSourceFeatures('The 6-agent crash test simulated a severe layoff shock and medical emergency.');
      expect(res[0].title).toBe('Crash-Test Engine');
      expect(res[0].url).toBe('/app/crash-test');
    });

    it('infers Goal Timeline from savings goal queries', () => {
      const res = inferSourceFeatures('To save ₹50,000 by December, your projected target timeline requires ₹4,166/month.');
      expect(res[0].title).toBe('Goal Timeline');
      expect(res[0].url).toBe('/app/goal-timeline');
    });

    it('infers Emergency Cushion from cushion and runway inquiries', () => {
      const res = inferSourceFeatures('Your emergency cushion holds ₹75,000, giving you 1.75 months of runway.');
      expect(res[0].title).toBe('Emergency Cushion');
      expect(res[0].url).toBe('/app/emergency-cushion');
    });

    it('infers Net Worth Tracker from assets and liabilities balance sheet', () => {
      const res = inferSourceFeatures('Your verified net worth stands at ₹12,45,000 across total assets and zero liabilities.');
      expect(res[0].title).toBe('Net Worth Tracker');
      expect(res[0].url).toBe('/app/net-worth');
    });

    it('infers Debt Watchdog from loans and EMI queries', () => {
      const res = inferSourceFeatures('All active loans and credit card balance EMI repayments are at zero.');
      expect(res[0].title).toBe('Debt Watchdog');
      expect(res[0].url).toBe('/app/debt-watchdog');
    });

    it('infers Credit Health from credit score and cibil inquiries', () => {
      const res = inferSourceFeatures('Your credit score is 782 with 4.8% credit utilization and zero negative bureau marks.');
      expect(res[0].title).toBe('Credit Health');
      expect(res[0].url).toBe('/app/credit-health');
    });

    it('infers Financial Health Score from health grade and holistic diagnosis', () => {
      const res = inferSourceFeatures('Your overall financial health score grade is 84/100 (A- Strong).');
      expect(res[0].title).toBe('Financial Health Score');
      expect(res[0].url).toBe('/app/financial-health');
    });

    it('infers Expense Splitter from shared group expenses and roommate bills', () => {
      const res = inferSourceFeatures('You have 2 shared group expenses with roommates, with ₹3,200 net owed to you.');
      expect(res[0].title).toBe('Expense Splitter');
      expect(res[0].url).toBe('/app/splitter');
    });

    it('infers Money Guides from educational how-to queries', () => {
      const res = inferSourceFeatures('Read our curated education guide on financial basics and zero-based budgeting tutorial.');
      expect(res[0].title).toBe('Money Guides');
      expect(res[0].url).toBe('/app/money-guides');
    });
  });

  describe('UI Component Rendering', () => {
    it('always renders the source feature chip on AI responses', () => {
      // Screenshot example
      const content = '[Simulated Demo] In this sample demo ledger, recorded expenses total ₹42,800.00 across 14 transactions. Top categories: Housing & Rent (₹15,000, 35%), Groceries & Food (₹11,400, 26.6%), and Dining & Outings (₹6,500, 15.2%). Discretionary spending accounted for ₹16,400 (38.3% of total outflow).';

      render(<AIMessageRenderer content={content} isUser={false} />);

      expect(screen.getByText('Source Feature:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Expense Tracking/i })).toBeInTheDocument();
    });

    it('renders and toggles the detailed breakdown drawer', () => {
      const content = `You are on track with your budget.

### 🔍 Detailed Analysis
• Category 1: On target
• Category 2: Within 10%

📌 Source: [Daily Budgeting](/app/budgeting)`;

      render(<AIMessageRenderer content={content} isUser={false} />);

      const toggleBtn = screen.getByRole('button', { name: /View Detailed Breakdown/i });
      expect(toggleBtn).toBeInTheDocument();

      // Breakdown not visible initially
      expect(screen.queryByText(/Verified Ledger Breakdown/i)).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(toggleBtn);
      expect(screen.getByText(/Verified Ledger Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText(/Category 1: On target/i)).toBeInTheDocument();

      // Click to close
      fireEvent.click(screen.getByRole('button', { name: /Hide Detailed Breakdown/i }));
      expect(screen.queryByText(/Verified Ledger Breakdown/i)).not.toBeInTheDocument();
    });
  });
});
