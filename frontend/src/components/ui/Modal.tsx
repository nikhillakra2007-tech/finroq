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
    if (!isOpen) return;

    // 1. Pause Lenis smooth scroll if present
    if (typeof window !== 'undefined' && (window as any).__lenis) {
      (window as any).__lenis.stop();
    }

    // 2. Lock body and html scroll
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 3. Block wheel and touch scrolling on backdrop
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const modalDialog = target.closest('[role="dialog"]');
      if (!modalDialog) {
        // Pointer is on backdrop -> completely cancel wheel scroll
        e.preventDefault();
        return;
      }

      // If pointer is inside dialog, prevent wheel from propagating to background
      // Check if dialog content has scrollable overflow
      const hasOverflow = modalDialog.scrollHeight > modalDialog.clientHeight;
      if (!hasOverflow) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[role="dialog"]')) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;

      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);

      // Resume Lenis smooth scroll
      if (typeof window !== 'undefined' && (window as any).__lenis) {
        (window as any).__lenis.start();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Fragment>
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 overscroll-contain transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        data-lenis-prevent
      />
      {/* Centering scroll wrapper */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overscroll-contain bg-transparent"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        data-lenis-prevent
      >
        <div
          className={cn(
            'w-full max-h-[90vh] flex flex-col bg-white dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-2xl shadow-2xl',
            'transform transition-all my-auto',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent
        >
          <div className="flex items-start justify-between p-6 border-b border-[#DCE4DC] dark:border-[#2A3D33] shrink-0">
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
                className="text-[#4D5D51] hover:text-[#173F2B] dark:text-slate-400 dark:hover:text-emerald-300 p-1.5 rounded-lg hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="p-6 text-[#173F2B] dark:text-slate-200 overflow-y-auto overscroll-contain flex-1" data-lenis-prevent>
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}