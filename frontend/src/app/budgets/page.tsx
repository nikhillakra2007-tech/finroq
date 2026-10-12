'use client';

import { BudgetList } from '@/features/budget/BudgetList';
import { MainLayout } from '@/components/layout/MainLayout';

export default function BudgetsPage() {
  return (
    <MainLayout>
      <BudgetList />
    </MainLayout>
  );
}
