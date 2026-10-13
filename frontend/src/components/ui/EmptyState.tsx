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
        <div className="text-finroq-forest/30 dark:text-slate-600 mb-4" aria-hidden="true">
          <Icon className="h-12 w-12" />
        </div>
      )}
      <h3 className="text-lg font-display font-medium text-finroq-forest dark:text-slate-100 mb-2">{title}</h3>
      {description && (
        <p className="text-finroq-muted dark:text-slate-400 mb-6 max-w-sm text-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}