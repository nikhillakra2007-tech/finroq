import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatementImportModal } from './StatementImportModal';
import { apiClient } from '@/lib/api-client';
import { I18nProvider } from '@/lib/i18n-context';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    uploadDocument: jest.fn(),
    updateIngestionItem: jest.fn(),
    confirmIngestionSession: jest.fn(),
    cancelIngestionSession: jest.fn(),
  },
}));

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
  {
    id: 2,
    name: 'Groceries & Food',
    category_type: 'expense' as const,
    is_system: true,
    owner_id: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
];

describe('StatementImportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = () =>
    render(
      <I18nProvider>
        <StatementImportModal
          isOpen={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      </I18nProvider>
    );

  it('renders mode switch tabs and target account selection', () => {
    renderModal();

    expect(screen.getByRole('button', { name: /Bank Statement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Receipt \/ Shopping Bill/i })).toBeInTheDocument();
    expect(screen.getByText(/Target Financial Account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze & Review Document/i })).toBeDisabled();
  });

  it('switches between statement mode and receipt mode', () => {
    renderModal();

    const receiptTab = screen.getByText(/Receipt \/ Shopping Bill/i);
    fireEvent.click(receiptTab);

    expect(screen.getByText(/Choose receipt image or PDF/i)).toBeInTheDocument();
  });

  it('renders review screen upon successful document analysis', async () => {
    (apiClient.uploadDocument as jest.Mock).mockResolvedValueOnce({
      data: {
        session_id: 'sess-123',
        owner_id: '1',
        account_id: 1,
        account_name: 'HDFC Checking',
        filename: 'statement.csv',
        file_type: 'csv',
        detected_document_type: 'bank_statement',
        status: 'needs_review',
        total_items: 1,
        valid_items: 1,
        uncertain_items: 0,
        duplicate_items: 0,
        reconciliation: {
          can_reconcile: true,
          opening_balance: '1000.00',
          closing_balance: '86000.00',
          calculated_closing_balance: '86000.00',
          total_credits: '85000.00',
          total_debits: '0.00',
          is_reconciled: true,
          discrepancy_amount: null,
          explanation: 'Statement balanced.',
        },
        items: [
          {
            id: 'item-1',
            row_index: 1,
            transaction_date: '2026-10-18T00:00:00Z',
            date_state: 'verified',
            description: 'Salary Deposit',
            amount: '85000.00',
            amount_state: 'verified',
            currency: 'INR',
            currency_state: 'verified',
            transaction_type: 'income',
            suggested_category_id: 1,
            suggested_category_name: 'Salary',
            category_confidence: 0.95,
            duplicate_status: 'none',
            is_valid: true,
            is_selected_for_import: true,
            line_items: [],
          },
        ],
        errors: [],
        created_at: '2026-10-22T00:00:00Z',
      },
    });

    renderModal();

    const fileInput = document.getElementById('document-ingestion-input') as HTMLInputElement;
    const testFile = new File(['Date,Description,Credit\n2026-10-18,Salary,85000.00\n'], 'statement.csv', {
      type: 'text/csv',
    });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze & Review Document/i });
    expect(analyzeBtn).not.toBeDisabled();
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Salary Deposit')).toBeInTheDocument();
      expect(screen.getByText(/Mathematical Statement Reconciliation Verified/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm & Import \(1\)/i })).toBeInTheDocument();
    });
  });
});
