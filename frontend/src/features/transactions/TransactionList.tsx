'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionListResponse, Account, Category, TransactionType } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { TransactionForm } from './TransactionForm';
import { Button, Card, EmptyState, Loading, LoadingCard, Badge, Select } from '@/components/ui';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Transactions</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
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
          <Button variant="secondary" onClick={() => setCreateFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Add your first transaction or adjust your filters."
            action={
              <Button onClick={() => setCreateFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Account</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Description</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {transactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.account_id);
                  const category = categories.find((c) => c.id === transaction.category_id);
                  const isIncome = transaction.transaction_type === 'income';
                  return (
                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <td className="p-4 text-sm text-slate-900 dark:text-slate-100">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {account?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {category?.name || '—'}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={isIncome ? 'success' : 'danger'}
                          size="sm"
                          className={cn(getTransactionTypeBg(transaction.transaction_type))}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-medium">
                        <span className={cn(getTransactionTypeColor(transaction.transaction_type))}>
                          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
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
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
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
    </div>
  );
}