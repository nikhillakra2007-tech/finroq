'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { BudgetList } from '@/features/budget/BudgetList';
import { useI18n } from '@/lib/i18n-context';

export default function DailyBudgetingPage() {
  const { language } = useI18n();

  return (
    <ModuleShell
      title={language === 'hi' ? 'बजट प्रबंधन' : 'Budgeting'}
      category={language === 'hi' ? 'ट्रैक और नियंत्रण' : 'Track & Control'}
      description={
        language === 'hi'
          ? 'श्रेणी व्यय सीमाएं निर्धारित करें, योजनाओं की वास्तविक पूर्ण खर्चों से तुलना करें और अधिक खर्च को समय रहते रोकें।'
          : 'Set category spending caps, compare plans with actual completed expenses, and catch overspending early.'
      }
    >
      <BudgetList />
    </ModuleShell>
  );
}
