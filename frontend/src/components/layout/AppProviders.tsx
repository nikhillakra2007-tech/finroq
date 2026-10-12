'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { CurtainProvider } from './CurtainTransition';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurtainProvider>{children}</CurtainProvider>
    </AuthProvider>
  );
}
