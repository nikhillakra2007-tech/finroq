'use client';

import { RecurringList } from '@/features/recurring/RecurringList';
import { MainLayout } from '@/components/layout/MainLayout';

export default function RecurringPage() {
  return (
    <MainLayout>
      <RecurringList />
    </MainLayout>
  );
}
