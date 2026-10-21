'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransactionCreate, TransactionUpdate, TransactionType, Account, Category } from '@/lib/api-types';
import { Button, Input, Select, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

const transactionSchema = z.object({
  account_id: z.number().min(1, 'Account is required'),
  to_account_id: z.number().nullable().optional(),
  category_id: z.number().nullable().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').refine(
    (val) => parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  description: z.string().max(512, 'Description too long').nullable().optional(),
  transaction_date: z.string().min(1, 'Date is required'),
}).refine(
  (data) => {
    if (data.transaction_type === 'transfer') {
      return !!data.to_account_id && data.to_account_id !== data.account_id;
    }
    return true;
  },
  {
    message: 'Destination account is required and must differ from source account',
    path: ['to_account_id'],
  }
);

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  initialData?: TransactionUpdate;
  isEditing?: boolean;
  isLoading?: boolean;
  defaultAccountId?: number;
  defaultType?: TransactionType;
}

const currencyOptions = [
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
];

export function getCategorySection(categoryName: string): 'living' | 'tax' | 'investment' {
  const lower = (categoryName || '').toLowerCase();
  if (
    lower.includes('tax') ||
    lower.includes('gst') ||
    lower.includes('tds') ||
    lower.includes('cess') ||
    lower.includes('statutory')
  ) {
    return 'tax';
  }
  if (
    lower.includes('invest') ||
    lower.includes('sip') ||
    lower.includes('fund') ||
    lower.includes('stock') ||
    lower.includes('gold') ||
    lower.includes('equity') ||
    lower.includes('portfolio') ||
    lower.includes('ppf') ||
    lower.includes('nps') ||
    lower.includes('wealth') ||
    lower.includes('brokerage')
  ) {
    return 'investment';
  }
  return 'living';
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  categories,
  initialData,
  isEditing = false,
  isLoading = false,
  defaultAccountId,
  defaultType,
}: TransactionFormProps) {
  const { language, t } = useI18n();
  const [categorySection, setCategorySection] = useState<'all' | 'living' | 'tax' | 'investment'>('all');

  const typeOptions = [
    { value: 'income', label: language === 'hi' ? 'आय' : 'Income' },
    { value: 'expense', label: language === 'hi' ? 'खर्च' : 'Expense' },
    { value: 'transfer', label: language === 'hi' ? 'ट्रांसफर' : 'Transfer' },
  ];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id: defaultAccountId || accounts[0]?.id || 0,
      to_account_id: (initialData as any)?.to_account_id || null,
      amount: '',
      currency: 'INR',
      transaction_type: defaultType || 'expense',
      transaction_date: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  });

  const watchedType = watch('transaction_type');
  const watchedAccountId = watch('account_id');
  const watchedCategoryId = watch('category_id');

  const filteredCategories = categories.filter(
    (cat) => cat.category_type === 'both' || cat.category_type === watchedType
  );

  const livingCats = filteredCategories.filter((c) => getCategorySection(c.name) === 'living');
  const taxCats = filteredCategories.filter((c) => getCategorySection(c.name) === 'tax');
  const investmentCats = filteredCategories.filter((c) => getCategorySection(c.name) === 'investment');

  const selectedCategory = filteredCategories.find((c) => c.id === Number(watchedCategoryId));
  const selectedSection = selectedCategory ? getCategorySection(selectedCategory.name) : null;

  const categoryGroups = [
    ...(livingCats.length > 0 && (categorySection === 'all' || categorySection === 'living')
      ? [
          {
            label:
              watchedType === 'income'
                ? (language === 'hi' ? '💼 नियमित व व्यावसायिक आय' : '💼 Regular & Operational Income')
                : (language === 'hi' ? '🏠 दैनिक व जीवन व्यय' : '🏠 Living & Everyday Expenses'),
            options: livingCats.map((c) => ({ value: String(c.id), label: c.name })),
          },
        ]
      : []),
    ...(taxCats.length > 0 && (categorySection === 'all' || categorySection === 'tax')
      ? [
          {
            label: language === 'hi' ? '🏛️ कर और वैधानिक अनुपालन' : '🏛️ Tax & Statutory Compliance',
            options: taxCats.map((c) => ({ value: String(c.id), label: c.name })),
          },
        ]
      : []),
    ...(investmentCats.length > 0 && (categorySection === 'all' || categorySection === 'investment')
      ? [
          {
            label: language === 'hi' ? '📈 निवेश और धन सृजन' : '📈 Investments & Wealth Creation',
            options: investmentCats.map((c) => ({ value: String(c.id), label: c.name })),
          },
        ]
      : []),
  ];

  const onFormSubmit = async (data: TransactionFormData) => {
    const payload: any = {
      ...data,
      to_account_id: data.transaction_type === 'transfer' ? data.to_account_id : undefined,
      category_id: data.transaction_type === 'transfer' ? null : (data.category_id || null),
    };
    await onSubmit(payload);
    reset({
      account_id: defaultAccountId || accounts[0]?.id || 0,
      to_account_id: null,
      amount: '',
      currency: 'INR',
      transaction_type: defaultType || 'expense',
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setCategorySection('all');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? (language === 'hi' ? 'लेन-देन संपादित करें' : 'Edit Transaction')
          : (language === 'hi' ? 'लेन-देन जोड़ें' : 'Add Transaction')
      }
      description={
        isEditing
          ? (language === 'hi' ? 'लेन-देन विवरण अपडेट करें' : 'Update transaction details')
          : (language === 'hi' ? 'नया आय, खर्च, या ट्रांसफर दर्ज करें' : 'Record a new income, expense, or transfer')
      }
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Select
          label={language === 'hi' ? 'खाता' : 'Account'}
          options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
          placeholder={language === 'hi' ? 'खाता चुनें' : 'Select account'}
          error={errors.account_id?.message}
          {...register('account_id', { valueAsNumber: true })}
        />

        <Select
          label={language === 'hi' ? 'प्रकार' : 'Type'}
          options={typeOptions}
          placeholder={language === 'hi' ? 'प्रकार चुनें' : 'Select type'}
          error={errors.transaction_type?.message}
          {...register('transaction_type')}
        />

        {watchedType === 'transfer' ? (
          <Select
            label={language === 'hi' ? 'गंतव्य खाता' : 'Destination Account'}
            options={accounts
              .filter((a) => a.id !== Number(watchedAccountId))
              .map((a) => ({ value: String(a.id), label: a.name }))}
            placeholder={language === 'hi' ? 'गंतव्य खाता चुनें' : 'Select destination account'}
            error={errors.to_account_id?.message}
            {...register('to_account_id', { valueAsNumber: true })}
          />
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#173F2B] dark:text-slate-200">
                {language === 'hi' ? 'श्रेणी एवं अनुभाग' : 'Category & Section'}
              </label>
              {selectedSection && (
                <span className="text-[11px] font-bold">
                  {selectedSection === 'tax' ? (
                    <span className="text-blue-600 dark:text-blue-400">🏛️ {language === 'hi' ? 'कर अनुभाग' : 'Tax Section'}</span>
                  ) : selectedSection === 'investment' ? (
                    <span className="text-amber-600 dark:text-amber-400">📈 {language === 'hi' ? 'निवेश अनुभाग' : 'Investment Section'}</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">🏠 {language === 'hi' ? 'दैनिक व्यय' : 'Living Expense'}</span>
                  )}
                </span>
              )}
            </div>

            {/* Quick Section Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
              <button
                type="button"
                onClick={() => setCategorySection('all')}
                className={cn(
                  'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  categorySection === 'all'
                    ? 'bg-[#173F2B] text-white shadow-2xs'
                    : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
                )}
              >
                {language === 'hi' ? 'सभी' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setCategorySection('living')}
                className={cn(
                  'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1',
                  categorySection === 'living'
                    ? 'bg-[#173F2B] text-white shadow-2xs'
                    : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
                )}
              >
                🏠 {language === 'hi' ? 'दैनिक' : 'Living'} ({livingCats.length})
              </button>
              <button
                type="button"
                onClick={() => setCategorySection('tax')}
                className={cn(
                  'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1',
                  categorySection === 'tax'
                    ? 'bg-[#173F2B] text-white shadow-2xs'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100'
                )}
              >
                🏛️ {language === 'hi' ? 'कर (Tax)' : 'Tax'} ({taxCats.length})
              </button>
              <button
                type="button"
                onClick={() => setCategorySection('investment')}
                className={cn(
                  'px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1',
                  categorySection === 'investment'
                    ? 'bg-[#173F2B] text-white shadow-2xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                )}
              >
                📈 {language === 'hi' ? 'निवेश' : 'Investments'} ({investmentCats.length})
              </button>
            </div>

            <Select
              groups={categoryGroups}
              placeholder={language === 'hi' ? 'श्रेणी चुनें (वैकल्पिक)' : 'Select category (optional)'}
              error={errors.category_id?.message}
              {...register('category_id', { valueAsNumber: true })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={language === 'hi' ? 'राशि' : 'Amount'}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Select
            label={language === 'hi' ? 'मुद्रा' : 'Currency'}
            options={currencyOptions}
            placeholder={language === 'hi' ? 'मुद्रा' : 'Currency'}
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <Input
          label={language === 'hi' ? 'दिनांक' : 'Date'}
          type="date"
          error={errors.transaction_date?.message}
          {...register('transaction_date')}
        />

        <Input
          label={language === 'hi' ? 'विवरण (वैकल्पिक)' : 'Description (optional)'}
          placeholder={language === 'hi' ? 'लेन-देन का विवरण' : 'Transaction details'}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEditing
              ? (language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')
              : (language === 'hi' ? 'लेन-देन जोड़ें' : 'Add Transaction')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}