'use client';

import { Dashboard } from '@/features/summary/Dashboard';
import { MainLayout } from '@/components/layout/MainLayout';

export default function HomePage() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}