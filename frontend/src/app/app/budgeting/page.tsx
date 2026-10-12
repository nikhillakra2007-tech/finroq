'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { BudgetList } from '@/features/budget/BudgetList';

export default function DailyBudgetingPage() {
  return (
    <ModuleShell
      title="Daily Budgeting"
      category="Track & Control"
      description="Set category spending caps, compare plans with actual completed expenses, and catch overspending early."
    >
      <BudgetList />
    </ModuleShell>
  );
}
