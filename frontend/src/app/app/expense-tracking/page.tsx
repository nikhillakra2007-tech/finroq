'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { TransactionList } from '@/features/transactions/TransactionList';
import { useI18n } from '@/lib/i18n-context';

export default function ExpenseTrackingPage() {
  const { language, t } = useI18n();

  return (
    <ModuleShell
      title={language === 'hi' ? 'खर्च ट्रैकिंग' : 'Expense Tracking'}
      category={language === 'hi' ? 'ट्रैक एवं नियंत्रण' : 'Track & Control'}
      description={
        language === 'hi'
          ? 'लेन-देन दर्ज करें और वर्गीकृत करें, स्थिति की निगरानी करें, और सटीक दशमलव गणना के साथ पूर्ण नकदी प्रवाह की समीक्षा करें।'
          : 'Record and categorize transactions, monitor statuses, and review completed cash flow with exact decimal arithmetic.'
      }
    >
      <TransactionList />
    </ModuleShell>
  );
}

