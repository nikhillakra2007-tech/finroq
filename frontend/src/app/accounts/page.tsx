'use client';

import { AccountsList } from '@/features/accounts/AccountsList';
import { MainLayout } from '@/components/layout/MainLayout';

export default function AccountsPage() {
  return (
    <MainLayout>
      <AccountsList />
    </MainLayout>
  );
}