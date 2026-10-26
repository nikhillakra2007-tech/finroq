'use client';

import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/api-types';
import { apiClient, DEMO_BUDGETS } from '@/lib/api-client';
import { BudgetForm } from './BudgetForm';
import { Button, Card, Badge, EmptyState, LoadingCard } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Edit2,
  Trash2,
  Calendar,
  ArrowDownRight,
  ShieldCheck,
  Home,
  Wallet,
  Layers,
} from 'lucide-react';

export type BudgetSectionType = 'living' | 'tax' | 'investment';

export function getBudgetSection(categoryName: string): BudgetSectionType {
  const lower = (categoryName || '').toLowerCase();
  if (
    lower.includes('tax') ||
    lower.includes('gst') ||
    lower.includes('tds') ||
    lower.includes('cess') ||
    lower.includes('statutory')
  ) {
    return 'tax';
  }
  if (
    lower.includes('invest') ||
    lower.includes('sip') ||
    lower.includes('fund') ||
    lower.includes('stock') ||
    lower.includes('gold') ||
    lower.includes('equity') ||
    lower.includes('portfolio') ||
    lower.includes('ppf') ||
    lower.includes('nps') ||
    lower.includes('wealth') ||
    lower.includes('brokerage')
  ) {
    return 'investment';
  }
  return 'living';
}

const SEED_MONTHLY_BUDGETS: Record<string, Budget[]> = {
  '2026-10': [
    // Living Expenses
    { id: 901, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 10, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 902, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 10, allocated_amount: '14500.00', actual_spending: '12850.00', remaining_amount: '1650.00', utilization_percent: '88.6', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 903, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 10, allocated_amount: '7000.00', actual_spending: '7450.00', remaining_amount: '-450.00', utilization_percent: '106.4', is_overspent: true, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 904, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 10, allocated_amount: '5500.00', actual_spending: '4300.00', remaining_amount: '1200.00', utilization_percent: '78.2', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 905, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 10, allocated_amount: '4200.00', actual_spending: '3890.00', remaining_amount: '310.00', utilization_percent: '92.6', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 906, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 10, allocated_amount: '2500.00', actual_spending: '1899.00', remaining_amount: '601.00', utilization_percent: '76.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    // Tax Section
    { id: 907, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 10, allocated_amount: '22000.00', actual_spending: '22000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 908, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 10, allocated_amount: '4500.00', actual_spending: '4200.00', remaining_amount: '300.00', utilization_percent: '93.3', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    // Investment Section
    { id: 909, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 10, allocated_amount: '30000.00', actual_spending: '30000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 910, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 10, allocated_amount: '15000.00', actual_spending: '12500.00', remaining_amount: '2500.00', utilization_percent: '83.3', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  ],
  '2026-9': [
    { id: 801, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 9, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 802, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 9, allocated_amount: '14000.00', actual_spending: '13450.00', remaining_amount: '550.00', utilization_percent: '96.1', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 803, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 9, allocated_amount: '7000.00', actual_spending: '6880.00', remaining_amount: '120.00', utilization_percent: '98.3', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 804, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 9, allocated_amount: '5500.00', actual_spending: '4890.00', remaining_amount: '610.00', utilization_percent: '88.9', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 805, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 9, allocated_amount: '4200.00', actual_spending: '4150.00', remaining_amount: '50.00', utilization_percent: '98.8', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 806, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 9, allocated_amount: '2500.00', actual_spending: '2399.00', remaining_amount: '101.00', utilization_percent: '96.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 807, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 9, allocated_amount: '22000.00', actual_spending: '22000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 808, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 9, allocated_amount: '4500.00', actual_spending: '4500.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 809, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 9, allocated_amount: '30000.00', actual_spending: '30000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 810, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 9, allocated_amount: '15000.00', actual_spending: '14000.00', remaining_amount: '1000.00', utilization_percent: '93.3', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
  ],
  '2026-8': [
    { id: 701, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 8, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 702, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 8, allocated_amount: '13500.00', actual_spending: '13200.00', remaining_amount: '300.00', utilization_percent: '97.8', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 703, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 8, allocated_amount: '6500.00', actual_spending: '6920.00', remaining_amount: '-420.00', utilization_percent: '106.5', is_overspent: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 704, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 8, allocated_amount: '5000.00', actual_spending: '5100.00', remaining_amount: '-100.00', utilization_percent: '102.0', is_overspent: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 705, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 8, allocated_amount: '4000.00', actual_spending: '3920.00', remaining_amount: '80.00', utilization_percent: '98.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 706, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 8, allocated_amount: '2500.00', actual_spending: '2500.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 707, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 8, allocated_amount: '20000.00', actual_spending: '20000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 708, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 8, allocated_amount: '4000.00', actual_spending: '4000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 709, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 8, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 710, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 8, allocated_amount: '12000.00', actual_spending: '11500.00', remaining_amount: '500.00', utilization_percent: '95.8', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  ],
  '2026-7': [
    { id: 601, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 7, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 602, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 7, allocated_amount: '13000.00', actual_spending: '12800.00', remaining_amount: '200.00', utilization_percent: '98.5', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 603, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 7, allocated_amount: '6000.00', actual_spending: '6100.00', remaining_amount: '-100.00', utilization_percent: '101.7', is_overspent: true, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 604, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 7, allocated_amount: '5000.00', actual_spending: '4700.00', remaining_amount: '300.00', utilization_percent: '94.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 605, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 7, allocated_amount: '3800.00', actual_spending: '3650.00', remaining_amount: '150.00', utilization_percent: '96.1', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 606, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 7, allocated_amount: '2200.00', actual_spending: '2100.00', remaining_amount: '100.00', utilization_percent: '95.5', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 607, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 7, allocated_amount: '20000.00', actual_spending: '20000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 608, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 7, allocated_amount: '4000.00', actual_spending: '3800.00', remaining_amount: '200.00', utilization_percent: '95.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 609, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 7, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 610, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 7, allocated_amount: '12000.00', actual_spending: '12000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  ],
  '2026-6': [
    { id: 501, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 6, allocated_amount: '27000.00', actual_spending: '27000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 502, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 6, allocated_amount: '12500.00', actual_spending: '12100.00', remaining_amount: '400.00', utilization_percent: '96.8', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 503, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 6, allocated_amount: '5500.00', actual_spending: '5200.00', remaining_amount: '300.00', utilization_percent: '94.5', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 504, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 6, allocated_amount: '4800.00', actual_spending: '4600.00', remaining_amount: '200.00', utilization_percent: '95.8', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 505, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 6, allocated_amount: '3500.00', actual_spending: '3400.00', remaining_amount: '100.00', utilization_percent: '97.1', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 506, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 6, allocated_amount: '2000.00', actual_spending: '1950.00', remaining_amount: '50.00', utilization_percent: '97.5', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 507, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 6, allocated_amount: '18000.00', actual_spending: '18000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 508, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 6, allocated_amount: '3800.00', actual_spending: '3800.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 509, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 6, allocated_amount: '25000.00', actual_spending: '25000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 510, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 6, allocated_amount: '10000.00', actual_spending: '9500.00', remaining_amount: '500.00', utilization_percent: '95.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  ],
  '2026-5': [
    { id: 401, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 5, allocated_amount: '27000.00', actual_spending: '27000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 402, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 5, allocated_amount: '12000.00', actual_spending: '11800.00', remaining_amount: '200.00', utilization_percent: '98.3', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 403, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 5, allocated_amount: '5000.00', actual_spending: '4800.00', remaining_amount: '200.00', utilization_percent: '96.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 404, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 5, allocated_amount: '4500.00', actual_spending: '4400.00', remaining_amount: '100.00', utilization_percent: '97.8', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 405, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 5, allocated_amount: '3200.00', actual_spending: '3100.00', remaining_amount: '100.00', utilization_percent: '96.9', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 406, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 5, allocated_amount: '1800.00', actual_spending: '1750.00', remaining_amount: '50.00', utilization_percent: '97.2', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 407, owner_id: 'usr_demo', category_id: 12, category_name: 'Income Tax & Advance Tax', budget_year: 2026, budget_month: 5, allocated_amount: '18000.00', actual_spending: '18000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 408, owner_id: 'usr_demo', category_id: 13, category_name: 'GST & Professional Tax', budget_year: 2026, budget_month: 5, allocated_amount: '3800.00', actual_spending: '3800.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 409, owner_id: 'usr_demo', category_id: 14, category_name: 'Mutual Funds & SIPs', budget_year: 2026, budget_month: 5, allocated_amount: '25000.00', actual_spending: '25000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 410, owner_id: 'usr_demo', category_id: 15, category_name: 'Stocks & Sovereign Gold', budget_year: 2026, budget_month: 5, allocated_amount: '10000.00', actual_spending: '10000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
  ],
};

export function BudgetList() {
  const { language, t, activeLanguageMeta } = useI18n();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'all' | 'living' | 'tax' | 'investment'>('all');

  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
  ];

  const getMonthName = (mIndex: number) => {
    try {
      return new Date(2026, mIndex, 1).toLocaleDateString(activeLanguageMeta?.speechLocale || language, { month: 'long' });
    } catch {
      return language === 'hi' ? monthNamesHi[mIndex] : monthNamesEn[mIndex];
    }
  };

  const monthNames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => getMonthName(m));

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const monthKey = `${year}-${month}`;
      const seedForMonth = SEED_MONTHLY_BUDGETS[monthKey];
      const res = await apiClient.listBudgets(year, month);
      if (res.data && res.data.length > 0) {
        if (apiClient.isDemoSession() && seedForMonth) {
          setBudgets(seedForMonth);
        } else {
          setBudgets(res.data);
        }
      } else {
        setBudgets(seedForMonth || DEMO_BUDGETS);
      }
    } catch (err: any) {
      console.warn('API fetch failed, falling back to demo budgets:', err);
      const monthKey = `${year}-${month}`;
      setBudgets(SEED_MONTHLY_BUDGETS[monthKey] || DEMO_BUDGETS);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleCreateBudget = async (data: { category_id: number; budget_year: number; budget_month: number; allocated_amount: string }) => {
    try {
      await apiClient.createBudget(data);
    } catch (e) {
      // Local optimistic fallback
      const newBudget: Budget = {
        id: Date.now(),
        owner_id: 'usr_demo',
        category_id: data.category_id,
        category_name: 'Custom Category',
        budget_year: data.budget_year,
        budget_month: data.budget_month,
        allocated_amount: data.allocated_amount,
        actual_spending: '0.00',
        remaining_amount: data.allocated_amount,
        utilization_percent: '0.0',
        is_overspent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBudgets((prev) => [...prev, newBudget]);
    }
    await fetchBudgets();
  };

  const handleUpdateBudget = async (data: { allocated_amount: string }) => {
    if (!editingBudget) return;
    try {
      await apiClient.updateBudget(editingBudget.id, { allocated_amount: data.allocated_amount });
    } catch (e) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === editingBudget.id ? { ...b, allocated_amount: data.allocated_amount } : b))
      );
    }
    await fetchBudgets();
    setEditingBudget(null);
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Are you sure you want to remove this budget allocation?')) return;
    try {
      await apiClient.deleteBudget(id);
    } catch (err) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    }
    await fetchBudgets();
  };

  // Section categorization
  const livingBudgets = budgets.filter((b) => getBudgetSection(b.category_name) === 'living');
  const taxBudgets = budgets.filter((b) => getBudgetSection(b.category_name) === 'tax');
  const investmentBudgets = budgets.filter((b) => getBudgetSection(b.category_name) === 'investment');

  const calcSectionTotals = (items: Budget[]) => {
    const allocated = items.reduce((acc, b) => acc + parseFloat(b.allocated_amount || '0'), 0);
    const spent = items.reduce((acc, b) => acc + parseFloat(b.actual_spending || '0'), 0);
    const remaining = allocated - spent;
    const util = allocated > 0 ? (spent / allocated) * 100 : 0;
    return { allocated, spent, remaining, util };
  };

  const livingTotals = calcSectionTotals(livingBudgets);
  const taxTotals = calcSectionTotals(taxBudgets);
  const investmentTotals = calcSectionTotals(investmentBudgets);

  const totalAllocated = budgets.reduce((acc, b) => acc + parseFloat(b.allocated_amount || '0'), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.actual_spending || '0'), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const renderBudgetCard = (b: Budget) => {
    const allocated = parseFloat(b.allocated_amount || '0');
    const spent = parseFloat(b.actual_spending || '0');
    const remaining = parseFloat(b.remaining_amount || '0');
    const util = b.utilization_percent ? parseFloat(b.utilization_percent) : (allocated > 0 ? (spent / allocated) * 100 : 0);
    const isOver = b.is_overspent || remaining < 0;

    return (
      <Card
        key={b.id}
        className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs rounded-2xl"
      >
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-[#173F2B] dark:text-emerald-300">
                {b.category_name}
              </h3>
              <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                {monthNames[b.budget_month - 1]} {b.budget_year}
              </p>
            </div>

            {isOver ? (
              <Badge variant="danger" className="flex items-center gap-1 font-bold">
                <AlertTriangle className="h-3 w-3" />
                {t('budget.overspent', 'Overspent')}
              </Badge>
            ) : util >= 80 ? (
              <Badge variant="warning" className="font-bold">
                {util.toFixed(0)}% {t('budget.used', 'Used')}
              </Badge>
            ) : (
              <Badge variant="success" className="font-bold">
                {util.toFixed(0)}% {t('budget.used', 'Used')}
              </Badge>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#4D5D51] dark:text-slate-400">
                {t('budget.spent_paid', 'Spent / Paid:')}
              </span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#4D5D51] dark:text-slate-400">
                {t('budget.allocated', 'Allocated:')}
              </span>
              <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                {formatCurrency(allocated)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-[#DCE4DC] dark:border-[var(--line)] pt-2 font-semibold">
              <span className={isOver ? 'text-[#B43838]' : 'text-[#173F2B] dark:text-slate-200'}>
                {isOver
                  ? t('budget.over_budget_by', 'Over budget by:')
                  : t('budget.remaining_capacity', 'Remaining capacity:')}
              </span>
              <span className={isOver ? 'text-[#B43838] font-bold font-mono' : 'text-[#157A42] font-bold font-mono'}>
                {formatCurrency(Math.abs(remaining))}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E5ECE5] dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-3">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isOver ? 'bg-[#B43838]' : util >= 80 ? 'bg-[#B77925]' : 'bg-[#173F2B]'
                )}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)] flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditingBudget(b)}
            className="h-8 px-2 text-[#173F2B] dark:text-slate-300 hover:text-[#102F21]"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            {t('action.edit', 'Edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteBudget(b.id)}
            className="h-8 px-2 text-danger-500 hover:text-danger-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t('action.delete', 'Delete')}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#173F2B] dark:text-slate-100">
            {t('budget.monthly_budgets', 'Monthly Budgets & Allocations')}
          </h1>
          <p className="text-sm font-medium text-[#4D5D51] dark:text-slate-400">
            {t('budget.monthly_budgets_subtitle', 'Set spending caps, plan statutory tax provisions, and track wealth investments in INR (₹)')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#173F2B] hover:bg-finroq-mint rounded-lg transition-colors cursor-pointer"
              title={t('action.previous_month', 'Previous Month')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-bold text-[#173F2B] dark:text-slate-200 min-w-[140px] text-center font-display">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#173F2B] hover:bg-finroq-mint rounded-lg transition-colors cursor-pointer"
              title={t('action.next_month', 'Next Month')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={() => setCreateFormOpen(true)} className="flex items-center gap-2 bg-[#173F2B] text-white hover:bg-finroq-forest-deep shadow-xs font-medium cursor-pointer">
            <Plus className="h-4 w-4" />
            {t('budget.add_budget', 'Add Budget')}
          </Button>
        </div>
      </div>

      {/* Historical Month-over-Month Trend Banner */}
      <div className="p-4 rounded-2xl bg-[#F4F7F3] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-white dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 font-bold border border-[#DCE4DC] dark:border-[var(--line)]">
            <Calendar className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-[#173F2B] dark:text-slate-200">
            {t('budget.outflow_trend', 'Outflow & Contribution Trend (Last 6 Months):')}
          </span>
          <span className="text-[#3F4F43] dark:text-slate-400 font-medium">
            May (₹1,00,750) → Jun (₹1,02,350) → Jul (₹1,18,550) → Aug (₹1,23,020) → Sep (₹1,27,239) → Oct (₹1,27,089)
          </span>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#173F2B] font-semibold text-[11px]">
            <ArrowDownRight className="w-3 h-3 text-[#157A42]" /> {t('budget.this_month_diff', '-0.1% This Month')}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-emerald-400">
            {t('budget.total_allocated', 'Total Allocated')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#173F2B] dark:text-emerald-300">{formatCurrency(totalAllocated)}</div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">
            {budgets.length} {t('budget.active_categories', 'active categories')}
          </p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-amber-400">
            {t('budget.actual_deployed', 'Actual Deployed')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#B77925] dark:text-amber-400">{formatCurrency(totalSpent)}</div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">
            {t('budget.expenses_taxes_sips', 'Expenses, taxes, and SIPs')}
          </p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-emerald-400">
            {t('budget.remaining_pool', 'Remaining Pool')}
          </div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', totalRemaining >= 0 ? 'text-[#157A42] dark:text-emerald-400' : 'text-[#B43838] dark:text-rose-400')}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">
            {totalRemaining >= 0
              ? t('budget.within_budget', 'Within monthly budget plan')
              : t('budget.over_allocation', 'Over allocation')}
          </p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-300">
            {t('budget.overall_utilization', 'Overall Utilization')}
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#173F2B] dark:text-slate-100">
            {overallUtilization.toFixed(1)}%
          </div>
          <div className="w-full bg-[#E5ECE5] dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                overallUtilization > 100 ? 'bg-[#B43838]' : overallUtilization >= 80 ? 'bg-[#B77925]' : 'bg-[#173F2B]'
              )}
              style={{ width: `${Math.min(overallUtilization, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Section Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[#DCE4DC] dark:border-[#2A3D33] pb-3">
        <button
          onClick={() => setActiveSection('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeSection === 'all'
              ? 'bg-[#173F2B] text-white shadow-xs'
              : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          {t('action.all_sections', 'All Sections')} ({budgets.length})
        </button>
        <button
          onClick={() => setActiveSection('living')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeSection === 'living'
              ? 'bg-[#173F2B] text-white shadow-xs'
              : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
          )}
        >
          <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {t('cat.living', 'Living Expenses')} ({livingBudgets.length})
        </button>
        <button
          onClick={() => setActiveSection('tax')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeSection === 'tax'
              ? 'bg-[#173F2B] text-white shadow-xs'
              : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {t('cat.tax', 'Tax & Statutory')} ({taxBudgets.length})
        </button>
        <button
          onClick={() => setActiveSection('investment')}
          className={cn(
            'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeSection === 'investment'
              ? 'bg-[#173F2B] text-white shadow-xs'
              : 'bg-[#F4F7F3] dark:bg-[#1A2C22] text-[#4D5D51] dark:text-slate-300 hover:bg-[#E5ECE5]'
          )}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          {t('cat.investments', 'Investments & Wealth')} ({investmentBudgets.length})
        </button>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33]">
          <EmptyState
            title={`${monthNames[month - 1]} ${year}: ${t('budget.no_budgets', 'No budgets allocated')}`}
            description={t('budget.no_budgets_desc', 'Create category budgets for living expenses, taxes, and investments.')}
            action={
              <Button onClick={() => setCreateFormOpen(true)} className="bg-[#173F2B] text-white">
                <Plus className="h-4 w-4 mr-2" />
                {t('budget.create_budget', 'Create Budget')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: LIVING & OPERATIONAL EXPENSES */}
          {(activeSection === 'all' || activeSection === 'living') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl bg-[#F8FAF7] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#243A2E]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-[#173F2B] dark:text-emerald-300">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-[#173F2B] dark:text-emerald-300 flex items-center gap-2">
                      {t('cat.living_expenses', 'Monthly Living & Operational Expenses')}
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-100/70 text-[#173F2B] dark:bg-emerald-950 dark:text-emerald-400">
                        {livingBudgets.length} {t('common.category', 'categories')}
                      </span>
                    </h2>
                    <p className="text-xs text-[#4D5D51] dark:text-slate-400">
                      Housing, groceries, transit, dining, utilities, and daily household operational commitments
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-[#3F4F43] dark:text-slate-300 flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#1A2C22] px-3 py-1.5 rounded-lg border border-[#DCE4DC] dark:border-[#2A3D33]">
                  <span>{t('budget.allocated', 'Cap:')} <strong>{formatCurrency(livingTotals.allocated)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{t('budget.spent_paid', 'Spent:')} <strong>{formatCurrency(livingTotals.spent)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className={livingTotals.util > 100 ? 'text-red-600 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                    {livingTotals.util.toFixed(0)}%
                  </span>
                </div>
              </div>

              {livingBudgets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {livingBudgets.map(renderBudgetCard)}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-[#DCE4DC] dark:border-[#2A3D33] rounded-xl text-xs text-[#4D5D51] dark:text-slate-400">
                  {t('budget.no_living_allocated', 'No living expense budgets allocated for this month.')}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: TAX & STATUTORY COMPLIANCE */}
          {(activeSection === 'all' || activeSection === 'tax') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl bg-[#F5F8FC] dark:bg-[#131D28] border border-[#D2DFEE] dark:border-[#1E3347]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-[#143E63] dark:text-blue-300 flex items-center gap-2">
                      {t('cat.tax_compliance', 'Tax Planning & Statutory Reserves')}
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                        {taxBudgets.length} {t('common.category', 'categories')}
                      </span>
                    </h2>
                    <p className="text-xs text-[#44607B] dark:text-slate-400">
                      Advance income tax provisions, quarterly statutory TDS, GST, and tax-saving statutory reserves
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-[#2B4B6F] dark:text-slate-300 flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#172535] px-3 py-1.5 rounded-lg border border-[#D2DFEE] dark:border-[#233B52]">
                  <span>{t('budget.allocated', 'Provision:')} <strong>{formatCurrency(taxTotals.allocated)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{t('budget.spent_paid', 'Deposited:')} <strong>{formatCurrency(taxTotals.spent)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className={taxTotals.util > 100 ? 'text-red-600 font-bold' : 'text-blue-700 dark:text-blue-400 font-bold'}>
                    {taxTotals.util.toFixed(0)}%
                  </span>
                </div>
              </div>

              {taxBudgets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {taxBudgets.map(renderBudgetCard)}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-[#D2DFEE] dark:border-[#233B52] rounded-xl text-xs text-[#44607B] dark:text-slate-400">
                  {t('budget.no_tax_allocated', 'No tax planning budgets allocated for this month.')}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: INVESTMENT & WEALTH CREATION */}
          {(activeSection === 'all' || activeSection === 'investment') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3.5 rounded-xl bg-[#FAF7F0] dark:bg-[#231E14] border border-[#E9DFCE] dark:border-[#382F20]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold text-[#6D4C13] dark:text-amber-300 flex items-center gap-2">
                      {t('cat.investments_wealth', 'Investments & Wealth Creation')}
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {investmentBudgets.length} {t('common.category', 'categories')}
                      </span>
                    </h2>
                    <p className="text-xs text-[#6B5A3E] dark:text-slate-400">
                      Systematic Investment Plans (SIPs), index equity funds, sovereign gold, and long-term capital assets
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-[#5C451D] dark:text-slate-300 flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#2B2317] px-3 py-1.5 rounded-lg border border-[#E9DFCE] dark:border-[#3E3422]">
                  <span>{t('budget.allocated', 'Target:')} <strong>{formatCurrency(investmentTotals.allocated)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{t('budget.spent_paid', 'Deployed:')} <strong>{formatCurrency(investmentTotals.spent)}</strong></span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className={investmentTotals.util >= 100 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
                    {investmentTotals.util.toFixed(0)}%
                  </span>
                </div>
              </div>

              {investmentBudgets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {investmentBudgets.map(renderBudgetCard)}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-[#E9DFCE] dark:border-[#3E3422] rounded-xl text-xs text-[#6B5A3E] dark:text-slate-400">
                  {t('budget.no_investments_allocated', 'No investment allocations set for this month.')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <BudgetForm
        isOpen={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSubmit={handleCreateBudget}
        defaultYear={year}
        defaultMonth={month}
      />

      {/* Edit Modal */}
      {editingBudget && (
        <BudgetForm
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          onSubmit={async (data) => {
            await handleUpdateBudget({ allocated_amount: data.allocated_amount });
          }}
          initialData={editingBudget}
        />
      )}
    </div>
  );
}
