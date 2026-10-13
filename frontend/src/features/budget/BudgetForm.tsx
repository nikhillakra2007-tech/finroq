'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category, Budget } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Select, Modal } from '@/components/ui';

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  budget_year: z.coerce.number().min(1900).max(2100),
  budget_month: z.coerce.number().min(1).max(12),
  allocated_amount: z
    .string()
    .min(1, 'Allocated amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount with up to 2 decimal places')
    .refine((val) => parseFloat(val) >= 0, 'Amount must be non-negative'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category_id: number; budget_year: number; budget_month: number; allocated_amount: string }) => Promise<void>;
  initialData?: Budget | null;
  defaultYear?: number;
  defaultMonth?: number;
}

export function BudgetForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultYear = new Date().getFullYear(),
  defaultMonth = new Date().getMonth() + 1,
}: BudgetFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: initialData ? String(initialData.category_id) : '',
      budget_year: initialData ? initialData.budget_year : defaultYear,
      budget_month: initialData ? initialData.budget_month : defaultMonth,
      allocated_amount: initialData ? initialData.allocated_amount : '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        category_id: initialData ? String(initialData.category_id) : '',
        budget_year: initialData ? initialData.budget_year : defaultYear,
        budget_month: initialData ? initialData.budget_month : defaultMonth,
        allocated_amount: initialData ? initialData.allocated_amount : '',
      });
      setError(null);
      fetchCategories();
    }
  }, [isOpen, initialData, defaultYear, defaultMonth, reset]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await apiClient.listCategories({ category_type: 'expense' });
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleFormSubmit = async (data: BudgetFormData) => {
    try {
      setError(null);
      await onSubmit({
        category_id: parseInt(data.category_id, 10),
        budget_year: data.budget_year,
        budget_month: data.budget_month,
        allocated_amount: data.allocated_amount,
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save budget';
      setError(msg);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Budget' : 'Create Monthly Budget'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <Select
            {...register('category_id')}
            disabled={!!initialData || isLoadingCategories}
            options={[
              { value: '', label: isLoadingCategories ? 'Loading categories...' : 'Select Category' },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
          {errors.category_id && (
            <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Month
            </label>
            <Select
              {...register('budget_month')}
              disabled={!!initialData}
              options={monthNames.map((m, idx) => ({
                value: String(idx + 1),
                label: m,
              }))}
            />
            {errors.budget_month && (
              <p className="mt-1 text-xs text-red-500">{errors.budget_month.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Year
            </label>
            <Input
              type="number"
              {...register('budget_year')}
              disabled={!!initialData}
            />
            {errors.budget_year && (
              <p className="mt-1 text-xs text-red-500">{errors.budget_year.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-finroq-forest dark:text-slate-200 mb-1">
            Allocated Amount (₹)
          </label>
          <Input
            type="text"
            placeholder="5000.00"
            {...register('allocated_amount')}
          />
          {errors.allocated_amount && (
            <p className="mt-1 text-xs text-red-500">{errors.allocated_amount.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {initialData ? 'Update Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
