'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#FCFDFC] dark:bg-[#16251E] rounded-2xl shadow-xs border border-[#DCE4DC] dark:border-[#2A3D33]',
      outlined: 'bg-[#F9FAF8] dark:bg-[#16251E] rounded-2xl border border-[#D5DFD5] dark:border-[#2A3D33]',
      elevated: 'bg-white dark:bg-[#16251E] rounded-2xl shadow-sm border border-[#D4DDD3] dark:border-[#2A3D33]',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], 'p-6', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-display font-semibold text-[#173F2B] dark:text-emerald-300', className)} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';