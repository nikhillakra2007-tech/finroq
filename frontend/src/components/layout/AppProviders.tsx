'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { CurtainProvider } from './CurtainTransition';
import { I18nProvider } from '@/lib/i18n-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <CurtainProvider>{children}</CurtainProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
