'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface CurtainContextType {
  navigateWithCurtain: (href: string, label?: string, dir?: 'fwd' | 'back') => void;
  isBusy: boolean;
}

const CurtainContext = createContext<CurtainContextType>({
  navigateWithCurtain: () => {},
  isBusy: false,
});

export const useCurtain = () => useContext(CurtainContext);

export function CurtainProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('finroq');
  const [isBusy, setIsBusy] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);

  const navigateWithCurtain = useCallback(
    (href: string, targetLabel = 'finroq', dir: 'fwd' | 'back' = 'fwd') => {
      if (isBusy) return;

      // Check prefers-reduced-motion
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href);
        return;
      }

      setIsBusy(true);
      setLabel(targetLabel);
      setIsOpen(true);

      const curtain = curtainRef.current;
      if (!curtain) {
        router.push(href);
        setIsBusy(false);
        setIsOpen(false);
        return;
      }

      const ease = 'cubic-bezier(.76, 0, .24, 1)';
      const fromY = dir === 'fwd' ? '100%' : '-100%';
      const toY = dir === 'fwd' ? '-100%' : '100%';

      // Curtain Wipe In
      const animIn = curtain.animate(
        [
          { transform: `translateY(${fromY})` },
          { transform: 'translateY(0%)' },
        ],
        { duration: 520, easing: ease, fill: 'forwards' }
      );

      animIn.finished.then(() => {
        router.push(href);

        // Curtain Wipe Out
        setTimeout(() => {
          const animOut = curtain.animate(
            [
              { transform: 'translateY(0%)' },
              { transform: `translateY(${toY})` },
            ],
            { duration: 520, easing: ease, fill: 'forwards' }
          );

          animOut.finished.then(() => {
            animIn.cancel();
            animOut.cancel();
            setIsOpen(false);
            setIsBusy(false);
          }).catch(() => {
            setIsOpen(false);
            setIsBusy(false);
          });
        }, 120);
      }).catch(() => {
        setIsOpen(false);
        setIsBusy(false);
      });
    },
    [isBusy, router]
  );

  return (
    <CurtainContext.Provider value={{ navigateWithCurtain, isBusy }}>
      {children}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--accent)] text-white pointer-events-none"
        style={{
          transform: isOpen ? 'translateY(0%)' : 'translateY(100%)',
          display: isOpen ? 'flex' : 'none',
          willChange: 'transform',
        }}
      >
        <span className="font-display font-bold text-5xl sm:text-7xl md:text-8xl tracking-tight text-white select-none">
          {label}
        </span>
      </div>
    </CurtainContext.Provider>
  );
}
