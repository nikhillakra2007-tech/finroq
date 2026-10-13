'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import AppSpendLeakDetectorPage from '../app/spend-leak-detector/page';

export default function SpendLeaksPage() {
  return (
    <MainLayout>
      <AppSpendLeakDetectorPage />
    </MainLayout>
  );
}
