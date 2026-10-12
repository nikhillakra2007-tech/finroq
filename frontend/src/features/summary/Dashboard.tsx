'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinancialSummary, AccountBalance, CategoryBreakdown } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { Card, Loading, LoadingCard, Badge, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react';

export function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getSummary({
        start_date: period.start,
        end_date: period.end,
      });
      setSummary(response.data);
    } catch (err) {
      setError('Failed to load financial summary. Please check your connection.');
      console.error('Failed to fetch summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const totalIncome = summary ? parseFloat(summary.total_income) : 0;
  const totalExpenses = summary ? parseFloat(summary.total_expenses) : 0;
  const netCashFlow = summary ? parseFloat(summary.net_cash_flow) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-danger-600 mb-4">{error}</p>
        <button onClick={fetchSummary} className="text-primary-600 hover:underline">
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {formatDate(period.start)} - {formatDate(period.end)}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={period.start}
            onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
            className="input w-auto"
          />
          <span className="self-center text-slate-500">to</span>
          <input
            type="date"
            value={period.end}
            onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
            className="input w-auto"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Income</p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
              <ArrowUpRight className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
              <ArrowDownRight className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Net Cash Flow</p>
              <p className={cn(
                'text-2xl font-bold mt-1',
                netCashFlow >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
              )}>
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </p>
            </div>
            <div className={cn(
              'p-3 rounded-xl',
              netCashFlow >= 0 ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20'
            )}>
              {netCashFlow >= 0 ? (
                <TrendingUp className="h-6 w-6 text-success-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-danger-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Account Balances
            </h2>
          </div>
          {summary?.account_balances.length === 0 ? (
            <EmptyState title="No accounts" description="Create accounts to see balances here." />
          ) : (
            <div className="space-y-3">
              {summary?.account_balances.map((account: AccountBalance) => {
                const currentBalance = parseFloat(account.current_balance);
                const isCredit = account.account_type === 'credit';
                const displayBalance = isCredit ? -currentBalance : currentBalance;
                return (
                  <div key={account.account_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{account.account_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{account.account_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-bold',
                        displayBalance >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                      )}>
                        {formatCurrency(displayBalance, account.currency)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Period: +{formatCurrency(account.period_income)} / -{formatCurrency(account.period_expenses)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Breakdown
            </h2>
          </div>
          {summary?.category_breakdown.length === 0 ? (
            <EmptyState title="No transactions" description="Add transactions to see category breakdown." />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {summary?.category_breakdown.map((category: CategoryBreakdown) => {
                const amount = parseFloat(category.total_amount);
                const isIncome = category.category_type === 'income';
                return (
                  <div key={category.category_id || category.category_name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        isIncome ? 'bg-success-50 dark:bg-success-900/30' : 'bg-danger-50 dark:bg-danger-900/30'
                      )}>
                        {isIncome ? (
                          <TrendingUp className="h-5 w-5 text-success-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-danger-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{category.category_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'font-bold',
                        isIncome ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                      )}>
                        {isIncome ? '+' : '-'}{formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}