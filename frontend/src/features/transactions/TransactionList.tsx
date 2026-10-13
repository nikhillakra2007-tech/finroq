'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionListResponse, Account, Category, TransactionType } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { TransactionForm } from './TransactionForm';
import { StatementImportModal } from './StatementImportModal';
import { Button, Card, EmptyState, Loading, LoadingCard, Badge, Select } from '@/components/ui';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Upload, CreditCard, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate, getTransactionTypeColor, getTransactionTypeBg } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 });
  const [filters, setFilters] = useState({
    account_id: undefined as number | undefined,
    transaction_type: undefined as TransactionType | undefined,
    category_id: undefined as number | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [txnRes, accRes, catRes] = await Promise.all([
        apiClient.listTransactions({ page: pagination.page, page_size: pagination.page_size, ...filters }),
        apiClient.listAccounts({ page: 1, page_size: 100, is_active: true }),
        apiClient.listCategories({ include_system: true }),
      ]);
      setTransactions(txnRes.data.transactions);
      setPagination((prev) => ({ ...prev, total: txnRes.data.total }));
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data);
    } catch (err) {
      setError('Failed to load transactions. Please check your connection.');
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.page_size, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTransaction = async (data: any) => {
    setIsSubmitting(true);
    try {
      await apiClient.createTransaction(data);
      await fetchData();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (data: any) => {
    if (!editingTransaction) return;
    setIsSubmitting(true);
    try {
      await apiClient.updateTransaction(editingTransaction.id, data);
      await fetchData();
      setEditingTransaction(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!confirm(`Are you sure you want to delete this transaction?`)) return;
    try {
      await apiClient.deleteTransaction(transaction.id);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction');
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.category_type === 'income' || c.category_type === 'both'),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.category_type === 'expense' || c.category_type === 'both'),
    [categories]
  );

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-danger-600 mb-4">{error}</p>
        <Button variant="primary" onClick={fetchData}>
          Retry
        </Button>
      </Card>
    );
  }

  const typeFilterOptions = [
    { value: '', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ];

  const accountFilterOptions = [
    { value: '', label: 'All Accounts' },
    ...accounts.map((a) => ({ value: String(a.id), label: a.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-finroq-forest dark:text-slate-100">Transactions</h2>
          <p className="text-finroq-muted dark:text-slate-400 mt-1 text-sm">
            {pagination.total} recorded ledger transaction{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.account_id ? String(filters.account_id) : ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value ? Number(e.target.value) : undefined }))}
            options={accountFilterOptions}
            placeholder="Filter by account"
            className="w-auto min-w-[180px]"
          />
          <Select
            value={filters.transaction_type || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, transaction_type: e.target.value as TransactionType || undefined }))}
            options={typeFilterOptions}
            placeholder="Filter by type"
            className="w-auto min-w-[140px]"
          />
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Statement
          </Button>
          <Button variant="primary" onClick={() => setCreateFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Financial Institution Integration Status Panel */}
      <div className="p-4 rounded-2xl bg-finroq-mint/50 border border-finroq-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white text-finroq-forest border border-finroq-border">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-finroq-forest">
              Financial Institution Linking (Open Banking / Account Aggregator)
            </p>
            <p className="text-finroq-muted">
              Status: Ready for Institutional Aggregator Config. Uses non-credential consent protocols.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-finroq-border text-finroq-forest font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-finroq-positive" /> Architecture Ready
        </span>
      </div>

      <Card className="overflow-hidden">
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Add your first transaction, import a statement, or adjust your filters."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Statement
                </Button>
                <Button onClick={() => setCreateFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-finroq-border dark:border-[var(--line)] bg-finroq-mint/20">
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Date</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Account</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Category</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Type</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Amount</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Description</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-finroq-forest dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-finroq-border dark:divide-[var(--line)]">
                {transactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.account_id);
                  const category = categories.find((c) => c.id === transaction.category_id);
                  const isIncome = transaction.transaction_type === 'income';
                  const isTransfer = transaction.transaction_type === 'transfer';
                  return (
                    <tr key={transaction.id} className="hover:bg-finroq-mint/30 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm font-mono text-finroq-forest dark:text-slate-100">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="p-4 text-sm font-medium text-finroq-text dark:text-slate-300">
                        {account?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-finroq-muted dark:text-slate-300">
                        {category?.name || (isTransfer ? 'Account Transfer' : '—')}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={isIncome ? 'success' : isTransfer ? 'info' : 'danger'}
                          size="sm"
                        >
                          {isIncome ? 'Income' : isTransfer ? 'Transfer' : 'Expense'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-bold">
                        <span
                          className={
                            isIncome
                              ? 'text-finroq-positive'
                              : isTransfer
                              ? 'text-finroq-forest'
                              : 'text-finroq-negative'
                          }
                        >
                          {isIncome ? '+' : isTransfer ? '↔ ' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-finroq-muted dark:text-slate-400 max-w-xs truncate">
                        {transaction.description || '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(transaction)}
                            aria-label="Edit transaction"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > pagination.page_size && (
          <div className="flex items-center justify-between p-4 border-t border-finroq-border dark:border-[var(--line)]">
            <p className="text-sm text-finroq-muted dark:text-slate-400">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionForm
        isOpen={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
        categories={categories}
        isLoading={isSubmitting}
      />

      <TransactionForm
        isOpen={editFormOpen}
        onClose={() => {
          setEditFormOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleUpdateTransaction}
        accounts={accounts}
        categories={categories}
        initialData={editingTransaction || undefined}
        isEditing={true}
        isLoading={isSubmitting}
      />

      <StatementImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={fetchData}
        accounts={accounts}
      />
    </div>
  );
}