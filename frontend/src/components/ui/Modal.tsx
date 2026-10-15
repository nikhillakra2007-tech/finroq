'use client';

import { Fragment, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleWheel = (e: WheelEvent) => {
        // Prevent scroll event bubbling to window
        const target = e.target as HTMLElement;
        const modalContent = target.closest('[role="dialog"]');
        if (!modalContent) {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 overscroll-contain transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain bg-transparent"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div
          className={cn(
            'w-full bg-white dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-2xl shadow-2xl',
            'transform transition-all',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-6 border-b border-[#DCE4DC] dark:border-[#2A3D33]">
            <div>
              <h2 id="modal-title" className="text-xl font-display font-bold text-[#173F2B] dark:text-emerald-300">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-sm text-[#4D5D51] dark:text-slate-300 mt-1.5">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-[#4D5D51] hover:text-[#173F2B] dark:text-slate-400 dark:hover:text-emerald-300 p-1.5 rounded-lg hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="p-6 text-[#173F2B] dark:text-slate-200">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}