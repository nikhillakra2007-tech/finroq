'use client';

import { TransactionList } from '@/features/transactions/TransactionList';
import { MainLayout } from '@/components/layout/MainLayout';

export default function TransactionsPage() {
  return (
    <MainLayout>
      <TransactionList />
    </MainLayout>
  );
}