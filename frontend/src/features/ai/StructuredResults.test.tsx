import React from 'react';
import { render, screen } from '@testing-library/react';
import { StructuredResults } from './StructuredResults';

describe('StructuredResults', () => {
  it('renders verified ledger overview when summary data is provided', () => {
    const summaryData = {
      total_income: '150000.00',
      total_expenses: '42800.00',
      net_cash_flow: '107200.00',
      liquid_cash_available: '75000.00',
      data_freshness: 'Real-time verified ledger',
    };

    render(<StructuredResults data={summaryData} currency="INR" />);
    expect(screen.getByText(/Verified Ledger Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Liquid Cash/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,50,000.00/i)).toBeInTheDocument();
  });

  it('renders generic ledger summary overview when data freshness is unverified or missing', () => {
    const unverifiedData = {
      total_income: '150000.00',
      total_expenses: '42800.00',
      net_cash_flow: '107200.00',
      liquid_cash_available: '75000.00',
      // no data_freshness or unverified
    };

    render(<StructuredResults data={unverifiedData} currency="INR" />);
    expect(screen.getByText(/Ledger Summary Overview/i)).toBeInTheDocument();
    expect(screen.queryByText(/Verified Ledger Overview/i)).toBeNull();
    expect(screen.queryByText(/Simulated Demo Overview/i)).toBeNull();
  });

  it('renders affordability assessment when affordability data is provided', () => {
    const affordData = {
      purchase_amount: '15000.00',
      affordability_rating: 'Comfortably Affordable',
      available_liquid_cash: '50000.00',
      upcoming_known_bills: '10000.00',
    };

    render(<StructuredResults data={affordData} currency="INR" />);
    expect(screen.getByText(/Affordability Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Comfortably Affordable/i)).toBeInTheDocument();
  });

  it('renders simulated demo overview and labels data as demo when simulated', () => {
    const demoSummaryData = {
      total_income: '150000.00',
      total_expenses: '42800.00',
      net_cash_flow: '107200.00',
      liquid_cash_available: '75000.00',
      data_freshness: 'Simulated Demo (Sample Ledger)',
      is_simulated: true,
    };

    render(<StructuredResults data={demoSummaryData} currency="INR" />);
    expect(screen.getByText(/Simulated Demo Overview/i)).toBeInTheDocument();
    expect(screen.queryByText(/Verified Ledger Overview/i)).toBeNull();
    expect(screen.getByText(/Simulated Demo \(Sample Ledger\)/i)).toBeInTheDocument();
  });

  it('renders goal timeline projection card when goal data is provided', () => {
    const goalData = {
      type: 'goal_timeline_simulation',
      goal_name: 'Emergency Fund 6 Months',
      target_amount: '300000.00',
      current_savings: '60000.00',
      monthly_contribution: '20000.00',
      projected_months_needed: 12,
      projected_completion_timeline: '12 months',
      feasibility_status: 'Comfortably Feasible',
      explanation: 'At ₹20,000/month, you will accumulate the required ₹2,40,000 in 12 months.',
    };

    render(<StructuredResults data={goalData} currency="INR" />);
    expect(screen.getByText(/Goal Timeline Projection/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency Fund 6 Months/i)).toBeInTheDocument();
    expect(screen.getByText(/Comfortably Feasible/i)).toBeInTheDocument();
    expect(screen.getByText(/₹3,00,000.00/i)).toBeInTheDocument();
  });

  it('renders budget proposal card with confirmation badge and action button', () => {
    const budgetProposal = {
      type: 'budget_adjustment_proposal',
      requires_confirmation: true,
      category_id: 2,
      category_name: 'Groceries & Food',
      current_allocated: '6500.00',
      proposed_allocated: '7500.00',
      difference: '1000.00',
      impact_summary: 'Increasing Groceries & Food monthly budget by ₹1,000.00',
      consequential_action_notice: 'Consequential change: Clicking Confirm will update your active budget cap in the verified ledger.',
    };

    render(<StructuredResults data={budgetProposal} currency="INR" />);
    expect(screen.getByText(/Proposed Budget Adjustment/i)).toBeInTheDocument();
    expect(screen.getByText(/Requires Confirmation/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm & Apply Budget Cap/i)).toBeInTheDocument();
  });

  it('renders recurring bill proposal card with confirmation badge and action button', () => {
    const recurringProposal = {
      type: 'recurring_bill_proposal',
      requires_confirmation: true,
      description: 'Netflix Premium 4K',
      amount: '649.00',
      currency: 'INR',
      frequency: 'monthly',
      category_name: 'Subscriptions',
      consequential_action_notice: 'Consequential change: Scheduling will create an active recurring commitment in your ledger.',
    };

    render(<StructuredResults data={recurringProposal} currency="INR" />);
    expect(screen.getByText(/Proposed Recurring Commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/Netflix Premium 4K/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm & Schedule Recurring Bill/i)).toBeInTheDocument();
  });

  it('renders nothing when data is empty', () => {
    const { container } = render(<StructuredResults data={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
