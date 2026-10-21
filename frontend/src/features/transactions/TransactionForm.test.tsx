import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionForm, getCategorySection } from './TransactionForm';
import { I18nProvider } from '@/lib/i18n-context';

const mockAccounts = [
  {
    id: 1,
    name: 'HDFC Checking',
    account_type: 'checking' as const,
    currency: 'INR',
    initial_balance: '10000.00',
    owner_id: '1',
    is_active: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
];

const mockCategories = [
  { id: 2, name: 'Groceries & Food', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { id: 4, name: 'Rent & Housing', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { id: 12, name: 'Income Tax & Advance Tax', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { id: 13, name: 'GST & Professional Tax', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { id: 14, name: 'Mutual Funds & SIPs', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { id: 15, name: 'Stocks & Sovereign Gold', category_type: 'expense' as const, is_system: true, owner_id: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
];

describe('TransactionForm Category Sections', () => {
  it('correctly classifies categories into living, tax, and investment sections', () => {
    expect(getCategorySection('Groceries & Food')).toBe('living');
    expect(getCategorySection('Rent & Housing')).toBe('living');
    expect(getCategorySection('Income Tax & Advance Tax')).toBe('tax');
    expect(getCategorySection('GST & Professional Tax')).toBe('tax');
    expect(getCategorySection('Mutual Funds & SIPs')).toBe('investment');
    expect(getCategorySection('Stocks & Sovereign Gold')).toBe('investment');
  });

  it('renders section filter pills for Tax and Investments in manual transaction modal', () => {
    render(
      <I18nProvider>
        <TransactionForm
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      </I18nProvider>
    );

    expect(screen.getByRole('button', { name: /Tax/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Investments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Living/i })).toBeInTheDocument();
  });

  it('filters optgroups when clicking Tax section pill', () => {
    render(
      <I18nProvider>
        <TransactionForm
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      </I18nProvider>
    );

    const taxBtn = screen.getByRole('button', { name: /Tax/i });
    fireEvent.click(taxBtn);

    // Should display Income Tax & Advance Tax in the options
    expect(screen.getByText('Income Tax & Advance Tax')).toBeInTheDocument();
    expect(screen.getByText('GST & Professional Tax')).toBeInTheDocument();
  });
});
