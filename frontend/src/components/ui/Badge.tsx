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
      default: 'bg-finroq-mint text-finroq-forest dark:bg-slate-700 dark:text-slate-300',
      success: 'bg-[#EAF3E7] text-[#247A50] border border-[#DCE7D9]',
      warning: 'bg-[#FEF7EC] text-[#B77925] border border-[#FDE1B8]',
      danger: 'bg-[#FDE8E8] text-[#B74747] border border-[#F6C5C5]',
      info: 'bg-finroq-mint text-finroq-forest border border-finroq-border',
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