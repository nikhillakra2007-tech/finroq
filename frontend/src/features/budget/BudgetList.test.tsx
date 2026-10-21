import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetList, getBudgetSection } from './BudgetList';
import { apiClient } from '@/lib/api-client';
import { I18nProvider } from '@/lib/i18n-context';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    listBudgets: jest.fn(),
    createBudget: jest.fn(),
    updateBudget: jest.fn(),
    deleteBudget: jest.fn(),
    listCategories: jest.fn(),
    isDemoSession: jest.fn().mockReturnValue(true),
  },
  DEMO_BUDGETS: [],
}));

describe('BudgetList Category Sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('correctly maps category names to budget section types', () => {
    expect(getBudgetSection('Housing & Rent')).toBe('living');
    expect(getBudgetSection('Groceries & Quick Commerce')).toBe('living');
    expect(getBudgetSection('Income Tax & Advance Tax')).toBe('tax');
    expect(getBudgetSection('GST & Professional Tax')).toBe('tax');
    expect(getBudgetSection('Mutual Funds & SIPs')).toBe('investment');
    expect(getBudgetSection('Stocks & Sovereign Gold')).toBe('investment');
  });

  it('renders section headers for Living Expenses, Tax Planning, and Investments', async () => {
    (apiClient.listBudgets as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 1,
          owner_id: 'usr_demo',
          category_id: 1,
          category_name: 'Housing & Rent',
          budget_year: 2026,
          budget_month: 10,
          allocated_amount: '28000.00',
          actual_spending: '28000.00',
          remaining_amount: '0.00',
          utilization_percent: '100.0',
          is_overspent: false,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 2,
          owner_id: 'usr_demo',
          category_id: 12,
          category_name: 'Income Tax & Advance Tax',
          budget_year: 2026,
          budget_month: 10,
          allocated_amount: '22000.00',
          actual_spending: '22000.00',
          remaining_amount: '0.00',
          utilization_percent: '100.0',
          is_overspent: false,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 3,
          owner_id: 'usr_demo',
          category_id: 14,
          category_name: 'Mutual Funds & SIPs',
          budget_year: 2026,
          budget_month: 10,
          allocated_amount: '30000.00',
          actual_spending: '30000.00',
          remaining_amount: '0.00',
          utilization_percent: '100.0',
          is_overspent: false,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ],
    });

    render(
      <I18nProvider>
        <BudgetList />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Monthly Living & Operational Expenses/i)).toBeInTheDocument();
      expect(screen.getByText(/Tax Planning & Statutory Reserves/i)).toBeInTheDocument();
      expect(screen.getByText(/Investments & Wealth Creation/i)).toBeInTheDocument();
    });
  });

  it('filters section display when clicking section filter pills', async () => {
    (apiClient.listBudgets as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 1,
          owner_id: 'usr_demo',
          category_id: 1,
          category_name: 'Housing & Rent',
          budget_year: 2026,
          budget_month: 10,
          allocated_amount: '28000.00',
          actual_spending: '28000.00',
          remaining_amount: '0.00',
          utilization_percent: '100.0',
          is_overspent: false,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
        {
          id: 2,
          owner_id: 'usr_demo',
          category_id: 12,
          category_name: 'Income Tax & Advance Tax',
          budget_year: 2026,
          budget_month: 10,
          allocated_amount: '22000.00',
          actual_spending: '22000.00',
          remaining_amount: '0.00',
          utilization_percent: '100.0',
          is_overspent: false,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ],
    });

    render(
      <I18nProvider>
        <BudgetList />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tax & Statutory/i })).toBeInTheDocument();
    });

    const taxPill = screen.getByRole('button', { name: /Tax & Statutory/i });
    fireEvent.click(taxPill);

    // Living section header should no longer be rendered
    expect(screen.queryByText(/Monthly Living & Operational Expenses/i)).not.toBeInTheDocument();
    // Tax section should still be rendered
    expect(screen.getByText(/Tax Planning & Statutory Reserves/i)).toBeInTheDocument();
  });
});
