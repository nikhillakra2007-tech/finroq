'use client';

import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/api-types';
import { apiClient, DEMO_BUDGETS } from '@/lib/api-client';
import { BudgetForm } from './BudgetForm';
import { Button, Card, Badge, EmptyState, LoadingCard } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Edit2, Trash2, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const SEED_MONTHLY_BUDGETS: Record<string, Budget[]> = {
  '2026-10': [
    { id: 901, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 10, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 902, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 10, allocated_amount: '14500.00', actual_spending: '12850.00', remaining_amount: '1650.00', utilization_percent: '88.6', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 903, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 10, allocated_amount: '7000.00', actual_spending: '7450.00', remaining_amount: '-450.00', utilization_percent: '106.4', is_overspent: true, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 904, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 10, allocated_amount: '5500.00', actual_spending: '4300.00', remaining_amount: '1200.00', utilization_percent: '78.2', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 905, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 10, allocated_amount: '4200.00', actual_spending: '3890.00', remaining_amount: '310.00', utilization_percent: '92.6', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
    { id: 906, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 10, allocated_amount: '2500.00', actual_spending: '1899.00', remaining_amount: '601.00', utilization_percent: '76.0', is_overspent: false, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  ],
  '2026-9': [
    { id: 801, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 9, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 802, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 9, allocated_amount: '14000.00', actual_spending: '13450.00', remaining_amount: '550.00', utilization_percent: '96.1', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 803, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 9, allocated_amount: '7000.00', actual_spending: '6880.00', remaining_amount: '120.00', utilization_percent: '98.3', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 804, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 9, allocated_amount: '5500.00', actual_spending: '4890.00', remaining_amount: '610.00', utilization_percent: '88.9', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 805, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 9, allocated_amount: '4200.00', actual_spending: '4150.00', remaining_amount: '50.00', utilization_percent: '98.8', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
    { id: 806, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 9, allocated_amount: '2500.00', actual_spending: '2399.00', remaining_amount: '101.00', utilization_percent: '96.0', is_overspent: false, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
  ],
  '2026-8': [
    { id: 701, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 8, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 702, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 8, allocated_amount: '13500.00', actual_spending: '13200.00', remaining_amount: '300.00', utilization_percent: '97.8', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 703, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 8, allocated_amount: '6500.00', actual_spending: '6920.00', remaining_amount: '-420.00', utilization_percent: '106.5', is_overspent: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 704, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 8, allocated_amount: '5000.00', actual_spending: '5100.00', remaining_amount: '-100.00', utilization_percent: '102.0', is_overspent: true, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 705, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 8, allocated_amount: '4000.00', actual_spending: '3920.00', remaining_amount: '80.00', utilization_percent: '98.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
    { id: 706, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 8, allocated_amount: '2500.00', actual_spending: '2500.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' },
  ],
  '2026-7': [
    { id: 601, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 7, allocated_amount: '28000.00', actual_spending: '28000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 602, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 7, allocated_amount: '13000.00', actual_spending: '12800.00', remaining_amount: '200.00', utilization_percent: '98.5', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 603, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 7, allocated_amount: '6000.00', actual_spending: '6100.00', remaining_amount: '-100.00', utilization_percent: '101.7', is_overspent: true, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 604, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 7, allocated_amount: '5000.00', actual_spending: '4700.00', remaining_amount: '300.00', utilization_percent: '94.0', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 605, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 7, allocated_amount: '3800.00', actual_spending: '3650.00', remaining_amount: '150.00', utilization_percent: '96.1', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
    { id: 606, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 7, allocated_amount: '2200.00', actual_spending: '2100.00', remaining_amount: '100.00', utilization_percent: '95.5', is_overspent: false, created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  ],
  '2026-6': [
    { id: 501, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 6, allocated_amount: '27000.00', actual_spending: '27000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 502, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 6, allocated_amount: '12500.00', actual_spending: '12100.00', remaining_amount: '400.00', utilization_percent: '96.8', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 503, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 6, allocated_amount: '5500.00', actual_spending: '5200.00', remaining_amount: '300.00', utilization_percent: '94.5', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 504, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 6, allocated_amount: '4800.00', actual_spending: '4600.00', remaining_amount: '200.00', utilization_percent: '95.8', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 505, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 6, allocated_amount: '3500.00', actual_spending: '3400.00', remaining_amount: '100.00', utilization_percent: '97.1', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
    { id: 506, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 6, allocated_amount: '2000.00', actual_spending: '1950.00', remaining_amount: '50.00', utilization_percent: '97.5', is_overspent: false, created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  ],
  '2026-5': [
    { id: 401, owner_id: 'usr_demo', category_id: 1, category_name: 'Housing & Rent', budget_year: 2026, budget_month: 5, allocated_amount: '27000.00', actual_spending: '27000.00', remaining_amount: '0.00', utilization_percent: '100.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 402, owner_id: 'usr_demo', category_id: 2, category_name: 'Groceries & Quick Commerce', budget_year: 2026, budget_month: 5, allocated_amount: '12000.00', actual_spending: '11800.00', remaining_amount: '200.00', utilization_percent: '98.3', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 403, owner_id: 'usr_demo', category_id: 3, category_name: 'Dining & Food Delivery', budget_year: 2026, budget_month: 5, allocated_amount: '5000.00', actual_spending: '4800.00', remaining_amount: '200.00', utilization_percent: '96.0', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 404, owner_id: 'usr_demo', category_id: 4, category_name: 'Fuel & Daily Transit', budget_year: 2026, budget_month: 5, allocated_amount: '4500.00', actual_spending: '4400.00', remaining_amount: '100.00', utilization_percent: '97.8', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 405, owner_id: 'usr_demo', category_id: 5, category_name: 'Utilities & Broadband', budget_year: 2026, budget_month: 5, allocated_amount: '3200.00', actual_spending: '3100.00', remaining_amount: '100.00', utilization_percent: '96.9', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
    { id: 406, owner_id: 'usr_demo', category_id: 6, category_name: 'Subscriptions & OTT', budget_year: 2026, budget_month: 5, allocated_amount: '1800.00', actual_spending: '1750.00', remaining_amount: '50.00', utilization_percent: '97.2', is_overspent: false, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
  ],
};

export function BudgetList() {
  const currentDate = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.listBudgets(year, month);
      if (res.data && res.data.length > 0) {
        setBudgets(res.data);
      } else {
        setBudgets(DEMO_BUDGETS);
      }
    } catch (err: any) {
      console.warn('API fetch failed, falling back to demo budgets:', err);
      setBudgets(DEMO_BUDGETS);
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
      // Local optimistic
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

  const totalAllocated = budgets.reduce((acc, b) => acc + parseFloat(b.allocated_amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.actual_spending), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header and Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#173F2B] dark:text-slate-100">Monthly Budgets</h1>
          <p className="text-sm font-medium text-[#4D5D51] dark:text-slate-400">
            Set and track category spending caps in Indian Rupees (₹)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FCFDFC] dark:bg-[var(--surface)] border border-[#DCE4DC] dark:border-[var(--line)] rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#173F2B] hover:bg-finroq-mint rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-bold text-[#173F2B] dark:text-slate-200 min-w-[140px] text-center font-display">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#173F2B] hover:bg-finroq-mint rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={() => setCreateFormOpen(true)} className="flex items-center gap-2 bg-[#173F2B] text-white hover:bg-finroq-forest-deep shadow-xs font-medium">
            <Plus className="h-4 w-4" />
            Add Budget
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
            Spending Trend (Last 6 Months):
          </span>
          <span className="text-[#3F4F43] dark:text-slate-400 font-medium">
            May (₹53,950) → Jun (₹55,550) → Jul (₹56,550) → Aug (₹59,520) → Sep (₹60,739) → Oct (₹58,489)
          </span>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#173F2B] font-semibold text-[11px]">
            <ArrowDownRight className="w-3 h-3 text-[#157A42]" /> -3.7% This Month
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-emerald-400">Total Allocated</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#173F2B] dark:text-emerald-300">{formatCurrency(totalAllocated)}</div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">Across {budgets.length} active categories</p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-amber-400">Actual Spending</div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#B77925] dark:text-amber-400">{formatCurrency(totalSpent)}</div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">Eligible ledger expenses</p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-emerald-400">Remaining Pool</div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', totalRemaining >= 0 ? 'text-[#157A42] dark:text-emerald-400' : 'text-[#B43838] dark:text-rose-400')}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="mt-1 text-xs font-medium text-[#4D5D51] dark:text-slate-400">{totalRemaining >= 0 ? 'Within monthly plan' : 'Over allocation'}</p>
        </Card>

        <Card className="p-5 bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs">
          <div className="text-xs font-mono uppercase tracking-wider font-bold text-[#4D5D51] dark:text-slate-300">Overall Utilization</div>
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
            title={`No budgets for ${monthNames[month - 1]} ${year}`}
            description="Create a category budget to keep your spending on track for this month."
            action={
              <Button onClick={() => setCreateFormOpen(true)} className="bg-[#173F2B] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const allocated = parseFloat(b.allocated_amount);
            const spent = parseFloat(b.actual_spending);
            const remaining = parseFloat(b.remaining_amount);
            const util = b.utilization_percent ? parseFloat(b.utilization_percent) : 0;
            const isOver = b.is_overspent;

            return (
              <Card key={b.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] shadow-xs rounded-2xl">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#173F2B] dark:text-emerald-300">{b.category_name}</h3>
                      <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                        {monthNames[b.budget_month - 1]} {b.budget_year}
                      </p>
                    </div>

                    {isOver ? (
                      <Badge variant="danger" className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="h-3 w-3" />
                        Overspent
                      </Badge>
                    ) : util >= 80 ? (
                      <Badge variant="warning" className="font-bold">
                        {util.toFixed(0)}% Used
                      </Badge>
                    ) : (
                      <Badge variant="success" className="font-bold">
                        {util.toFixed(0)}% Used
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#4D5D51] dark:text-slate-400">Spent:</span>
                      <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#4D5D51] dark:text-slate-400">Allocated:</span>
                      <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(allocated)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-[#DCE4DC] dark:border-[var(--line)] pt-2 font-semibold">
                      <span className={isOver ? 'text-[#B43838]' : 'text-[#173F2B] dark:text-slate-200'}>
                        {isOver ? 'Over budget by:' : 'Remaining capacity:'}
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
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBudget(b.id)}
                    className="h-8 px-2 text-danger-500 hover:text-danger-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
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
