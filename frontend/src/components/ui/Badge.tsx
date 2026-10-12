'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      success: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      warning: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      danger: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
      info: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';