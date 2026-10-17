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

  it('renders nothing when data is empty', () => {
    const { container } = render(<StructuredResults data={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
