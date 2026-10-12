import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, currency = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Card',
    investment: 'Investment',
    cash: 'Cash',
    other: 'Other',
  };
  return labels[type] || type;
}

export function getTransactionTypeLabel(type: string): string {
  return type === 'income' ? 'Income' : 'Expense';
}

export function getTransactionTypeColor(type: string): string {
  return type === 'income' ? 'text-success-600' : 'text-danger-600';
}

export function getTransactionTypeBg(type: string): string {
  return type === 'income' ? 'bg-success-50' : 'bg-danger-50';
}