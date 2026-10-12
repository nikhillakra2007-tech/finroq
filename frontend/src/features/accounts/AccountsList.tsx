'use client';

import { useState, useEffect, useCallback } from 'react';
import { Account, AccountListResponse } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { Button, Card, EmptyState, Loading, LoadingCard } from '@/components/ui';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.listAccounts({ page: 1, page_size: 50 });
      setAccounts(response.data.accounts);
    } catch (err) {
      setError('Failed to load accounts. Please check your connection.');
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = async (data: any) => {
    setIsSubmitting(true);
    try {
      await apiClient.createAccount(data);
      await fetchAccounts();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (data: any) => {
    if (!editingAccount) return;
    setIsSubmitting(true);
    try {
      await apiClient.updateAccount(editingAccount.id, data);
      await fetchAccounts();
      setEditingAccount(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    setEditFormOpen(true);
  };

  const handleDeleteClick = async (account: Account) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      // Note: Delete endpoint not implemented in Phase 1, but we can archive
      await apiClient.updateAccount(account.id, { is_active: false });
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to archive account:', err);
      alert('Failed to archive account');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-danger-600 mb-4">{error}</p>
        <Button variant="primary" onClick={fetchAccounts}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Accounts</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={undefined}
            title="No accounts yet"
            description="Create your first financial account to start tracking your finances."
            action={
              <Button onClick={() => setCreateFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => handleEditClick(account)}
            />
          ))}
        </div>
      )}

      <AccountForm
        isOpen={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateAccount}
        isLoading={isSubmitting}
      />

      <AccountForm
        isOpen={editFormOpen}
        onClose={() => {
          setEditFormOpen(false);
          setEditingAccount(null);
        }}
        onSubmit={handleUpdateAccount}
        initialData={editingAccount || undefined}
        isEditing={true}
        isLoading={isSubmitting}
      />
    </div>
  );
}