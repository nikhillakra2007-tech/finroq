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
import { useI18n } from '@/lib/i18n-context';

export function TransactionList() {
  const { t, language } = useI18n();
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
    { value: '', label: t('action.all_types', 'All Types') },
    { value: 'income', label: t('action.income', 'Income') },
    { value: 'expense', label: t('action.expense', 'Expense') },
  ];

  const accountFilterOptions = [
    { value: '', label: t('action.all_accounts', 'All Accounts') },
    ...accounts.map((a) => ({ value: String(a.id), label: a.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#173F2B] dark:text-slate-100">
            {t('mod.expense_tracking', 'Transactions')}
          </h2>
          <p className="text-[#374A3E] dark:text-slate-400 mt-1 text-sm font-medium">
            {pagination.total} {language === 'hi' ? 'दर्ज लेजर लेन-देन' : `recorded ledger transaction${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* All four controls strictly in ONE single horizontal line properly spaced */}
        <div className="flex flex-row items-center gap-3 overflow-x-auto no-scrollbar py-1">
          <Select
            value={filters.account_id ? String(filters.account_id) : ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, account_id: e.target.value ? Number(e.target.value) : undefined }))}
            options={accountFilterOptions}
            placeholder={t('action.filter_account', 'Filter by account')}
            containerClassName="w-auto shrink-0"
            className="w-44 text-xs font-semibold text-[#173F2B] dark:text-slate-100 bg-white dark:bg-[#16251E] border-[#BAC7BE] dark:border-[#2A3D33] shadow-xs"
          />
          <Select
            value={filters.transaction_type || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, transaction_type: e.target.value as TransactionType || undefined }))}
            options={typeFilterOptions}
            placeholder={t('action.filter_type', 'Filter by type')}
            containerClassName="w-auto shrink-0"
            className="w-40 text-xs font-semibold text-[#173F2B] dark:text-slate-100 bg-white dark:bg-[#16251E] border-[#BAC7BE] dark:border-[#2A3D33] shadow-xs"
          />
          <Button
            variant="secondary"
            onClick={() => setIsImportOpen(true)}
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#173F2B] dark:text-slate-100 border-[#BAC7BE] dark:border-[#2A3D33] bg-white dark:bg-[#16251E] hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] shadow-xs"
          >
            <Upload className="h-4 w-4 mr-1.5 text-[#173F2B] dark:text-emerald-400" />
            {t('action.import_statement', 'Import Statement')}
          </Button>
          <Button
            variant="primary"
            onClick={() => setCreateFormOpen(true)}
            className="shrink-0 whitespace-nowrap text-xs font-semibold bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t('action.add_transaction', 'Add Transaction')}
          </Button>
        </div>
      </div>

      {/* Financial Institution Integration Status Panel */}
      <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#14231B] border border-[#BAC7BE] dark:border-[#2A3D33] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-[#67E8F9] border border-[#BAC7BE] dark:border-[#2A3D33] shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-[#173F2B] dark:text-slate-100">
              Financial Institution Linking (Open Banking / Account Aggregator)
            </p>
            <p className="text-[#374A3E] dark:text-slate-400 font-medium">
              Status: Ready for Institutional Aggregator Config. Uses non-credential consent protocols.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#1A2C22] border border-[#BAC7BE] dark:border-[#2A3D33] text-[#173F2B] dark:text-emerald-300 font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-finroq-positive" /> Architecture Ready
        </span>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-[#16251E] border border-[#BAC7BE] dark:border-[#2A3D33] shadow-xs">
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
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#DCE4DC] dark:border-[#2A3D33] bg-[#F3F7F3] dark:bg-[#16251E]">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Date</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Account</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Category</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Type</th>
                  <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Amount</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Description</th>
                  <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4DC] dark:divide-[#2A3D33]">
                {transactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.account_id);
                  const category = categories.find((c) => c.id === transaction.category_id);
                  const isIncome = transaction.transaction_type === 'income';
                  const isTransfer = transaction.transaction_type === 'transfer';
                  return (
                    <tr key={transaction.id} className="hover:bg-[#F4F8F4] dark:hover:bg-white/5 transition-colors bg-white dark:bg-[#16251E]">
                      <td className="p-4 text-sm font-mono font-semibold text-[#173F2B] dark:text-slate-100">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="p-4 text-sm font-bold text-[#111827] dark:text-slate-100">
                        {account?.name || 'Unknown'}
                      </td>
                      <td className="p-4 text-sm font-medium text-[#2A4736] dark:text-slate-300">
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
                              ? 'text-[#157A42] dark:text-[#4ADE80]'
                              : isTransfer
                              ? 'text-[#173F2B] dark:text-slate-200'
                              : 'text-[#B43838] dark:text-[#F87171]'
                          }
                        >
                          {isIncome ? '+' : isTransfer ? '↔ ' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#374151] dark:text-slate-200 max-w-xs truncate">
                        {transaction.description || '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(transaction)}
                            aria-label="Edit transaction"
                            className="text-[#173F2B] dark:text-emerald-400 hover:text-[#102F21]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
                            aria-label="Delete transaction"
                            className="text-danger-500 hover:text-danger-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
          <div className="flex items-center justify-between p-4 border-t border-[#DCE4DC] dark:border-[#2A3D33]">
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