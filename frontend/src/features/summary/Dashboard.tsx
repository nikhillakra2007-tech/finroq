'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FinancialSummary, AccountBalance, CategoryBreakdown, Transaction, Budget, RecurringTransaction } from '@/lib/api-types';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { Card, LoadingCard, Badge, EmptyState, Button } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
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
  Sparkles,
  Target,
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  Zap,
  Users,
  BookOpen,
  Umbrella,
  ShieldAlert,
  Activity,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const ALL_MODULES = [
  { name: 'Expense Tracking', href: '/transactions', icon: CreditCard, cat: 'Track' },
  { name: 'Daily Budgeting', href: '/budgets', icon: PieChart, cat: 'Track' },
  { name: 'Expense Splitter', href: '/splitter', icon: Users, cat: 'Track' },
  { name: 'Pre-Spend Check', href: '/pre-spend-check', icon: ShoppingBag, cat: 'Decide' },
  { name: 'Spend Leak Detector', href: '/spend-leaks', icon: Zap, cat: 'Decide' },
  { name: 'Money Guides', href: '/guides', icon: BookOpen, cat: 'Decide' },
  { name: 'Net Worth', href: '/net-worth', icon: TrendingUp, cat: 'Wealth' },
  { name: 'Goal Timeline', href: '/insights', icon: Target, cat: 'Wealth' },
  { name: 'Emergency Cushion', href: '/emergency-cushion', icon: Umbrella, cat: 'Wealth' },
  { name: 'EMI / Debt Watchdog', href: '/debt-watchdog', icon: ShieldAlert, cat: 'Obligations' },
  { name: 'Credit Health', href: '/credit-health', icon: ShieldCheck, cat: 'Obligations' },
  { name: 'Financial Health', href: '/financial-health', icon: Activity, cat: 'Obligations' },
];

export function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
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
      const now = new Date();
      const [sumRes, txRes, bRes, rRes] = await Promise.all([
        apiClient.getSummary({
          start_date: period.start,
          end_date: period.end,
        }),
        apiClient.listTransactions({ page_size: 6 }),
        apiClient.listBudgets(now.getFullYear(), now.getMonth() + 1),
        apiClient.listRecurring(),
      ]);
      setSummary(sumRes.data);
      setRecentTransactions(txRes.data.transactions || []);
      setBudgets(bRes.data || []);
      setRecurring(rRes.data.filter((r) => r.status === 'active') || []);
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

  // Calculate total budget utilization
  const totalAllocatedBudget = budgets.reduce((sum, b) => sum + parseFloat(b.allocated_amount), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + parseFloat(b.actual_spending || '0'), 0);
  const overallBudgetUtilization = totalAllocatedBudget > 0 ? (totalBudgetSpent / totalAllocatedBudget) * 100 : 0;

  // Assets vs Liabilities
  const totalAssets = summary?.account_balances
    .filter((a) => a.account_type !== 'credit')
    .reduce((sum, a) => sum + parseFloat(a.current_balance), 0) || 0;
  const totalLiabilities = summary?.account_balances
    .filter((a) => a.account_type === 'credit')
    .reduce((sum, a) => sum + parseFloat(a.current_balance), 0) || 0;

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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
      <Card className="text-center py-12 bg-white border-finroq-border max-w-lg mx-auto my-8 rounded-3xl p-8 shadow-xs">
        <div className="w-12 h-12 bg-finroq-mint rounded-2xl flex items-center justify-center mx-auto mb-4 text-finroq-forest">
          <Wallet className="h-6 w-6 text-finroq-forest" />
        </div>
        <h3 className="font-heading text-lg font-bold text-finroq-text mb-2">Financial Engine Connection</h3>
        <p className="text-finroq-muted text-sm mb-6">
          {error.includes('Not authenticated') || error.includes('connection')
            ? 'Authenticate your session or connect with the verified demo account to inspect live balances, cash flow, and budgets.'
            : error}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={async () => {
              try {
                const res = await apiClient.login({ email: 'demo@finroq.com', password: 'password123' });
                apiClient.setToken(res.data.access_token);
                fetchDashboardData();
              } catch {
                fetchDashboardData();
              }
            }}
            className="btn btn-primary text-xs px-5 py-2.5 w-full sm:w-auto"
          >
            Connect Demo Account
          </button>
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary text-xs px-4 py-2.5 w-full sm:w-auto"
          >
            Retry Loading
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. DASHBOARD WELCOME AREA & DATE CYCLE
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-finroq-border">
        <div>
          <h1 className="heading-page">
            {getGreeting()}. Let&apos;s get your money in focus.
          </h1>
          <p className="text-sm text-finroq-muted mt-1">
            Here is where things stand across your spending, budgets, savings, and financial commitments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-finroq-border shadow-xs text-xs">
            <Calendar className="h-3.5 w-3.5 text-finroq-muted" />
            <span className="font-semibold text-finroq-text">
              {formatDate(period.start)} – {formatDate(period.end)}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP FINANCIAL SUMMARY (5 KEY INDICATORS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Net Worth */}
        <Card className="bg-white border-finroq-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Net Worth</span>
              <p className={cn('figure-primary mt-1', netWorth >= 0 ? 'text-finroq-forest' : 'text-finroq-negative')}>
                {formatCurrency(netWorth)}
              </p>
              <span className="text-[11px] text-finroq-muted font-medium">Assets minus debt</span>
            </div>
            <div className="p-2.5 bg-finroq-mint rounded-xl text-finroq-forest">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Period Income */}
        <Card className="bg-white border-finroq-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Period Income</span>
              <p className="figure-primary text-finroq-positive mt-1">
                {formatCurrency(totalIncome)}
              </p>
              <span className="text-[11px] text-finroq-positive font-medium">Completed inflow</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-finroq-positive">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Period Expenses */}
        <Card className="bg-white border-finroq-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Period Expenses</span>
              <p className="figure-primary text-finroq-negative mt-1">
                {formatCurrency(totalExpenses)}
              </p>
              <span className="text-[11px] text-finroq-muted font-medium">Verified outflow</span>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl text-finroq-negative">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card className="bg-white border-finroq-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Net Cash Flow</span>
              <p className={cn('figure-primary mt-1', netCashFlow >= 0 ? 'text-finroq-forest' : 'text-finroq-negative')}>
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </p>
              <span className="text-[11px] text-finroq-positive font-medium">
                {totalIncome > 0 ? `${((netCashFlow / totalIncome) * 100).toFixed(0)}% Savings Rate` : 'Surplus'}
              </span>
            </div>
            <div className="p-2.5 bg-finroq-mint rounded-xl text-finroq-forest">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Budget Utilization */}
        <Card className="bg-white border-finroq-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="label-supporting">Budget Health</span>
              <p className={cn('figure-primary mt-1', overallBudgetUtilization > 90 ? 'text-amber-600' : 'text-finroq-forest')}>
                {overallBudgetUtilization.toFixed(0)}%
              </p>
              <span className="text-[11px] text-finroq-muted font-medium">
                {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalAllocatedBudget)}
              </span>
            </div>
            <div className="p-2.5 bg-finroq-mint rounded-xl text-finroq-forest">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN DASHBOARD VISUALIZATIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* VISUALIZATION A & B: Budget Comparison & Spending Over Time */}
        <div className="lg:col-span-7 space-y-6">
          {/* Budget vs Actual Horizontal Bars */}
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <PieChart className="h-4 w-4 text-finroq-forest" />
                Budget vs. Actual Spending
              </h2>
              <Link href="/budgets" className="text-xs font-semibold text-finroq-forest hover:underline">
                Manage Budgets →
              </Link>
            </div>

            {budgets.length === 0 ? (
              <EmptyState
                title="No active category budgets"
                description="Set monthly caps for Groceries, Dining, and Housing to monitor utilization here."
              />
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((b) => {
                  const allocated = parseFloat(b.allocated_amount);
                  const spent = parseFloat(b.actual_spending || '0');
                  const remaining = Math.max(0, allocated - spent);
                  const isOver = spent > allocated;
                  const pct = Math.min(100, (spent / allocated) * 100);

                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-finroq-text">
                          {b.category_name || `Category #${b.category_id}`}
                        </span>
                        <div className="text-right">
                          <span className={cn('font-mono font-bold', isOver ? 'text-finroq-negative' : 'text-finroq-forest')}>
                            {formatCurrency(spent)}
                          </span>
                          <span className="text-finroq-muted"> / {formatCurrency(allocated)}</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={cn(
                            'h-2.5 rounded-full transition-all duration-300',
                            isOver ? 'bg-finroq-negative' : pct > 85 ? 'bg-amber-500' : 'bg-finroq-forest'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-finroq-muted">
                        <span>{pct.toFixed(1)}% utilized</span>
                        <span>
                          {isOver ? `Exceeded by ${formatCurrency(spent - allocated)}` : `${formatCurrency(remaining)} remaining`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Balance Sheet Breakdown: Assets vs Liabilities */}
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-finroq-forest" />
                Balance Sheet Equity (Assets vs. Liabilities)
              </h2>
              <Link href="/net-worth" className="text-xs font-semibold text-finroq-forest hover:underline">
                Net Worth Details →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-finroq-ivory rounded-xl border border-finroq-border">
                <span className="text-xs text-finroq-muted font-medium">Total Assets</span>
                <p className="font-mono text-xl font-bold text-finroq-positive mt-1">
                  {formatCurrency(totalAssets)}
                </p>
                <span className="text-[10px] text-finroq-muted">Checking, Savings, Brokerage</span>
              </div>

              <div className="p-4 bg-finroq-ivory rounded-xl border border-finroq-border">
                <span className="text-xs text-finroq-muted font-medium">Total Liabilities</span>
                <p className="font-mono text-xl font-bold text-finroq-negative mt-1">
                  {formatCurrency(totalLiabilities)}
                </p>
                <span className="text-[10px] text-finroq-muted">Credit Cards & Loans</span>
              </div>
            </div>

            <div className="p-3 bg-finroq-mint rounded-xl flex items-center justify-between text-xs text-finroq-forest font-semibold">
              <span>Overall Equity (Net Worth): {formatCurrency(netWorth)}</span>
              <span className="text-finroq-positive">
                Debt-to-Asset: {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </Card>
        </div>

        {/* VISUALIZATION C & D: Category Distribution & Goal Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Category Spending Breakdown */}
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-finroq-forest" />
                Category Outflow Distribution
              </h2>
            </div>

            {!summary || summary.category_breakdown.length === 0 ? (
              <EmptyState title="No transactions recorded" description="Add expenses to see categorical spending distribution." />
            ) : (
              <div className="space-y-3">
                {summary.category_breakdown.slice(0, 5).map((cat) => {
                  const amt = parseFloat(cat.total_amount);
                  const isInc = cat.category_type === 'income';
                  return (
                    <div key={cat.category_id || cat.category_name} className="flex items-center justify-between p-3 bg-finroq-ivory rounded-xl border border-finroq-border text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('w-2 h-2 rounded-full', isInc ? 'bg-finroq-positive' : 'bg-finroq-negative')} />
                        <span className="font-semibold text-finroq-text">{cat.category_name}</span>
                        <span className="text-[11px] text-finroq-muted">({cat.transaction_count} tx)</span>
                      </div>
                      <span className={cn('font-mono font-bold', isInc ? 'text-finroq-positive' : 'text-finroq-text')}>
                        {isInc ? '+' : '-'}{formatCurrency(amt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Goal & Emergency Cushion Overview */}
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <Target className="h-4 w-4 text-finroq-forest" />
                Wealth Cushion & Runway
              </h2>
              <Link href="/emergency-cushion" className="text-xs font-semibold text-finroq-forest hover:underline">
                Calculator →
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-finroq-text">Liquid Emergency Runway</span>
                <span className="font-mono font-bold text-finroq-positive">
                  {totalExpenses > 0 ? (totalAssets / totalExpenses).toFixed(1) : '12+'} Months
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-finroq-positive h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, totalExpenses > 0 ? ((totalAssets / totalExpenses) / 6) * 100 : 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-finroq-muted block">
                Target: 6 months of baseline living costs ({formatCurrency(totalExpenses * 6)}).
              </span>
            </div>

            <div className="pt-2">
              <Link href="/insights" className="btn btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Simulate Goal Timelines with AI
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CONNECTED WORKSPACE: ALL 12 FINANCIAL MODULES
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-finroq-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-section">Connected Financial Workspace</h2>
            <p className="text-xs text-finroq-muted mt-0.5">
              Instant access to all 12 operational modules across tracking, pre-spend checks, and health.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_MODULES.map((m, idx) => (
            <Link
              key={idx}
              href={m.href}
              className="p-3.5 bg-white hover:bg-finroq-mint/40 border border-finroq-border hover:border-finroq-sage rounded-2xl shadow-xs transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-finroq-mint flex items-center justify-center text-finroq-forest group-hover:scale-105 transition-transform mb-2">
                <m.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-heading font-bold text-xs text-finroq-text group-hover:text-finroq-forest transition-colors">
                  {m.name}
                </p>
                <span className="text-[10px] text-finroq-muted">{m.cat}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. RECENT ACTIVITY & UPCOMING OBLIGATIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12 pt-2">
        {/* Recent Transactions Feed */}
        <div className="lg:col-span-7">
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-finroq-forest" />
                Recent Ledger Activity
              </h2>
              <Link href="/transactions" className="text-xs font-semibold text-finroq-forest hover:underline">
                View All Ledger →
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState title="No transactions yet" description="Add income or expense transactions to populate the ledger." />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => {
                  const amt = parseFloat(tx.amount);
                  const isInc = tx.transaction_type === 'income';
                  const isTfr = tx.transaction_type === 'transfer';
                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-finroq-text">{tx.description || 'Transaction'}</p>
                        <span className="text-[11px] text-finroq-muted">
                          {tx.category?.name || 'General'} • {formatDate(tx.transaction_date)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={cn('font-mono font-bold', isInc ? 'text-finroq-positive' : isTfr ? 'text-blue-600' : 'text-finroq-text')}>
                          {isInc ? '+' : isTfr ? '' : '-'}{formatCurrency(amt, tx.currency)}
                        </p>
                        <span className="text-[10px] font-medium text-slate-500 uppercase">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Recurring Obligations */}
        <div className="lg:col-span-5">
          <Card className="p-6 bg-white border-finroq-border rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-finroq-border">
              <h2 className="font-heading font-bold text-base text-finroq-text flex items-center gap-2">
                <Repeat className="h-4 w-4 text-finroq-forest" />
                Upcoming Recurring Bills
              </h2>
              <Link href="/recurring" className="text-xs font-semibold text-finroq-forest hover:underline">
                Schedules →
              </Link>
            </div>

            {recurring.length === 0 ? (
              <EmptyState title="No scheduled bills" description="Add rent, salary, or subscriptions to track upcoming occurrences." />
            ) : (
              <div className="space-y-3">
                {recurring.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3.5 bg-finroq-ivory rounded-xl border border-finroq-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-finroq-text">{r.description || 'Recurring'}</p>
                      <span className="text-[11px] text-finroq-muted capitalize">
                        {r.frequency} • Next: {r.next_occurrence || 'Scheduled'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-finroq-forest">
                        {formatCurrency(r.amount, r.currency)}
                      </p>
                      <span className="text-[10px] font-semibold text-finroq-positive">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}