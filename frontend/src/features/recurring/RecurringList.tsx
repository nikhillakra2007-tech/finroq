'use client';

import { useState, useEffect, useCallback } from 'react';
import { RecurringTransaction } from '@/lib/api-types';
import { apiClient } from '@/lib/api-client';
import { RecurringForm } from './RecurringForm';
import { Button, Card, Badge, EmptyState, LoadingCard } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Plus,
  Repeat,
  Play,
  Pause,
  Trash2,
  Calendar,
  CheckCircle,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from 'lucide-react';

export function RecurringList() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchRecurring = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.listRecurring();
      setItems(res.data);
    } catch (err: any) {
      setError('Failed to load recurring transactions. Please ensure you are logged in.');
      console.error('Failed to fetch recurring transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleCreate = async (data: any) => {
    await apiClient.createRecurring(data);
    await fetchRecurring();
  };

  const handleTogglePause = async (item: RecurringTransaction) => {
    try {
      if (item.status === 'active') {
        await apiClient.pauseRecurring(item.id);
      } else {
        await apiClient.resumeRecurring(item.id);
      }
      await fetchRecurring();
    } catch (err) {
      console.error('Failed to toggle recurring status', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recurring transaction rule?')) return;
    try {
      await apiClient.deleteRecurring(id);
      await fetchRecurring();
    } catch (err) {
      console.error('Failed to delete recurring transaction', err);
    }
  };

  const handleRecordOccurrence = async (item: RecurringTransaction) => {
    try {
      setRecordingId(item.id);
      setFeedbackMessage(null);
      const res = await apiClient.recordRecurringOccurrence(item.id);
      const wasAlready = res.data.already_recorded;
      setFeedbackMessage(
        wasAlready
          ? `Occurrence for "${item.description || item.frequency}" was already recorded (idempotent)!`
          : `Successfully recorded real transaction of ${formatCurrency(parseFloat(item.amount))}!`
      );
      await fetchRecurring();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to record occurrence';
      alert(msg);
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Recurring Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define scheduled recurring expectations and explicitly record actual occurrences
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Recurring Rule
        </Button>
      </div>

      {/* Clear Distinction Banner */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3">
        <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm text-sky-800 dark:text-sky-200 space-y-1">
          <p className="font-semibold">Expected Schedules vs Real Financial Ledger Entries</p>
          <p className="text-xs text-sky-700 dark:text-sky-300">
            A recurring definition represents an expected transaction, not financial proof. To prevent unauthorized or
            premature charges, recurring rules do not silently insert financial transactions without user trigger.
            Click <span className="font-semibold underline">Record Now</span> to record the next scheduled occurrence
            into your ledger. Recording is strictly idempotent.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchRecurring} variant="secondary" className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="No recurring transactions configured"
            description="Create recurring templates for salaries, rent, subscriptions, or weekly transfers."
            action={
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Recurring Rule
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => {
            const isPaused = r.status === 'paused';
            const amount = parseFloat(r.amount);

            return (
              <Card
                key={r.id}
                className={cn(
                  'p-5 flex flex-col justify-between transition-all border',
                  isPaused
                    ? 'border-slate-200 dark:border-slate-800 opacity-75 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
                )}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {r.description || 'Recurring Transaction'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.account_name}
                        {r.to_account_name && ` → ${r.to_account_name}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge variant={isPaused ? 'default' : 'success'}>
                        {r.status.toUpperCase()}
                      </Badge>
                      <Badge variant="info" className="capitalize text-xs">
                        {r.frequency}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Expected Amount:</span>
                      <span
                        className={cn(
                          'text-lg font-bold',
                          r.transaction_type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : r.transaction_type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-primary-600 dark:text-primary-400'
                        )}
                      >
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    {r.category_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Category:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{r.category_name}</span>
                      </div>
                    )}

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Next Due:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.next_occurrence ? formatDate(r.next_occurrence) : 'Ended / None'}
                        </span>
                      </div>
                      {r.end_date && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Ends:</span>
                          <span>{formatDate(r.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePause(r)}
                      title={isPaused ? 'Resume schedule' : 'Pause schedule'}
                      className="h-8 px-2"
                    >
                      {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-600" /> : <Pause className="h-3.5 w-3.5 text-amber-600" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(r.id)}
                      title="Delete rule"
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    disabled={isPaused || !r.next_occurrence || recordingId === r.id}
                    loading={recordingId === r.id}
                    onClick={() => handleRecordOccurrence(r)}
                    className="flex items-center gap-1.5 h-8 text-xs font-semibold"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Record Now
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <RecurringForm
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
