'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AccountCreate, AccountUpdate, AccountType } from '@/lib/api-types';
import { Button, Input, Select, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(128, 'Name too long'),
  account_type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash', 'other']),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
  initial_balance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').refine(
    (val) => parseFloat(val) >= 0,
    'Initial balance must be non-negative'
  ),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountCreate | AccountUpdate) => Promise<void>;
  initialData?: AccountUpdate;
  isEditing?: boolean;
  isLoading?: boolean;
}

const accountTypeOptions = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export function AccountForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}: AccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      account_type: 'checking',
      currency: 'USD',
      initial_balance: '0.00',
      ...initialData,
    },
  });

  const onFormSubmit = async (data: AccountFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Account' : 'Create Account'}
      description={isEditing ? 'Update your account details' : 'Add a new financial account'}
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Account Name"
          placeholder="e.g., Main Checking"
          error={errors.name?.message}
          {...register('name')}
        />

        <Select
          label="Account Type"
          options={accountTypeOptions}
          placeholder="Select account type"
          error={errors.account_type?.message}
          {...register('account_type')}
        />

        <Select
          label="Currency"
          options={currencyOptions}
          placeholder="Select currency"
          error={errors.currency?.message}
          {...register('currency')}
        />

        <Input
          label="Initial Balance"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.initial_balance?.message}
          {...register('initial_balance')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}