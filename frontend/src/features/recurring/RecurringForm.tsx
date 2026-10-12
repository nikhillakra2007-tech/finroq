'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Account, Category, RecurrenceFrequency, TransactionType } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Select, Modal } from '@/components/ui';

const recurringSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a positive amount with up to 2 decimal places')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  description: z.string().max(512).optional(),
}).refine((data) => {
  if (data.transaction_type === 'transfer') {
    return !!data.to_account_id && data.to_account_id !== data.account_id;
  }
  return true;
}, {
  message: 'Transfer requires a distinct destination account',
  path: ['to_account_id'],
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface RecurringFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function RecurringForm({ isOpen, onClose, onSubmit }: RecurringFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nowIso = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      account_id: '',
      to_account_id: '',
      category_id: '',
      amount: '',
      transaction_type: 'expense',
      frequency: 'monthly',
      start_date: nowIso,
      description: '',
    },
  });

  const txType = watch('transaction_type');

  useEffect(() => {
    if (isOpen) {
      reset({
        account_id: '',
        to_account_id: '',
        category_id: '',
        amount: '',
        transaction_type: 'expense',
        frequency: 'monthly',
        start_date: nowIso,
        description: '',
      });
      setError(null);
      loadDependencies();
    }
  }, [isOpen, reset, nowIso]);

  const loadDependencies = async () => {
    try {
      setIsLoading(true);
      const [accRes, catRes] = await Promise.all([
        apiClient.listAccounts({ is_active: true }),
        apiClient.listCategories(),
      ]);
      setAccounts(accRes.data.accounts);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load accounts/categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: RecurringFormData) => {
    try {
      setError(null);
      await onSubmit({
        account_id: parseInt(data.account_id, 10),
        to_account_id: data.to_account_id ? parseInt(data.to_account_id, 10) : undefined,
        category_id: data.category_id ? parseInt(data.category_id, 10) : undefined,
        amount: data.amount,
        currency: 'USD',
        transaction_type: data.transaction_type,
        frequency: data.frequency,
        start_date: new Date(data.start_date).toISOString(),
        end_date: data.end_date ? new Date(data.end_date).toISOString() : undefined,
        description: data.description || undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create recurring rule';
      setError(msg);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (txType === 'expense') return c.category_type === 'expense' || c.category_type === 'both';
    if (txType === 'income') return c.category_type === 'income' || c.category_type === 'both';
    return false;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Recurring Transaction">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Transaction Type
          </label>
          <Select
            {...register('transaction_type')}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfer' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account
            </label>
            <Select
              {...register('account_id')}
              disabled={isLoading}
              options={[
                { value: '', label: 'Select Account' },
                ...accounts.map((a) => ({ value: String(a.id), label: `${a.name} (${a.currency})` })),
              ]}
            />
            {errors.account_id && (
              <p className="mt-1 text-xs text-red-500">{errors.account_id.message}</p>
            )}
          </div>

          {txType === 'transfer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                To Account
              </label>
              <Select
                {...register('to_account_id')}
                disabled={isLoading}
                options={[
                  { value: '', label: 'Select Destination' },
                  ...accounts.map((a) => ({ value: String(a.id), label: `${a.name} (${a.currency})` })),
                ]}
              />
              {errors.to_account_id && (
                <p className="mt-1 text-xs text-red-500">{errors.to_account_id.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <Select
                {...register('category_id')}
                disabled={isLoading}
                options={[
                  { value: '', label: 'None / Uncategorized' },
                  ...filteredCategories.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount
            </label>
            <Input type="text" placeholder="100.00" {...register('amount')} />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Frequency
            </label>
            <Select
              {...register('frequency')}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <Input type="date" {...register('start_date')} />
            {errors.start_date && (
              <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date (Optional)
            </label>
            <Input type="date" {...register('end_date')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <Input type="text" placeholder="e.g. Netflix Subscription" {...register('description')} />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save Recurring Rule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
