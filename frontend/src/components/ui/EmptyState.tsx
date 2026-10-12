'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}
      {...props}
    >
      {Icon && (
        <div className="text-slate-300 dark:text-slate-600 mb-4" aria-hidden="true">
          <Icon className="h-12 w-12" />
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}