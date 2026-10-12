'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Loading, EmptyState, Badge, Button } from '@/components/ui';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { Account, FinancialSummary } from '@/lib/api-types';
import { formatCurrency, getAccountTypeLabel } from '@/lib/utils';
import { TrendingUp, ShieldCheck, CreditCard, Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export default function NetWorthPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [accRes, sumRes] = await Promise.all([
        apiClient.listAccounts({ is_active: true, page_size: 100 }),
        apiClient.getSummary(),
      ]);
      setAccounts(accRes.data.accounts || []);
      setSummary(sumRes.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to calculate net worth data.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Asset types: checking, savings, investment, cash
  // Liability types: credit
  const assets = accounts.filter((a) => ['checking', 'savings', 'investment', 'cash'].includes(a.account_type));
  const liabilities = accounts.filter((a) => a.account_type === 'credit');

  const totalAssets = assets.reduce((sum, a) => sum + Math.max(0, parseFloat(a.initial_balance || '0')), 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(parseFloat(a.initial_balance || '0')), 0);
  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : '0';

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-page">Net Worth Overview</h1>
            <p className="text-sm text-finroq-muted mt-1">
              Your consolidated financial balance sheet across all active cash, investment, and credit accounts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={loadData}
              className="flex items-center gap-2 text-xs"
              title="Refresh balances"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Link href="/accounts">
              <Button variant="primary" className="flex items-center gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Manage Accounts
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-finroq-negative text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl border border-finroq-border animate-pulse p-6" />
              ))}
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            title="No accounts linked"
            description="Create your first bank, savings, or credit account to start tracking your total net worth."
            action={
              <Link href="/accounts">
                <Button variant="primary">Add First Account</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* Net Worth Summary Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-white border-finroq-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label-supporting">Total Net Worth</span>
                    <p
                      className={`figure-primary mt-1 ${
                        netWorth >= 0 ? 'text-finroq-positive' : 'text-finroq-negative'
                      }`}
                    >
                      {formatCurrency(netWorth)}
                    </p>
                  </div>
                  <div className="p-3 bg-finroq-mint rounded-xl">
                    <TrendingUp className="h-6 w-6 text-finroq-forest" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-finroq-border text-xs text-finroq-muted flex items-center justify-between">
                  <span>Solvency Status</span>
                  <Badge variant={netWorth >= 0 ? 'success' : 'danger'}>
                    {netWorth >= 0 ? 'Positive Equity' : 'Net Debt'}
                  </Badge>
                </div>
              </Card>

              <Card className="bg-white border-finroq-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label-supporting">Total Assets</span>
                    <p className="figure-primary text-finroq-forest mt-1">
                      {formatCurrency(totalAssets)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <ArrowUpRight className="h-6 w-6 text-finroq-positive" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-finroq-border text-xs text-finroq-muted flex items-center justify-between">
                  <span>Active Asset Accounts</span>
                  <span className="font-semibold text-finroq-text">{assets.length}</span>
                </div>
              </Card>

              <Card className="bg-white border-finroq-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label-supporting">Total Liabilities</span>
                    <p className="figure-primary text-finroq-negative mt-1">
                      {formatCurrency(totalLiabilities)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <ArrowDownRight className="h-6 w-6 text-finroq-negative" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-finroq-border text-xs text-finroq-muted flex items-center justify-between">
                  <span>Debt-to-Asset Ratio</span>
                  <span className="font-semibold text-finroq-text">{debtToAssetRatio}%</span>
                </div>
              </Card>
            </div>

            {/* Asset vs Liability Breakdown Lists */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Assets Section */}
              <Card className="bg-white border-finroq-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="heading-card flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-finroq-forest" />
                    Assets & Deposits
                  </h2>
                  <Badge variant="success">{assets.length} Accounts</Badge>
                </div>

                {assets.length === 0 ? (
                  <p className="text-sm text-finroq-muted py-4">No asset accounts recorded.</p>
                ) : (
                  <div className="divide-y divide-finroq-border">
                    {assets.map((acc) => (
                      <div key={acc.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-finroq-text">{acc.name}</p>
                          <p className="text-xs text-finroq-muted">{getAccountTypeLabel(acc.account_type)}</p>
                        </div>
                        <p className="font-mono font-bold text-sm text-finroq-forest">
                          {formatCurrency(acc.initial_balance, acc.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Liabilities Section */}
              <Card className="bg-white border-finroq-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="heading-card flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-finroq-negative" />
                    Liabilities & Credit
                  </h2>
                  <Badge variant={liabilities.length > 0 ? 'warning' : 'info'}>
                    {liabilities.length} Accounts
                  </Badge>
                </div>

                {liabilities.length === 0 ? (
                  <div className="py-6 text-center">
                    <ShieldCheck className="h-8 w-8 text-finroq-positive mx-auto mb-2" />
                    <p className="text-sm font-semibold text-finroq-text">Zero Liabilities</p>
                    <p className="text-xs text-finroq-muted mt-0.5">You currently have no credit liabilities recorded.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-finroq-border">
                    {liabilities.map((acc) => (
                      <div key={acc.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-finroq-text">{acc.name}</p>
                          <p className="text-xs text-finroq-muted">{getAccountTypeLabel(acc.account_type)}</p>
                        </div>
                        <p className="font-mono font-bold text-sm text-finroq-negative">
                          {formatCurrency(acc.initial_balance, acc.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
