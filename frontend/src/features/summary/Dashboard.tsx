'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FinancialSummary, AccountBalance, CategoryBreakdown, Transaction } from '@/lib/api-types';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { Card, LoadingCard, Badge, EmptyState, Button } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus,
  Repeat,
  PieChart,
  CreditCard,
  Calendar,
} from 'lucide-react';

export function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sumRes, txRes] = await Promise.all([
        apiClient.getSummary({
          start_date: period.start,
          end_date: period.end,
        }),
        apiClient.listTransactions({ page_size: 5 }),
      ]);
      setSummary(sumRes.data);
      setRecentTransactions(txRes.data.transactions || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load financial dashboard. Please check your connection.'));
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalIncome = summary ? parseFloat(summary.total_income) : 0;
  const totalExpenses = summary ? parseFloat(summary.total_expenses) : 0;
  const netCashFlow = summary ? parseFloat(summary.net_cash_flow) : 0;
  const netWorth = summary?.net_worth ? parseFloat(summary.net_worth) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12 bg-white border-finroq-border">
        <p className="text-finroq-negative font-medium mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="secondary">
          Retry Loading
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-page">Financial Overview</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Accounting cycle: {formatDate(period.start)} – {formatDate(period.end)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-finroq-border shadow-xs">
            <Calendar className="h-4 w-4 text-finroq-muted ml-1" />
            <input
              type="date"
              value={period.start}
              onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
              className="text-xs bg-transparent border-0 focus:ring-0 text-finroq-text"
              aria-label="Period start date"
            />
            <span className="text-xs text-finroq-muted">to</span>
            <input
              type="date"
              value={period.end}
              onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
              className="text-xs bg-transparent border-0 focus:ring-0 text-finroq-text"
              aria-label="Period end date"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="flex flex-wrap gap-2.5">
        <Link href="/transactions">
          <Button variant="primary" className="flex items-center gap-2 text-xs py-2">
            <Plus className="h-3.5 w-3.5" />
            New Transaction
          </Button>
        </Link>
        <Link href="/accounts">
          <Button variant="secondary" className="flex items-center gap-2 text-xs py-2 bg-white">
            <Wallet className="h-3.5 w-3.5 text-finroq-forest" />
            Add Account
          </Button>
        </Link>
        <Link href="/budgets">
          <Button variant="secondary" className="flex items-center gap-2 text-xs py-2 bg-white">
            <PieChart className="h-3.5 w-3.5 text-finroq-forest" />
            Set Budget
          </Button>
        </Link>
        <Link href="/recurring">
          <Button variant="secondary" className="flex items-center gap-2 text-xs py-2 bg-white">
            <Repeat className="h-3.5 w-3.5 text-finroq-forest" />
            Recurring Bill
          </Button>
        </Link>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Net Worth</span>
              <p className={cn('figure-primary mt-1', netWorth >= 0 ? 'text-finroq-positive' : 'text-finroq-negative')}>
                {formatCurrency(netWorth)}
              </p>
            </div>
            <div className="p-3 bg-finroq-mint rounded-xl text-finroq-forest">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Total Income */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Period Income</span>
              <p className="figure-primary text-finroq-positive mt-1">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-finroq-positive">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Period Expenses</span>
              <p className="figure-primary text-finroq-negative mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-finroq-negative">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Net Cash Flow</span>
              <p className={cn('figure-primary mt-1', netCashFlow >= 0 ? 'text-finroq-positive' : 'text-finroq-negative')}>
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </p>
            </div>
            <div
              className={cn(
                'p-3 rounded-xl',
                netCashFlow >= 0 ? 'bg-emerald-50 text-finroq-positive' : 'bg-red-50 text-finroq-negative'
              )}
            >
              {netCashFlow >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Grid: Account Balances & Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Balances */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-card flex items-center gap-2">
              <Wallet className="h-5 w-5 text-finroq-forest" />
              Account Balances
            </h2>
            <Link href="/accounts" className="text-xs font-semibold text-finroq-forest hover:underline">
              View All
            </Link>
          </div>

          {!summary || summary.account_balances.length === 0 ? (
            <EmptyState title="No accounts yet" description="Create your checking or savings account to view live balances." />
          ) : (
            <div className="space-y-3">
              {summary.account_balances.map((account: AccountBalance) => {
                const currentBalance = parseFloat(account.current_balance);
                const isCredit = account.account_type === 'credit';
                const displayBalance = isCredit ? -currentBalance : currentBalance;
                return (
                  <div
                    key={account.account_id}
                    className="flex items-center justify-between p-3.5 bg-finroq-ivory/60 border border-finroq-border rounded-xl transition-colors hover:bg-finroq-mint/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-finroq-mint rounded-lg text-finroq-forest">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-finroq-text">{account.account_name}</p>
                        <p className="text-xs text-finroq-muted capitalize">{account.account_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-mono font-bold text-sm',
                          displayBalance >= 0 ? 'text-finroq-positive' : 'text-finroq-negative'
                        )}
                      >
                        {formatCurrency(displayBalance, account.currency)}
                      </p>
                      <p className="text-xs text-finroq-muted">
                        +{formatCurrency(account.period_income)} / -{formatCurrency(account.period_expenses)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Category Breakdown with Progress Visualizations */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-card flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-finroq-forest" />
              Category Breakdown
            </h2>
            <Link href="/budgets" className="text-xs font-semibold text-finroq-forest hover:underline">
              Budgets
            </Link>
          </div>

          {!summary || summary.category_breakdown.length === 0 ? (
            <EmptyState title="No transactions yet" description="Add income and expense transactions to see spending distribution." />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {summary.category_breakdown.map((category: CategoryBreakdown) => {
                const amount = parseFloat(category.total_amount);
                const isIncome = category.category_type === 'income';
                return (
                  <div
                    key={category.category_id || category.category_name}
                    className="p-3 bg-finroq-ivory/50 border border-finroq-border rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isIncome ? 'bg-finroq-positive' : 'bg-finroq-negative'
                          )}
                        />
                        <p className="font-semibold text-sm text-finroq-text">{category.category_name}</p>
                        <span className="text-xs text-finroq-muted">
                          ({category.transaction_count} tx)
                        </span>
                      </div>
                      <p
                        className={cn(
                          'font-mono font-bold text-sm',
                          isIncome ? 'text-finroq-positive' : 'text-finroq-negative'
                        )}
                      >
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

      {/* Bottom Section: Recent Transactions */}
      <Card className="bg-white border-finroq-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-card flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-finroq-forest" />
            Recent Activity
          </h2>
          <Link href="/transactions" className="text-xs font-semibold text-finroq-forest hover:underline">
            View All Transactions
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState title="No recent transactions" description="Log your first income or expense to see it here." />
        ) : (
          <div className="divide-y divide-finroq-border">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-finroq-text">
                    {tx.description || `${tx.transaction_type.toUpperCase()} transaction`}
                  </p>
                  <p className="text-xs text-finroq-muted">{formatDate(tx.transaction_date)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-mono font-bold text-sm',
                      tx.transaction_type === 'income' ? 'text-finroq-positive' : 'text-finroq-negative'
                    )}
                  >
                    {tx.transaction_type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <Badge variant={tx.transaction_type === 'income' ? 'success' : 'danger'}>
                    {tx.transaction_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}