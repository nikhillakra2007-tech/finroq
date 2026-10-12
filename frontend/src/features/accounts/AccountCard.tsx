'use client';

import { Account } from '@/lib/api-types';
import { formatCurrency, getAccountTypeLabel } from '@/lib/utils';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isCredit = account.account_type === 'credit';
  const balance = parseFloat(account.initial_balance);
  const displayBalance = isCredit ? -balance : balance;

  return (
    <Card
      variant="outlined"
      className={cn('transition-shadow hover:shadow-md cursor-pointer', onClick && 'hover:bg-slate-50 dark:hover:bg-slate-750')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
              {account.name}
            </h3>
            <Badge variant="default" size="sm">
              {getAccountTypeLabel(account.account_type)}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {account.currency} • {account.is_active ? 'Active' : 'Archived'}
          </p>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(displayBalance, account.currency)}
          </div>
          {isCredit && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Credit balance shown as negative
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}