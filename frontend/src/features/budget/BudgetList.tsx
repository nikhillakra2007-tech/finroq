'use client';

import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { BudgetForm } from './BudgetForm';
import { Button, Card, Badge, EmptyState, Loading, LoadingCard } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, TrendingDown, Wallet, Edit2, Trash2 } from 'lucide-react';

export function BudgetList() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
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
      setBudgets(res.data);
    } catch (err: any) {
      setError('Failed to load budgets. Please ensure you are logged in.');
      console.error('Failed to fetch budgets:', err);
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
    await apiClient.createBudget(data);
    await fetchBudgets();
  };

  const handleUpdateBudget = async (data: { allocated_amount: string }) => {
    if (!editingBudget) return;
    await apiClient.updateBudget(editingBudget.id, { allocated_amount: data.allocated_amount });
    await fetchBudgets();
    setEditingBudget(null);
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Are you sure you want to remove this budget allocation?')) return;
    try {
      await apiClient.deleteBudget(id);
      await fetchBudgets();
    } catch (err) {
      console.error('Failed to delete budget', err);
    }
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
          <h1 className="text-2xl font-display font-bold text-finroq-forest dark:text-slate-100">Monthly Budgets</h1>
          <p className="text-sm text-finroq-muted dark:text-slate-400">
            Set and track spending limits by category
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-[var(--surface)] border border-finroq-border dark:border-[var(--line)] rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-finroq-forest hover:bg-finroq-mint rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-finroq-forest dark:text-slate-200 min-w-[130px] text-center font-display">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-finroq-forest hover:bg-finroq-mint rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={() => setCreateFormOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-finroq-muted">Total Allocated</div>
          <div className="mt-2 text-2xl font-bold font-mono text-finroq-forest dark:text-slate-100">{formatCurrency(totalAllocated)}</div>
          <p className="mt-1 text-xs text-finroq-muted">Across {budgets.length} categories</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-finroq-muted">Actual Spending</div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(totalSpent)}</div>
          <p className="mt-1 text-xs text-finroq-muted">Eligible expense transactions</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-finroq-muted">Remaining Pool</div>
          <div className={cn('mt-2 text-2xl font-bold font-mono', totalRemaining >= 0 ? 'text-finroq-positive' : 'text-finroq-negative')}>
            {formatCurrency(totalRemaining)}
          </div>
          <p className="mt-1 text-xs text-finroq-muted">{totalRemaining >= 0 ? 'Within budget' : 'Total overallocation'}</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono uppercase tracking-wider text-finroq-muted">Overall Utilization</div>
          <div className="mt-2 text-2xl font-bold font-mono text-finroq-forest dark:text-slate-100">
            {overallUtilization.toFixed(1)}%
          </div>
          <div className="w-full bg-finroq-mint dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                overallUtilization > 100 ? 'bg-finroq-negative' : overallUtilization >= 80 ? 'bg-amber-500' : 'bg-finroq-forest'
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
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-finroq-negative">{error}</p>
          <Button onClick={fetchBudgets} variant="secondary" className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            title={`No budgets for ${monthNames[month - 1]} ${year}`}
            description="Create a category budget to keep your spending on track for this month."
            action={
              <Button onClick={() => setCreateFormOpen(true)}>
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
              <Card key={b.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-finroq-forest dark:text-slate-100">{b.category_name}</h3>
                      <p className="text-xs text-finroq-muted dark:text-slate-400">
                        {monthNames[b.budget_month - 1]} {b.budget_year}
                      </p>
                    </div>

                    {isOver ? (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Overspent
                      </Badge>
                    ) : util >= 80 ? (
                      <Badge variant="warning">
                        {util.toFixed(0)}% Used
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        {util.toFixed(0)}% Used
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-finroq-muted">Spent:</span>
                      <span className="font-mono font-medium text-finroq-forest dark:text-slate-100">{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-finroq-muted">Allocated:</span>
                      <span className="font-mono font-medium text-finroq-forest dark:text-slate-100">{formatCurrency(allocated)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-finroq-border pt-1 font-semibold">
                      <span className={isOver ? 'text-finroq-negative' : 'text-finroq-forest'}>
                        {isOver ? 'Over by:' : 'Remaining:'}
                      </span>
                      <span className={isOver ? 'text-finroq-negative' : 'text-finroq-positive font-mono'}>
                        {formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-finroq-mint dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-3">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isOver ? 'bg-finroq-negative' : util >= 80 ? 'bg-amber-500' : 'bg-finroq-forest'
                        )}
                        style={{ width: `${Math.min(util, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-finroq-border flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingBudget(b)}
                    className="h-8 px-2 text-finroq-muted hover:text-finroq-forest"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteBudget(b.id)}
                    className="h-8 px-2 text-finroq-negative hover:text-red-700 hover:bg-red-50"
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
