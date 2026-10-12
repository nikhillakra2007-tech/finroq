'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { TransactionList } from '@/features/transactions/TransactionList';

export default function ExpenseTrackingPage() {
  return (
    <ModuleShell
      title="Expense Tracking"
      category="Track & Control"
      description="Record and categorize transactions, monitor statuses, and review completed cash flow with exact decimal arithmetic."
    >
      <TransactionList />
    </ModuleShell>
  );
}
